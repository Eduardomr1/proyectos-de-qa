import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RUTA_CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));

function correrCli(argumentos) {
  try {
    const stdout = execFileSync(process.execPath, [RUTA_CLI, ...argumentos], {
      encoding: 'utf8',
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      status: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

describe('cli · Integracion de linea de comandos herramientas-qa', () => {
  it('despliega menu de ayuda con --help y codigo de salida 0', () => {
    const res = correrCli(['--help']);
    assert.equal(res.status, 0);
    assert.match(res.stdout, /herramientas-qa/);
    assert.match(res.stdout, /validar-contrato/);
  });

  it('exporta JSON valido para limites-texto, credenciales y vectores-owasp', () => {
    const limites = correrCli(['limites-texto', '--min', '1', '--max', '50']);
    assert.equal(limites.status, 0);
    const tabla = JSON.parse(limites.stdout);
    assert.ok(Array.isArray(tabla));
    assert.ok(tabla.some((c) => c.longitud === 51 && c.validoEsperado === false));

    const cred = correrCli(['credenciales', '--seed', 'ci-seed-77', '--email', 'mayusculas']);
    assert.equal(cred.status, 0);
    const datosCred = JSON.parse(cred.stdout);
    assert.equal(datosCred.email, datosCred.email.toUpperCase());

    const owasp = correrCli(['vectores-owasp', '--categoria', 'API2:2023-Auth']);
    assert.equal(owasp.status, 0);
    assert.equal(JSON.parse(owasp.stdout).length, 4);
  });

  it('retorna codigo 0 en contratos/reportes validos y codigo 1 cuando falla la compuerta', () => {
    const dirTemporal = mkdtempSync(join(tmpdir(), 'herramientas-qa-'));
    try {
      const archivoContratoOk = join(dirTemporal, 'salud-ok.json');
      writeFileSync(
        archivoContratoOk,
        JSON.stringify({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          tiempoMs: 18,
          cuerpo: { status: 'ok' },
        }),
        'utf8'
      );

      const okContrato = correrCli([
        'validar-contrato',
        '--contrato',
        'salud',
        '--archivo',
        archivoContratoOk,
      ]);
      assert.equal(okContrato.status, 0);
      assert.equal(JSON.parse(okContrato.stdout).valido, true);

      const archivoReporteFlaky = join(dirTemporal, 'playwright-flaky.json');
      writeFileSync(
        archivoReporteFlaky,
        JSON.stringify({
          suites: [
            {
              title: 'ui.spec.js',
              specs: [
                {
                  title: 'test intermitente',
                  tests: [
                    {
                      projectName: 'chromium',
                      status: 'flaky',
                      results: [
                        { status: 'failed', duration: 900 },
                        { status: 'passed', duration: 300 },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
        'utf8'
      );

      const falloGate = correrCli(['analizar-reporte', '--archivo', archivoReporteFlaky]);
      assert.equal(falloGate.status, 1);
      const cuerpoGate = JSON.parse(falloGate.stdout);
      assert.equal(cuerpoGate.aprobada, false);
      assert.equal(cuerpoGate.metricas.intermitentes, 1);
    } finally {
      rmSync(dirTemporal, { recursive: true, force: true });
    }
  });

  it('autodetecta reportes JUnit XML estables y aprueba la compuerta con codigo 0', () => {
    const dirTemporal = mkdtempSync(join(tmpdir(), 'herramientas-qa-junit-'));
    try {
      const archivoJunit = join(dirTemporal, 'resultados.xml');
      writeFileSync(
        archivoJunit,
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<testsuite name="api-regression" tests="2" failures="0">',
          '  <testcase classname="auth.spec" name="login exitoso" time="0.045" />',
          '  <testcase classname="tasks.spec" name="lista paginada" time="0.062" />',
          '</testsuite>',
        ].join('\n'),
        'utf8'
      );

      const okGate = correrCli(['analizar-reporte', '--archivo', archivoJunit, '--max-flaky', '0']);
      assert.equal(okGate.status, 0);
      const veredicto = JSON.parse(okGate.stdout);
      assert.equal(veredicto.aprobada, true);
      assert.equal(veredicto.metricas.aprobados, 2);
      assert.equal(veredicto.metricas.intermitentes, 0);
    } finally {
      rmSync(dirTemporal, { recursive: true, force: true });
    }
  });

  it('retorna codigo 1 y diagnostico en stderr ante comandos o argumentos invalidos', () => {
    const desconocido = correrCli(['comando-inexistente']);
    assert.equal(desconocido.status, 1);
    assert.match(desconocido.stderr, /Comando no reconocido/);

    const sinArgumentos = correrCli(['validar-contrato', '--contrato', 'salud']);
    assert.equal(sinArgumentos.status, 1);
    assert.match(sinArgumentos.stderr, /se requieren --contrato/);

    const contratoInvalido = correrCli([
      'validar-contrato',
      '--contrato',
      'inexistente',
      '--archivo',
      'dummy.json',
    ]);
    assert.equal(contratoInvalido.status, 1);
    assert.match(contratoInvalido.stderr, /contrato desconocido/);
  });
});
