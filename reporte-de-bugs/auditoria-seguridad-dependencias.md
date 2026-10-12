# Auditoría de Seguridad, Hardening y Análisis de Dependencias

**Autor:** Eduardo Maytorena <eduardo_maytorenar@outlook.com>  
**Fecha de Auditoría:** Octubre 2026  
**Ámbito de Evaluación:** Repositorios del Portafolio Profesional  
- `gastos` (React Native / Expo SDK 57 / Supabase / SQLite)
- `reservas` (Next.js 16 / React 19 / Drizzle ORM / Supabase Postgres)
- `vigia` (GitHub Action Composite / TypeScript CLI / Jest)
- `automatizacion-e2e` (Playwright E2E / Axe-Core / Node 22)

---

## 1. Resumen Ejecutivo

Se realizó una auditoría integral de seguridad, higiene de credenciales y análisis de dependencias de terceros sobre los 4 repositorios que conforman el portafolio profesional de Eduardo Maytorena.

El objetivo fue identificar vulnerabilidades conocidas en la cadena de suministro de software (software supply chain), verificar la exposición accidental de secretos o llaves de API en código y control de versiones, validar la cobertura de directivas `.gitignore`, y establecer recomendaciones de endurecimiento (*hardening*) tanto a nivel de código como de canalizaciones de integración continua (CI/CD).

### Matriz Comparativa General

| Repositorio | Stack Tecnológico | `npm audit` (Crítica / Alta / Media) | Secretos Expuestos en Git | Cobertura `.gitignore` (.env) | Postura de Seguridad Global |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **gastos** | Expo 57, React Native 0.86, Supabase, SQLite | **2** / **44** / **16** (Total: 62) | **Ninguno** (0 commits con secretos) | ✅ Completa (`.env*`, `!.env.example`) | **Buena** (RLS estricto, vulnerabilidades acotadas al tooling de compilación) |
| **reservas** | Next.js 16, React 19, Drizzle ORM, Postgres | **0** / **5** / **4** (Total: 9) | **Ninguno** (0 commits con secretos) | ✅ Completa (`.env*`, `!.env.example`) | **Buena** (ORM parametrizado, sin fugas de credenciales) |
| **vigia** | Node.js CLI, GitHub Action, Jest, TypeScript | **1** / **30** / **5** (Total: 36) | **Ninguno** (0 commits con secretos) | ⚠️ **Incompleta** (Falta `.env*` en `.gitignore`) | **Aceptable** (Runtime sin dependencias externas, CI seguro con `--ignore-scripts`) |
| **automatizacion-e2e** | Playwright 1.49, Axe-Core Playwright | **0** / **0** / **0** (Total: 0) | **Ninguno** (0 commits con secretos) | ⚠️ **Incompleta** (Falta `.env*` en `.gitignore`) | **Excelente** (Cadena de dependencias limpia; credenciales sintéticas aisladas) |

---

## 2. Metodología de Análisis

La auditoría se ejecutó aplicando las siguientes técnicas y herramientas automatizadas y manuales:

1. **Auditoría de Dependencias (`npm audit`):**
   - Ejecución de `npm audit` con nivel `--audit-level=low` sobre los árboles de dependencias resueltos en `package-lock.json`.
   - Clasificación por criticidad y análisis de transitividad (diferenciación entre dependencias de producción vs. dependencias exclusivas de build/desarrollo).
   - Evaluación del impacto de remediaciones automáticas (`npm audit fix` vs. `npm audit fix --force`).

2. **Detección Estática de Secretos y Tokens:**
   - Rastreo en todo el árbol de archivos mediante expresiones regulares especializadas para firmas de proveedores:
     - Claves públicas y secretas de Supabase (`sb_publishable_*`, `sb_secret_*`).
     - Tokens personales de GitHub (`ghp_*`, `github_pat_*`).
     - Claves de OpenAI (`sk-*`).
     - Cadenas de conexión PostgreSQL con contraseñas (`postgresql://user:pass@host`).
     - Claves criptográficas privadas (`BEGIN PRIVATE KEY`).
     - Tokens JWT codificados (`eyJ...`).
   - Escaneo de historial completo de Git (`git log --all --full-history`) para detectar archivos `.env*` previamente introducidos y borrados posteriormente.

3. **Revisión de Control de Acceso y Arquitectura de Datos:**
   - Análisis de migraciones SQL en Supabase (`gastos`) para verificar la presencia y rigor de políticas *Row Level Security* (RLS).
   - Inspección de configuración de clientes de base de datos (Next.js/Drizzle en `reservas`) y cifrado en tránsito (TLS/SSL).

4. **Auditoría de Canales de CI/CD (GitHub Actions):**
   - Inspección de flujos en `.github/workflows/` para verificar el manejo de tokens (`GITHUB_TOKEN`, secretos de Expo), uso de scripts remotos no fijados, inyección de comandos en shell scripts y directivas seguras de instalación (`npm ci` vs. `npm install`, `--ignore-scripts`).

---

## 3. Resultados Detallados por Repositorio

---

### 3.1. Repositorio: `gastos`
*Ruta: `C:\Users\Eduardomr\PortafolioProfesional\gastos`*

#### A. Análisis de Dependencias
- **Resultado `npm audit`:** 62 vulnerabilidades identificadas (2 Críticas, 44 Altas, 16 Medias).
- **Vulnerabilidades Críticas:**
  - `handlebars` (4.0.0 - 4.7.9): Inyección de código JavaScript arbitrario a través de inserción no segura de plantillas precompiladas y confusión de tipos en AST ([GHSA-xw65-4hp5-5hc7](https://github.com/advisories/GHSA-xw65-4hp5-5hc7), [GHSA-8r5x-fm3f-whwj](https://github.com/advisories/GHSA-8r5x-fm3f-whwj), [GHSA-p8wg-vrv2-v86f](https://github.com/advisories/GHSA-p8wg-vrv2-v86f)).
  - `shell-quote` (1.8.4 - 1.10.0): Inyección de comandos en `quote()` mediante terminadores de línea tras tokens de comentario ([GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv)).
- **Vulnerabilidades Altas Relevantes:**
  - `node-forge` (*): Aceptación indebida de elementos adicionales en verificación de firmas RSA PKCS#1 v1.5 ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)). Introducida por `@expo/code-signing-certificates` -> `@expo/cli`.
  - `source-map-js` (1.0.0 - 1.2.1): Denegación de servicio (DoS) del event-loop por índices anómalos de mapeo de fuentes ([GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)).
  - `micromatch` / `braces`: DoS por agotamiento de pila en la suite de pruebas Jest y el empaquetador Metro.
- **Evaluación de Explotabilidad:**
  - Todas las vulnerabilidades críticas y altas provienen de herramientas de empaquetado (`metro`, `@expo/cli`) y testing (`jest`), no del runtime móvil final empacado en el APK.
  - **Advertencia contra `npm audit fix --force`:** Ejecutar `--force` degradaría el paquete `expo` a la versión `44.0.6` (versión obsoleta), lo cual destruiría la arquitectura de la aplicación configurada en Expo SDK 57 y React Native 0.86.

#### B. Gestión de Secretos y Variables de Entorno
- **Hallazgo:** Existe en disco el archivo `.env.supabase` conteniendo:
  - `EXPO_PUBLIC_SUPABASE_URL=https://uhuwmkexjyxxxlullvna.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_15T9HV6nR2G09GL6Cp2YiA_E6hlxSvE`
- **Análisis de Riesgo:**
  - El prefijo `EXPO_PUBLIC_` indica que estos valores están diseñados para ser compilados dentro del cliente móvil. La clave anónima (`anon key`) de Supabase es pública por diseño y carece de privilegios administrativos.
  - La directiva `.gitignore` del repositorio incluye explícitamente `.env*` y `!.env.example`.
  - El historial de Git (`git log`) confirmó que `.env.supabase` jamás ha sido commiteado.
  - El archivo de log local `.expo/dev/logs/start.log` registra la anon key; dicho directorio `.expo/` se encuentra debidamente ignorado por Git.
  - El script local `scripts/db-pull.mjs` extrae copias de la base SQLite del emulador hacia `.local/gastos.db`, carpeta también excluida del repositorio en `.gitignore`.

#### C. Postura de Seguridad en Base de Datos (Supabase RLS)
- En `supabase/migrations/0001_initial.sql`:
  - Se valida la activación explícita de RLS:
    ```sql
    alter table public.expenses enable row level security;
    alter table public.categories enable row level security;
    ```
  - Las políticas restringen inserción, lectura y modificación estrictamente al propietario del registro:
    ```sql
    create policy "cada usuario ve solo sus gastos"
      on public.expenses for select to authenticated
      using (auth.uid() = user_id);
    ```
  - Las funciones `public.sync_expense` y `public.pull_changes` están definidas con `security invoker`, garantizando que se ejecuten con los permisos del usuario que invoca la función y no con privilegios elevados del creador de la base de datos (`security definer`).

#### D. Canalización CI/CD
- En `.github/workflows/ci.yml`:
  - Se utiliza `npm ci` para garantizar compilaciones reproducibles.
  - El token `EXPO_TOKEN` se consume mediante secretos seguros de GitHub (`${{ secrets.EXPO_TOKEN }}`).
  - *Oportunidad de Hardening:* La instalación de Maestro en la línea 69 ejecuta `curl -Ls "https://get.maestro.mobi" | bash`. En entornos empresariales se recomienda validar la suma criptográfica o descargar una versión fija para mitigar ataques de redirección o alteración de script.

---

### 3.2. Repositorio: `reservas`
*Ruta: `C:\Users\Eduardomr\PortafolioProfesional\reservas`*

#### A. Análisis de Dependencias
- **Resultado `npm audit`:** 9 vulnerabilidades identificadas (0 Críticas, 5 Altas, 4 Medias).
- **Vulnerabilidades Altas:**
  - `braces` (*): Agotamiento de pila vía patrones anidados complejos ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)), en la cadena `eslint-config-next` -> `@next/eslint-plugin-next` -> `fast-glob` -> `micromatch`.
- **Vulnerabilidades Medias:**
  - `esbuild` (<=0.24.2): Servidor local de desarrollo permite a sitios web enviar peticiones y leer respuestas ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)), en la cadena `drizzle-kit` -> `@esbuild-kit/esm-loader` -> `@esbuild-kit/core-utils`.
- **Evaluación de Explotabilidad:**
  - Se limitan al entorno de linting y ejecución de migraciones en desarrollo (`drizzle-kit`). No impactan la seguridad del servidor de producción de Next.js.
  - `npm audit fix --force` no debe ejecutarse, ya que intentaría forzar `eslint-config-next@14.2.35` y `drizzle-kit@0.18.1`, incompatibles con Next.js 16.4.0 y React 19.

#### B. Gestión de Secretos y Variables de Entorno
- **Hallazgo:** Existe en disco el archivo `.env.local` con contenido:
  ```text
  DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.uphypddtgnbsngltdivl.supabase.co:5432/postgres
  ```
- **Análisis de Riesgo:**
  - La contraseña no está presente (contiene el marcador de posición `[YOUR-PASSWORD]`), protegiendo el acceso a la base de datos de producción.
  - El archivo está ignorado en `.gitignore` (`.env*`, `!.env.example`) y nunca ha sido commiteado en Git.
  - En `src/shared/lib/supabase.ts`, se detectó un valor de reserva (*fallback*) directo al host del proyecto:
    ```typescript
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uphypddtgnbsngltdivl.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";
    ```
    *Riesgo:* Aunque la clave es ficticia (`dummy-anon-key`), incluir la URL real de Supabase como fallback predeterminado en el código puede dirigir peticiones fallidas o de pruebas locales contra la infraestructura de producción.

#### C. Conexión de Base de Datos y Parámetros
- En `src/db/index.ts`:
  ```typescript
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString, { prepare: false });
  export const db = drizzle(client, { schema });
  ```
  - *Oportunidad de Hardening:* Se recomienda forzar `ssl: 'require'` de manera explícita en las opciones del cliente `postgres()`, asegurando que la conexión al pooler de Supabase rechace enlaces no cifrados por error de configuración de la URI.

#### D. Canalización CI/CD
- **Hallazgo:** El repositorio `reservas` carece de directorio `.github/` y no cuenta con un workflow de CI configurado para ejecutar automáticamente `npm run lint`, `npm run typecheck` ni `npm test`.

---

### 3.3. Repositorio: `vigia`
*Ruta: `C:\Users\Eduardomr\PortafolioProfesional\vigia`*

#### A. Análisis de Dependencias
- **Resultado `npm audit`:** 36 vulnerabilidades identificadas (1 Crítica, 30 Altas, 5 Medias).
- **Vulnerabilidad Crítica:**
  - `handlebars` (4.0.0 - 4.7.9): Inyección de código JavaScript ([GHSA-xw65-4hp5-5hc7](https://github.com/advisories/GHSA-xw65-4hp5-5hc7)).
- **Vulnerabilidades Altas:**
  - `micromatch` / `braces` en el framework de pruebas Jest.
- **Aislamiento Arquitectónico:**
  - El paquete `vigia` es una GitHub Action y CLI. Su archivo `package.json` **no tiene dependencias en `"dependencies"`** (todas son `"devDependencies"`).
  - El artefacto distribuido `dist/cli.js` es código JavaScript puro generado por el compilador `tsc` sin arrastrar módulos vulnerables de terceros a producción.
  - Ejecutar `npm audit fix` resuelve la vulnerabilidad crítica de `handlebars` de manera limpia y sin romper dependencias.

#### B. Gestión de Secretos y `.gitignore`
- **Hallazgo Crítico de Configuración:** El archivo `vigia/.gitignore` únicamente contiene:
  ```gitignore
  node_modules/
  dist/
  coverage/
  *.log
  ```
  **Falta la exclusión de `.env*` o variables de entorno.**
- **Riesgo:** Si un colaborador o script crea un archivo `.env` para pruebas locales de la CLI, Git no lo ignorará y existe alto riesgo de que sea agregado al repositorio mediante `git add .`.

#### C. Seguridad en GitHub Action (`action.yml` y CI)
- **Aspectos Positivos:**
  - En `action.yml`, el paso de compilación ejecuta `npm ci --ignore-scripts`, lo que neutraliza la ejecución de código malicioso contenido en scripts de ciclo de vida (`preinstall`, `postinstall`).
  - La acción se auto-analiza (dogfooding) e integra escaneo estático de seguridad mediante exportación de reportes SARIF a GitHub Code Scanning.
- **Oportunidades de Hardening:**
  - En `action.yml` (pasos de análisis), las variables `$LIST` y `$SRC` se evalúan sin comillas en el intérprete de comandos bash (`node cli.js $SRC --files $LIST`). Rutas con espacios podrían provocar comportamiento imprevisto.

---

### 3.4. Repositorio: `automatizacion-e2e`
*Ruta: `C:\Users\Eduardomr\PortafolioProfesional\automatizacion-e2e`*

#### A. Análisis de Dependencias
- **Resultado `npm audit`:** **0 vulnerabilidades encontradas**.
- El proyecto mantiene dependencias mínimas y modernas (`@playwright/test@^1.49.0` y `@axe-core/playwright@^4.13.0`), con árbol de dependencias completamente limpio.

#### B. Gestión de Secretos y `.gitignore`
- **Hallazgo:** El archivo `.gitignore` sólo excluye:
  ```gitignore
  node_modules/
  test-results/
  playwright-report/
  playwright/.cache/
  ```
  **No contiene directivas para ignorar `.env` ni `.env.*`.**
- En `playwright.config.js`, se lee `process.env.APP_URL`. Si se parametriza mediante un archivo de entorno en el futuro, no estará protegido.
- En `tests/helpers.js`, se genera un usuario aleatorio con credenciales de prueba (`e2e-${marca}@prueba.com` / `password: 'secret123'`). El patrón es seguro para pruebas automatizadas locales/efímeras.

#### C. Canalización CI/CD (`ci-e2e.yml`)
- En el workflow raíz `.github/workflows/ci-e2e.yml`:
  - En las líneas 37, 44 y 52 se invoca `npm install` en lugar de `npm ci`.
  - *Riesgo:* `npm install` en servidores de CI puede resolver versiones menores imprevistas o alterar el árbol de dependencias, comprometiendo el determinismo del pipeline. Debe estandarizarse el uso de `npm ci`.

---

## 4. Matriz Consolidada de Hallazgos y Severidad

| ID | Repositorio | Categoría | Descripción del Hallazgo | Severidad | Impacto | Estado / Remediación |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **SEC-001** | `vigia` | Configuración Git | Ausencia de reglas `.env*` en `.gitignore` | **Alta** | Posible exposición inadvertida de secretos si se crean archivos `.env` locales. | **Abierto:** Añadir `.env*` y `!.env.example` a `.gitignore`. |
| **SEC-002** | `automatizacion-e2e` | Configuración Git | Ausencia de reglas `.env*` en `.gitignore` | **Media** | Exposición de endpoints o tokens de prueba si se agrega archivo de entorno local. | **Abierto:** Añadir `.env*` a `.gitignore`. |
| **SEC-003** | `gastos` | Dependencias | 2 vulnerabilidades críticas (`handlebars`, `shell-quote`) en tooling | **Media** | Afecta herramientas de build/CLI (`metro`, `jest`), no el bundle APK de producción. | **Mitigable:** Ejecutar `npm audit fix` o fijar *overrides* sin `--force`. |
| **SEC-004** | `vigia` | Dependencias | 1 vulnerabilidad crítica (`handlebars`) en devDependencies | **Media** | Acotada a Jest durante desarrollo; runtime compilado no posee dependencias externas. | **Mitigable:** Ejecutar `npm audit fix`. |
| **SEC-005** | `reservas` | Arquitectura / Código | URL real de Supabase como fallback en código fuente (`supabase.ts`) | **Baja** | Conexiones erróneas o ruido en métricas de producción si no se define la variable de entorno. | **Abierto:** Eliminar URL hardcodeada y exigir variable de entorno obligatoria. |
| **SEC-006** | `reservas` | Configuración DB | Conexión PostgreSQL en `db/index.ts` sin parámetro explícito de SSL | **Baja** | Riesgo de transmisión en texto plano si la URI apunta por error a un host no cifrado. | **Abierto:** Configurar `{ ssl: 'require' }` en cliente `postgres()`. |
| **SEC-007** | `reservas` | CI/CD | Inexistencia de pipeline de Integración Continua (CI) en GitHub Actions | **Baja** | Ausencia de verificación automática de lint, types y tests en Pull Requests. | **Abierto:** Crear workflow `.github/workflows/ci.yml`. |
| **SEC-008** | `PortafolioProfesional` | CI/CD | Uso de `npm install` en lugar de `npm ci` en `.github/workflows/ci-e2e.yml` | **Baja** | Falta de determinismo en versiones instaladas durante la ejecución del pipeline. | **Abierto:** Reemplazar `npm install` por `npm ci`. |
| **SEC-009** | `gastos` | CI/CD | Instalación de binario de pruebas mediante `curl | bash` en `ci.yml` | **Informativa** | Riesgo de cadena de suministro ante secuestro de dominio o CDN externo. | **Recomendación:** Fijar versión con checksum verificado. |

---

## 5. Plan de Remediación y Hardening

### Fase 1: Remediación Inmediata de Configuración y Git (P1)

#### 1. Endurecimiento de `.gitignore` en `vigia`
Actualizar `C:\Users\Eduardomr\PortafolioProfesional\vigia\.gitignore`:
```gitignore
node_modules/
dist/
coverage/
*.log

# Variables de entorno y secretos locales
.env
.env.*
!.env.example
```

#### 2. Endurecimiento de `.gitignore` en `automatizacion-e2e`
Actualizar `C:\Users\Eduardomr\PortafolioProfesional\automatizacion-e2e\.gitignore`:
```gitignore
node_modules/
test-results/
playwright-report/
playwright/.cache/

# Variables de entorno
.env
.env.*
!.env.example
```

---

### Fase 2: Remediación de Dependencias Críticas (P2)

#### 1. En `vigia`:
Ejecutar la corrección automática no destructiva:
```bash
cd C:\Users\Eduardomr\PortafolioProfesional\vigia
npm audit fix
```
Esto actualiza la dependencia de `handlebars` cerrando la vulnerabilidad crítica sin introducir cambios de ruptura.

#### 2. En `gastos`:
Aplicar directivas de resolución segura en `package.json` mediante el campo `overrides`, evitando `npm audit fix --force`:
```json
{
  "overrides": {
    "schema-utils": {
      "ajv": "^8.17.1"
    },
    "handlebars": "^4.7.9",
    "shell-quote": "^1.8.2"
  }
}
```

---

### Fase 3: Endurecimiento de Código y Conexiones (P3)

#### 1. En `reservas/src/shared/lib/supabase.ts`:
Hacer obligatoria la definición de variables de entorno para evitar fallback silencioso a infraestructura de producción:
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Faltan las variables de entorno de Supabase en producción.");
  }
}

export const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "dummy-anon-key"
);
```

#### 2. En `reservas/src/db/index.ts`:
Asegurar cifrado forzoso en la conexión de base de datos:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const isProd = process.env.NODE_ENV === "production";

const client = postgres(connectionString, {
  prepare: false,
  ssl: isProd ? "require" : false,
});

export const db = drizzle(client, { schema });
```

---

### Fase 4: Endurecimiento de Integración Continua (P4)

#### 1. Estandarización de `npm ci` en `ci-e2e.yml`:
Modificar `.github/workflows/ci-e2e.yml` sustituyendo los comandos `npm install` por:
```yaml
run: npm ci
```

#### 2. Adición de pipeline de CI para `reservas`:
Crear `.github/workflows/ci.yml` en `reservas` con etapas de linting, tipado estático, pruebas y auditoría preventiva:
```yaml
name: CI Reservas
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - name: Auditoría de dependencias críticas
        run: npm audit --audit-level=critical
```

---

## 6. Dictamen Final de Seguridad

Los cuatro proyectos evaluados muestran un estándar sólido de higiene de seguridad:
- **Cero fugas de credenciales en el historial de Git.**
- **Correcto uso de RLS en bases de datos relacionales vinculadas a Supabase.**
- **Aislamiento de vulnerabilidades de librerías dentro de la fase de desarrollo/empaquetado.**

La aplicación de las recomendaciones descritas (especialmente la actualización de directivas `.gitignore` en `vigia` y `automatizacion-e2e`, junto con la estandarización de `npm ci` y el reemplazo de fallbacks hardcodeados) elevará la postura de seguridad del portafolio al nivel recomendado para entornos de producción.
