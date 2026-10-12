# Pirámide de Pruebas & Framework de Automatización E2E
### Caso de Estudio: Automatización Playwright, Accesibilidad Axe y Newman API

[![Framework](https://img.shields.io/badge/Framework-Playwright%20v1.50-green?logo=playwright)](https://playwright.dev/)
[![A11y](https://img.shields.io/badge/A11y-%40axe--core%2Fplaywright-blueviolet)](https://github.com/dequelabs/axe-core-npm)
[![API Automation](https://img.shields.io/badge/API-Newman%20%2B%20Postman-FF6C37?logo=postman)](https://www.npmjs.com/package/newman)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions)](../../.github/workflows)

Este documento expone la arquitectura del ecosistema de calidad y aseguramiento de software, implementando una **Pirámide de Pruebas Multi-Capa**, el patrón **Page Object Model (POM)** en Playwright, auditorías automatizadas de accesibilidad web (WCAG 2.1 AA) y pruebas de contrato de API REST con Newman.

---

## 1. La Filosofía de Aseguramiento de Calidad

El aseguramiento de calidad (QA) en este portafolio no es una fase tardía de validación manual, sino una disciplina de ingeniería continua gobernada por tres principios:

1. **Determinismo y Cero Flakiness:** Erradicación total de esperas basadas en tiempo (`page.waitForTimeout()`). Toda sincronización espera estados explícitos de la interfaz o de red (`toBeVisible()`, `waitFor()`).
2. **Locators Semánticos y Accesibles:** Prioridad absoluta a selectores basados en roles ARIA (`getByRole`) y etiquetas accesibles (`getByLabel`). Si la interfaz pierde accesibilidad, las pruebas fallan automáticamente.
3. **Aislamiento Absoluto de Datos:** Cada prueba genera dinámicamente credenciales y recursos únicos (`nuevoUsuario()`), permitiendo ejecuciones idempotentes sin necesidad de limpiar la base de datos entre casos.

---

## 2. Diagrama de la Pirámide de Automatización Integral

```mermaid
flowchart TD
    subgraph Pyramid["Pirámide de Calidad de Software"]
        direction TB

        L4["🔝 Capa E2E & Accesibilidad UI (Playwright POM + Axe Core)<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>• 32 pruebas automatizadas en Chromium<br/>• Page Object Model estructurado (AuthPage, TareasPage)<br/>• Auditorías de Accesibilidad WCAG 2.1 AA con @axe-core/playwright<br/>• Locators orientados a accesibilidad (getByRole, getByLabel)<br/>• Aislamiento determinista de datos por usuario único"]

        L3["⚡ Capa de Resiliencia de Red & Simulación de Caos (Chaos Testing)<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>• Intercepción de tráfico de red (page.route())<br/>• Simulación de conectividad degradada y modo offline<br/>• Sincronización asíncrona sin timeouts fijos (eliminación de esperas frágiles)<br/>• Detección de UI asíncrona no optimista y condiciones de carrera"]

        L2["🔌 Capa de Contrato & Integración de API (Postman + Newman Runner)<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>• 25 peticiones HTTP organizadas en 4 carpetas funcionales<br/>• 96 aserciones de contrato, tipos y esquemas (100% aprobadas)<br/>• Verificación de seguridad JWT y RBAC sin interfaz gráfica<br/>• Runner configurable con Newman y reportes ejecutivos HTML interactivos"]

        L1["🛡️ Base de Metacalidad & Pruebas Unitarias (Vigía + Vitest / Jest)<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>• Auditoría AST de suites de prueba con Vigía (prevención de falsos positivos)<br/>• Pruebas unitarias de algoritmos y Casos de Uso puros de dominio<br/>• Suites de regresión automáticas para 14 defectos reales documentados<br/>• Trazabilidad completa entre bugs, planes de prueba y pruebas automáticas"]

        L4 --- L3
        L3 --- L2
        L2 --- L1
    end

    subgraph CI_Execution["Orquestación en CI/CD (GitHub Actions)"]
        W_API["ci-api-postman.yml<br/>(Pruebas de Contrato API en CI)"]
        W_E2E["ci-e2e.yml<br/>(Playwright E2E y Axe A11y en CI)"]
        W_Vigia["ci-vigia.yml<br/>(Auditoría AST en PRs)"]
        W_Bugs["ci-verificacion-bugs.yml<br/>(Verificación de No-Regresión)"]
    end

    L2 -.-> W_API
    L4 -.-> W_E2E
    L1 -.-> W_Vigia
    L1 -.-> W_Bugs

    classDef top fill:#991b1b,stroke:#dc2626,stroke-width:2px,color:#fff;
    classDef midHigh fill:#c2410c,stroke:#ea580c,stroke-width:2px,color:#fff;
    classDef mid fill:#0369a1,stroke:#0284c7,stroke-width:2px,color:#fff;
    classDef base fill:#166534,stroke:#15803d,stroke-width:2px,color:#fff;
    classDef ci fill:#4338ca,stroke:#6366f1,stroke-width:2px,color:#fff;

    class L4 top;
    class L3 midHigh;
    class L2 mid;
    class L1 base;
    class W_API,W_E2E,W_Vigia,W_Bugs ci;
```

---

## 3. Patrón Page Object Model (POM) en Playwright

Para evitar la duplicación de selectores y permitir que las pruebas se redacten en términos de intenciones de negocio, la interacción con la aplicación se encapsula en Page Objects modulares:

```
automatizacion-e2e/
├── pages/
│   ├── AuthPage.js           # Encapsula selectores y acciones de Login / Registro
│   ├── TareasPage.js         # Encapsula selectores y acciones de la lista de tareas
│   └── index.js              # Barrel de exportación unificado
├── tests/
│   ├── accesibilidad.spec.js # Auditorías A11y con @axe-core/playwright (WCAG 2.1 AA)
│   ├── autenticacion.spec.js # Flujos de registro, login, credenciales inválidas
│   ├── tareas.spec.js        # CRUD completo de tareas y aislamiento de usuarios
│   ├── regresiones-ui.spec.js# Verificación de corrección de bugs documentados
│   └── fixtures/
│       └── a11y.js           # Fixture reutilizable inyectando AxeBuilder configurado
```

### Ejemplo de Prueba Orientada a Intención
```javascript
test('crea una tarea y verifica el contador reactivo', async () => {
  await tareasPage.agregarTarea('Escribir el plan de pruebas');
  await expect(tareasPage.obtenerTarea('Escribir el plan de pruebas')).toBeVisible();
  await tareasPage.esperarContador('1 pendiente');
});
```

---

## 4. Auditorías Automatizadas de Accesibilidad (WCAG 2.1 AA)

Mediante `@axe-core/playwright`, cada pantalla clave se audita automáticamente contra las directrices de accesibilidad web:

```javascript
const resultados = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

expect(resultados.violations).toEqual([]);
```

### Criterios Validados Automáticamente:
- **WCAG 1.4.3 (Contraste Mínimo):** Relación de contraste $\ge 4.5:1$ en texto normal y $\ge 3:1$ en componentes gráficos y estados de foco.
- **WCAG 1.3.1 & 4.1.2 (Estructura Semántica y Roles ARIA):** Presencia de regiones `main`, títulos jerárquicos `h1`, mensajes de error con `role="alert"` y atributos `aria-label` en controles interactivos.
- **WCAG 2.1.1 (Navegación por Teclado):** Operabilidad 100% mediante teclado con indicadores de foco visibles (`outline`).

---

## 5. Pruebas de Contrato de API y Simulación de Caos en Red

### 5.1 Automatización con Newman
La suite de pruebas de API (`pruebas-api-postman`) ejecuta 25 peticiones HTTP y 96 aserciones que validan:
- Códigos de estado HTTP y encabezados `Content-Type`.
- Contratos de payload JSON mediante validación estricta de esquemas.
- Autenticación con JWT, vencimiento de tokens y aislamiento multi-tenant.
- Reportes ejecutivos interactivos generados con `newman-reporter-htmlextra`.

### 5.2 Simulación de Red y Caos (Network Chaos)
Mediante `page.route()` de Playwright, se simulan condiciones adversas de red:
- **Latencia Artificial (Throttling):** Validación de que la UI mantenga estados de carga visuales y no bloquee el hilo principal.
- **Modo Offline & Abort:** Demostración de que la aplicación maneja fallos de red con mensajes claros y no queda en estado bloqueado.
- **Manejo de Respuestas Lentas:** Detección de que el checkbox de tareas en la aplicación bajo prueba es asíncrono y requiere confirmación de la API antes de cambiar de estado en pantalla.
