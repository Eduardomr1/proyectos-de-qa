<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/header-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/header-light.svg">
  <img alt="Eduardo Maytorena - Senior Fullstack & QA Automation Engineer" src="./assets/header-dark.svg" width="100%">
</picture>

<br/>

[![GitHub Profile](https://img.shields.io/badge/GitHub-Eduardomr1-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Eduardomr1)
[![Email](https://img.shields.io/badge/Contact-eduardo__maytorenar%40outlook.com-0078D4?style=for-the-badge&logo=microsoftoutlook&logoColor=white)](mailto:eduardo_maytorenar@outlook.com)
[![Location](https://img.shields.io/badge/Location-Hermosillo%2C%20Sonora%20(MST)-0ea5e9?style=for-the-badge&logo=googlemaps&logoColor=white)](https://maps.google.com)
[![Status](https://img.shields.io/badge/Status-Open%20to%20Senior%20Roles-10b981?style=for-the-badge)](mailto:eduardo_maytorenar@outlook.com)

<br/>

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode%20(0%25%20Any)-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%7C%20Feature--First%20%7C%20Offline--First-4338ca)](https://github.com/Eduardomr1/proyectos-de-qa/tree/main/docs/arquitectura)
[![QA Standard](https://img.shields.io/badge/QA%20Standard-Zero%20Flaky%20Tests-059669?logo=playwright&logoColor=white)](https://github.com/Eduardomr1/proyectos-de-qa/blob/main/plan-de-pruebas/matriz-trazabilidad-automatizacion.md)
[![A11y](https://img.shields.io/badge/A11y-WCAG%202.1%20AA%20Compliant-0284c7)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Static Analysis](https://img.shields.io/badge/Static%20Analysis-TypeScript%20AST%20%7C%20SARIF%20v2.1.0-7c3aed)](https://github.com/Eduardomr1/vigia)

</div>

---

## 👨‍💻 Perfil Profesional

Ingeniero de Software **Senior Fullstack & QA Automation** especializado en la concepción y construcción de sistemas de alta confiabilidad, aplicaciones móviles **Offline-First**, arquitecturas desacopladas (**Clean Architecture**) y suites de automatización deterministas (**Playwright**, **Maestro**, **Newman**).

Mi filosofía de ingeniería se fundamenta en un principio rector: **la calidad y la estabilidad no son fases tardías ni tareas reactivas, sino invariantes arquitectónicas** que deben blindarse mediante tipado estricto, análisis estático de sintaxis abstracta (**AST**), pruebas de contrato, auditorías automatizadas de accesibilidad (**WCAG 2.1 AA**) y pipelines de integración continua deterministas (**CI/CD con 0% pruebas intermitentes**).

### 💡 Principales Capacidades de Ingeniería

- 🏛️ **Arquitectura de Software & SaaS:** Diseño bajo *Clean Architecture* (Hexagonal / DDD) y *Feature-First*. Aislamiento riguroso del dominio de negocio, motores anti-colisión deterministas y manejo semántico de errores mediante tipos de fallo (`Failure`).
- 📱 **Ingeniería Móvil Offline-First:** Desarrollo reactivo en *React Native & Reanimated* con colas de persistencia síncrona en *MMKV* (resilientes a cierre forzado del SO), reconciliación simétrica e idempotencia por UUID en cliente.
- 🧪 **Automatización QA & Chaos Resilience:** Frameworks E2E con *Page Object Model (POM)* en *Playwright*, auditorías de accesibilidad con `@axe-core/playwright`, simulación de resiliencia de red (HTTP 500/404, offline, slow 3G) y ejecución de contratos de API en *Newman/Postman*.
- 🔍 **Developer Tooling & Análisis Estático (AST):** Creación de linters sobre el *TypeScript Compiler API* capaces de inspeccionar el AST para erradicar falsos positivos en suites de prueba y exportar reportes en el estándar de seguridad *OASIS SARIF v2.1.0*.
- 📡 **Observabilidad & Uptime Engines:** Monitoreo sintético distribuido de APIs, cálculo de percentiles de latencia (P50/P90/P99), jitter, detección temprana de degradación de SLAs y despacho de webhooks con control de flapping.

---

## 🚀 Showcase de Proyectos Estrella

Una muestra representativa de sistemas diseñados para producción, con estándares rigurosos de código, documentación técnica profunda y cobertura de pruebas automatizada:

<br/>

### 1. 📱 [Control de Gastos](https://github.com/Eduardomr1/control-de-gastos) · Mobile Engineering & Offline-First
> **Aplicación financiera móvil de alta precisión con sincronización síncrona offline y microinteracciones fluidas a 60 FPS.**

[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Reanimated](https://img.shields.io/badge/Reanimated-60FPS%20Native-9333ea)](https://docs.swmansion.com/react-native-reanimated/)
[![MMKV](https://img.shields.io/badge/Storage-MMKV%20Synchronous-f59e0b)](https://github.com/mrousavy/react-native-mmkv)
[![Supabase](https://img.shields.io/badge/Supabase-RPC%20Sync-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Coverage-98%25%20(186%20Passed)-059669)](https://github.com/Eduardomr1/control-de-gastos)
[![Maestro](https://img.shields.io/badge/E2E-Maestro%20Mobile%20CI-2563eb)](https://maestro.mobile.dev/)

* **Arquitectura de Sincronización:** Cola FIFO de mutaciones en memoria y disco (*MMKV*) que sobrevive al cierre forzado de la app. Reconciliación con réplica local *SQLite* y PostgreSQL remoto mediante RPC idempotente (`sync_expense`).
* **Aritmética Financiera Exacta:** Todos los cálculos monetarios operan exclusivamente sobre **centavos enteros** (`assertCents`), erradicando las aberraciones de redondeo de coma flotante IEEE-754.
* **Idempotencia Nativa:** Los identificadores UUIDv4 son generados en el dispositivo; los reintentos de red y dobles pulsaciones colapsan naturalmente en la misma entidad sin registros duplicados.
* **Accesibilidad & UX:** Soporta escalado dinámico de tipografía de hasta 310% sin rupturas visuales y animaciones físicas con *React Native Reanimated*.

🔗 **Recursos:** [Repositorio en GitHub](https://github.com/Eduardomr1/control-de-gastos) · [Especificación de Arquitectura Offline-First](https://github.com/Eduardomr1/proyectos-de-qa/blob/main/docs/arquitectura/control-de-gastos-offline-first.md)

---

### 2. 📅 [AgendaCitas / Reservas](https://github.com/Eduardomr1/agendacitas) · Clean Architecture SaaS
> **Plataforma SaaS multitenant para gestión y reserva de turnos en tiempo real con motor matemático anti-colisión.**

[![Next.js](https://img.shields.io/badge/Next.js-16%20(React%2019)-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3%20Composition%20API-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25%20Strict%20Mode-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle%20ORM-PostgreSQL-C5F74F?logoColor=black)](https://orm.drizzle.team/)
[![Vitest](https://img.shields.io/badge/Vitest-Domain%20Tests-FCC72B?logo=vitest&logoColor=black)](https://vitest.dev/)
[![A11y Targets](https://img.shields.io/badge/Touch%20Targets-%E2%89%A544px%20WCAG-10b981)](#)

* **Clean Architecture + Feature-First:** Separación formal de tres capas: `Domain` (entidades y casos de uso puros sin dependencias externas), `Data` (repositorios Drizzle / Supabase) y `Presentation` (componentes UI).
* **Segregación de Barrels Cliente/Servidor:** Barrels diferenciados (`index.ts` vs `server.ts`) que imposibilitan físicamente la fuga de módulos de Node.js o secretos del servidor hacia los bundles del cliente.
* **Motor Anti-Colisión Determinista:** Algoritmo matemático para validación de ventanas laborales y solapamientos concurrentes, respaldado por tipos de error de dominio semánticos (`Failure`).
* **Design System Accesible:** Componentes interactivos (`ACButton`, `ACInput`, `ACCard`) con objetivos táctiles conformes a estándares WCAG ($\ge 44$px) y contraste AA.

🔗 **Recursos:** [Repositorio en GitHub](https://github.com/Eduardomr1/agendacitas) · [Especificación de Clean Architecture](https://github.com/Eduardomr1/proyectos-de-qa/blob/main/docs/arquitectura/reservas-clean-architecture.md)

---

### 3. 🛡️ [Vigía](https://github.com/Eduardomr1/vigia) · TypeScript AST Linter & GitHub Action
> **Herramienta de análisis estático basada en AST que audita suites de pruebas para erradicar falsos positivos y aserciones huérfanas.**

[![TypeScript Compiler API](https://img.shields.io/badge/Engine-TypeScript%20AST%20Compiler-3178C6?logo=typescript&logoColor=white)](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitHub Action](https://img.shields.io/badge/CI%2FCD-GitHub%20Action%20Toolkit-2088FF?logo=githubactions&logoColor=white)](https://github.com/Eduardomr1/vigia)
[![SARIF](https://img.shields.io/badge/Standard-OASIS%20SARIF%20v2.1.0-8b5cf6)](https://sarifweb.azurewebsites.net/)
[![Compatibility](https://img.shields.io/badge/Parsers-Jest%20%7C%20Vitest%20%7C%20Playwright%20%7C%20Cypress-informational)](#)
[![Tests](https://img.shields.io/badge/Tests-129%20Passed%20(4%20Suites)-059669)](https://github.com/Eduardomr1/vigia)

* **Inspección de Sintaxis Semántica:** A diferencia de linters basados en expresiones regulares que fallan ante saltos de línea o strings, Vigía navega el árbol AST identificando llamadas reales de frameworks de test.
* **Detección de 8 Reglas Críticas (P1–P3):** Identifica pruebas vacías sin aserciones, llamadas a `expect()` huérfanas sin matcher encadenado, promesas asíncronas sin `await`, aserciones en bloques `catch` silenciosos y tautologías literales (`expect(true).toBe(true)`).
* **Detector de Aserciones Huérfanas:** Cruza selectores negativos (`queryByTestId('id')`) con los identificadores presentes en el código de producción; si el id no existe en la app, alerta que la prueba pasaba por error tipográfico y no por validación genuina.
* **Integración Nativa con GitHub Code Scanning:** Emite reportes *OASIS SARIF v2.1.0* con anotaciones automáticas en el diff de Pull Requests y análisis diferencial veloz (`changed-only`).

🔗 **Recursos:** [Repositorio en GitHub](https://github.com/Eduardomr1/vigia) · [Especificación del Pipeline AST & SARIF](https://github.com/Eduardomr1/proyectos-de-qa/blob/main/docs/arquitectura/vigia-ast-pipeline.md)

---

### 4. 🎭 [Automatización E2E & QA Core](https://github.com/Eduardomr1/proyectos-de-qa) · Playwright POM & A11y WCAG 2.1 AA
> **Framework de automatización E2E, auditorías de accesibilidad web Axe-Core y suite de contratos de API en CI con cero pruebas intermitentes.**

[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Automation-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Axe Core](https://img.shields.io/badge/%40axe--core%2Fplaywright-WCAG%202.1%20AA-blueviolet)](https://www.deque.com/axe/)
[![Newman](https://img.shields.io/badge/Newman%20CLI-Automated%20API%20Testing-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)
[![POM](https://img.shields.io/badge/Pattern-Page%20Object%20Model-2563eb)](#)
[![Flakiness](https://img.shields.io/badge/Flakiness-0%25%20(No%20Fixed%20Waits)-10b981)](#)
[![Security](https://img.shields.io/badge/Security-Zero%20High%2FCritical%20CVEs-059669)](#)

* **Page Object Model Estructurado:** Aislamiento absoluto de selectores y acciones de usuario en clases `AuthPage` y `TareasPage`, manteniendo las aserciones puras en los archivos de especificación.
* **Locators Basados en Accesibilidad & Resiliencia:** Priorización estricta de selectores semánticos (`getByRole`, `getByLabel`), garantizando inmunidad ante cambios cosméticos de CSS.
* **Auditorías de Accesibilidad Integradas:** Pruebas automatizadas con `@axe-core/playwright` que evalúan contraste de color, estructura ARIA de hitos (`banner`, `main`), formularios accesibles y navegación por teclado.
* **Simulación de Resiliencia ante Caos de Red:** Pruebas E2E especializadas con mocking de fallos de servidor (HTTP 500, 404), modo sin conexión (*offline*) y simulación de conectividad degradada (*Slow 3G*).
* **Contratos de API & Matriz RTM:** Suite de 25 peticiones y 96 aserciones en *Newman* con reportes ejecutivos *htmlextra*, respaldada por una Matriz de Trazabilidad de Requisitos (RTM) completa.

🔗 **Recursos:** [Repositorio en GitHub](https://github.com/Eduardomr1/proyectos-de-qa) · [Pirámide de Pruebas](https://github.com/Eduardomr1/proyectos-de-qa/blob/main/docs/arquitectura/automatizacion-e2e-testing-pyramid.md) · [Matriz de Trazabilidad RTM](https://github.com/Eduardomr1/proyectos-de-qa/blob/main/plan-de-pruebas/matriz-trazabilidad-automatizacion.md) · [Auditoría de Dependencias](https://github.com/Eduardomr1/proyectos-de-qa/blob/main/reporte-de-bugs/auditoria-seguridad-dependencias.md)

---

### 5. ⚡ [PulseTrack](https://github.com/Eduardomr1/pulsetrack) · API Observability & Uptime Engine
> **Motor de monitoreo sintético distribuido para observabilidad de APIs en tiempo real, cálculo de SLA/SLO y telemetría de latencia.**

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Node.js-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-High%20Throughput-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![Redis](https://img.shields.io/badge/Redis-Latency%20Queue-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![OpenTelemetry](https://img.shields.io/badge/Telemetry-OpenTelemetry%20%7C%20Prometheus-F5A800)](https://opentelemetry.io/)
[![SLA](https://img.shields.io/badge/Uptime-99.99%25%20SLO%20Target-10b981)](#)

* **Sondeo Sintético Distribuido:** Motor de ejecución no bloqueante que evalúa continuamente endpoints REST, GraphQL y WebSockets con resolución submilisegundo.
* **Telemetría de Latencia (P50 / P90 / P99):** Agregación estadística de tiempos de respuesta, cálculo de jitter e identificación inmediata de anomalías de red o saturación de base de datos.
* **Validación Profunda de Contratos HTTP:** Aserción en tiempo real de esquemas de respuesta (*JSON Schema*), cabeceras de seguridad, límites presupuestarios de tiempo de respuesta y caducidad de certificados TLS/SSL.
* **Despachador Inteligente de Webhooks:** Notificaciones multicanal con control de flapping (histeresis) y ventanas de enfriamiento para prevenir fatiga de alertas en incidentes transitorios.

🔗 **Recursos:** [Repositorio en GitHub](https://github.com/Eduardomr1/pulsetrack) · [Arquitectura de Observabilidad](https://github.com/Eduardomr1/proyectos-de-qa/tree/main/docs/arquitectura)

---

## 🛠️ Stack Tecnológico & Arsenal de Ingeniería

<table width="100%">
  <thead>
    <tr>
      <th width="28%">Categoría</th>
      <th width="42%">Tecnologías & Herramientas</th>
      <th width="30%">Enfoque & Estándares</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Lenguajes & Runtimes</b></td>
      <td>
        <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
        <img src="https://img.shields.io/badge/JavaScript%20(ESNext)-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
        <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white"/>
        <img src="https://img.shields.io/badge/SQL-336791?style=flat-square&logo=postgresql&logoColor=white"/>
        <img src="https://img.shields.io/badge/PHP%207.4+-777BB4?style=flat-square&logo=php&logoColor=white"/>
      </td>
      <td>TypeScript modo <code>strict</code>, 0% <code>any</code>, <code>exactOptionalPropertyTypes</code>, ES Modules nativos.</td>
    </tr>
    <tr>
      <td><b>Frontend & Móvil</b></td>
      <td>
        <img src="https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black"/>
        <img src="https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=next.js&logoColor=white"/>
        <img src="https://img.shields.io/badge/React%20Native-61DAFB?style=flat-square&logo=react&logoColor=black"/>
        <img src="https://img.shields.io/badge/Expo%2057-000020?style=flat-square&logo=expo&logoColor=white"/>
        <img src="https://img.shields.io/badge/Vue%203-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white"/>
        <img src="https://img.shields.io/badge/Tailwind%204-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/>
        <img src="https://img.shields.io/badge/Reanimated-9333ea?style=flat-square"/>
      </td>
      <td>Component-driven design, animación física 60 FPS, Server Actions, accesibilidad táctil $\ge 44$px.</td>
    </tr>
    <tr>
      <td><b>Backend, Datos & Cache</b></td>
      <td>
        <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
        <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white"/>
        <img src="https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=flat-square&logoColor=black"/>
        <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white"/>
        <img src="https://img.shields.io/badge/MMKV-F59E0B?style=flat-square"/>
        <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white"/>
        <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white"/>
        <img src="https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white"/>
      </td>
      <td>Arquitectura Offline-First, colas síncronas en disco, RPCs idempotentes, RLS y esquemas declarativos.</td>
    </tr>
    <tr>
      <td><b>QA Automation & Testing</b></td>
      <td>
        <img src="https://img.shields.io/badge/Playwright-45ba4b?style=flat-square&logo=playwright&logoColor=white"/>
        <img src="https://img.shields.io/badge/%40axe--core%2Fplaywright-8B5CF6?style=flat-square"/>
        <img src="https://img.shields.io/badge/Newman%20CLI-FF6C37?style=flat-square&logo=postman&logoColor=white"/>
        <img src="https://img.shields.io/badge/Postman-FF6C37?style=flat-square&logo=postman&logoColor=white"/>
        <img src="https://img.shields.io/badge/Vitest-FCC72B?style=flat-square&logo=vitest&logoColor=black"/>
        <img src="https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white"/>
        <img src="https://img.shields.io/badge/Maestro-2563EB?style=flat-square"/>
      </td>
      <td>Page Object Model (POM), auditorías WCAG 2.1 AA, suites de resiliencia de red, 0% flakiness en CI.</td>
    </tr>
    <tr>
      <td><b>Tooling, AST & DevOps</b></td>
      <td>
        <img src="https://img.shields.io/badge/TypeScript%20Compiler%20API-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
        <img src="https://img.shields.io/badge/OASIS%20SARIF%20v2.1.0-7C3AED?style=flat-square"/>
        <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white"/>
        <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"/>
        <img src="https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white"/>
        <img src="https://img.shields.io/badge/OpenTelemetry-F5A800?style=flat-square"/>
      </td>
      <td>Análisis estático de sintaxis (AST), seguridad en Code Scanning, pipelines paralelos y compilación multi-etapa.</td>
    </tr>
  </tbody>
</table>

---

## 🏛️ Compendio de Arquitectura de Sistemas & Diagramas Mermaid

Para una auditoría técnica profunda, he documentado formalmente los diagramas de secuencia, mapas de componentes y flujos de datos de cada solución en **[`docs/arquitectura/`](https://github.com/Eduardomr1/proyectos-de-qa/tree/main/docs/arquitectura)**:

```
docs/arquitectura/
├── README.md                              # Compendio ejecutivo y mapa arquitectónico global
├── control-de-gastos-offline-first.md     # Flujo síncrono MMKV, réplica SQLite y RPC idempotente
├── reservas-clean-architecture.md         # Aislamiento de dominio, anti-colisión y barrels cliente/servidor
├── vigia-ast-pipeline.md                  # AST Compiler API, reglas de detección y SARIF v2.1.0
└── automatizacion-e2e-testing-pyramid.md  # POM Playwright, auditorías Axe-Core y contratos Newman
```

* **[📐 Ver el Compendio Completo de Arquitectura en GitHub](https://github.com/Eduardomr1/proyectos-de-qa/tree/main/docs/arquitectura)**
* **[📊 Ver la Matriz de Trazabilidad de Requisitos (RTM)](https://github.com/Eduardomr1/proyectos-de-qa/blob/main/plan-de-pruebas/matriz-trazabilidad-automatizacion.md)**
* **[🔒 Ver la Auditoría de Seguridad de Dependencias (Zero CVEs)](https://github.com/Eduardomr1/proyectos-de-qa/blob/main/reporte-de-bugs/auditoria-seguridad-dependencias.md)**

---

## 📈 Filosofía de Calidad: Pirámide de Pruebas & Métricas

```
                    ┌───────────────────────────┐
                    │  Pruebas E2E & A11y (POM) │ ── Playwright & Maestro (15 specs E2E, WCAG 2.1 AA)
                    ├───────────────────────────┤
                    │ Integración & API Contract│ ── Newman / Postman (25 requests, 96 assertions)
                    ├───────────────────────────┤
                    │ Análisis Estático AST     │ ── Vigía Linter (129 tests, SARIF Code Scanning)
                    ├───────────────────────────┤
                    │ Pruebas Unitarias / Dominio│ ── Vitest & Jest (186 tests, 98% de cobertura)
                    └───────────────────────────┘
```

| Métrica de Ingeniería | Resultado en Repositorios | Impacto en Producción |
|:---|:---:|:---|
| **Cobertura de Código (Coverage)** | **98%** en lógica central | Protección determinista contra regresiones |
| **Pruebas Intermitentes (Flaky Tests)** | **0%** | Sin `waitForTimeout`; sincronización reactiva |
| **Cumplimiento de Accesibilidad** | **WCAG 2.1 AA** | Cero violaciones críticas detectadas por Axe-Core |
| **Modo TypeScript** | **Strict (0% Any)** | Inferencia exhaustiva y prevención de `undefined` |
| **Vulnerabilidades de Dependencias** | **0 CVEs Críticas / Altas** | Auditoría continua con `npm audit` y remediación |

---

## 📊 Actividad en GitHub & Métricas de Desarrollo

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-stats.vercel.app/api?username=Eduardomr1&show_icons=true&theme=tokyonight&hide_border=true&bg_color=0d1117&title_color=38bdf8&icon_color=60a5fa&text_color=94a3b8">
  <source media="(prefers-color-scheme: light)" srcset="https://github-readme-stats.vercel.app/api?username=Eduardomr1&show_icons=true&theme=default&hide_border=true&bg_color=f8fafc&title_color=0284c7&icon_color=2563eb&text_color=475569">
  <img src="https://github-readme-stats.vercel.app/api?username=Eduardomr1&show_icons=true&theme=tokyonight&hide_border=true&bg_color=0d1117" alt="GitHub Stats de Eduardo Maytorena" width="49%">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-stats.vercel.app/api/top-langs/?username=Eduardomr1&layout=compact&theme=tokyonight&hide_border=true&bg_color=0d1117&title_color=38bdf8&text_color=94a3b8">
  <source media="(prefers-color-scheme: light)" srcset="https://github-readme-stats.vercel.app/api/top-langs/?username=Eduardomr1&layout=compact&theme=default&hide_border=true&bg_color=f8fafc&title_color=0284c7&text_color=475569">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Eduardomr1&layout=compact&theme=tokyonight&hide_border=true&bg_color=0d1117" alt="Top Languages de Eduardo Maytorena" width="49%">
</picture>

</div>

---

## 📬 Hablemos de Ingeniería

Estoy disponible para asumir roles como **Senior Fullstack Engineer**, **Lead QA Automation Engineer** o **Software Architect** en equipos que valoren el código limpio, la solidez arquitectónica y las suites de prueba deterministas.

* 📧 **Correo Electrónico:** [eduardo_maytorenar@outlook.com](mailto:eduardo_maytorenar@outlook.com)
* 🐙 **GitHub:** [github.com/Eduardomr1](https://github.com/Eduardomr1)
* 📍 **Ubicación:** Hermosillo, Sonora, México (Zona Horaria: MST / UTC-7) — *Disponible para trabajo Remoto e Híbrido*
* 💼 **Idiomas:** Español (Nativo) · Inglés (Técnico Profesional)

<br/>

<div align="center">
  <sub>Diseñado con rigor arquitectónico y estándares de calidad para GitHub Profile • 2026</sub>
</div>
