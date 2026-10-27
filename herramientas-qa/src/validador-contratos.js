const REGEX_FORMATOS = Object.freeze({
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  'iso-date-time':
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/,
  jwt: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
});

/**
 * Determina el tipo real de un valor en términos de JSON Schema estricto.
 * Nota: `0` y `1` son `'integer'`, nunca `'boolean'` (detecta defectos tipo BUG-006).
 *
 * @param {unknown} valor
 * @returns {string}
 */
export function detectarTipoJson(valor) {
  if (valor === null) return 'null';
  if (Array.isArray(valor)) return 'array';
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return 'non-finite-number';
    return Number.isInteger(valor) ? 'integer' : 'number';
  }
  return typeof valor;
}

function coincideTipo(valor, tipoEsperado) {
  const tipoReal = detectarTipoJson(valor);
  if (tipoEsperado === 'number') {
    return tipoReal === 'number' || tipoReal === 'integer';
  }
  return tipoReal === tipoEsperado;
}

/**
 * Valida recursivamente un payload contra un esquema declarativo estilo JSON Schema.
 *
 * @param {unknown} valor
 * @param {Record<string, any>} esquema
 * @param {string} [ruta='$']
 * @returns {{ valido: boolean, errores: Array<{ ruta: string, regla: string, esperado: unknown, recibido: unknown, mensaje: string }> }}
 */
export function validarEsquema(valor, esquema, ruta = '$') {
  if (!esquema || typeof esquema !== 'object') {
    throw new TypeError('El esquema de contrato debe ser un objeto valido');
  }

  const errores = [];

  function registrarError(rutaActual, regla, esperado, recibido, mensaje) {
    errores.push({
      ruta: rutaActual,
      regla,
      esperado,
      recibido,
      mensaje,
    });
  }

  function inspeccionar(nodo, reglas, rutaActual) {
    if (reglas.nullable === true && nodo === null) {
      return;
    }

    if (reglas.type !== undefined) {
      const tiposPermitidos = Array.isArray(reglas.type) ? reglas.type : [reglas.type];
      const cumpleAlguno = tiposPermitidos.some((t) => coincideTipo(nodo, t));
      if (!cumpleAlguno) {
        const tipoReal = detectarTipoJson(nodo);
        registrarError(
          rutaActual,
          'type',
          reglas.type,
          tipoReal,
          `En ${rutaActual} se esperaba tipo ${JSON.stringify(reglas.type)}, pero se recibio ${tipoReal}`
        );
        return;
      }
    }

    if (Object.hasOwn(reglas, 'const') && nodo !== reglas.const) {
      registrarError(
        rutaActual,
        'const',
        reglas.const,
        nodo,
        `En ${rutaActual} se esperaba constante ${JSON.stringify(reglas.const)}`
      );
    }

    if (Array.isArray(reglas.enum) && !reglas.enum.includes(nodo)) {
      registrarError(
        rutaActual,
        'enum',
        reglas.enum,
        nodo,
        `En ${rutaActual} el valor ${JSON.stringify(nodo)} no pertenece a ${JSON.stringify(reglas.enum)}`
      );
    }

    if (typeof nodo === 'string') {
      if (typeof reglas.minLength === 'number' && nodo.length < reglas.minLength) {
        registrarError(
          rutaActual,
          'minLength',
          reglas.minLength,
          nodo.length,
          `En ${rutaActual} la longitud (${nodo.length}) es menor al minimo (${reglas.minLength})`
        );
      }
      if (typeof reglas.maxLength === 'number' && nodo.length > reglas.maxLength) {
        registrarError(
          rutaActual,
          'maxLength',
          reglas.maxLength,
          nodo.length,
          `En ${rutaActual} la longitud (${nodo.length}) excede el maximo (${reglas.maxLength})`
        );
      }
      if (reglas.noSoloEspacios === true && nodo.trim().length === 0) {
        registrarError(
          rutaActual,
          'noSoloEspacios',
          'texto con contenido visible',
          JSON.stringify(nodo),
          `En ${rutaActual} la cadena no puede estar vacia ni contener solo espacios`
        );
      }
      if (reglas.pattern !== undefined) {
        const regex =
          reglas.pattern instanceof RegExp ? reglas.pattern : new RegExp(reglas.pattern);
        if (!regex.test(nodo)) {
          registrarError(
            rutaActual,
            'pattern',
            String(reglas.pattern),
            nodo,
            `En ${rutaActual} el valor no cumple el patron ${reglas.pattern}`
          );
        }
      }
      if (typeof reglas.format === 'string') {
        const validadorFormato = REGEX_FORMATOS[reglas.format];
        if (!validadorFormato) {
          throw new RangeError(`Formato de esquema no soportado: ${reglas.format}`);
        }
        if (!validadorFormato.test(nodo)) {
          registrarError(
            rutaActual,
            'format',
            reglas.format,
            nodo,
            `En ${rutaActual} el valor no tiene un formato ${reglas.format} valido`
          );
        }
      }
    }

    if (typeof nodo === 'number' && Number.isFinite(nodo)) {
      if (typeof reglas.minimum === 'number' && nodo < reglas.minimum) {
        registrarError(
          rutaActual,
          'minimum',
          reglas.minimum,
          nodo,
          `En ${rutaActual} el valor (${nodo}) es menor al minimo permitido (${reglas.minimum})`
        );
      }
      if (typeof reglas.maximum === 'number' && nodo > reglas.maximum) {
        registrarError(
          rutaActual,
          'maximum',
          reglas.maximum,
          nodo,
          `En ${rutaActual} el valor (${nodo}) supera el maximo permitido (${reglas.maximum})`
        );
      }
      if (typeof reglas.multipleOf === 'number' && reglas.multipleOf > 0) {
        const residuo = Math.abs(nodo % reglas.multipleOf);
        if (residuo > 1e-9 && Math.abs(residuo - reglas.multipleOf) > 1e-9) {
          registrarError(
            rutaActual,
            'multipleOf',
            reglas.multipleOf,
            nodo,
            `En ${rutaActual} el valor (${nodo}) no es multiplo de ${reglas.multipleOf}`
          );
        }
      }
    }

    if (Array.isArray(nodo)) {
      if (typeof reglas.minItems === 'number' && nodo.length < reglas.minItems) {
        registrarError(
          rutaActual,
          'minItems',
          reglas.minItems,
          nodo.length,
          `En ${rutaActual} el arreglo contiene ${nodo.length} items (minimo ${reglas.minItems})`
        );
      }
      if (typeof reglas.maxItems === 'number' && nodo.length > reglas.maxItems) {
        registrarError(
          rutaActual,
          'maxItems',
          reglas.maxItems,
          nodo.length,
          `En ${rutaActual} el arreglo contiene ${nodo.length} items (maximo ${reglas.maxItems})`
        );
      }
      if (reglas.uniqueItems === true) {
        const serializados = nodo.map((item) => JSON.stringify(item));
        if (new Set(serializados).size !== serializados.length) {
          registrarError(
            rutaActual,
            'uniqueItems',
            true,
            false,
            `En ${rutaActual} el arreglo contiene elementos duplicados`
          );
        }
      }
      if (reglas.items && typeof reglas.items === 'object') {
        nodo.forEach((elemento, indice) => {
          inspeccionar(elemento, reglas.items, `${rutaActual}[${indice}]`);
        });
      }
    }

    if (nodo !== null && typeof nodo === 'object' && !Array.isArray(nodo)) {
      if (Array.isArray(reglas.required)) {
        for (const campo of reglas.required) {
          if (!Object.hasOwn(nodo, campo) || nodo[campo] === undefined) {
            registrarError(
              `${rutaActual}.${campo}`,
              'required',
              campo,
              undefined,
              `Falta la propiedad obligatoria "${campo}" en ${rutaActual}`
            );
          }
        }
      }

      const propiedadesDefinidas = reglas.properties ?? {};
      for (const [clave, subEsquema] of Object.entries(propiedadesDefinidas)) {
        if (Object.hasOwn(nodo, clave) && nodo[clave] !== undefined) {
          inspeccionar(nodo[clave], subEsquema, `${rutaActual}.${clave}`);
        }
      }

      if (reglas.additionalProperties === false) {
        for (const claveActual of Object.keys(nodo)) {
          if (!Object.hasOwn(propiedadesDefinidas, claveActual)) {
            registrarError(
              `${rutaActual}.${claveActual}`,
              'additionalProperties',
              false,
              claveActual,
              `Propiedad no documentada "${claveActual}" detectada en ${rutaActual} (deriva de contrato)`
            );
          }
        }
      }
    }
  }

  inspeccionar(valor, esquema, ruta);

  return {
    valido: errores.length === 0,
    errores,
  };
}

function normalizarCabeceras(headers = {}) {
  const mapa = new Map();
  if (headers instanceof Map) {
    for (const [k, v] of headers.entries()) mapa.set(String(k).toLowerCase(), String(v));
  } else if (headers && typeof headers === 'object') {
    for (const [k, v] of Object.entries(headers)) mapa.set(k.toLowerCase(), String(v));
  }
  return mapa;
}

/**
 * Valida de forma integral una respuesta HTTP contra un contrato declarativo
 * que incluye código de estado, presupuesto SLA de latencia, cabeceras y esquema JSON.
 *
 * @param {object} respuesta
 * @param {number} respuesta.status
 * @param {Record<string, string>} [respuesta.headers]
 * @param {unknown} [respuesta.cuerpo]
 * @param {number} [respuesta.tiempoMs]
 * @param {object} contrato
 */
export function validarRespuestaHttp(respuesta, contrato) {
  if (!respuesta || typeof respuesta !== 'object') {
    throw new TypeError('Se requiere un objeto de respuesta HTTP para validar');
  }
  if (!contrato || typeof contrato !== 'object') {
    throw new TypeError('Se requiere un contrato HTTP para validar');
  }

  const errores = [];
  const cabeceras = normalizarCabeceras(respuesta.headers);

  if (contrato.status !== undefined) {
    const codigosEsperados = Array.isArray(contrato.status)
      ? contrato.status
      : [contrato.status];
    if (!codigosEsperados.includes(respuesta.status)) {
      errores.push({
        ruta: 'http.status',
        regla: 'status',
        esperado: contrato.status,
        recibido: respuesta.status,
        mensaje: `Codigo HTTP inesperado: se esperaba ${JSON.stringify(contrato.status)} y respondio ${respuesta.status}`,
      });
    }
  }

  if (
    typeof contrato.maxLatenciaMs === 'number' &&
    typeof respuesta.tiempoMs === 'number' &&
    respuesta.tiempoMs > contrato.maxLatenciaMs
  ) {
    errores.push({
      ruta: 'http.tiempoMs',
      regla: 'maxLatenciaMs',
      esperado: `<= ${contrato.maxLatenciaMs} ms`,
      recibido: `${respuesta.tiempoMs} ms`,
      mensaje: `Violacion de presupuesto SLO de latencia: ${respuesta.tiempoMs} ms supera ${contrato.maxLatenciaMs} ms`,
    });
  }

  if (contrato.cuerpoVacio === true) {
    const esVacio =
      respuesta.cuerpo === undefined ||
      respuesta.cuerpo === null ||
      respuesta.cuerpo === '';
    if (!esVacio) {
      errores.push({
        ruta: 'http.cuerpo',
        regla: 'cuerpoVacio',
        esperado: '',
        recibido: respuesta.cuerpo,
        mensaje: 'El contrato exige cuerpo estrictamente vacio (ej. HTTP 204 No Content)',
      });
    }
  } else if (contrato.requiereJson !== false && contrato.esquemaCuerpo) {
    const contentType = cabeceras.get('content-type') ?? '';
    if (cabeceras.size > 0 && !contentType.toLowerCase().includes('application/json')) {
      errores.push({
        ruta: 'http.headers.content-type',
        regla: 'contentTypeJson',
        esperado: 'application/json',
        recibido: contentType || '(ausente)',
        mensaje: `Content-Type debe incluir application/json, pero se recibio "${contentType || 'ausente'}"`,
      });
    }
  }

  if (contrato.cabecerasRequeridas && typeof contrato.cabecerasRequeridas === 'object') {
    for (const [nombre, esperado] of Object.entries(contrato.cabecerasRequeridas)) {
      const actual = cabeceras.get(nombre.toLowerCase());
      if (actual === undefined) {
        errores.push({
          ruta: `http.headers.${nombre.toLowerCase()}`,
          regla: 'headerRequired',
          esperado,
          recibido: undefined,
          mensaje: `Cabecera obligatoria ausente: ${nombre}`,
        });
      } else if (esperado instanceof RegExp && !esperado.test(actual)) {
        errores.push({
          ruta: `http.headers.${nombre.toLowerCase()}`,
          regla: 'headerPattern',
          esperado: String(esperado),
          recibido: actual,
          mensaje: `Cabecera ${nombre} ("${actual}") no coincide con ${esperado}`,
        });
      } else if (typeof esperado === 'string' && !actual.toLowerCase().includes(esperado.toLowerCase())) {
        errores.push({
          ruta: `http.headers.${nombre.toLowerCase()}`,
          regla: 'headerValue',
          esperado,
          recibido: actual,
          mensaje: `Cabecera ${nombre} ("${actual}") no contiene "${esperado}"`,
        });
      }
    }
  }

  if (contrato.esquemaCuerpo) {
    const resultadoCuerpo = validarEsquema(respuesta.cuerpo, contrato.esquemaCuerpo, '$');
    errores.push(...resultadoCuerpo.errores);
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

const ESQUEMA_ENTIDAD_TAREA = Object.freeze({
  type: 'object',
  required: ['id', 'title', 'done', 'created_at'],
  additionalProperties: false,
  properties: {
    id: { type: 'integer', minimum: 1 },
    user_id: { type: 'integer', minimum: 1 },
    title: { type: 'string', minLength: 1, maxLength: 200, noSoloEspacios: true },
    done: { type: 'boolean' },
    created_at: { type: 'string', minLength: 10 },
  },
});

/**
 * Contratos canónicos reutilizables de la API REST del Gestor de Tareas.
 */
export const CONTRATOS_GESTOR_TAREAS = Object.freeze({
  salud: Object.freeze({
    status: 200,
    maxLatenciaMs: 500,
    esquemaCuerpo: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', const: 'ok' },
      },
    },
  }),
  autenticacionToken: Object.freeze({
    status: [200, 201],
    maxLatenciaMs: 2000,
    esquemaCuerpo: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', format: 'jwt' },
      },
    },
  }),
  tareaIndividual: Object.freeze({
    status: [200, 201],
    maxLatenciaMs: 2000,
    esquemaCuerpo: ESQUEMA_ENTIDAD_TAREA,
  }),
  listaTareasPaginada: Object.freeze({
    status: 200,
    maxLatenciaMs: 2000,
    esquemaCuerpo: {
      type: 'object',
      required: ['tasks', 'total', 'limit', 'offset'],
      additionalProperties: false,
      properties: {
        tasks: { type: 'array', items: ESQUEMA_ENTIDAD_TAREA },
        total: { type: 'integer', minimum: 0 },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        offset: { type: 'integer', minimum: 0 },
      },
    },
  }),
  eliminacionSinContenido: Object.freeze({
    status: 204,
    maxLatenciaMs: 2000,
    cuerpoVacio: true,
  }),
  errorEstandar: Object.freeze({
    status: [400, 401, 403, 404, 409, 429],
    maxLatenciaMs: 2000,
    esquemaCuerpo: {
      type: 'object',
      required: ['error'],
      properties: {
        error: { type: 'string', minLength: 3, noSoloEspacios: true },
      },
    },
  }),
});
