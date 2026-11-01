import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularPercentil,
  normalizarReportePlaywright,
  parsearReporteJUnitXml,
  analizarEstabilidadSuite,
  evaluarCompuertaCalidad,
} from '../src/analizador-estabilidad.js';

describe('analizador-estabilidad · Percentiles y normalizacion de reportes Playwright / JUnit', () => {
  it('calcula percentiles P50, P90, P95 y P99 con interpolacion lineal exacta', () => {
    const tiempos = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    assert.equal(calcularPercentil(tiempos, 50), 550);
    assert.equal(calcularPercentil(tiempos, 90), 910);
    assert.equal(calcularPercentil(tiempos, 95), 955);
    assert.equal(calcularPercentil([], 95), 0);
    assert.equal(calcularPercentil([420], 99), 420);
  });

  it('normaliza suites anidadas de Playwright y detecta casos flaky que aprobaron tras reintento', () => {
    const reporte = {
      suites: [
        {
          title: 'tareas.spec.js',
          file: 'tests/tareas.spec.js',
          suites: [
            {
              title: 'CRUD de tareas',
              specs: [
                {
                  title: 'crea una tarea nueva',
                  tests: [
                    {
                      projectName: 'chromium',
                      status: 'expected',
                      results: [{ status: 'passed', duration: 310 }],
                    },
                  ],
                },
                {
                  title: 'marca checkbox bajo latencia',
                  tests: [
                    {
                      projectName: 'chromium',
                      status: 'flaky',
                      results: [
                        { status: 'failed', duration: 1050 },
                        { status: 'passed', duration: 380 },
                      ],
                    },
                  ],
                },
                {
                  title: 'caso pendiente temporal',
                  tests: [
                    {
                      projectName: 'chromium',
                      status: 'skipped',
                      results: [{ status: 'skipped', duration: 0 }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const normalizados = normalizarReportePlaywright(reporte);
    assert.equal(normalizados.length, 3);
    assert.equal(normalizados[0].estado, 'passed');
    assert.equal(normalizados[1].estado, 'flaky');
    assert.equal(normalizados[1].reintentos, 1);
    assert.equal(normalizados[1].duracionMs, 1430);
    assert.equal(normalizados[2].estado, 'skipped');
  });

  it('parsea reportes JUnit XML con etiquetas autocerradas, fallos y omitidos', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <testsuites>
        <testsuite name="api-suite" tests="3">
          <testcase classname="auth.spec" name="login exitoso" time="0.145"/>
          <testcase classname="auth.spec" name="bloqueo fuerza bruta" time="0.412">
            <failure message="Esperaba 429 pero recibio 200"/>
          </testcase>
          <testcase classname="auth.spec" name="oauth externo" time="0.000">
            <skipped/>
          </testcase>
        </testsuite>
      </testsuites>`;

    const casos = parsearReporteJUnitXml(xml);
    assert.equal(casos.length, 3);
    assert.equal(casos[0].estado, 'passed');
    assert.equal(casos[0].duracionMs, 145);
    assert.equal(casos[1].estado, 'failed');
    assert.equal(casos[2].estado, 'skipped');
  });
});

describe('analizador-estabilidad · Flip-rate multicorrida y Compuerta de Calidad CI', () => {
  it('detecta intermitencia (flip-rate) entre corridas consecutivas aunque retries sea 0', () => {
    const corrida1 = [
      { id: 'c1', titulo: 'aislamiento de usuarios', archivo: 'tareas.spec.js', estado: 'passed', duracionMs: 280 },
      { id: 'c2', titulo: 'sincronizacion red lenta', archivo: 'red.spec.js', estado: 'passed', duracionMs: 1850 },
    ];
    const corrida2 = [
      { id: 'c1', titulo: 'aislamiento de usuarios', archivo: 'tareas.spec.js', estado: 'passed', duracionMs: 295 },
      { id: 'c2', titulo: 'sincronizacion red lenta', archivo: 'red.spec.js', estado: 'failed', duracionMs: 2010 },
    ];
    const corrida3 = [
      { id: 'c1', titulo: 'aislamiento de usuarios', archivo: 'tareas.spec.js', estado: 'passed', duracionMs: 270 },
      { id: 'c2', titulo: 'sincronizacion red lenta', archivo: 'red.spec.js', estado: 'passed', duracionMs: 1920 },
    ];

    const resumen = analizarEstabilidadSuite([corrida1, corrida2, corrida3]);
    assert.equal(resumen.totalCorridasAnalizadas, 3);
    assert.equal(resumen.intermitentes, 1);
    assert.equal(resumen.aprobados, 1);
    assert.equal(resumen.tasaFlakiness, 50);
    assert.equal(resumen.casosInestables[0].id, 'c2');
    assert.equal(resumen.casosInestables[0].tasaTransicion, 1);

    const compuerta = evaluarCompuertaCalidad(resumen);
    assert.equal(compuerta.aprobada, false);
    assert.ok(compuerta.motivosFallo.some((m) => m.includes('flakiness')));
  });

  it('aprueba la compuerta de calidad estricta cuando la suite tiene 0% flakiness y P95 bajo presupuesto', () => {
    const suiteDeterminista = [
      { id: 't1', titulo: 'registro nuevo', archivo: 'auth.spec.js', estado: 'passed', duracionMs: 410 },
      { id: 't2', titulo: 'login normalizado', archivo: 'auth.spec.js', estado: 'passed', duracionMs: 365 },
      { id: 't3', titulo: 'auditoria wcag aa', archivo: 'a11y.spec.js', estado: 'passed', duracionMs: 920 },
    ];

    const resumen = analizarEstabilidadSuite(suiteDeterminista);
    const compuerta = evaluarCompuertaCalidad(resumen, {
      maxFlakinessPorcentaje: 0,
      minTasaAprobacion: 100,
      minPuntajeEstabilidad: 100,
      maxP95Ms: 5000,
    });

    assert.equal(compuerta.aprobada, true);
    assert.deepEqual(compuerta.motivosFallo, []);
    assert.equal(resumen.puntajeEstabilidad, 100);
  });
});
