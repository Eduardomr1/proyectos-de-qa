# Compendio de Arquitectura de Software y Estrategia de Calidad
### Portafolio Profesional — Eduardo Maytorena

[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%7C%20Offline--First%20%7C%20AST%20Tooling-blue)](./README.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![SARIF](https://img.shields.io/badge/SARIF-OASIS%20v2.1.0-blueviolet)](https://sarifweb.azurewebsites.net/)
[![WCAG](https://img.shields.io/badge/A11y-WCAG%202.1%20AA-success)](https://www.w3.org/WAI/WCAG21/quickref/)

Este compendio documenta de forma visual, analítica y técnica las decisiones de diseño arquitectónico, patrones de software, protocolos de tolerancia a fallos y la estrategia de aseguramiento de calidad implementada en los proyectos insignia del portafolio.

Está diseñado para que **Líderes Técnicos, Arquitectos de Software, Staff Engineers y Reclutadores Técnicos** puedan auditar rápidamente la profundidad ingenieril, la madurez en diseño de sistemas y la prevención rigurosa de errores que rigen cada repositorio.

---

## 🗺️ Mapa Arquitectónico de Proyectos Insignia

| Proyecto | Dominio | Patrón Arquitectónico Principal | Invariante Crítico de Diseño | Mecanismo de Tolerancia a Fallos |
|---|---|---|---|---|
| **[Gastos (Control de Gastos)](../../gastos)** | Móvil (React Native / Expo) | **Offline-First Reactive Architecture** con cola síncrona en MMKV y réplica local SQLite | Aritmética monetaria exclusiva en centavos enteros (`assertCents`); generación de UUID en cliente para idempotencia | Cola FIFO en MMKV resistente a cierre forzado del SO; reconciliación simétrica con Last-Write-Wins (LWW) |
| **[Reservas (AgendaCitas)](../../reservas)** | Web SaaS (Next.js 16 / React 19) | **Clean Architecture** (Hexagonal/Onion) + **Feature-First** | Dominio puro libre de dependencias externas; Barrels cliente/servidor estrictamente segregados | Manejo semántico de errores mediante tipo `Failure`; motor matemático determinista de prevención de colisiones |
| **[Vigía](../../vigia)** | Developer Tooling / CI/CD Action | **Pipeline de Análisis Estático de Sintaxis (AST)** con TypeScript Compiler API | Inspección semántica de llamadas vs. regex frágil; validación cruzada de selectores negativos contra el código fuente | Formato OASIS SARIF v2.1.0 para GitHub Code Scanning; self-check en CI; modo `changed-only` para PRs veloces |
| **[Automatización E2E & QA](../../automatizacion-e2e)** | QA Core & Automation Framework | **Page Object Model (POM)** estructurado + Pirámide de Pruebas Multi-Capa | Locators por rol y etiqueta accesible (WCAG); cero esperas fijas; aislamiento total de datos por prueba | Captura determinista de trazas y capturas en fallos (`retain-on-failure`); suites de regresión acopladas a defectos reales |

---

## 1. Gastos · Arquitectura Offline-First y Sincronización Idempotente

### 1.1 Diagrama de Bloques y Almacenamiento Local
La aplicación móvil no considera la conectividad como un requisito, sino como una optimización progresiva. Los datos siempre se escriben primero en disco local antes de que la interfaz confirme la acción al usuario.

```mermaid
flowchart TD
    subgraph UI_Layer["Capa de Presentación (React Native / Expo)"]
        User["👤 Usuario"] --> Form["Formulario de Gastos"]
        Form --> Valid["Validación de Dominio<br/>assertCents() + Generación UUID"]
        Valid --> RQ["TanStack Query<br/>(Cache en Memoria / Estado Optimista)"]
    end

    subgraph Storage_Layer["Almacenamiento Local en Dispositivo"]
        Valid -->|"Escritura Síncrona"| MMKV["Cola de Sincronización MMKV<br/>(Persistencia Síncrona / Sobrevive App Kill)"]
        Valid -->|"Escritura Síncrona"| SQLite["Réplica Local SQLite (gastos.db)<br/>(Consultas estructuradas y Lectura Offline)"]
    end

    subgraph Engine_Layer["Motor de Sincronización (Sync Engine)"]
        NetMon{"Detector de Red<br/>(NetInfo)"}
        QueueWorker["Queue Worker<br/>(Procesamiento FIFO asíncrono)"]
        ConflictResolver["Reconciliador de Conflictos<br/>resolveConflict() (Last-Write-Wins)"]
        
        MMKV -.->|"Leer pendientes"| QueueWorker
        NetMon -->|"Conexión Detectada"| QueueWorker
        QueueWorker --> ConflictResolver
    end

    subgraph Cloud_Layer["Nube Supabase (PostgreSQL)"]
        RPC["RPC Postgres<br/>sync_expense(UUID, ...)"]
        PullRPC["RPC Postgres<br/>pull_changes(cursor)"]
        RLS["Políticas Row Level Security (RLS)"]
        Tables[("Tabla Gastos<br/>PostgreSQL")]
        
        RPC --> RLS --> Tables
        Tables --> PullRPC
    end

    QueueWorker ==>|"HTTP POST (Idempotente)"| RPC
    PullRPC ==>|"Delta de cambios remotos"| ConflictResolver
    ConflictResolver -->|"Actualizar réplica"| SQLite
    ConflictResolver -->|"Eliminar confirmado"| MMKV
    ConflictResolver -->|"Invalidar consultas activas"| RQ
    RQ -->|"Actualización reactiva de UI"| Form

    classDef primary fill:#1e3a8a,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef secondary fill:#064e3b,stroke:#059669,stroke-width:2px,color:#fff;
    classDef storage fill:#78350f,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef cloud fill:#4c1d95,stroke:#7c3aed,stroke-width:2px,color:#fff;

    class Form,Valid,RQ primary;
    class MMKV,SQLite storage;
    class QueueWorker,ConflictResolver,NetMon secondary;
    class RPC,PullRPC,RLS,Tables cloud;
```

### 1.2 Diagrama de Secuencia del Flujo de Sincronización
Muestra el ciclo de vida de un gasto desde su creación en el cliente hasta su confirmación remota en PostgreSQL vía RPC.

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuario (Móvil)
    participant UI as React Native UI<br/>(Expo / Reanimated)
    participant RQ as TanStack Query<br/>(Client Cache)
    participant LocalDB as SQLite Local DB<br/>(gastos.db / Read Replica)
    participant Queue as MMKV Sync Queue<br/>(Síncrono en Disco)
    participant Engine as Sync Engine<br/>(Worker & Reconcile)
    participant Net as Network Monitor<br/>(NetInfo)
    participant Supa as Supabase Cloud<br/>(PostgreSQL RPC)

    Note over User,UI: 1. Creación de Gasto (Completamente Offline u Online)
    User->>UI: Ingresa monto ($150.00) y categoría
    UI->>UI: assertCents(15000) & genera UUIDv4 en cliente
    UI->>RQ: Mutación optimista en cache local
    
    par Persistencia Síncrona en Disco (Aislamiento de fallo)
        UI->>LocalDB: INSERT INTO gastos (UUID, cents, local_date...)
        UI->>Queue: ENQUEUE payload {id, action: 'upsert', cents, version}
    end
    Note over UI,Queue: Si el SO cierra la app forzosamente, los datos persisten intactos
    UI-->>User: Feedback inmediato en UI (< 16ms / 60 FPS)

    Note over Engine,Supa: 2. Proceso de Sincronización en Segundo Plano
    Engine->>Net: Verifica estado de conexión
    alt Sin Conexión (Offline)
        Net-->>Engine: Offline
        Engine->>Engine: Pausa ejecución; cola permanece en MMKV
    else Con Conexión (Online)
        Net-->>Engine: Online
        Engine->>Queue: PEEK ítems pendientes
        Queue-->>Engine: Lista de operaciones pendientes
        
        Engine->>Supa: POST /rpc/sync_expense (payload con UUID del cliente)
        alt Éxito (HTTP 200)
            Supa-->>Engine: { success: true, server_version, updated_at }
            Engine->>Queue: DEQUEUE / REMOVE (ítem confirmado)
            Engine->>Engine: Reconciliación LWW (Last-Write-Wins)
            Engine->>RQ: Invalida y refresca consultas activas
        else Error de Red o Timeout
            Supa-->>Engine: Network Error / 5xx
            Engine->>Engine: Backoff exponencial; ítem permanece seguro en MMKV
        end

        opt Traer cambios remotos (Pull delta incremental)
            Engine->>Supa: POST /rpc/pull_changes (cursor)
            Supa-->>Engine: Delta de registros modificados
            Engine->>Engine: reconcile(local, remote) via resolveConflict()
            Engine->>LocalDB: Actualiza réplica SQLite local
            Engine->>RQ: Refresca consultas de UI
        end
    end
```

### 1.3 Decisiones de Ingeniería Destacadas
- **Aritmética en Centavos Enteros:** Elimina fallos de punto flotante IEEE-754 (`assertCents`).
- **Idempotencia por UUID en Cliente:** Reintentos de red o pulsaciones dobles colapsan en el mismo registro en la base de datos sin generar duplicados.
- **Fechas en Hora Local Explícita:** Se resuelven los límites mensuales según los componentes literales de la zona horaria del usuario, evitando desfasajes de UTC al cierre de mes.

---

## 2. Reservas (AgendaCitas) · Clean Architecture & Prevención de Colisiones

### 2.1 Diagrama de Capas de Clean Architecture + Feature-First
Alineado con los principios de Robert C. Martin, la regla de dependencia es estricta: **las dependencias apuntan exclusivamente hacia adentro, al Dominio**.

```mermaid
flowchart TB
    subgraph Presentation_Layer["Capa de Presentación (Presentation Layer)"]
        direction TB
        AppRouter["Next.js 16 App Router<br/>(Server & Client Components)"]
        DesignSystem["Design System Propio Accesible<br/>(ACButton, ACInput, ACCard, ACCalendar, ACToggle)"]
        Views["Vistas Modulares por Feature<br/>(ReservasView, GestionServiciosView, ServicioModal)"]
        ClientBarrel["Barrel de Cliente (index.ts)<br/>(Empaquetado limpio sin código de servidor)"]
    end

    subgraph Domain_Layer["Capa de Dominio (Domain Layer - Pure Business Logic)"]
        direction TB
        Entities["Entidades de Negocio Puras<br/>(Servicio, Cita, HorarioLaboral)"]
        UseCases["Casos de Uso (Interactors)<br/>• CrearCitaUseCase<br/>• ActualizarServicioUseCase<br/>• CambiarEstadoServicioUseCase<br/>• EliminarServicioUseCase"]
        MathEngine["Motor Matemático Anti-Colisión<br/>(disponibilidad.ts - Cálculo de intervalos continuos)"]
        RepoInterfaces["Interfaces de Repositorio (Puertos)<br/>(ReservasRepository, ServiciosRepository)"]
        Failures["Tipos de Fallo Semánticos (Failure)<br/>HORARIO_OCUPADO | SIN_CONEXION | DATOS_INVALIDOS"]
    end

    subgraph Data_Layer["Capa de Datos e Infraestructura (Data & Infra Layer)"]
        direction TB
        RepoImpl["Implementaciones de Repositorio (Adaptadores)<br/>ReservasRepositoryImpl<br/>ServiciosRepositoryImpl"]
        Drizzle["Drizzle ORM Schema & Queries<br/>(Consultas SQL tipadas en TypeScript)"]
        DBDriver["Conexión Postgres / Supabase<br/>(Connection Pooling)"]
        ErrorTranslator["Traductor de Errores (traducir.ts)<br/>Postgres Code 23505 ➔ Failure: HORARIO_OCUPADO"]
        ServerBarrel["Barrel de Servidor (server.ts)<br/>(Aislamiento estricto de secretos y drivers de BD)"]
    end

    %% Relaciones y flujo de dependencias (hacia el centro / Dominio)
    Views -->|"Invoca con DTOs"| UseCases
    AppRouter --> Views
    DesignSystem --> Views
    ClientBarrel --> Views

    UseCases -->|"Opera sobre"| Entities
    UseCases -->|"Valida traslapes con"| MathEngine
    UseCases -->|"Retorna Result<T, Failure>"| Failures
    UseCases -->|"Depende de contratos"| RepoInterfaces

    RepoImpl -.->|"Implementa (DIP)"| RepoInterfaces
    RepoImpl --> Drizzle
    Drizzle --> DBDriver
    Drizzle -.->|"Captura excepciones de SQL"| ErrorTranslator
    ErrorTranslator -->|"Mapea a tipos de dominio"| Failures
    ServerBarrel --> RepoImpl

    classDef pres fill:#1e3a8a,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef domain fill:#064e3b,stroke:#059669,stroke-width:2px,color:#fff;
    classDef data fill:#78350f,stroke:#d97706,stroke-width:2px,color:#fff;

    class AppRouter,DesignSystem,Views,ClientBarrel pres;
    class Entities,UseCases,MathEngine,RepoInterfaces,Failures domain;
    class RepoImpl,Drizzle,DBDriver,ErrorTranslator,ServerBarrel data;
```

### 2.2 Patrón de Manejo de Errores con `Failure`
En lugar de propagar excepciones no controladas o códigos crudos de PostgreSQL (`23505`, `ECONNREFUSED`), la capa de datos captura las excepciones y las traduce al tipo de dominio `Failure`:

```
PostgreSQL / Drizzle Exception ➔ traducir(error) ➔ Failure.HORARIO_OCUPADO ➔ UI amigable con WCAG
```

Esto impide la fuga de detalles de infraestructura al usuario final y asegura que las vistas manejen estados de fallo tipados exhaustivamente (`exhaustive switch checking`).

---

## 3. Vigía · Pipeline de Análisis Estático de AST & GitHub Code Scanning

### 3.1 Diagrama del Pipeline de Procesamiento AST
Vigía inspecciona el Árbol de Sintaxis Abstracta de TypeScript para detectar pruebas que pasan en verde sin verificar aserciones o con falsos positivos.

```mermaid
flowchart LR
    subgraph Trigger["1. Entrada & Contexto"]
        PR["Pull Request / Git Diff<br/>(changed-only: true)"]
        CLI["CLI Command<br/>vigia [path] --source [dir]"]
        Files["Archivos de Prueba<br/>*.spec.ts, *.test.js, *.yaml"]
    end

    subgraph AST_Parser["2. Parsing Sintáctico (AST)"]
        TSCompiler["TypeScript Compiler API<br/>ts.createSourceFile()"]
        AST["Árbol de Sintaxis Abstracta (AST)<br/>SourceFile ➔ Block ➔ CallExpressions"]
        OrphanCollector["Recolector de Identificadores<br/>collectKnownIds(sourceRoot)"]
    end

    subgraph Rule_Engine["3. Motor de Reglas (AST Traversal)"]
        direction TB
        Matcher["analyzeSource() - Rule Matcher"]
        
        R1["no-assertion (P1)<br/>Test sin aserciones evaluadas"]
        R2["expect-without-matcher (P1)<br/>expect(x) sin matcher encadenado"]
        R3["tautology (P1)<br/>expect(true).toBe(true)"]
        R4["identical-expression (P1)<br/>expect(a).toBe(a)"]
        R5["missing-await (P1)<br/>Aserción asíncrona sin await"]
        R6["assertion-in-catch (P1)<br/>Aserción en catch sin guardia en try"]
        R7["focused-test (P1)<br/>it.only() / fit() en commit"]
        R8["skipped-test (P3)<br/>it.skip() / xit() abandonado"]
        R9["orphan-negative-assertion (P1/P2)<br/>queryByTestId('id') ausente en app"]
        
        Matcher --- R1 & R2 & R3
        Matcher --- R4 & R5 & R6
        Matcher --- R7 & R8 & R9
    end

    subgraph Formatting["4. Agregación & Normalización"]
        Findings["Findings Normalizados<br/>(file, line, col, ruleId, severity)"]
    end

    subgraph Outputs["5. Reportes & Exportación"]
        StdOut["Consola Terminal<br/>(Reporte ANSI estructurado)"]
        PRComment["GitHub Sticky PR Comment<br/>(Tabla Markdown con línea exacta)"]
        SARIF["OASIS SARIF v2.1.0 Exporter<br/>(sarif.ts)"]
        CodeScan["GitHub Code Scanning<br/>(Alertas de Seguridad en Repositorio)"]
    end

    PR --> Files
    CLI --> Files
    Files --> TSCompiler
    CLI -.->|"Si --source está presente"| OrphanCollector
    TSCompiler --> AST
    AST --> Matcher
    OrphanCollector -.->|"Lista de TestIDs válidos"| R9
    Matcher --> Findings
    Findings --> StdOut
    Findings --> PRComment
    Findings --> SARIF
    SARIF --> CodeScan

    classDef trigger fill:#1e3a8a,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef ast fill:#4c1d95,stroke:#7c3aed,stroke-width:2px,color:#fff;
    classDef rules fill:#064e3b,stroke:#059669,stroke-width:2px,color:#fff;
    classDef out fill:#831843,stroke:#db2777,stroke-width:2px,color:#fff;

    class PR,CLI,Files trigger;
    class TSCompiler,AST,OrphanCollector ast;
    class Matcher,R1,R2,R3,R4,R5,R6,R7,R8,R9 rules;
    class Findings,StdOut,PRComment,SARIF,CodeScan out;
```

### 3.2 Clasificación de Severidad y Compatibilidad de Frameworks
- **Severidad P1 (Bloqueante en CI):** Pruebas sin aserción, promesas sin `await`, tautologías literales, tests enfocados (`.only`).
- **Severidad P2 (Advertencia):** Selectores huérfanos con coincidencia parcial.
- **Severidad P3 (Informativa):** Tests omitidos (`.skip`) para alertar sobre pruebas ignoradas.
- **Frameworks Soportados:** Jest, Vitest, Playwright (matchers asíncronos), Cypress, Chai y flujos E2E de Maestro en YAML.

---

## 4. Automatización E2E & QA Core · Pirámide de Pruebas Multi-Capa

### 4.1 Diagrama de la Pirámide Integral de Testing
El ecosistema de calidad articula pruebas en cada nivel del ciclo de vida del software, desde el análisis estático y metacalidad hasta la auditoría de accesibilidad y simulación de caos en red.

```mermaid
flowchart TD
    subgraph Pyramid["Pirámide de Automatización de Pruebas Integral"]
        direction TB

        L4["🔝 Capa E2E & Accesibilidad UI (Playwright POM + Axe Core)<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>• 32 pruebas automatizadas en Chromium<br/>• Page Object Model estructurado (AuthPage, TareasPage)<br/>• Auditorías de Accesibilidad WCAG 2.1 AA con @axe-core/playwright<br/>• Locators orientados a accesibilidad (getByRole, getByLabel)<br/>• Aislamiento determinista de datos por usuario único"]

        L3["⚡ Capa de Resiliencia de Red & Simulación de Caos (Chaos Testing)<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>• Intercepción de tráfico de red (page.route())<br/>• Simulación de conectividad degradada y modo offline<br/>• Sincronización asíncrona sin timeouts fijos (eliminación de esperas frágiles)<br/>• Detección de UI asíncrona no optimista y condiciones de carrera"]

        L2["🔌 Capa de Contrato & Integración de API (Postman + Newman Runner)<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>• 25 peticiones HTTP organizadas en 4 carpetas funcionales<br/>• 96 aserciones de contrato, tipos y esquemas (100% aprobadas)<br/>• Verificación de seguridad JWT y RBAC sin interfaz gráfica<br/>• Runner configurable con Newman y reportes ejecutivos HTML interactivos"]

        L1["🛡️ Base de Metacalidad & Pruebas Unitarias (Vigía + Vitest / Jest)<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>• Auditoría AST de suites de prueba con Vigía (prevención de falsos positivos)<br/>• Pruebas unitarias de algoritmos y Casos de Uso puros de dominio<br/>• Suites de regresión automáticas para 14 defectos reales documentados<br/>• Trazabilidad completa entre bugs, planes de prueba y pruebas automáticas"]

        L4 --- L3
        L3 --- L2
        L2 --- L1
    end

    subgraph CI_Pipelines["Orquestación en Integración Continua (GitHub Actions)"]
        CI_API["ci-api-postman.yml<br/>(Pruebas de Contrato y Smoke API)"]
        CI_E2E["ci-e2e.yml<br/>(Playwright E2E y Accesibilidad Axe)"]
        CI_Vigia["ci-vigia.yml<br/>(Self-Check AST en PRs)"]
        CI_Bugs["ci-verificacion-bugs.yml<br/>(Regresiones de Defectos Documentados)"]
    end

    L2 -.-> CI_API
    L4 -.-> CI_E2E
    L1 -.-> CI_Vigia
    L1 -.-> CI_Bugs

    classDef top fill:#991b1b,stroke:#dc2626,stroke-width:2px,color:#fff;
    classDef midHigh fill:#c2410c,stroke:#ea580c,stroke-width:2px,color:#fff;
    classDef mid fill:#0369a1,stroke:#0284c7,stroke-width:2px,color:#fff;
    classDef base fill:#166534,stroke:#15803d,stroke-width:2px,color:#fff;
    classDef ci fill:#4338ca,stroke:#6366f1,stroke-width:2px,color:#fff;

    class L4 top;
    class L3 midHigh;
    class L2 mid;
    class L1 base;
    class CI_API,CI_E2E,CI_Vigia,CI_Bugs ci;
```

### 4.2 Matriz de Estrategias y Cobertura de QA

| Estrategia / Nivel | Herramienta | Enfoque de Validación | Métrica Clave |
|---|---|---|---|
| **Metacalidad (AST)** | Vigía | Detección de pruebas vacías o falsos positivos antes del merge | 129 pruebas en 4 suites; 0 falsos positivos |
| **Pruebas de Dominio** | Vitest / Jest | Lógica de negocio pura, cálculo de disponibilidad y modelos monetarios | 98% cobertura en Gastos; 100% tipado estricto en Reservas |
| **Pruebas de Contrato API** | Postman + Newman | Contratos HTTP, seguridad JWT, validación de esquemas y tipos | 25 peticiones, 96 aserciones, 100% aprobadas |
| **Pruebas E2E (POM)** | Playwright | Flujos de usuario completos, persistencia y aislamiento entre cuentas | 32 pruebas automatizadas sin esperas fijas |
| **Accesibilidad (A11y)** | Axe Core + WCAG | Cumplimiento de WCAG 2.1 AA (contraste, teclado, ARIA, semántica) | 0 violaciones críticas de accesibilidad |
| **Pruebas de Regresión** | Suites Dedicadas | Validación automática de defectos previamente encontrados | 14 bugs de Gastos + 8 de QA blindados en CI |

---

## 5. Tabla Comparativa de Decisiones Técnicas y Trade-offs

| Decisión Arquitectónica | Alternativa Descartada | Justificación Técnica & Impacto |
|---|---|---|
| **MMKV síncrono para cola de sync** | `AsyncStorage` | `AsyncStorage` es asíncrono y los datos pendientes pueden perderse si el sistema operativo finaliza el proceso de la app antes de completar la escritura en disco. MMKV garantiza persistencia síncrona inmediata. |
| **UUID generado en el cliente** | `SERIAL` / Auto-increment en BD | Permite registrar entidades de forma offline instantánea y convierte cualquier reintento o doble clic en una operación naturalmente idempotente. |
| **Clean Architecture + Barrels separados** | Estructura tradicional por tipo de archivo (`controllers/`, `views/`) | Previene la fuga de dependencias pesadas de base de datos o secretos de Node.js al empaquetado del navegador en Next.js (`server.ts` vs `index.ts`). |
| **Análisis Estático por AST** | Expresiones regulares (Regex) | Los regex fallan catastróficamente ante cadenas de texto, comentarios multilínea o templates literales. El árbol AST de TypeScript proporciona conocimiento semántico real del código. |
| **Locators semánticos y accesibles** | Selectores XPath o clases CSS (`.btn-primary`) | Las clases CSS cambian con frecuencia ante rediseños estéticos. Los selectores por rol y etiqueta (`getByRole`, `getByLabel`) son resilientes y detectan regresiones de accesibilidad web. |

---

## 📂 Enlaces a Especificaciones Detalladas
- [Flujo Detallado Offline-First en Control de Gastos](./control-de-gastos-offline-first.md)
- [Especificación de Clean Architecture en Reservas](./reservas-clean-architecture.md)
- [Arquitectura del Pipeline AST de Vigía](./vigia-ast-pipeline.md)
- [Pirámide de Pruebas y Resiliencia en Automatización E2E](./automatizacion-e2e-testing-pyramid.md)
