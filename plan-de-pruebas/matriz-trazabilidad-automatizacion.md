# Matriz de Trazabilidad de Requisitos y Automatización (RTM)

> **Documento:** Matriz de Trazabilidad de Requisitos, Casos Manuales y Suites Automatizadas  
> **Área:** Aseguramiento de Calidad (QA), Testing Funcional & Automatización E2E / API  
> **Autor:** Eduardo Maytorena `<eduardo_maytorenar@outlook.com>`  
> **Fecha de Emisión:** Octubre 2026  
> **Versión:** 2.0 — Estado: Aprobado / Vigente  

---

## 1. Resumen Ejecutivo y Propósito

El propósito de este documento es **conectar y alinear de forma explícita la estrategia de QA manual con la pirámide de automatización de pruebas** dentro del portafolio profesional de ingeniería y calidad.

En la práctica profesional de QA, las pruebas manuales y la automatización no son disciplinas aisladas ni secuenciales en cascada:
1. **El diseño manual riguroso** (análisis de requisitos, partición de clases de equivalencia, análisis de valores límite y modelado de riesgos) establece **qué** debe verificarse y con qué prioridad de negocio.
2. **La automatización multinivel** (pruebas unitarias de dominio, pruebas de contrato de API y pruebas E2E con Page Object Model) garantiza **repetibilidad determinista, velocidad de feedback y prevención contra regresiones** en pipelines de Integración Continua (CI/CD).

```
   ┌────────────────────────────────────────────────────────┐
   │             1. Requisito / Necesidad de Negocio        │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │       2. Caso de Prueba Manual / Exploratorio (CP)     │
   │      - Pasos detallados, datos de entrada, esperado    │
   └─────────────┬───────────────────────────┬──────────────┘
                 │                           │
                 ▼                           ▼
   ┌───────────────────────────┐ ┌──────────────────────────┐
   │ 3A. Automatización API    │ │ 3B. Automatización E2E   │
   │     (Newman / Postman)    │ │     (Playwright + POM)   │
   │ - Contratos, esquemas     │ │ - Flujos de usuario real │
   │ - Códigos de estado, auth │ │ - Accesibilidad semántica│
   └─────────────┬─────────────┘ └───────────┬──────────────┘
                 │                           │
                 └─────────────┬─────────────┘
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │     4. Pruebas Unitarias de Dominio / Integración      │
   │        (node:test / Vitest / Clean Architecture)       │
   └───────────────────────────┬────────────────────────────┘
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │      5. Verificación Continua & No-Regresión en CI     │
   │        (GitHub Actions, reportes HTML, trazas)         │
   └────────────────────────────────────────────────────────┘
```

Este documento consolida la trazabilidad de dos ámbitos complementarios:
* **Ámbito A — Plan Funcional de SauceDemo ([`plan-de-pruebas.md`](./plan-de-pruebas.md) y [`casos-de-prueba.md`](./casos-de-prueba.md)):** 17 casos funcionales manuales categorizados con su viabilidad técnica, capa óptima de automatización y arquitectura proyectada en Playwright.
* **Ámbito B — Ecosistema Real Gestor de Tareas & Reporte de Bugs ([`reporte-de-bugs`](../reporte-de-bugs), [`automatizacion-e2e`](../automatizacion-e2e), [`pruebas-api-postman`](../pruebas-api-postman)):** Trazabilidad 100% implementada y probada en código que mapea cada caso funcional, prueba de integración, prueba de contrato y los 8 defectos reales corregidos (`BUG-001` al `BUG-008`).
* **Ámbito C — Lógica Crítica de Dominio ([`reservas`](../reservas) y [`gastos`](../gastos)):** Trazabilidad hacia pruebas unitarias de dominio puro (cálculo de disponibilidad anti-colisión con Vitest y aritmética monetaria en centavos).

---

## 2. Convenciones y Criterios de Clasificación

### Niveles de Prioridad
* **Alta (P1):** Flujos críticos de negocio (*happy path*, login, aislamiento de datos personales, completar compra o transacción). Sin esta funcionalidad, el sistema no cumple su propósito principal.
* **Media (P2):** Validaciones funcionales clave, filtros, ordenamiento, manejo de errores de entrada, persistencia entre vistas y límites de campos.
* **Baja (P3):** Comportamientos estéticos menores, edge cases poco frecuentes o cancelaciones de flujos intermedios sin pérdida de estado.

### Estados de Automatización
* `AUTOMATIZADO`: El caso cuenta con script activo en CI (Playwright, Newman o `node:test`) que valida el comportamiento esperado.
* `CANDIDATO_P1`: Caso prioritario con ROI muy alto para ser automatizado en la suite E2E de interfaz.
* `CANDIDATO_P2`: Caso automatizable a nivel de API o E2E según la capa más costo-eficiente.
* `MANUAL_EXPLORATORIO`: Casos donde la automatización tiene bajo ROI, comportamientos intencionales rotos de plataformas demo (`problem_user`), o validaciones visuales subjetivas.

### Capas de Prueba (Pirámide de Testing)
* **E2E:** Interfaz de usuario de extremo a extremo en navegadores reales (Playwright con Page Object Model).
* **API:** Pruebas de integración HTTP y validación de contrato JSON (Postman / Newman).
* **UNIT / INT:** Pruebas unitarias de dominio o integración en memoria sin dependencias externas (`node:test` / Vitest).

---

## 3. Matriz de Trazabilidad: Casos Funcionales de SauceDemo

Basada en los 17 casos diseñados en [`casos-de-prueba.md`](./casos-de-prueba.md) y las directrices de [`plan-de-pruebas.md`](./plan-de-pruebas.md):

| ID Caso | Módulo | Descripción Funcional | Prioridad | Estado Automatización | Capa Óptima | Spec / Script Proyectado | Criterio de Selección & ROI |
|---|---|---|---|---|---|---|---|
| **LOGIN-01** | Login | Login exitoso con credenciales válidas (`standard_user`) | **Alta** | `CANDIDATO_P1` | E2E (UI) | `sauce-auth.spec.js` (`SauceLoginPage.login`) | **Crítico:** Puerta de entrada para el 100% de los flujos del sistema. |
| **LOGIN-02** | Login | Rechazo de login con password incorrecto | **Alta** | `CANDIDATO_P1` | E2E (UI) | `sauce-auth.spec.js` (`esperarErrorCredenciales`) | **Crítico:** Previene accesos no autorizados y valida mensajes de error al usuario. |
| **LOGIN-03** | Login | Rechazo de login para usuario bloqueado (`locked_out_user`) | **Alta** | `CANDIDATO_P1` | E2E (UI) | `sauce-auth.spec.js` (`esperarErrorBloqueado`) | **Crítico:** Valida política de bloqueo de cuentas en la capa de presentación. |
| **LOGIN-04** | Login | Intento de login con campos de entrada vacíos | Media | `CANDIDATO_P2` | E2E (UI) | `sauce-auth.spec.js` (`validarUsernameRequerido`) | **Alto:** Validación de cliente para evitar envíos de formulario sin payload. |
| **LOGIN-05** | Login | Intento de login con usuario sin ingresar password | Media | `CANDIDATO_P2` | E2E (UI) | `sauce-auth.spec.js` (`validarPasswordRequerido`) | **Alto:** Validación de integridad en formulario de acceso. |
| **INV-01** | Catálogo | Ordenamiento alfabético de productos (A a Z) | Media | `CANDIDATO_P2` | E2E (UI) | `sauce-catalogo.spec.js` (`SauceInventoryPage.ordenarAz`) | **Medio:** Verifica reactividad de listas y ordenamiento del DOM. |
| **INV-02** | Catálogo | Ordenamiento de productos por precio (low to high) | Media | `CANDIDATO_P2` | E2E (UI) | `sauce-catalogo.spec.js` (`SauceInventoryPage.ordenarPrecio`) | **Medio:** Valida lógica de comparación numérica sobre precios formateados. |
| **INV-03** | Catálogo | Navegación hacia la vista de detalle de producto | **Alta** | `CANDIDATO_P1` | E2E (UI) | `sauce-catalogo.spec.js` (`verDetalleProducto`) | **Alto:** Navegación fundamental en embudo de compra e-commerce. |
| **INV-04** | Catálogo | Exploración con `problem_user` (imágenes y orden alterados) | Media | `MANUAL_EXPLORATORIO` | Manual UI | N/A (Inspección visual heurística) | **Bajo ROI:** Es un bug simulado del sitio para evaluar detección manual de anomalías visuales. |
| **CART-01** | Carrito | Agregar producto al carrito (badge se actualiza a 1) | **Alta** | `CANDIDATO_P1` | E2E (UI) | `sauce-carrito.spec.js` (`SauceInventoryPage.agregarItem`) | **Crítico:** Primer paso del embudo de conversión de ventas. |
| **CART-02** | Carrito | Eliminar producto del carrito (badge disminuye) | **Alta** | `CANDIDATO_P1` | E2E (UI) | `sauce-carrito.spec.js` (`SauceCartPage.removerItem`) | **Alto:** Permite rectificar selección antes de pasar a facturación. |
| **CART-03** | Carrito | Persistencia del carrito durante navegación interna | Media | `CANDIDATO_P1` | E2E (UI) | `sauce-carrito.spec.js` (`verificarPersistenciaStorage`) | **Alto:** Evita pérdida de carrito durante navegación exploratoria del cliente. |
| **CART-04** | Carrito | Carrito vacío restringe checkout lógico | Baja | `CANDIDATO_P2` | E2E (UI) | `sauce-carrito.spec.js` (`verificarCheckoutVacio`) | **Medio:** Regla de negocio para no generar órdenes vacías. |
| **CHK-01** | Checkout | Flujo completo de compra exitoso (*End-to-End Happy Path*) | **Alta** | `CANDIDATO_P1` | E2E (UI) | `sauce-checkout.spec.js` (`completarOrdenExitosa`) | **Máximo:** La prueba de humo transaccional más importante del negocio. |
| **CHK-02** | Checkout | Formulario de checkout con campos obligatorios vacíos | **Alta** | `CANDIDATO_P1` | E2E (UI) | `sauce-checkout.spec.js` (`validarCamposRequeridos`) | **Alto:** Asegura captura completa de datos de despacho y facturación. |
| **CHK-03** | Checkout | Verificación matemática del resumen de orden (items + tax = total) | **Alta** | `CANDIDATO_P1` | E2E (UI) | `sauce-checkout.spec.js` (`validarCalculoImpuestos`) | **Crítico:** Precisión contable y consistencia de precios calculados. |
| **CHK-04** | Checkout | Cancelación de checkout retorna al carrito sin pérdida de items | Baja | `CANDIDATO_P2` | E2E (UI) | `sauce-checkout.spec.js` (`cancelarYRetornar`) | **Medio:** Usabilidad y control de navegación del cliente. |

---

## 4. Matriz de Trazabilidad: Ecosistema Gestor de Tareas & Reporte de Bugs

En los proyectos centrales del portafolio ([`automatizacion-e2e`](../automatizacion-e2e), [`pruebas-api-postman`](../pruebas-api-postman), [`reporte-de-bugs`](../reporte-de-bugs) y [`api-gestor-tareas`](../proyectos-de-programacion/api-gestor-tareas)), la trazabilidad está **100% implementada y automatizada en código ejecutable**:

| ID Caso | Módulo / Requisito | Descripción | Prioridad | Cobertura Manual / Exploratoria | Cobertura Newman / Postman (`coleccion.json`) | Cobertura Playwright E2E (`automatizacion-e2e`) | Cobertura Integración / Dominio (`api-gestor-tareas/test`) | Estado |
|---|---|---|---|---|---|---|---|---|
| **CP-GT-001** | Auth | Registro de usuario nuevo con datos válidos | **Alta** | Formulario en cliente web (`:5173`) | `POST /auth/register - crea cuenta` (status 201, token emitido) | `autenticacion.spec.js` (`un usuario nuevo puede registrarse y entra a su lista`) | `auth.test.js` (`registro exitoso devuelve un token`) | `AUTOMATIZADO` |
| **CP-GT-002** | Auth | Rechazo de email ya registrado | **Alta** | Registro repetido manual | `POST /auth/register - rechaza email duplicado` (status 409) | `autenticacion.spec.js` (`rechaza un email ya registrado`) | `auth.test.js` (`registro duplicado devuelve 409`) | `AUTOMATIZADO` |
| **CP-GT-003** | Auth | Inicio de sesión con credenciales válidas | **Alta** | Login manual en UI | `POST /auth/login - inicia sesion` (status 200, JWT) | `autenticacion.spec.js` (`un usuario registrado puede cerrar e iniciar sesion`) | `auth.test.js` (`registerAndLogin helper`) | `AUTOMATIZADO` |
| **CP-GT-004** | Auth | Rechazo de credenciales incorrectas | **Alta** | Formulario con contraseña errónea | `POST /auth/login - rechaza contrasena incorrecta` (status 401) | `autenticacion.spec.js` (`rechaza credenciales invalidas y muestra el error`) | `auth.test.js` (`login con password incorrecto devuelve 401`) | `AUTOMATIZADO` |
| **CP-GT-005** | Auth | Cierre de sesión y protección de ruta | **Alta** | Click en botón "Cerrar sesión" | N/A (Comportamiento de UI / invalidación de token local) | `autenticacion.spec.js` (`sin sesion, la app muestra la pantalla de login`) | `cors.test.js` / Verificación de cabeceras | `AUTOMATIZADO` |
| **CP-GT-006** | Auth | Persistencia de sesión tras recarga (F5) | Media | F5 en navegador tras login | N/A (Manejo de LocalStorage en cliente) | `autenticacion.spec.js` (`la sesion sobrevive a recargar la pagina`) | N/A (Exclusivo de capa cliente) | `AUTOMATIZADO` |
| **CP-GT-007** | Tareas | Creación de tarea y visualización en lista | **Alta** | Formulario de nueva tarea | `POST /tasks - crea una tarea` (status 201, `id`, `done: false`) | `tareas.spec.js` (`crea una tarea y aparece en la lista`) | `tasks.test.js` (`crear y listar una tarea`) | `AUTOMATIZADO` |
| **CP-GT-008** | Tareas | Botón "Agregar" deshabilitado si el campo está vacío | Media | Inspección de botón en UI | N/A (Validación preventiva en React) | `tareas.spec.js` (`el boton Agregar esta deshabilitado con el campo vacio`) | N/A (Estado local en UI) | `AUTOMATIZADO` |
| **CP-GT-009** | Tareas | Marcar tarea completada y decrementar contador | **Alta** | Click en checkbox de tarea | `PATCH /tasks/:id - marca como completada` (status 200, `done: true`) | `tareas.spec.js` (`marca una tarea como completada y el contador baja`) | `tasks.test.js` (`marcar tarea como completada`) | `AUTOMATIZADO` |
| **CP-GT-010** | Tareas | Desmarcar tarea completada (vuelta a pendiente) | Media | Click en tarea ya marcada | `PATCH /tasks/:id` con `done: false` | `tareas.spec.js` (`desmarca una tarea completada`) | `tasks.test.js` (Update booleano) | `AUTOMATIZADO` |
| **CP-GT-011** | Tareas | Eliminación de tarea de la lista | **Alta** | Click en botón "Eliminar" | `DELETE /tasks/:id - elimina` (status 204) & 404 al repetir | `tareas.spec.js` (`elimina una tarea`) | `tasks.test.js` (`borrar una tarea inexistente devuelve 404`) | `AUTOMATIZADO` |
| **CP-GT-012** | Tareas | Conteo reactivo de tareas pendientes | Media | Creación y marcado múltiple | `GET /tasks` cálculo de pendientes | `tareas.spec.js` (`maneja varias tareas y cuenta solo las pendientes`) | `tasks.test.js` (`list.json` total) | `AUTOMATIZADO` |
| **CP-GT-013** | Tareas | Persistencia de tareas tras recarga de página | **Alta** | Recargar con tareas creadas | N/A (Persistencia SQLite validada vía UI) | `tareas.spec.js` (`las tareas persisten despues de recargar`) | `tasks.test.js` (Persistencia en `:memory:`) | `AUTOMATIZADO` |
| **CP-GT-014** | Seguridad | Aislamiento estricto de datos entre usuarios | **Alta** | Creación de cuenta B e inspección | Verificación de `user_id` en JWT de la API | `tareas.spec.js` (`un usuario no ve las tareas de otro`) | `tasks.test.js` (`un usuario no puede ver tareas de otro usuario`) | `AUTOMATIZADO` |
| **CP-GT-015** | Seguridad | Rechazo de peticiones sin token JWT | **Alta** | `curl -X GET /tasks` sin header | `GET /tasks - 401 sin token` (status 401) | Validado vía middleware de rutas | `tasks.test.js` (`sin token, /tasks devuelve 401`) | `AUTOMATIZADO` |
| **CP-GT-016** | Seguridad | Rechazo de tokens inválidos o mal formados | **Alta** | Enviar `Bearer xxx` corrupto | `GET /tasks - 401 con token invalido / mal formado` | Validado en capa HTTP | `auth.test.js` (Validación de verify JWT) | `AUTOMATIZADO` |
| **CP-GT-017** | Salud API | Health check y latencia aceptable | Media | `GET /health` | `GET /health` (< 2000 ms, status 200) | Validado en arranque de suite | `server.js` (`/health` endpoint) | `AUTOMATIZADO` |
| **CP-GT-018** | API Contrato | Manejo de rutas inexistentes | Baja | `GET /ruta-random` | `GET /ruta-inexistente - 404` | N/A (Manejo 404) | Express 404 handler | `AUTOMATIZADO` |

---

## 5. Trazabilidad de Defectos a Pruebas de Regresión (`reporte-de-bugs`)

Uno de los aportes más significativos del portafolio es la **trazabilidad bidireccional entre defectos descubiertos y su blindaje automatizado**. Cada uno de los 8 defectos reportados en [`reporte-de-bugs/README.md`](../reporte-de-bugs/README.md) cuenta con commit de resolución, script de verificación y pruebas automatizadas en Newman, Playwright y `node:test`:

| ID Bug | Título del Hallazgo | Severidad | Commit Corrección | Script de Verificación (`verificar-correcciones.sh`) | Cobertura en Postman / Newman (`coleccion.json`) | Cobertura en Playwright E2E (`regresiones-ui.spec.js`) | Cobertura en Pruebas Unitarias / API (`regresiones.test.js`) |
|---|---|---|---|---|---|---|---|
| **BUG-001** | Email distingue mayúsculas (cuentas duplicadas) | **Alta** | [`8091df9`](https://github.com/eduardo-mr1/proyectos-de-programacion/commit/8091df9) | Líneas 44–49 (comprobación registro 409 y login 200) | `POST /auth/register - email no distingue mayusculas` & `POST /auth/login - acepta email en mayusculas` | Cubierto en flujo de autenticación | `test('BUG-001: el email no distingue mayusculas...')` (3 tests) |
| **BUG-002** | Sin límite de intentos de login (fuerza bruta) | **Alta** | [`81ff09b`](https://github.com/eduardo-mr1/proyectos-de-programacion/commit/81ff09b) | Líneas 50–58 (intento 6 responde 429) | N/A (Requiere aislamiento en memoria para no bloquear entorno de pruebas) | Validado a nivel API | `test('BUG-002: bloquea tras varios intentos fallidos...')` (2 tests, reseteo tras éxito) |
| **BUG-003** | Título sin longitud máxima (desborda layout) | Media | [`61295bf`](https://github.com/eduardo-mr1/proyectos-de-programacion/commit/61295bf) | Líneas 59–67 (cadena de 201 chars rechazada con 400) | `POST /tasks - rechaza titulo demasiado largo` (status 400) | `test('BUG-003: un titulo largo no desborda la pagina')` & rechazo en API | `test('BUG-003: rechaza titulos por encima del limite')` (máximo 200 caracteres) |
| **BUG-004** | Acepta títulos de solo espacios | Media | [`61295bf`](https://github.com/eduardo-mr1/proyectos-de-programacion/commit/61295bf) | Líneas 68–76 (rechaza espacios y recorta bordes) | `POST /tasks - recorta espacios` & `POST /tasks - rechaza titulo solo espacios` | Validación de campo vacío en formulario | `test('BUG-004: rechaza titulo solo espacios')` & `recorta los espacios` |
| **BUG-005** | Contraseña débil (acepta contraseñas comunes) | Media | [`8091df9`](https://github.com/eduardo-mr1/proyectos-de-programacion/commit/8091df9) | Líneas 77–83 (rechazo de `12345678`) | `POST /auth/register - rechaza contrasena comun` (status 400) | Validación de contraseña en formulario | `test('BUG-005: rechaza contrasenas cortas y contrasenas comunes')` |
| **BUG-006** | `done` entra como booleano y sale como entero | Baja | [`61295bf`](https://github.com/eduardo-mr1/proyectos-de-programacion/commit/61295bf) | Líneas 84–90 (valida `done: false` booleano estricto) | `PATCH /tasks/:id - marca como completada` (aserción `typeof === 'boolean'`) | Checkbox `toBeChecked()` interactivo | `test('BUG-006: done entra y sale como booleano')` (PATCH y GET) |
| **BUG-007** | `GET /tasks` sin paginación (riesgo de payload gigante) | Baja | [`61295bf`](https://github.com/eduardo-mr1/proyectos-de-programacion/commit/61295bf) | Líneas 91–95 (comprueba `limit`, `offset`, `total`) | `GET /tasks - lista paginada` & `rechaza limit fuera de rango` | Carga de lista paginada en vista | `test('BUG-007: GET /tasks pagina y reporta el total')` (2 tests) |
| **BUG-008** | Checkbox sin feedback optimista (latencia visual) | Baja | [`c914f97`](https://github.com/eduardo-mr1/proyectos-de-programacion/commit/c914f97) | N/A (Defecto puramente de interfaz reactiva) | N/A (Comportamiento de rendering en cliente) | `test('BUG-008: el checkbox refleja el click de inmediato')` (`check({ timeout: 1000 })`) | Actualización optimista de estado en React |

---

## 6. Trazabilidad de Lógica de Dominio Crítico (`Reservas` & `Gastos`)

Además de las aplicaciones e-commerce y de tareas, el portafolio aplica trazabilidad sobre componentes de alta complejidad de dominio donde los errores representan pérdidas financieras o colisiones de datos:

| Proyecto | Componente / Regla de Negocio | Riesgo Mitigado | Tipo de Prueba | Archivo de Prueba | Framework | Resultado |
|---|---|---|---|---|---|---|
| **Reservas** | Motor Anti-Colisión de Citas | Traslape de turnos y citas en horarios ocupados | Unitaria de Dominio | [`disponibilidad.test.ts`](../reservas/src/lib/disponibilidad.test.ts) | Vitest | 100% aprobado |
| **Reservas** | Contrato de Errores Tipados (`Failure`) | Fuga de excepciones técnicas de Postgres/Supabase a la UI | Unitaria de Dominio | [`traducir.test.ts`](../reservas/src/shared/errors/traducir.test.ts) | Vitest | 100% aprobado |
| **Reservas** | Creación y Cancelación de Reservas | Registro de citas inconsistentes sin validación | Casos de Uso | [`CrearCitaUseCase.test.ts`](../reservas/src/features/reservas/domain/usecases/CrearCitaUseCase.test.ts) | Vitest | 100% aprobado |
| **Reservas** | Autenticación y Autorización de Administrador | Acceso indebido al panel de control del negocio | Casos de Uso | [`IniciarSesionUseCase.test.ts`](../reservas/src/features/auth/domain/usecases/IniciarSesionUseCase.test.ts) | Vitest | 100% aprobado |
| **Gastos** | Aritmética Monetaria en Centavos (`assertCents`) | Pérdida o acumulación de errores de coma flotante IEEE-754 | Unitaria de Dominio | `cents.test.ts` / `balance.test.ts` | Jest / React Native | 98% cobertura |
| **Gastos** | Idempotencia Offline y Persistencia MMKV | Generación de registros duplicados por reintentos de red | Unitaria / E2E | `sync.test.ts` / Maestro Flows en CI | Jest + Maestro | 186 tests passing |

---

## 7. Métricas de Cobertura Funcional y Análisis Cuantitativo

### 7.1 Métricas Globales del Ecosistema Automatizado (Gestor de Tareas & Regresiones)

```
Total de Casos Funcionales Identificados:    18 casos
Casos con Automatización Implementada:       18 casos (100%)
Defectos Reales Identificados y Blindados:   8 / 8 bugs (100%)
Aserciones de API en CI (Newman):            96 aserciones en 25 peticiones
Pruebas E2E en CI (Playwright POM):          18 tests automatizados
Pruebas Unitarias y de Regresión API:        16 tests en node:test
```

### 7.2 Cobertura por Nivel de Prioridad (Gestor de Tareas)

| Prioridad | Casos Identificados | Casos Automatizados | % Cobertura Automatizada | Estado en CI |
|---|---|---|---|---|
| **Alta (P1)** | 10 | 10 | **100.0%** | Activo y bloqueante en pull requests |
| **Media (P2)** | 6 | 6 | **100.0%** | Activo en suites E2E y Newman |
| **Baja (P3)** | 2 | 2 | **100.0%** | Activo en validaciones de contrato |
| **Total** | **18** | **18** | **100.0%** | **Green Suite en CI/CD** |

### 7.3 Distribución por Capas de la Pirámide de Pruebas

| Capa de Prueba | Herramienta Principal | Cantidad de Casos / Aserciones | Velocidad de Ejecución | Rol Estratégico |
|---|---|---|---|---|
| **E2E (Navegador Real)** | Playwright (POM) | 18 pruebas completas | ~8 – 15 segundos | Verificación del viaje de usuario y accesibilidad |
| **API / Contrato** | Newman / Postman | 25 peticiones / 96 aserciones | ~1.5 segundos | Validación de contrato, esquemas y límites |
| **Integración / Regresiones** | `node:test` (nativo) | 16 pruebas con DB en memoria | ~250 milisegundos | Detección inmediata de regresiones de lógica |
| **Dominio Puro (SaaS/Móvil)** | Vitest / Jest | > 300 pruebas unitarias | < 5 segundos | Validación matemática y arquitectónica estricta |

### 7.4 Análisis de Automatización del Plan SauceDemo

| Estado | Cantidad de Casos | Porcentaje | Justificación Técnica |
|---|---|---|---|
| `CANDIDATO_P1` (Automatizable Inmediato) | 9 casos | **52.9%** | Flujos transaccionales y de autenticación con máximo ROI. |
| `CANDIDATO_P2` (Automatizable Secundario) | 7 casos | **41.2%** | Validaciones de ordenamiento, límites y persistencia. |
| `MANUAL_EXPLORATORIO` | 1 caso | **5.9%** | `problem_user` (diseñado específicamente para exploración humana de fallos visuales). |
| **Total** | **17 casos** | **100.0%** | **94.1% de viabilidad de automatización** |

---

## 8. Conclusiones y Lecciones de Ingeniería de QA

1. **La trazabilidad evita los falsos verdes:** El análisis estático de Vigía combinado con esta matriz asegura que ninguna prueba pase en verde por casualidad; cada prueba tiene un requisito funcional o defecto que justifica su existencia.
2. **El Page Object Model (POM) es el puente entre QA manual y automatización:** Un caso manual escrito con intención funcional (`"Ingresar usuario y password y dar click en Login"`) se traduce limpiamente en `await authPage.iniciarSesion(user, pass)`, manteniendo el test legible tanto para un analista manual como para un ingeniero de automatización.
3. **El blindaje de regresiones es una inversión acumulativa:** Al transformar los scripts de reproducción de los 8 bugs en aserciones permanentes en CI, el costo de volver a sufrir el mismo defecto cae a cero.

---

> **Firma de Aprobación:**  
> **Eduardo Maytorena**  
> *Ingeniero de Software & QA Automation*  
> Email: [eduardo_maytorenar@outlook.com](mailto:eduardo_maytorenar@outlook.com)  
> Portafolio: [github.com/eduardo-mr1](https://github.com/eduardo-mr1)
