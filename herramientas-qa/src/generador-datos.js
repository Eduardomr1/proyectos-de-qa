import { createHash } from 'node:crypto';

const ALFABETO_ALFANUMERICO = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CONTRASENAS_COMUNES_PRUEBA = Object.freeze([
  '12345678',
  'password',
  'qwerty123',
  'admin123',
  '123456789',
]);

/**
 * Convierte cualquier semilla (cadena o número) en un entero sin signo de 32 bits
 * mediante SHA-256 para inicializar un generador pseudoaleatorio reproducible.
 *
 * @param {string | number} semilla
 * @returns {number}
 */
export function derivarEstadoSemilla(semilla = 'qa-default-seed') {
  const texto = String(semilla);
  const digest = createHash('sha256').update(texto, 'utf8').digest();
  const estado = digest.readUInt32BE(0);
  return estado === 0 ? 0x6d2b79f5 : estado;
}

/**
 * Crea un generador pseudoaleatorio determinista basado en Mulberry32.
 * Misma semilla -> exactamente la misma secuencia de datos en local y en CI.
 *
 * @param {string | number} [semilla='qa-default-seed']
 */
export function crearGeneradorDeterminista(semilla = 'qa-default-seed') {
  let estado = derivarEstadoSemilla(semilla);

  function siguienteUint32() {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  function siguienteFloat() {
    return siguienteUint32() / 4294967296;
  }

  function enteroEntre(min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new RangeError(`Rango entero invalido: [${min}, ${max}]`);
    }
    return min + Math.floor(siguienteFloat() * (max - min + 1));
  }

  function elegir(elementos) {
    if (!Array.isArray(elementos) || elementos.length === 0) {
      throw new TypeError('Se requiere un arreglo no vacio para elegir un elemento');
    }
    return elementos[enteroEntre(0, elementos.length - 1)];
  }

  function cadenaAlfanumerica(longitud = 8) {
    if (!Number.isInteger(longitud) || longitud < 0) {
      throw new RangeError(`La longitud debe ser un entero no negativo: ${longitud}`);
    }
    let resultado = '';
    for (let i = 0; i < longitud; i += 1) {
      resultado += ALFABETO_ALFANUMERICO[enteroEntre(0, ALFABETO_ALFANUMERICO.length - 1)];
    }
    return resultado;
  }

  function uuidDeterminista() {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i += 4) {
      const palabra = siguienteUint32();
      bytes[i] = (palabra >>> 24) & 0xff;
      bytes[i + 1] = (palabra >>> 16) & 0xff;
      bytes[i + 2] = (palabra >>> 8) & 0xff;
      bytes[i + 3] = palabra & 0xff;
    }
    // RFC 4122 variante 1, version 4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  return Object.freeze({
    semillaOriginal: semilla,
    siguienteFloat,
    enteroEntre,
    elegir,
    cadenaAlfanumerica,
    uuidDeterminista,
  });
}

/**
 * Genera casos sistemáticos de Análisis de Valores Límite (BVA) y Partición de
 * Equivalencia (EP) para cadenas de texto con restricciones de longitud [min, max].
 *
 * @param {object} [opciones]
 * @param {number} [opciones.min=1]
 * @param {number} [opciones.max=200]
 * @param {string} [opciones.caracter='a']
 * @param {boolean} [opciones.incluirUnicode=true]
 */
export function generarValoresLimiteTexto({
  min = 1,
  max = 200,
  caracter = 'a',
  incluirUnicode = true,
} = {}) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min) {
    throw new RangeError(`Limites de longitud invalidos: min=${min}, max=${max}`);
  }
  if (typeof caracter !== 'string' || caracter.length !== 1) {
    throw new TypeError('El parametro "caracter" debe ser un string de longitud 1');
  }

  const casos = [];
  const vistos = new Set();

  function agregarCaso(id, valor, validoEsperado, particion, descripcion) {
    const clave = `${id}::${valor.length}`;
    if (vistos.has(clave)) return;
    vistos.add(clave);
    casos.push({
      id,
      valor,
      longitud: valor.length,
      validoEsperado,
      particion,
      descripcion,
    });
  }

  agregarCaso(
    'vacio',
    '',
    min === 0,
    min === 0 ? 'limite-minimo' : 'invalida-vacio',
    'Cadena completamente vacia (0 caracteres)'
  );

  if (min > 0) {
    agregarCaso(
      'solo-espacios',
      '   \t  ',
      false,
      'invalida-blancos',
      'Cadena compuesta unicamente por espacios y tabuladores (prevencion BUG-004)'
    );
  }

  if (min > 1) {
    agregarCaso(
      'bajo-minimo',
      caracter.repeat(min - 1),
      false,
      'limite-inferior-invalido',
      `Un caracter por debajo del minimo permitido (${min - 1})`
    );
  }

  if (min > 0) {
    agregarCaso(
      'en-minimo',
      caracter.repeat(min),
      true,
      'limite-inferior-valido',
      `Exactamente en el limite minimo permitido (${min})`
    );
  }

  if (min + 1 <= max) {
    agregarCaso(
      'sobre-minimo',
      caracter.repeat(min + 1),
      true,
      'limite-inferior-interno',
      `Un caracter por encima del minimo permitido (${min + 1})`
    );
  }

  const puntoMedio = Math.floor((min + max) / 2);
  if (puntoMedio > min + 1 && puntoMedio < max - 1) {
    agregarCaso(
      'nominal',
      caracter.repeat(puntoMedio),
      true,
      'equivalencia-nominal',
      `Valor nominal representativo dentro del rango (${puntoMedio})`
    );
  }

  if (max - 1 >= min && max - 1 !== min + 1) {
    agregarCaso(
      'bajo-maximo',
      caracter.repeat(max - 1),
      true,
      'limite-superior-interno',
      `Un caracter por debajo del maximo permitido (${max - 1})`
    );
  }

  if (max > min) {
    agregarCaso(
      'en-maximo',
      caracter.repeat(max),
      true,
      'limite-superior-valido',
      `Exactamente en el limite maximo permitido (${max})`
    );
  }

  agregarCaso(
    'sobre-maximo',
    caracter.repeat(max + 1),
    false,
    'limite-superior-invalido',
    `Un caracter por encima del maximo permitido (${max + 1}, prevencion BUG-003)`
  );

  if (max >= Math.max(min, 5) + 4) {
    const nucleo = caracter.repeat(Math.max(min, 5));
    agregarCaso(
      'bordes-con-espacios',
      `  ${nucleo}  `,
      true,
      'normalizacion-trim',
      'Texto valido rodeado de espacios para verificar recorte (trim)'
    );
  }

  if (incluirUnicode && max >= Math.max(min, 12)) {
    const baseUnicode = 'Revisión técnica áéíóú ñ ü';
    const ajustado =
      baseUnicode.length < min
        ? baseUnicode.padEnd(min, 'a')
        : baseUnicode.slice(0, max);
    agregarCaso(
      'unicode-nfc',
      ajustado,
      true,
      'equivalencia-unicode',
      'Texto con caracteres latinos acentuados en forma normalizada NFC'
    );
  }

  return casos;
}

/**
 * Genera casos de Análisis de Valores Límite (BVA) para parámetros enteros
 * (como `limit`, `offset`, montos en centavos o contadores).
 *
 * @param {object} [opciones]
 * @param {number} [opciones.min=1]
 * @param {number} [opciones.max=100]
 */
export function generarValoresLimiteEntero({ min = 1, max = 100 } = {}) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
    throw new RangeError(`Rango entero invalido: min=${min}, max=${max}`);
  }

  const puntoMedio = Math.floor((min + max) / 2);
  return [
    { id: 'bajo-minimo', valor: min - 1, validoEsperado: false, particion: 'limite-inferior-invalido' },
    { id: 'en-minimo', valor: min, validoEsperado: true, particion: 'limite-inferior-valido' },
    {
      id: 'sobre-minimo',
      valor: Math.min(max, min + 1),
      validoEsperado: true,
      particion: 'limite-inferior-interno',
    },
    { id: 'nominal', valor: puntoMedio, validoEsperado: true, particion: 'equivalencia-nominal' },
    {
      id: 'bajo-maximo',
      valor: Math.max(min, max - 1),
      validoEsperado: true,
      particion: 'limite-superior-interno',
    },
    { id: 'en-maximo', valor: max, validoEsperado: true, particion: 'limite-superior-valido' },
    { id: 'sobre-maximo', valor: max + 1, validoEsperado: false, particion: 'limite-superior-invalido' },
    { id: 'decimal', valor: min + 0.5, validoEsperado: false, particion: 'tipo-no-entero' },
    {
      id: 'fuera-safe-integer',
      valor: Number.MAX_SAFE_INTEGER + 2,
      validoEsperado: false,
      particion: 'desbordamiento-precision',
    },
    { id: 'nan', valor: Number.NaN, validoEsperado: false, particion: 'tipo-invalido' },
  ];
}

/**
 * Construye credenciales deterministas de prueba para escenarios positivos y
 * negativos de autenticación (normalización de mayúsculas BUG-001 y política de
 * contraseñas BUG-005).
 *
 * @param {string | number} semilla
 * @param {object} [opciones]
 * @param {'minusculas' | 'mayusculas' | 'mixto' | 'invalido'} [opciones.varianteEmail='minusculas']
 * @param {'fuerte' | 'comun' | 'corta'} [opciones.fortalezaPassword='fuerte']
 */
export function generarCredencialesPrueba(
  semilla,
  { varianteEmail = 'minusculas', fortalezaPassword = 'fuerte' } = {}
) {
  const rng = crearGeneradorDeterminista(semilla);
  const sufijo = rng.cadenaAlfanumerica(8);
  const baseLocal = `qa.${sufijo}`;
  const dominio = 'pruebas.local';

  let email;
  switch (varianteEmail) {
    case 'minusculas':
      email = `${baseLocal}@${dominio}`;
      break;
    case 'mayusculas':
      email = `${baseLocal}@${dominio}`.toUpperCase();
      break;
    case 'mixto':
      email = `Qa.${sufijo.slice(0, 4).toUpperCase()}${sufijo.slice(4)}@Pruebas.Local`;
      break;
    case 'invalido':
      email = `${baseLocal}-sin-arroba`;
      break;
    default:
      throw new RangeError(`Variante de email no soportada: ${varianteEmail}`);
  }

  let password;
  switch (fortalezaPassword) {
    case 'fuerte':
      password = `Qa#${rng.cadenaAlfanumerica(6)}9!`;
      break;
    case 'comun':
      password = rng.elegir(CONTRASENAS_COMUNES_PRUEBA);
      break;
    case 'corta':
      password = rng.cadenaAlfanumerica(5);
      break;
    default:
      throw new RangeError(`Fortaleza de password no soportada: ${fortalezaPassword}`);
  }

  return {
    email,
    emailNormalizado: varianteEmail === 'invalido' ? null : `${baseLocal}@${dominio}`,
    password,
    esValidaEsperada: varianteEmail !== 'invalido' && fortalezaPassword === 'fuerte',
  };
}

/**
 * Construye payloads deterministas para el dominio del Gestor de Tareas
 * cubriendo flujos válidos y regresiones conocidas (BUG-003 y BUG-004).
 *
 * @param {string | number} semilla
 * @param {'valida' | 'limiteMaximo' | 'excedeMaximo' | 'soloEspacios' | 'conEspaciosBorde' | 'vacia'} [modo='valida']
 */
export function generarPayloadTarea(semilla, modo = 'valida') {
  const rng = crearGeneradorDeterminista(semilla);
  const etiqueta = rng.cadenaAlfanumerica(6);

  switch (modo) {
    case 'valida':
      return { title: `Verificar contrato de tarea #${etiqueta}` };
    case 'limiteMaximo': {
      const prefijo = `Tarea-${etiqueta}-`;
      return { title: prefijo + 'x'.repeat(200 - prefijo.length) };
    }
    case 'excedeMaximo': {
      const prefijo = `Tarea-${etiqueta}-`;
      return { title: prefijo + 'x'.repeat(201 - prefijo.length) };
    }
    case 'soloEspacios':
      return { title: '     ' };
    case 'conEspaciosBorde':
      return { title: `   Tarea recortada #${etiqueta}   ` };
    case 'vacia':
      return { title: '' };
    default:
      throw new RangeError(`Modo de payload de tarea no soportado: ${modo}`);
  }
}
