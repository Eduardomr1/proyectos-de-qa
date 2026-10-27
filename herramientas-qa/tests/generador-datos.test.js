import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  derivarEstadoSemilla,
  crearGeneradorDeterminista,
  generarValoresLimiteTexto,
  generarValoresLimiteEntero,
  generarCredencialesPrueba,
  generarPayloadTarea,
} from '../src/generador-datos.js';

describe('generador-datos · PRNG determinista con semilla', () => {
  it('reproduce exactamente la misma secuencia de enteros, tokens y UUIDv4 con igual semilla', () => {
    const a = crearGeneradorDeterminista('corrida-ci-4821');
    const b = crearGeneradorDeterminista('corrida-ci-4821');

    assert.equal(derivarEstadoSemilla('corrida-ci-4821'), derivarEstadoSemilla('corrida-ci-4821'));
    assert.equal(a.enteroEntre(10, 500), b.enteroEntre(10, 500));
    assert.equal(a.cadenaAlfanumerica(16), b.cadenaAlfanumerica(16));

    const uuidA = a.uuidDeterminista();
    const uuidB = b.uuidDeterminista();
    assert.equal(uuidA, uuidB);
    assert.match(
      uuidA,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('produce secuencias independientes cuando cambia la semilla', () => {
    const a = crearGeneradorDeterminista('semilla-alfa');
    const b = crearGeneradorDeterminista('semilla-beta');

    assert.notEqual(a.uuidDeterminista(), b.uuidDeterminista());
    assert.notEqual(a.cadenaAlfanumerica(12), b.cadenaAlfanumerica(12));
  });

  it('valida argumentos fuera de contrato en enteroEntre, elegir y cadenaAlfanumerica', () => {
    const rng = crearGeneradorDeterminista(99);
    assert.throws(() => rng.enteroEntre(20, 10), RangeError);
    assert.throws(() => rng.enteroEntre(1.5, 5), RangeError);
    assert.throws(() => rng.elegir([]), TypeError);
    assert.throws(() => rng.cadenaAlfanumerica(-1), RangeError);
  });
});

describe('generador-datos · Analisis de Valores Limite (BVA) en texto y enteros', () => {
  it('genera fronteras exactas [1, 200] para titulos de tareas (BUG-003 y BUG-004)', () => {
    const casos = generarValoresLimiteTexto({ min: 1, max: 200 });
    const porId = new Map(casos.map((c) => [c.id, c]));

    assert.equal(porId.get('vacio').longitud, 0);
    assert.equal(porId.get('vacio').validoEsperado, false);

    assert.equal(porId.get('solo-espacios').validoEsperado, false);
    assert.equal(porId.get('solo-espacios').valor.trim(), '');

    assert.equal(porId.get('en-minimo').longitud, 1);
    assert.equal(porId.get('en-minimo').validoEsperado, true);

    assert.equal(porId.get('sobre-minimo').longitud, 2);
    assert.equal(porId.get('bajo-maximo').longitud, 199);

    assert.equal(porId.get('en-maximo').longitud, 200);
    assert.equal(porId.get('en-maximo').validoEsperado, true);

    assert.equal(porId.get('sobre-maximo').longitud, 201);
    assert.equal(porId.get('sobre-maximo').validoEsperado, false);

    assert.ok(porId.has('bordes-con-espacios'));
    assert.ok(porId.has('unicode-nfc'));
  });

  it('marca cadena vacia como valida cuando el limite minimo es 0', () => {
    const casos = generarValoresLimiteTexto({ min: 0, max: 20, incluirUnicode: false });
    const vacio = casos.find((c) => c.id === 'vacio');
    assert.equal(vacio.validoEsperado, true);
    assert.equal(
      casos.some((c) => c.id === 'solo-espacios'),
      false
    );
  });

  it('genera fronteras enteras [1, 100] e invalidaciones de tipo para paginacion (BUG-007)', () => {
    const casos = generarValoresLimiteEntero({ min: 1, max: 100 });
    const porId = new Map(casos.map((c) => [c.id, c]));

    assert.equal(porId.get('bajo-minimo').valor, 0);
    assert.equal(porId.get('bajo-minimo').validoEsperado, false);
    assert.equal(porId.get('en-minimo').valor, 1);
    assert.equal(porId.get('en-minimo').validoEsperado, true);
    assert.equal(porId.get('en-maximo').valor, 100);
    assert.equal(porId.get('en-maximo').validoEsperado, true);
    assert.equal(porId.get('sobre-maximo').valor, 101);
    assert.equal(porId.get('sobre-maximo').validoEsperado, false);
    assert.equal(Number.isNaN(porId.get('nan').valor), true);
  });
});

describe('generador-datos · Fixtures de dominio Gestor de Tareas', () => {
  it('mantiene el mismo emailNormalizado entre variantes minusculas, mayusculas y mixto (BUG-001)', () => {
    const min = generarCredencialesPrueba('usuario-42', { varianteEmail: 'minusculas' });
    const may = generarCredencialesPrueba('usuario-42', { varianteEmail: 'mayusculas' });
    const mix = generarCredencialesPrueba('usuario-42', { varianteEmail: 'mixto' });

    assert.equal(min.emailNormalizado, may.emailNormalizado);
    assert.equal(min.emailNormalizado, mix.emailNormalizado);
    assert.equal(may.email, min.email.toUpperCase());
    assert.equal(min.esValidaEsperada, true);
  });

  it('marca como invalidas las credenciales con password comun o corta (BUG-005)', () => {
    const comun = generarCredencialesPrueba('usuario-99', { fortalezaPassword: 'comun' });
    const corta = generarCredencialesPrueba('usuario-99', { fortalezaPassword: 'corta' });
    const emailRoto = generarCredencialesPrueba('usuario-99', { varianteEmail: 'invalido' });

    assert.equal(comun.esValidaEsperada, false);
    assert.equal(corta.esValidaEsperada, false);
    assert.equal(corta.password.length, 5);
    assert.equal(emailRoto.esValidaEsperada, false);
    assert.equal(emailRoto.emailNormalizado, null);
  });

  it('construye payloads de tarea con longitudes exactas de frontera', () => {
    assert.equal(generarPayloadTarea('t1', 'limiteMaximo').title.length, 200);
    assert.equal(generarPayloadTarea('t1', 'excedeMaximo').title.length, 201);
    assert.equal(generarPayloadTarea('t1', 'soloEspacios').title.trim(), '');
    assert.equal(generarPayloadTarea('t1', 'vacia').title, '');
  });
});
