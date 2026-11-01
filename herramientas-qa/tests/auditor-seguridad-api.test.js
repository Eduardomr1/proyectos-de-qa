import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  obtenerVectoresOwasp,
  auditarCabecerasSeguridadHttp,
  auditarFugaInformacionError,
} from '../src/auditor-seguridad-api.js';

describe('auditor-seguridad-api · Catalogo defensivo OWASP API Top 10 (2023)', () => {
  it('entrega copias desacopladas de las 5 categorias OWASP API cubiertas', () => {
    const todo = obtenerVectoresOwasp();
    const categorias = Object.keys(todo);
    assert.deepEqual(categorias, [
      'API1:2023-BOLA',
      'API2:2023-Auth',
      'API3:2023-BOPLA',
      'API4:2023-ResourceConsumption',
      'API8:2023-MisconfigurationAndInjection',
    ]);

    const bola = obtenerVectoresOwasp('API1:2023-BOLA');
    bola[0].parametroId = 123;
    const bolaFresco = obtenerVectoresOwasp('API1:2023-BOLA');
    assert.equal(bolaFresco[0].parametroId, 999999);
  });

  it('lanza RangeError descriptivo ante categorias OWASP inexistentes', () => {
    assert.throws(() => obtenerVectoresOwasp('API99:Inexistente'), RangeError);
  });
});

describe('auditor-seguridad-api · Auditoria de cabeceras HTTP y CORS', () => {
  it('califica con 100/100 una respuesta endurecida con nosniff, DENY y HSTS', () => {
    const resultado = auditarCabecerasSeguridadHttp(
      {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Access-Control-Allow-Origin': 'https://app.midominio.com',
      },
      { requiereTls: true }
    );

    assert.equal(resultado.segura, true);
    assert.equal(resultado.puntaje, 100);
    assert.equal(resultado.hallazgos.length, 0);
  });

  it('detecta comodin CORS inseguro con credenciales, falta de nosniff y huella X-Powered-By', () => {
    const resultado = auditarCabecerasSeguridadHttp(
      {
        'X-Powered-By': 'Express',
        Server: 'nginx/1.24.0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
      { requiereTls: true }
    );

    assert.equal(resultado.segura, false);
    const reglas = resultado.hallazgos.map((h) => h.regla);
    assert.ok(reglas.includes('insecure-cors-wildcard-credentials'));
    assert.ok(reglas.includes('missing-nosniff'));
    assert.ok(reglas.includes('missing-hsts'));
    assert.ok(reglas.includes('tech-fingerprint-x-powered-by'));
    assert.ok(reglas.includes('verbose-server-version'));
  });
});

describe('auditor-seguridad-api · Prevencion de fugas de informacion en errores HTTP', () => {
  it('aprueba errores JSON semanticos limpios sin detalles de infraestructura', () => {
    const resultado = auditarFugaInformacionError({
      status: 401,
      cuerpo: { error: 'Credenciales invalidas' },
    });

    assert.equal(resultado.libreDeFugas, true);
    assert.equal(resultado.hallazgos.length, 0);
  });

  it('detecta stack traces de V8, codigos crudos SQLITE_ERROR, rutas internas y HTML por defecto', () => {
    const fugaSqlYStack = auditarFugaInformacionError({
      status: 500,
      cuerpo: {
        error:
          'SQLITE_ERROR: near "FROM": syntax error\n    at Database.prepare (/app/src/db.js:42:15)',
      },
    });

    assert.equal(fugaSqlYStack.libreDeFugas, false);
    const reglas = fugaSqlYStack.hallazgos.map((h) => h.regla);
    assert.ok(reglas.includes('sqlite-driver-error'));
    assert.ok(reglas.includes('node-stack-trace'));
    assert.ok(reglas.includes('filesystem-path-leak'));

    const htmlDefault = auditarFugaInformacionError({
      status: 404,
      cuerpo: '<!DOCTYPE html><html><body><pre>Cannot GET /secreto</pre></body></html>',
    });
    assert.equal(htmlDefault.libreDeFugas, false);
    assert.equal(htmlDefault.hallazgos[0].regla, 'default-html-error-page');
  });
});
