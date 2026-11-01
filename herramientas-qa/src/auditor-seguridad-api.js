const CATALOGO_OWASP_API_2023 = Object.freeze({
  'API1:2023-BOLA': Object.freeze([
    Object.freeze({
      id: 'bola-id-ajeno',
      descripcion: 'Acceso a recurso de otro usuario autenticado mediante ID secuencial distinto',
      parametroId: 999999,
      codigosEsperados: [403, 404],
    }),
    Object.freeze({
      id: 'bola-id-no-positivo',
      descripcion: 'Sondeo de frontera con identificador cero o negativo en ruta parametrizada',
      parametroId: 0,
      codigosEsperados: [400, 404],
    }),
  ]),
  'API2:2023-Auth': Object.freeze([
    Object.freeze({
      id: 'auth-sin-prefijo-bearer',
      descripcion: 'Cabecera Authorization sin esquema estricto Bearer',
      headerAuthorization: 'Token eyJhbGciOiJIUzI1NiJ9.e30.firma',
      codigosEsperados: [401],
    }),
    Object.freeze({
      id: 'auth-jwt-alg-none',
      descripcion: 'Token JWT sin firma con encabezado alg=none (debe rechazarse siempre)',
      headerAuthorization: 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjF9.',
      codigosEsperados: [401],
    }),
    Object.freeze({
      id: 'auth-jwt-firma-alterada',
      descripcion: 'Token JWT estructuralmente valido con firma HMAC adulterada',
      headerAuthorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.firmaInvalida000',
      codigosEsperados: [401],
    }),
    Object.freeze({
      id: 'auth-password-comun-bug005',
      descripcion: 'Intento de registro con contrasena de diccionario comun (BUG-005)',
      payload: Object.freeze({ email: 'auditoria@pruebas.local', password: '12345678' }),
      codigosEsperados: [400],
    }),
  ]),
  'API3:2023-BOPLA': Object.freeze([
    Object.freeze({
      id: 'bopla-mass-assignment-userid',
      descripcion: 'Intento de sobrescribir user_id y privilegios administrativos en creacion',
      payload: Object.freeze({
        title: 'Tarea con propiedades inyectadas',
        user_id: 1,
        role: 'admin',
        isAdmin: true,
      }),
      codigosEsperados: [201, 400],
      invariante: 'El servidor debe ignorar o rechazar user_id/role externos y usar el sujeto del JWT',
    }),
  ]),
  'API4:2023-ResourceConsumption': Object.freeze([
    Object.freeze({
      id: 'resource-limit-desbordado-bug007',
      descripcion: 'Solicitud de paginacion masiva para agotar memoria o red (BUG-007)',
      query: Object.freeze({ limit: 100000, offset: 0 }),
      codigosEsperados: [400],
    }),
    Object.freeze({
      id: 'resource-offset-negativo',
      descripcion: 'Desplazamiento negativo en consulta paginada',
      query: Object.freeze({ limit: 10, offset: -25 }),
      codigosEsperados: [400],
    }),
    Object.freeze({
      id: 'resource-payload-sobredimensionado-bug003',
      descripcion: 'Cadena de 4096 caracteres para probar corte temprano de longitud (BUG-003)',
      payload: Object.freeze({ title: 'A'.repeat(4096) }),
      codigosEsperados: [400, 413],
    }),
  ]),
  'API8:2023-MisconfigurationAndInjection': Object.freeze([
    Object.freeze({
      id: 'inj-sql-comillas-parametrizadas',
      descripcion: 'Literal con comillas SQL para confirmar consultas parametrizadas sin error 500',
      payload: Object.freeze({ title: "Revisar ' OR '1'='1; -- reporte" }),
      codigosEsperados: [201, 400],
    }),
    Object.freeze({
      id: 'inj-xss-almacenado-encoding',
      descripcion: 'Etiqueta HTML activa para verificar escape seguro al renderizar o rechazar',
      payload: Object.freeze({ title: '<img src=x onerror=alert(1)>' }),
      codigosEsperados: [201, 400],
    }),
    Object.freeze({
      id: 'inj-contaminacion-prototipo',
      descripcion: 'JSON crudo con clave __proto__ para verificar parseo inmune a prototype pollution',
      jsonCrudo: '{"title":"Tarea segura","__proto__":{"esAdmin":true}}',
      codigosEsperados: [201, 400],
    }),
  ]),
});

/**
 * Obtiene copias inmutables/seguras de los vectores defensivos de prueba mapeados
 * a OWASP API Security Top 10 (2023).
 *
 * @param {string} [categoria]
 */
export function obtenerVectoresOwasp(categoria) {
  if (categoria === undefined) {
    return structuredClone(CATALOGO_OWASP_API_2023);
  }
  if (!Object.hasOwn(CATALOGO_OWASP_API_2023, categoria)) {
    const disponibles = Object.keys(CATALOGO_OWASP_API_2023).join(', ');
    throw new RangeError(
      `Categoria OWASP desconocida "${categoria}". Disponibles: ${disponibles}`
    );
  }
  return structuredClone(CATALOGO_OWASP_API_2023[categoria]);
}

function mapaCabecerasMinusculas(headers = {}) {
  const resultado = new Map();
  if (!headers || typeof headers !== 'object') return resultado;
  for (const [clave, valor] of Object.entries(headers)) {
    if (valor !== undefined && valor !== null) {
      resultado.set(clave.toLowerCase(), String(valor).trim());
    }
  }
  return resultado;
}

/**
 * Audita las cabeceras HTTP de una respuesta API según las recomendaciones de
 * endurecimiento de OWASP REST Security Cheat Sheet.
 *
 * @param {Record<string, string>} headers
 * @param {object} [opciones]
 * @param {boolean} [opciones.requiereTls=false]
 */
export function auditarCabecerasSeguridadHttp(headers, { requiereTls = false } = {}) {
  const h = mapaCabecerasMinusculas(headers);
  const hallazgos = [];

  if (h.get('x-content-type-options')?.toLowerCase() !== 'nosniff') {
    hallazgos.push({
      regla: 'missing-nosniff',
      severidad: 'media',
      cabecera: 'X-Content-Type-Options',
      detalle: 'Debe definirse X-Content-Type-Options: nosniff para impedir MIME sniffing',
    });
  }

  const xfo = h.get('x-frame-options')?.toUpperCase() ?? '';
  const csp = h.get('content-security-policy')?.toLowerCase() ?? '';
  if (!['DENY', 'SAMEORIGIN'].includes(xfo) && !csp.includes('frame-ancestors')) {
    hallazgos.push({
      regla: 'missing-frame-protection',
      severidad: 'baja',
      cabecera: 'X-Frame-Options / Content-Security-Policy',
      detalle: 'Se recomienda DENY/SAMEORIGIN o directiva frame-ancestors en CSP',
    });
  }

  if (h.has('x-powered-by')) {
    hallazgos.push({
      regla: 'tech-fingerprint-x-powered-by',
      severidad: 'baja',
      cabecera: 'X-Powered-By',
      detalle: `Exposicion innecesaria de tecnologia interna: "${h.get('x-powered-by')}"`,
    });
  }

  const serverBanner = h.get('server') ?? '';
  if (/\d+\.\d+/.test(serverBanner)) {
    hallazgos.push({
      regla: 'verbose-server-version',
      severidad: 'baja',
      cabecera: 'Server',
      detalle: `La cabecera Server expone version exacta de infraestructura: "${serverBanner}"`,
    });
  }

  const acao = h.get('access-control-allow-origin') ?? '';
  const acac = h.get('access-control-allow-credentials')?.toLowerCase() ?? '';
  if (acao === '*' && acac === 'true') {
    hallazgos.push({
      regla: 'insecure-cors-wildcard-credentials',
      severidad: 'alta',
      cabecera: 'Access-Control-Allow-Origin',
      detalle: 'Configuracion CORS insegura: comodin "*" combinado con Allow-Credentials: true',
    });
  }

  if (requiereTls) {
    const hsts = h.get('strict-transport-security') ?? '';
    if (!/max-age=\d+/i.test(hsts)) {
      hallazgos.push({
        regla: 'missing-hsts',
        severidad: 'alta',
        cabecera: 'Strict-Transport-Security',
        detalle: 'En entornos HTTPS productivos debe emitirse Strict-Transport-Security con max-age',
      });
    }
  }

  const penalizacionPorSeveridad = { alta: 35, media: 20, baja: 10 };
  const descuento = hallazgos.reduce(
    (acc, item) => acc + (penalizacionPorSeveridad[item.severidad] ?? 10),
    0
  );
  const puntaje = Math.max(0, 100 - descuento);
  const tieneAltaOMedia = hallazgos.some(
    (item) => item.severidad === 'alta' || item.severidad === 'media'
  );

  return {
    segura: !tieneAltaOMedia,
    puntaje,
    hallazgos,
  };
}

const PATRONES_FUGA_INTERNA = Object.freeze([
  {
    id: 'node-stack-trace',
    severidad: 'alta',
    regex: /\bat\s+[A-Za-z0-9_$.<>]+\s+\([^)]+:\d+:\d+\)/,
    descripcion: 'Traza de pila interna de Node.js/V8 expuesta al cliente HTTP',
  },
  {
    id: 'sqlite-driver-error',
    severidad: 'alta',
    regex: /\bSQLITE_(?:ERROR|CONSTRAINT|MISUSE|BUSY|CORRUPT)\b/i,
    descripcion: 'Codigo crudo de excepcion SQLite expuesto sin traduccion de dominio',
  },
  {
    id: 'postgres-sql-error',
    severidad: 'alta',
    regex: /\bsyntax error at or near\b|\bduplicate key value violates unique constraint\b/i,
    descripcion: 'Detalle interno del motor PostgreSQL expuesto en mensaje de error',
  },
  {
    id: 'filesystem-path-leak',
    severidad: 'media',
    regex: /(?:[A-Za-z]:\\Users\\|\/(?:home|var|usr|app)\/[A-Za-z0-9._/-]+\.(?:js|ts|mjs))/,
    descripcion: 'Ruta absoluta del sistema de archivos del servidor filtrada en la respuesta',
  },
  {
    id: 'secret-env-mention',
    severidad: 'alta',
    regex: /\b(?:JWT_SECRET|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]/i,
    descripcion: 'Posible exposicion de variable de entorno sensible en cuerpo de respuesta',
  },
]);

/**
 * Inspecciona una respuesta de error HTTP (4xx / 5xx) para verificar que no filtre
 * trazas de pila, errores crudos de SQL, rutas del servidor ni secretos.
 *
 * @param {object} respuesta
 * @param {number} respuesta.status
 * @param {unknown} respuesta.cuerpo
 */
export function auditarFugaInformacionError(respuesta) {
  if (!respuesta || typeof respuesta !== 'object') {
    throw new TypeError('Se requiere un objeto de respuesta para auditar fugas de informacion');
  }

  const textoInspeccion =
    typeof respuesta.cuerpo === 'string'
      ? respuesta.cuerpo
      : JSON.stringify(respuesta.cuerpo ?? '');

  const hallazgos = [];

  for (const patron of PATRONES_FUGA_INTERNA) {
    if (patron.regex.test(textoInspeccion)) {
      hallazgos.push({
        regla: patron.id,
        severidad: patron.severidad,
        status: respuesta.status,
        detalle: patron.descripcion,
      });
    }
  }

  if (
    respuesta.status >= 400 &&
    typeof respuesta.cuerpo === 'string' &&
    /<!DOCTYPE html>|<pre>Cannot (?:GET|POST|PATCH|DELETE)/i.test(respuesta.cuerpo)
  ) {
    hallazgos.push({
      regla: 'default-html-error-page',
      severidad: 'baja',
      status: respuesta.status,
      detalle: 'El endpoint devolvio una pagina HTML por defecto en lugar de un error JSON estructurado',
    });
  }

  return {
    libreDeFugas: hallazgos.length === 0,
    hallazgos,
  };
}
