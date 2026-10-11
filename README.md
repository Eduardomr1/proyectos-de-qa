# Portafolio Profesional de Ingeniería de Software & QA — Eduardo Maytorena

[![CI E2E](https://github.com/eduardo-mr1/proyectos-de-qa/actions/workflows/ci-e2e.yml/badge.svg)](https://github.com/eduardo-mr1/proyectos-de-qa/actions/workflows/ci-e2e.yml)
[![CI API Postman](https://github.com/eduardo-mr1/proyectos-de-qa/actions/workflows/ci-api-postman.yml/badge.svg)](https://github.com/eduardo-mr1/proyectos-de-qa/actions/workflows/ci-api-postman.yml)
[![Vigía CI](https://github.com/eduardo-mr1/vigia/actions/workflows/ci.yml/badge.svg)](https://github.com/eduardo-mr1/vigia/actions)
[![Control de Gastos CI](https://github.com/eduardo-mr1/control-de-gastos/actions/workflows/ci.yml/badge.svg)](https://github.com/eduardo-mr1/control-de-gastos/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean%20%7C%20Feature--First-blue)](./reservas)

Portafolio enfocado en **desarrollo full-stack, ingeniería de software móvil y aseguramiento de calidad (QA Automation)**. Los proyectos aquí presentados demuestran diseño arquitectónico robusto, dominio de TypeScript estricto, análisis estático de código mediante AST, arquitecturas desacopladas (*Clean Architecture* y *Offline-First*), suites de prueba deterministas y automatización en pipelines de Integración Continua (CI/CD).

---

## 📌 Resumen Ejecutivo de Proyectos Principales

| Proyecto | Tipo / Dominio | Stack Tecnológico | Arquitectura Destacada | Métricas de Calidad & Tests |
|---|---|---|---|---|
| **[Gastos](./gastos)** | App Móvil (iOS & Android) | **React Native**, **Reanimated**, Expo SDK 57, TypeScript Strict, TanStack Query, MMKV, Supabase, Maestro | **Offline-First** con cola de persistencia síncrona en MMKV; sincronización RPC idempotente con IDs en cliente; aritmética monetaria en centavos enteros (`assertCents`). | **98% Cobertura**, 186 pruebas unitarias/integración aprobadas, E2E en Maestro en CI, accesibilidad tipográfica probada al 310%. |
| **[Reservas](./reservas)** | Plataforma SaaS Web | Next.js 16 (React 19) / **Vue 3**, TypeScript Strict, Tailwind CSS 4, Drizzle ORM, Supabase (PostgreSQL), Vitest | **Clean Architecture** (Domain, Data, Presentation) + **Feature-First**; Casos de Uso puros; motor matemático anti-colisión; manejo de errores tipados con patrón `Failure`. | **100% tipado estricto** (0% `any`), pruebas de dominio con Vitest, Design System propio accesible (WCAG, touch targets $\ge 44$px). |
| **[Vigía](./vigia)** | Developer Tooling / CI Action | **TypeScript AST** (Compiler API), Node.js, GitHub Actions Toolkit, Jest/Playwright/Cypress parser | Análisis estático de sintaxis (AST) para detectar pruebas que pasan en verde sin verificar aserciones reales (8 reglas P1–P3); detección de selectores negativos huérfanos. | **129 pruebas en 4 suites**, auto-verificación en CI (`self-check`), análisis diferencial veloz sobre el diff del PR (`changed-only`). |
| **[Automatización E2E](./automatizacion-e2e)** | Framework E2E & QA Core | **Playwright**, **Newman**, Postman, JavaScript/Node.js, Express, React, GitHub Actions | **Page Object Model (POM)** estructurado; selectores por rol y accesibilidad (`getByRole`, `getByLabel`); sincronización determinista sin esperas fijas; contrato de API automatizado. | **15 pruebas E2E** + **96 aserciones de API**, 8 defectos reales corregidos y blindados con pruebas de regresión, trazas y captura en fallos. |

---

## 🚀 Proyectos Destacados

### 1. [Gastos](./gastos) · Mobile Engineering & Offline-First

Aplicación de control de gastos personales construida como caso de estudio de ingeniería móvil rigurosa, resiliencia ante pérdida de conectividad y precisión financiera.

- **Stack:** React Native 0.81, Expo SDK 57, React Native Reanimated, TypeScript (modo `strict` con `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`), TanStack Query, MMKV, Supabase, Maestro.
- **Decisiones de Arquitectura Críticas:**
  - **Aritmética en centavos enteros:** Para eliminar imprecisiones de coma flotante (`0.1 + 0.2 !== 0.3` en IEEE-754), el monto se almacena y opera como centavos enteros (`assertCents`), formateándose únicamente en los extremos de la UI.
  - **Identificadores generados en el cliente:** Idempotencia nativa. El reintento de red, doble tap o reanudación de la cola local colapsan en el mismo registro, previniendo duplicidades sin depender de bloqueos de interfaz frágiles.
  - **Períodos en hora local:** Agrupación y cortes mensuales determinados a partir de componentes ISO explícitos sin desfasajes de zona por conversiones indebidas a UTC.
  - **Persistencia síncrona en MMKV:** La cola de sincronización offline sobrevive cierres forzados del sistema operativo.
- **Calidad y Pruebas:**
  - 186 pruebas unitarias y de integración.
  - 98% de cobertura de código.
  - Flujos E2E automatizados en Maestro ejecutados en CI.

---

### 2. [Reservas (AgendaCitas)](./reservas) · Clean Architecture & SaaS

Sistema SaaS multitenant para reserva y gestión de citas de servicios en tiempo real con prevención matemática de colisiones de agenda.

- **Stack:** Next.js 16 (App Router + React 19) / soporte para componentes reactivos modernos (Vue 3 / React), TypeScript Strict, Tailwind CSS 4, Drizzle ORM, PostgreSQL (Supabase), Vitest.
- **Decisiones de Arquitectura Críticas:**
  - **Clean Architecture + Feature-First:** Separación formal entre `Domain` (entidades y casos de uso puros), `Data` (repositorios e infraestructura Drizzle/Postgres) y `Presentation` (vistas y componentes UI).
  - **Desacoplamiento de Cliente/Servidor:** Barrels diferenciados (`index.ts` para cliente y `server.ts` para servidor) que impiden la fuga de dependencias o secretos del runtime de servidor al cliente.
  - **Manejo de Errores Semánticos (`Failure`):** Los errores de Postgres o Supabase son transformados en tipos de fallo semánticos (`HORARIO_OCUPADO`, `SIN_CONEXION`, `DATOS_INVALIDOS`), resguardando detalles internos y otorgando feedback amigable al usuario.
  - **Motor Anti-Colisión:** Algoritmo matemático que valida límites laborales, duración de turnos y solapamientos de citas en base de datos.
- **Calidad y Pruebas:**
  - Pruebas unitarias con Vitest sobre casos de uso y cálculo de disponibilidad.
  - Componentes de diseño propios (`ACButton`, `ACInput`, `ACCard`) con objetivos táctiles accesibles ($\ge 44$px).

---

### 3. [Vigía](./vigia) · Static Analysis & AST Tooling

Herramienta de análisis estático publicada como GitHub Action y CLI que audita suites de pruebas automatizadas para detectar falsos positivos y pruebas que pasan sin verificar aserciones.

- **Stack:** TypeScript, Node.js, TypeScript Compiler API (`ts.createSourceFile`), GitHub Actions Toolkit. Compatible con Jest, Vitest, Cypress, Playwright y Maestro.
- **Decisiones de Arquitectura Críticas:**
  - **Inspección de Sintaxis Abstracta (AST):** A diferencia de linters basados en expresiones regulares que fallan ante comentarios o strings, Vigía navega el árbol AST de TypeScript reconociendo llamadas semánticas reales.
  - **Reglas de Detección de Falsos Positivos:** Identifica 8 patrones defectuosos, entre ellos: pruebas sin aserción, `expect` sin matcher encadenado, tautologías literales (`expect(true).toBe(true)`), promesas sin `await` (que terminan antes de evaluar), aserciones en bloques `catch` silenciosos y pruebas con `.only` o `.skip`.
  - **Detección de Aserciones Huérfanas:** Cruza las consultas negativas de los tests (`queryByTestId('x')` esperado nulo) con los identificadores producidos en el código fuente. Si `"x"` no existe en la app, la prueba pasa por un error tipográfico y no por validar ausencia de la funcionalidad.
- **Calidad y Pruebas:**
  - 129 pruebas automatizadas distribuidas en 4 suites con fixtures positivos y negativos.
  - Pipeline de CI con trabajo dedicado de `self-check` que ejecuta Vigía contra su propio código.

---

### 4. [Automatización E2E](./automatizacion-e2e) · Playwright & Calidad de Software

Suite de automatización end-to-end con Playwright y pruebas de contrato de API sobre una aplicación real de gestión de tareas (API en Node/Express + cliente web).

- **Stack:** Playwright, JavaScript (Node.js), Postman, Newman CLI, GitHub Actions.
- **Decisiones de Arquitectura Críticas:**
  - **Page Object Model (POM):** Arquitectura modular encapsulada en `AuthPage` y `TareasPage`, separando la interacción con la interfaz de la lógica de aserción de las pruebas.
  - **Locators Orientados a Accesibilidad:** Selectores basados en roles semánticos (`getByRole`) y etiquetas (`getByLabel`), garantizando resiliencia ante cambios estéticos de clases y alertando regresiones en accesibilidad web.
  - **Sincronización Determinista:** Erradicación completa de esperas fijas (`page.waitForTimeout`); todo flujo aguarda condiciones de estado y reactividad de la aplicación.
  - **Aislamiento de Datos por Prueba:** Generación dinámica de cuentas únicas por ejecución, permitiendo repetibilidad sin ensuciar el estado compartido.
- **Ecosistema Completo de QA:**
  - **[Pruebas de API (Postman + Newman)](./pruebas-api-postman):** 25 peticiones y 96 aserciones que validan tipos y contratos en CI.
  - **[Reporte de Bugs](./reporte-de-bugs):** 8 defectos reales descubiertos en auditorías exploratorias, con causa raíz analizada, corrección en pull request y pruebas de regresión automáticas asociadas.
  - **[Plan de Pruebas](./plan-de-pruebas):** Estrategia y 17 casos manuales organizados por prioridad y matriz de riesgos sobre SauceDemo.

---

## 🔄 El Ciclo Integral de Calidad y Desarrollo

Los proyectos reflejan la conexión continua entre diseño, desarrollo, pruebas y prevención de regresiones:

```
Diseño y Casos de Prueba  →  Desarrollo con Clean Code  →  Automatización E2E & API
           ↑                                                         ↓
Verificación y Cierre en CI  ←  Pruebas de Regresión  ←  Detección de Defectos (Vigía/QA)
```

### Las Capas de Prueba Implementadas

| Capa | Herramienta | Enfoque y Propósito |
|---|---|---|
| **Análisis Estático (AST)** | Vigía | Detecta pruebas vacías o falsos positivos antes del merge. |
| **Pruebas Unitarias & Dominio** | Vitest / Jest | Valida reglas de negocio, Casos de Uso y motores matemáticos sin efectos secundarios. |
| **Integración & Contrato** | Node Test Runner / Postman + Newman | Garantiza que la API cumpla contratos HTTP, tipos y aislamiento de datos. |
| **Extremo a Extremo (E2E)** | Playwright / Maestro | Verifica flujos de usuario reales de principio a fin en web y dispositivos móviles. |

---

## 🛠️ Stack Tecnológico Global

- **Lenguajes:** TypeScript (Strict Mode), JavaScript (ESNext), Node.js, PHP, SQL.
- **Frontend & Móvil:** React Native, React 19, Next.js 16, Vue 3, React Native Reanimated, Expo, Tailwind CSS.
- **Backend & Bases de Datos:** Node.js, Express, PostgreSQL (Supabase), Drizzle ORM, SQLite, PDO / MySQL, MMKV.
- **Testing & Tooling:** Playwright, Vitest, Jest, Maestro, Postman / Newman, TypeScript Compiler API (AST), GitHub Actions.
- **Principios & Metodologías:** Clean Architecture, Feature-First, Page Object Model (POM), Offline-First, CI/CD, WCAG Accessibility.

---

## 📂 Estructura del Repositorio

```
PortafolioProfesional/
├── gastos/                   # App móvil React Native + Expo + Reanimated + Offline-First
├── reservas/                 # SaaS de Citas con Next.js + Clean Architecture + Drizzle ORM
├── vigia/                    # Linter AST en TypeScript & GitHub Action para suites de pruebas
├── automatizacion-e2e/       # Framework E2E con Playwright y Page Object Model (POM)
├── pruebas-api-postman/      # Colección Postman y ejecución Newman CI (25 req, 96 asserts)
├── reporte-de-bugs/          # Documentación de 8 defectos reales, causa raíz y regresiones
├── plan-de-pruebas/          # Estrategia de pruebas, matriz de riesgos y 17 casos manuales
├── proyectos-de-programacion/# API REST Node/Express + Frontend React + Motor de Búsqueda BM25
└── mini-crm-php-mysql/       # Sistema CRM en PHP 7.4 + MySQL con arquitectura MVC pura
```

---

## 👤 Autor

**Eduardo Maytorena**  
- Correo: [eduardo_maytorenar@outlook.com](mailto:eduardo_maytorenar@outlook.com)  
- GitHub: [github.com/eduardo-mr1](https://github.com/eduardo-mr1)
