#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generarValoresLimiteTexto,
  generarCredencialesPrueba,
  validarRespuestaHttp,
  CONTRATOS_GESTOR_TAREAS,
  normalizarReportePlaywright,
  parsearReporteJUnitXml,
  analizarEstabilidadSuite,
  evaluarCompuertaCalidad,
  obtenerVectoresOwasp,
} from './index.js';

function leerOpcion(args, bandera, porDefecto = undefined) {
  const idx = args.indexOf(bandera);
  if (idx === -1 || idx + 1 >= args.length) return porDefecto;
  return args[idx + 1];
}

function imprimirAyuda() {
  const texto = `herramientas-qa — Kit CLI de Ingenieria de Calidad (Node.js 22, 0 dependencias)

Uso:
  node src/cli.js <comando> [opciones]

Comandos disponibles:
  limites-texto [--min N] [--max N]
      Genera tabla JSON de Analisis de Valores Limite (BVA) y Particiones de Equivalencia.

  credenciales [--seed S] [--email minusculas|mayusculas|mixto|invalido] [--password fuerte|comun|corta]
      Genera credenciales deterministas reproducibles para pruebas de autenticacion.

  validar-contrato --contrato <nombre> --archivo <respuesta.json>
      Valida una respuesta HTTP serializada contra un contrato canonico
      (${Object.keys(CONTRATOS_GESTOR_TAREAS).join(', ')}).

  analizar-reporte --archivo <reporte.json|xml> [--formato playwright|junit] [--max-flaky N]
      Calcula tasa de flakiness, percentiles P50-P99 y evalua la compuerta de calidad CI.

  vectores-owasp [--categoria <ID>]
      Exporta el catalogo defensivo de vectores OWASP API Security Top 10 (2023).
`;
  process.stdout.write(texto);
}

export function ejecutarCli(argv = process.argv.slice(2)) {
  const comando = argv[0];

  if (!comando || comando === '--help' || comando === '-h') {
    imprimirAyuda();
    return 0;
  }

  switch (comando) {
    case 'limites-texto': {
      const min = Number.parseInt(leerOpcion(argv, '--min', '1'), 10);
      const max = Number.parseInt(leerOpcion(argv, '--max', '200'), 10);
      const casos = generarValoresLimiteTexto({ min, max });
      process.stdout.write(`${JSON.stringify(casos, null, 2)}\n`);
      return 0;
    }

    case 'credenciales': {
      const seed = leerOpcion(argv, '--seed', 'qa-cli-seed');
      const varianteEmail = leerOpcion(argv, '--email', 'minusculas');
      const fortalezaPassword = leerOpcion(argv, '--password', 'fuerte');
      const resultado = generarCredencialesPrueba(seed, { varianteEmail, fortalezaPassword });
      process.stdout.write(`${JSON.stringify(resultado, null, 2)}\n`);
      return 0;
    }

    case 'validar-contrato': {
      const nombreContrato = leerOpcion(argv, '--contrato');
      const rutaArchivo = leerOpcion(argv, '--archivo');
      if (!nombreContrato || !rutaArchivo) {
        process.stderr.write('Error: se requieren --contrato <nombre> y --archivo <ruta>\n');
        return 1;
      }
      const contrato = CONTRATOS_GESTOR_TAREAS[nombreContrato];
      if (!contrato) {
        process.stderr.write(`Error: contrato desconocido "${nombreContrato}"\n`);
        return 1;
      }
      const respuesta = JSON.parse(readFileSync(resolve(rutaArchivo), 'utf8'));
      const veredicto = validarRespuestaHttp(respuesta, contrato);
      process.stdout.write(`${JSON.stringify(veredicto, null, 2)}\n`);
      return veredicto.valido ? 0 : 1;
    }

    case 'analizar-reporte': {
      const rutaArchivo = leerOpcion(argv, '--archivo');
      if (!rutaArchivo) {
        process.stderr.write('Error: se requiere --archivo <ruta>\n');
        return 1;
      }
      const formato =
        leerOpcion(argv, '--formato') ??
        (rutaArchivo.toLowerCase().endsWith('.xml') ? 'junit' : 'playwright');
      const maxFlaky = Number.parseFloat(leerOpcion(argv, '--max-flaky', '0'));

      const contenido = readFileSync(resolve(rutaArchivo), 'utf8');
      const normalizados =
        formato === 'junit'
          ? parsearReporteJUnitXml(contenido)
          : normalizarReportePlaywright(JSON.parse(contenido));

      const metricas = analizarEstabilidadSuite(normalizados);
      const compuerta = evaluarCompuertaCalidad(metricas, {
        maxFlakinessPorcentaje: maxFlaky,
      });
      process.stdout.write(`${JSON.stringify(compuerta, null, 2)}\n`);
      return compuerta.aprobada ? 0 : 1;
    }

    case 'vectores-owasp': {
      const categoria = leerOpcion(argv, '--categoria');
      const vectores = obtenerVectoresOwasp(categoria);
      process.stdout.write(`${JSON.stringify(vectores, null, 2)}\n`);
      return 0;
    }

    default:
      process.stderr.write(`Comando no reconocido: "${comando}". Usa --help para ver opciones.\n`);
      return 1;
  }
}

const esEjecucionDirecta =
  Boolean(process.argv[1]) && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (esEjecucionDirecta) {
  try {
    const codigo = ejecutarCli(process.argv.slice(2));
    process.exitCode = codigo;
  } catch (error) {
    process.stderr.write(`Error fatal en herramientas-qa: ${error.message}\n`);
    process.exitCode = 1;
  }
}
