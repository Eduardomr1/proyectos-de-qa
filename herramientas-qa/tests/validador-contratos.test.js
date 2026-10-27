import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectarTipoJson,
  validarEsquema,
  validarRespuestaHttp,
  CONTRATOS_GESTOR_TAREAS,
} from '../src/validador-contratos.js';

describe('validador-contratos · Tipado estricto y validacion recursiva JSON Schema', () => {
  it('distingue estrictamente integer, number, boolean, array, null y non-finite-number', () => {
    assert.equal(detectarTipoJson(0), 'integer');
    assert.equal(detectarTipoJson(1), 'integer');
    assert.equal(detectarTipoJson(19.95), 'number');
    assert.equal(detectarTipoJson(false), 'boolean');
    assert.equal(detectarTipoJson([]), 'array');
    assert.equal(detectarTipoJson(null), 'null');
    assert.equal(detectarTipoJson(Number.NaN), 'non-finite-number');
  });

  it('detecta regresion BUG-006 cuando done se serializa como entero 0/1 en lugar de boolean', () => {
    const respuestaDefectuosa = {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      tiempoMs: 28,
      cuerpo: {
        id: 7,
        title: 'Revisar serializacion SQLite',
        done: 0,
        created_at: '2026-10-27 14:20:00',
      },
    };

    const resultado = validarRespuestaHttp(
      respuestaDefectuosa,
      CONTRATOS_GESTOR_TAREAS.tareaIndividual
    );

    assert.equal(resultado.valido, false);
    assert.equal(resultado.errores.length, 1);
    assert.equal(resultado.errores[0].ruta, '$.done');
    assert.equal(resultado.errores[0].regla, 'type');
    assert.equal(resultado.errores[0].recibido, 'integer');
  });

  it('detecta regresion BUG-007 cuando GET /tasks carece de envoltura paginada o excede limit', () => {
    const sinPaginacion = validarRespuestaHttp(
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
        tiempoMs: 35,
        cuerpo: [{ id: 1, title: 'Suelta', done: false, created_at: '2026-10-27T10:00:00Z' }],
      },
      CONTRATOS_GESTOR_TAREAS.listaTareasPaginada
    );
    assert.equal(sinPaginacion.valido, false);
    assert.equal(sinPaginacion.errores[0].ruta, '$');

    const limitExcesivo = validarRespuestaHttp(
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
        tiempoMs: 35,
        cuerpo: { tasks: [], total: 0, limit: 5000, offset: 0 },
      },
      CONTRATOS_GESTOR_TAREAS.listaTareasPaginada
    );
    assert.equal(limitExcesivo.valido, false);
    assert.equal(limitExcesivo.errores[0].ruta, '$.limit');
    assert.equal(limitExcesivo.errores[0].regla, 'maximum');
  });

  it('detecta propiedades no documentadas cuando additionalProperties es false (deriva de esquema)', () => {
    const resultado = validarEsquema(
      {
        id: 12,
        title: 'Auditar contrato',
        done: true,
        created_at: '2026-10-27T12:00:00Z',
        password_hash: '$2b$10$secretoFiltrado',
      },
      CONTRATOS_GESTOR_TAREAS.tareaIndividual.esquemaCuerpo
    );

    assert.equal(resultado.valido, false);
    assert.ok(
      resultado.errores.some(
        (e) => e.ruta === '$.password_hash' && e.regla === 'additionalProperties'
      )
    );
  });

  it('valida formatos email, uuid, iso-date-time, jwt y unicidad en arreglos', () => {
    const esquema = {
      type: 'object',
      required: ['email', 'id', 'creadoEn', 'token', 'tags'],
      properties: {
        email: { type: 'string', format: 'email' },
        id: { type: 'string', format: 'uuid' },
        creadoEn: { type: 'string', format: 'iso-date-time' },
        token: { type: 'string', format: 'jwt' },
        tags: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string' } },
      },
    };

    const ok = validarEsquema(
      {
        email: 'qa@dominio.mx',
        id: '550e8400-e29b-41d4-a716-446655440000',
        creadoEn: '2026-10-27T14:25:00Z',
        token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.firmaBase64Url_123',
        tags: ['api', 'contrato'],
      },
      esquema
    );
    assert.equal(ok.valido, true);

    const fallo = validarEsquema(
      {
        email: 'invalido',
        id: 'no-es-uuid',
        creadoEn: 'ayer',
        token: 'token-sin-puntos',
        tags: ['dup', 'dup'],
      },
      esquema
    );
    assert.equal(fallo.valido, false);
    assert.equal(fallo.errores.length, 5);
  });
});

describe('validador-contratos · Contratos HTTP completos, cabeceras y SLO de latencia', () => {
  it('aprueba respuestas HTTP conformes para /health, /auth/login, /tasks y DELETE 204', () => {
    assert.equal(
      validarRespuestaHttp(
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          tiempoMs: 14,
          cuerpo: { status: 'ok' },
        },
        CONTRATOS_GESTOR_TAREAS.salud
      ).valido,
      true
    );

    assert.equal(
      validarRespuestaHttp(
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          tiempoMs: 42,
          cuerpo: { token: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.abc123XYZ_-' },
        },
        CONTRATOS_GESTOR_TAREAS.autenticacionToken
      ).valido,
      true
    );

    assert.equal(
      validarRespuestaHttp(
        { status: 204, headers: {}, tiempoMs: 19, cuerpo: '' },
        CONTRATOS_GESTOR_TAREAS.eliminacionSinContenido
      ).valido,
      true
    );
  });

  it('reporta violaciones de codigo HTTP, presupuesto de latencia, Content-Type HTML y cuerpo no vacio en 204', () => {
    const falloSalud = validarRespuestaHttp(
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
        tiempoMs: 820,
        cuerpo: { status: 'degraded' },
      },
      CONTRATOS_GESTOR_TAREAS.salud
    );

    assert.equal(falloSalud.valido, false);
    const reglasFallidas = falloSalud.errores.map((e) => e.regla);
    assert.ok(reglasFallidas.includes('status'));
    assert.ok(reglasFallidas.includes('maxLatenciaMs'));
    assert.ok(reglasFallidas.includes('contentTypeJson'));
    assert.ok(reglasFallidas.includes('const'));

    const fallo204 = validarRespuestaHttp(
      { status: 204, tiempoMs: 10, cuerpo: '{"unexpected":true}' },
      CONTRATOS_GESTOR_TAREAS.eliminacionSinContenido
    );
    assert.equal(fallo204.valido, false);
    assert.equal(fallo204.errores[0].regla, 'cuerpoVacio');
  });
});
