function redondear2(numero) {
  return Math.round(numero * 100) / 100;
}

/**
 * Calcula un percentil estadístico (0-100) mediante interpolación lineal.
 *
 * @param {number[]} muestras
 * @param {number} percentil
 * @returns {number}
 */
export function calcularPercentil(muestras, percentil) {
  if (!Array.isArray(muestras)) {
    throw new TypeError('Las muestras de duracion deben ser un arreglo numerico');
  }
  if (typeof percentil !== 'number' || percentil < 0 || percentil > 100) {
    throw new RangeError(`El percentil debe estar entre 0 y 100 (recibido: ${percentil})`);
  }

  const limpias = muestras
    .filter((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)
    .sort((a, b) => a - b);

  if (limpias.length === 0) return 0;
  if (limpias.length === 1) return redondear2(limpias[0]);

  const posicion = (percentil / 100) * (limpias.length - 1);
  const inferior = Math.floor(posicion);
  const superior = Math.ceil(posicion);
  const fraccion = posicion - inferior;

  const interpolado = limpias[inferior] + fraccion * (limpias[superior] - limpias[inferior]);
  return redondear2(interpolado);
}

/**
 * Extrae y normaliza casos de prueba a partir de un reporte JSON nativo de Playwright.
 *
 * @param {Record<string, any>} reportePlaywright
 * @returns {Array<{ id: string, titulo: string, archivo: string, proyecto: string, estado: 'passed' | 'failed' | 'flaky' | 'skipped', duracionMs: number, reintentos: number }>}
 */
export function normalizarReportePlaywright(reportePlaywright) {
  if (!reportePlaywright || typeof reportePlaywright !== 'object') {
    throw new TypeError('El reporte de Playwright debe ser un objeto JSON valido');
  }

  const casos = [];

  function recorrerSuite(suite, prefijoTitulos = [], archivoPadre = '') {
    const archivoActual = suite.file || archivoPadre || 'desconocido.spec.js';
    const rutaTitulos = suite.title ? [...prefijoTitulos, suite.title] : prefijoTitulos;

    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        const tituloCompleto = [...rutaTitulos, spec.title].filter(Boolean).join(' › ');
        const archivoSpec = spec.file || archivoActual;

        for (const testEntry of spec.tests ?? []) {
          const proyecto = testEntry.projectName || 'default';
          const resultados = Array.isArray(testEntry.results) ? testEntry.results : [];
          const duracionTotal = resultados.reduce(
            (acc, r) => acc + (typeof r.duration === 'number' ? r.duration : 0),
            0
          );
          const estadosIntentos = resultados.map((r) => r.status);
          const tuvoFallo = estadosIntentos.some(
            (s) => s === 'failed' || s === 'timedOut' || s === 'interrupted'
          );
          const tuvoExito = estadosIntentos.some((s) => s === 'passed');

          let estado;
          if (testEntry.status === 'flaky' || (tuvoFallo && tuvoExito)) {
            estado = 'flaky';
          } else if (
            testEntry.status === 'skipped' ||
            (estadosIntentos.length > 0 && estadosIntentos.every((s) => s === 'skipped'))
          ) {
            estado = 'skipped';
          } else if (testEntry.status === 'expected' || (!tuvoFallo && tuvoExito)) {
            estado = 'passed';
          } else {
            estado = 'failed';
          }

          casos.push({
            id: `${proyecto}::${archivoSpec}::${tituloCompleto}`,
            titulo: tituloCompleto,
            archivo: archivoSpec,
            proyecto,
            estado,
            duracionMs: redondear2(duracionTotal),
            reintentos: Math.max(0, resultados.length - 1),
          });
        }
      }
    }

    if (Array.isArray(suite.suites)) {
      for (const subSuite of suite.suites) {
        recorrerSuite(subSuite, rutaTitulos, archivoActual);
      }
    }
  }

  for (const suiteRaiz of reportePlaywright.suites ?? []) {
    recorrerSuite(suiteRaiz, [], suiteRaiz.file || '');
  }

  return casos;
}

function extraerAtributoXml(etiquetaApertura, nombreAtributo) {
  const regex = new RegExp(`\\b${nombreAtributo}\\s*=\\s*["']([^"']*)["']`, 'i');
  const coincidencia = etiquetaApertura.match(regex);
  return coincidencia ? coincidencia[1] : '';
}

/**
 * Parsea un reporte JUnit XML estándar sin dependencias externas y lo convierte
 * al formato normalizado del analizador de estabilidad.
 *
 * @param {string} xmlTexto
 */
export function parsearReporteJUnitXml(xmlTexto) {
  if (typeof xmlTexto !== 'string') {
    throw new TypeError('El contenido JUnit XML debe ser una cadena de texto');
  }

  const casos = [];
  const regexTestcase = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/gi;
  let match;

  while ((match = regexTestcase.exec(xmlTexto)) !== null) {
    const atributos = match[1] ?? '';
    const interior = match[2] ?? '';

    const nombre = extraerAtributoXml(atributos, 'name') || 'caso-sin-nombre';
    const clase = extraerAtributoXml(atributos, 'classname') || 'suite';
    const tiempoSegundos = Number.parseFloat(extraerAtributoXml(atributos, 'time') || '0');
    const duracionMs = Number.isFinite(tiempoSegundos) ? redondear2(tiempoSegundos * 1000) : 0;

    let estado = 'passed';
    if (/<skipped\b/i.test(interior)) {
      estado = 'skipped';
    } else if (/<(?:failure|error)\b/i.test(interior)) {
      estado = 'failed';
    }

    casos.push({
      id: `${clase}::${nombre}`,
      titulo: nombre,
      archivo: clase,
      proyecto: 'junit',
      estado,
      duracionMs,
      reintentos: 0,
    });
  }

  return casos;
}

/**
 * Analiza una corrida individual o un historial de múltiples corridas para cuantificar
 * flakiness (reintentos + flip-rate entre corridas), percentiles P50-P99 y puntaje SRE.
 *
 * @param {Array<any> | Array<Array<any>>} entradaCorridas
 */
export function analizarEstabilidadSuite(entradaCorridas) {
  if (!Array.isArray(entradaCorridas)) {
    throw new TypeError('Se requiere un arreglo de casos o un arreglo de corridas');
  }

  const corridas =
    entradaCorridas.length > 0 && Array.isArray(entradaCorridas[0])
      ? entradaCorridas
      : [entradaCorridas];

  const historialPorCaso = new Map();

  for (const corrida of corridas) {
    for (const caso of corrida) {
      if (!caso || typeof caso !== 'object') continue;
      const clave = caso.id || `${caso.archivo ?? 'spec'}::${caso.titulo ?? 'test'}`;
      if (!historialPorCaso.has(clave)) {
        historialPorCaso.set(clave, {
          id: clave,
          titulo: caso.titulo ?? clave,
          archivo: caso.archivo ?? 'desconocido',
          estados: [],
          duracionesMs: [],
          reintentosMaximos: 0,
        });
      }
      const registro = historialPorCaso.get(clave);
      registro.estados.push(caso.estado);
      if (typeof caso.duracionMs === 'number' && Number.isFinite(caso.duracionMs)) {
        registro.duracionesMs.push(caso.duracionMs);
      }
      if (typeof caso.reintentos === 'number' && caso.reintentos > registro.reintentosMaximos) {
        registro.reintentosMaximos = caso.reintentos;
      }
    }
  }

  let aprobados = 0;
  let fallidos = 0;
  let omitidos = 0;
  let intermitentes = 0;
  const todasLasDuraciones = [];
  const casosInestables = [];
  const resumenPorCaso = [];

  for (const registro of historialPorCaso.values()) {
    todasLasDuraciones.push(...registro.duracionesMs);
    const promedioCaso =
      registro.duracionesMs.length > 0
        ? redondear2(
            registro.duracionesMs.reduce((a, b) => a + b, 0) / registro.duracionesMs.length
          )
        : 0;

    const noOmitidos = registro.estados.filter((e) => e !== 'skipped');
    let transiciones = 0;
    for (let i = 1; i < noOmitidos.length; i += 1) {
      if (noOmitidos[i] !== noOmitidos[i - 1]) {
        transiciones += 1;
      }
    }
    const tasaTransicion =
      noOmitidos.length > 1 ? redondear2(transiciones / (noOmitidos.length - 1)) : 0;

    const tuvoFlakyExplicito = registro.estados.includes('flaky');
    const tuvoExito = registro.estados.includes('passed') || tuvoFlakyExplicito;
    const tuvoFallo = registro.estados.includes('failed');

    let clasificacion;
    if (noOmitidos.length === 0) {
      clasificacion = 'skipped';
      omitidos += 1;
    } else if (tuvoFlakyExplicito || (tuvoExito && tuvoFallo)) {
      clasificacion = 'flaky';
      intermitentes += 1;
      casosInestables.push({
        id: registro.id,
        titulo: registro.titulo,
        archivo: registro.archivo,
        tasaTransicion,
        reintentosMaximos: registro.reintentosMaximos,
        historial: registro.estados,
      });
    } else if (tuvoFallo) {
      clasificacion = 'failed';
      fallidos += 1;
    } else {
      clasificacion = 'passed';
      aprobados += 1;
    }

    resumenPorCaso.push({
      id: registro.id,
      titulo: registro.titulo,
      archivo: registro.archivo,
      clasificacion,
      duracionPromedioMs: promedioCaso,
    });
  }

  const totalCasos = historialPorCaso.size;
  const ejecutados = totalCasos - omitidos;
  const tasaAprobacion = ejecutados > 0 ? redondear2((aprobados / ejecutados) * 100) : 100;
  const tasaFlakiness = ejecutados > 0 ? redondear2((intermitentes / ejecutados) * 100) : 0;

  // Penalización ponderada: los fallos deterministas restan peso directo y los flaky
  // aplican penalización doble para impedir que los reintentos oculten deuda de estabilidad.
  const penalizacionFallos = ejecutados > 0 ? (fallidos / ejecutados) * 100 : 0;
  const penalizacionFlaky = ejecutados > 0 ? (intermitentes / ejecutados) * 150 : 0;
  const puntajeEstabilidad = redondear2(
    Math.max(0, Math.min(100, 100 - penalizacionFallos - penalizacionFlaky))
  );

  const promedioGlobal =
    todasLasDuraciones.length > 0
      ? redondear2(
          todasLasDuraciones.reduce((a, b) => a + b, 0) / todasLasDuraciones.length
        )
      : 0;
  const maximoGlobal =
    todasLasDuraciones.length > 0 ? redondear2(Math.max(...todasLasDuraciones)) : 0;

  const casosMasLentos = [...resumenPorCaso]
    .sort((a, b) => b.duracionPromedioMs - a.duracionPromedioMs)
    .slice(0, 5);

  return {
    totalCorridasAnalizadas: corridas.length,
    totalCasos,
    ejecutados,
    aprobados,
    fallidos,
    omitidos,
    intermitentes,
    tasaAprobacion,
    tasaFlakiness,
    puntajeEstabilidad,
    latenciaMs: {
      p50: calcularPercentil(todasLasDuraciones, 50),
      p90: calcularPercentil(todasLasDuraciones, 90),
      p95: calcularPercentil(todasLasDuraciones, 95),
      p99: calcularPercentil(todasLasDuraciones, 99),
      promedio: promedioGlobal,
      maximo: maximoGlobal,
    },
    casosInestables,
    casosMasLentos,
  };
}

/**
 * Evalúa si las métricas de una suite cumplen la compuerta de calidad (Quality Gate)
 * de Integración Continua bajo política de Cero Flakiness.
 *
 * @param {ReturnType<typeof analizarEstabilidadSuite>} metricas
 * @param {object} [umbrales]
 * @param {number} [umbrales.maxFlakinessPorcentaje=0]
 * @param {number} [umbrales.minTasaAprobacion=100]
 * @param {number} [umbrales.minPuntajeEstabilidad=100]
 * @param {number} [umbrales.maxP95Ms=15000]
 */
export function evaluarCompuertaCalidad(
  metricas,
  {
    maxFlakinessPorcentaje = 0,
    minTasaAprobacion = 100,
    minPuntajeEstabilidad = 100,
    maxP95Ms = 15000,
  } = {}
) {
  if (!metricas || typeof metricas !== 'object') {
    throw new TypeError('Se requieren metricas calculadas por analizarEstabilidadSuite');
  }

  const motivosFallo = [];

  if (metricas.tasaFlakiness > maxFlakinessPorcentaje) {
    motivosFallo.push(
      `Tasa de flakiness (${metricas.tasaFlakiness}%) excede el maximo permitido (${maxFlakinessPorcentaje}%)`
    );
  }
  if (metricas.tasaAprobacion < minTasaAprobacion) {
    motivosFallo.push(
      `Tasa de aprobacion (${metricas.tasaAprobacion}%) inferior al minimo requerido (${minTasaAprobacion}%)`
    );
  }
  if (metricas.puntajeEstabilidad < minPuntajeEstabilidad) {
    motivosFallo.push(
      `Puntaje de estabilidad (${metricas.puntajeEstabilidad}) inferior al umbral (${minPuntajeEstabilidad})`
    );
  }
  if (metricas.latenciaMs?.p95 > maxP95Ms) {
    motivosFallo.push(
      `Duracion P95 (${metricas.latenciaMs.p95} ms) supera el presupuesto de ejecucion (${maxP95Ms} ms)`
    );
  }

  return {
    aprobada: motivosFallo.length === 0,
    motivosFallo,
    metricas,
  };
}
