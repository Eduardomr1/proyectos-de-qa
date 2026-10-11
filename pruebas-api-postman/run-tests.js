#!/usr/bin/env node

/**
 * Runner Configurable de Pruebas de API con Newman y Reportes Ejecutivos
 * Día 14 - API Automation & Executive Reporting
 * 
 * Permite ejecutar la colección de Postman en entornos locales y CI/CD,
 * personalizando colecciones, entornos, carpetas específicas, timeouts
 * y generando reportes HTML interactivos con dashboard de métricas ejecutivas.
 */

const fs = require('fs');
const path = require('path');
const newman = require('newman');

// Parseo de argumentos de línea de comandos
function parseArgs(args) {
  const options = {
    collection: process.env.COLLECTION_PATH || 'coleccion.json',
    environment: process.env.ENVIRONMENT_PATH || 'entorno.local.json',
    report: process.env.REPORT === 'true' || process.env.GENERATE_REPORT === 'true' || false,
    reportPath: process.env.REPORT_PATH || path.join('reporte', 'reporte-ejecutivo.html'),
    folder: process.env.TEST_FOLDER || null,
    bail: process.env.BAIL === 'true' || false,
    iterations: parseInt(process.env.ITERATIONS || '1', 10),
    delay: parseInt(process.env.DELAY || '0', 10),
    timeout: parseInt(process.env.TIMEOUT || '10000', 10),
    baseUrl: process.env.BASE_URL || null,
    envVars: [],
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--report' || arg === '-r') {
      options.report = true;
    } else if (arg === '--no-report') {
      options.report = false;
    } else if (arg === '--collection' || arg === '-c') {
      options.collection = args[++i];
    } else if (arg === '--environment' || arg === '-e') {
      options.environment = args[++i];
    } else if (arg === '--folder' || arg === '-f') {
      options.folder = args[++i];
    } else if (arg === '--report-path') {
      options.reportPath = args[++i];
    } else if (arg === '--bail' || arg === '-b') {
      options.bail = true;
    } else if (arg === '--iterations' || arg === '-n') {
      options.iterations = parseInt(args[++i], 10);
    } else if (arg === '--delay') {
      options.delay = parseInt(args[++i], 10);
    } else if (arg === '--timeout') {
      options.timeout = parseInt(args[++i], 10);
    } else if (arg === '--base-url') {
      options.baseUrl = args[++i];
    } else if (arg === '--env-var') {
      const pair = args[++i];
      if (pair && pair.includes('=')) {
        const [key, ...rest] = pair.split('=');
        options.envVars.push({ key: key.trim(), value: rest.join('=').trim() });
      }
    }
  }

  return options;
}

function showHelp() {
  console.log(`
=============================================================================
           Runner de Pruebas API con Newman y Reportería Ejecutiva
=============================================================================

Uso:
  node run-tests.js [opciones]
  npm test
  npm run test:report

Opciones principales:
  -r, --report            Genera reporte HTML interactivo con dashboard (htmlextra)
  --no-report             Desactiva la generación del reporte HTML
  --report-path <ruta>    Ruta de destino del reporte HTML (default: reporte/reporte-ejecutivo.html)
  -c, --collection <ruta> Archivo JSON de colección (default: coleccion.json)
  -e, --environment <ruta> Archivo JSON de entorno (default: entorno.local.json)
  -f, --folder <nombre>   Ejecuta únicamente una carpeta específica (ej. 'Salud', 'Autenticacion', 'Tareas', 'Seguridad')
  -b, --bail              Detiene la ejecución en la primera aserción fallida
  -n, --iterations <num>  Número de iteraciones a ejecutar (default: 1)
  --base-url <url>        Sobrescribe la variable baseUrl (ej. http://localhost:3000)
  --env-var <clave=valor> Define o sobrescribe variables del entorno
  --delay <ms>            Pausa en milisegundos entre cada petición
  --timeout <ms>          Timeout máximo por petición en ms (default: 10000)
  -h, --help              Muestra esta pantalla de ayuda

Variables de Entorno:
  REPORT=true             Activa reporte HTML
  REPORT_PATH             Ruta del reporte
  BASE_URL                Sobrescribe baseUrl
  TEST_FOLDER             Carpeta a ejecutar
  BAIL=true               Detención temprana

Ejemplos:
  node run-tests.js
  node run-tests.js --report
  node run-tests.js -f Autenticacion --report
  node run-tests.js --base-url http://api.staging.local:3000 --report
=============================================================================
`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Resolver rutas relativas/absolutas
  const collectionPath = path.resolve(process.cwd(), options.collection);
  if (!fs.existsSync(collectionPath)) {
    console.error(`\x1b[31m[ERROR]\x1b[0m No se encontro la coleccion en: ${collectionPath}`);
    process.exit(1);
  }

  let environmentPath = null;
  if (options.environment) {
    environmentPath = path.resolve(process.cwd(), options.environment);
    if (!fs.existsSync(environmentPath)) {
      console.warn(`\x1b[33m[ADVERTENCIA]\x1b[0m Archivo de entorno no encontrado en: ${environmentPath}. Se ejecutara sin entorno.`);
      environmentPath = null;
    }
  }

  // Si se pasó baseUrl por CLI o env, agregar a envVars
  if (options.baseUrl) {
    options.envVars.push({ key: 'baseUrl', value: options.baseUrl });
  }

  // Configuración de reportería
  const reporters = ['cli'];
  let exportPath = null;

  if (options.report) {
    reporters.push('htmlextra');
    exportPath = path.resolve(process.cwd(), options.reportPath);
    const reportDir = path.dirname(exportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  // Banner informativo
  console.log('\n=============================================================================');
  console.log('            EJECUCIÓN DE PRUEBAS DE API AUTOMATIZADAS - NEWMAN               ');
  console.log('=============================================================================');
  console.log(`  Colección:   ${options.collection}`);
  console.log(`  Entorno:     ${options.environment || 'Ninguno'}`);
  if (options.folder) console.log(`  Carpeta:     ${options.folder}`);
  if (options.baseUrl) console.log(`  Base URL:    ${options.baseUrl}`);
  console.log(`  Iteraciones: ${options.iterations}`);
  console.log(`  Reporte:     ${options.report ? `HTML Extra (${options.reportPath})` : 'Consola CLI'}`);
  console.log(`  Fecha/Hora:  ${new Date().toISOString()}`);
  console.log('=============================================================================\n');

  const newmanConfig = {
    collection: collectionPath,
    environment: environmentPath,
    reporters: reporters,
    iterationCount: options.iterations,
    bail: options.bail,
    delayRequest: options.delay,
    timeoutRequest: options.timeout
  };

  if (options.folder) {
    newmanConfig.folder = options.folder;
  }

  if (options.envVars.length > 0) {
    newmanConfig.envVar = options.envVars;
  }

  if (options.report) {
    newmanConfig.reporter = {
      htmlextra: {
        export: exportPath,
        title: 'Reporte Ejecutivo de Pruebas API - Gestor de Tareas',
        titleSize: 2,
        logs: true,
        showOnlyFails: false,
        noSyntaxHighlighting: false,
        testPaging: true,
        browserTitle: 'Dashboard Ejecutivo | Newman & Postman',
        displayProgressBar: true,
        showEnvironmentData: true,
        showGlobalData: true,
        skipSensitiveData: true,
        showMarkdownLinks: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Hermosillo'
      }
    };
  }

  const startTime = Date.now();

  newman.run(newmanConfig, (err, summary) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (err) {
      console.error('\n\x1b[31m[ERROR CRÍTICO EN LA EJECUCIÓN]\x1b[0m', err);
      process.exit(1);
    }

    const run = summary.run;
    const stats = run.stats;
    const failures = run.failures;

    const totalAssertions = stats.assertions.total;
    const failedAssertions = stats.assertions.failed;
    const passedAssertions = totalAssertions - failedAssertions;
    const passRate = totalAssertions > 0 ? ((passedAssertions / totalAssertions) * 100).toFixed(1) : 0;

    console.log('\n=============================================================================');
    console.log('                     DASHBOARD RESUMEN EJECUTIVO                             ');
    console.log('=============================================================================');
    console.log(`  Duración total:        ${duration}s`);
    console.log(`  Iteraciones:           ${stats.iterations.total}`);
    console.log(`  Peticiones HTTP:       ${stats.requests.total} (Fallidas: ${stats.requests.failed})`);
    console.log(`  Scripts de prueba:     ${stats.testScripts.total} (Fallidos: ${stats.testScripts.failed})`);
    console.log(`  Aserciones ejecutadas: ${totalAssertions}`);
    console.log(`    - Exitosas:          \x1b[32m${passedAssertions}\x1b[0m`);
    console.log(`    - Fallidas:          ${failedAssertions > 0 ? `\x1b[31m${failedAssertions}\x1b[0m` : '0'}`);
    console.log(`    - Tasa de éxito:     ${passRate}%`);
    console.log(`  Tiempo de respuesta:   Promedio: ${run.timings.responseAverage || 0}ms | Min: ${run.timings.responseMin || 0}ms | Max: ${run.timings.responseMax || 0}ms`);

    if (options.report && exportPath) {
      console.log('-----------------------------------------------------------------------------');
      console.log(`  \x1b[36m[REPORTE GENERADO]\x1b[0m`);
      console.log(`  Archivo HTML: ${exportPath}`);
    }
    console.log('=============================================================================\n');

    if (failures.length > 0) {
      console.error(`\x1b[31m[FALLO]\x1b[0m Se detectaron ${failures.length} fallos en las pruebas.`);
      process.exit(1);
    } else {
      console.log('\x1b[32m[ÉXITO]\x1b[0m Todas las pruebas y aserciones pasaron satisfactoriamente.');
      process.exit(0);
    }
  });
}

main();
