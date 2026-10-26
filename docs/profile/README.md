<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/header-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/header-light.svg">
  <img alt="Eduardo Maytorena - Software Engineer | Fullstack & QA Automation" src="./assets/header-dark.svg" width="100%">
</picture>

<br/>

[![GitHub Profile](https://img.shields.io/badge/GitHub-Eduardomr1-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Eduardomr1)
[![Email](https://img.shields.io/badge/Contact-eduardo__maytorenar%40outlook.com-0078D4?style=for-the-badge&logo=microsoftoutlook&logoColor=white)](mailto:eduardo_maytorenar@outlook.com)
[![Location](https://img.shields.io/badge/Location-Culiac%C3%A1n%2C%20Sinaloa%20(MST)-0ea5e9?style=for-the-badge&logo=googlemaps&logoColor=white)](https://maps.google.com)
[![Status](https://img.shields.io/badge/Status-Open%20to%20Work%20(Remote%20%7C%20Hybrid%20%7C%20On--site)-10b981?style=for-the-badge)](mailto:eduardo_maytorenar@outlook.com)

<br/>

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode%20(0%25%20Any)-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%7C%20Offline--First%20%7C%20Feature--First-4338ca)](https://github.com/Eduardomr1)
[![QA Standard](https://img.shields.io/badge/QA%20Standard-Zero%20Flaky%20Tests-059669?logo=playwright&logoColor=white)](https://github.com/Eduardomr1/proyectos-de-qa)
[![A11y](https://img.shields.io/badge/A11y-WCAG%202.1%20AA%20Compliant-0284c7)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Static Analysis](https://img.shields.io/badge/Static%20Analysis-TypeScript%20AST%20%7C%20SARIF%20v2.1.0-7c3aed)](https://github.com/Eduardomr1/vigia)

</div>

---

## 👨‍💻 About Me

I work in **software engineering & quality assurance** and build the applications I test. I come from the side that breaks systems, and that changes how I design and write code: every non-trivial piece leaves a test that covers it, and limitations are written down and benchmarked instead of discovered in production.

My engineering philosophy: **quality, reliability, and accessibility are not late-stage checkboxes or reactive fixes; they are foundational architectural invariants**. I enforce this through strict typing (0% `any`), abstract syntax tree (**AST**) static analysis, deterministic contract testing, automated accessibility audits (**WCAG 2.1 AA**), and zero-flakiness **CI/CD** pipelines.

---

## 🔄 The Full Engineering Cycle: Break, Report, Fix, Verify

> *"Find the defect with evidence, design the architectural fix, prove resolution with a regression test."*

My repositories are intentionally interconnected to demonstrate the complete lifecycle of software:
1. **The Application:** Built with strict contracts, clean separation of concerns, and defensive data modeling.
2. **The QA Framework:** Stress-tests the application via automated E2E suites, network chaos simulations, and contract assertions.
3. **The Proof:** Deficiencies discovered during exploratory testing (such as case-sensitive login lockouts, un-optimistic UI toggles, or floating-point rounding errors) aren't just patched—they leave behind permanent automated regression tests and architectural documentation preventing their recurrence.

---

## 🚀 Featured Projects & Systems

### 🛠️ Developer Tooling, AST Linters & AI Security

#### 1. 🛡️ [Vigía](https://github.com/Eduardomr1/vigia) · TypeScript AST Linter & GitHub Action
> **Static analysis tool built on the TypeScript Compiler API that audits test suites to eradicate hollow tests, false positives, and orphaned assertions.**

[![TypeScript](https://img.shields.io/badge/TypeScript-Compiler%20API-3178C6?logo=typescript&logoColor=white)](https://github.com/Eduardomr1/vigia)
[![GitHub Action](https://img.shields.io/badge/CI%2FCD-GitHub%20Action-2088FF?logo=githubactions&logoColor=white)](https://github.com/Eduardomr1/vigia)
[![SARIF](https://img.shields.io/badge/Standard-OASIS%20SARIF%20v2.1.0-8b5cf6)](https://sarifweb.azurewebsites.net/)
[![Tests](https://img.shields.io/badge/Tests-129%20Passed-059669)](https://github.com/Eduardomr1/vigia)

* **Semantic AST Traversal:** Inspects real call expressions across Jest, Vitest, Playwright, and Cypress rather than relying on brittle regex pattern matching.
* **8 Critical Diagnostic Rules:** Detects tests without assertions, orphaned `expect()` calls without matchers, asynchronous promises missing `await`, silent `try/catch` assertion swallows, and literal tautologies (`expect(true).toBe(true)`).
* **Orphan Selector Detection:** Cross-checks negative assertions (`queryByTestId`) against production codebase IDs to catch tests passing due to typos rather than real logic.
* **GitHub Code Scanning:** Exports native *OASIS SARIF v2.1.0* reports for automated inline Pull Request annotations and diff-only checks.

#### 2. 🤖 [AgentGuard](https://github.com/Eduardomr1/agentguard) · LLM Prompt & Output Security Auditor
> **Lightweight CLI and TypeScript library designed to safeguard LLM interactions against prompt injection attacks, secret/PII exfiltration, and schema non-compliance.**

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Node.js-3178C6?logo=typescript&logoColor=white)](https://github.com/Eduardomr1/agentguard)
[![Security](https://img.shields.io/badge/Security-Prompt%20Injection%20%7C%20PII%20Auditing-red)](https://github.com/Eduardomr1/agentguard)
[![CLI](https://img.shields.io/badge/Interface-CLI%20%2B%20Library-informational)](https://github.com/Eduardomr1/agentguard)

* **Prompt Injection Detection:** Multi-pattern behavioral and delimiter analysis identifying jailbreaks, system-prompt override attempts, and instruction hijackings.
* **PII & Credential Scrubbing:** Real-time regex and entropy scanning targeting API keys, tokens, emails, phone numbers, and payment details before hitting model inference.
* **Structured Output Validation:** Validates generative LLM payloads strictly against pre-defined JSON Schemas, guaranteeing reliable backend downstream ingestion.

---

### ⚡ Systems Engineering, High Performance & Observability

#### 3. 💾 [RESP Key-Value Store](https://github.com/Eduardomr1/resp-kv-store) · In-Memory Engine (Redis Compatible)
> **Zero-dependency, production-grade in-memory key-value database engine implementing the Redis Serialization Protocol (RESP2) over TCP sockets in TypeScript.**

[![TypeScript](https://img.shields.io/badge/TypeScript-Node.js%2022-3178C6?logo=typescript&logoColor=white)](https://github.com/Eduardomr1/resp-kv-store)
[![Protocol](https://img.shields.io/badge/Protocol-RESP2%20Compatible-DC382D?logo=redis&logoColor=white)](https://github.com/Eduardomr1/resp-kv-store)
[![Throughput](https://img.shields.io/badge/Throughput-35%2C000%2B%20ops%2Fsec-10b981)](https://github.com/Eduardomr1/resp-kv-store)
[![Tests](https://img.shields.io/badge/Tests-127%20Passed%20(17%20Suites)-059669)](https://github.com/Eduardomr1/resp-kv-store)

* **Polymorphic In-Memory Storage:** Full support for Strings, Lists, Hashes, Sets, and Sorted Sets powered by custom probabilistic **SkipList** and dictionary structures.
* **Durability & Snapshots:** Append-Only File (**AOF**) with atomic background rewriting (`BGREWRITEAOF`), along with point-in-time **RDB binary serialization** with CRC64 checksum integrity.
* **Advanced Engine Capabilities:** ACID-like transactions (`MULTI`/`EXEC`/`WATCH`), pub/sub messaging hub, master-replica replication with ring-buffer backlog (`PSYNC2`), probabilistic **HyperLogLog** cardinality, and big-endian Bitmaps.
* **Deterministic Eviction:** Configurable memory governor supporting LRU, Morris probabilistic LFU with temporal decay, and volatile-TTL pool sampling.

#### 4. 📡 [PulseTrack](https://github.com/Eduardomr1/pulsetrack) · API Observability & Uptime Engine
> **Real-time API uptime, latency & health observability platform featuring Clean Architecture, Next.js 15, Drizzle ORM, and SRE error budget telemetry.**

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle%20ORM-PostgreSQL-C5F74F?logoColor=black)](https://orm.drizzle.team/)
[![Latency](https://img.shields.io/badge/Telemetry-P50%20%7C%20P90%20%7C%20P99-blueviolet)](https://github.com/Eduardomr1/pulsetrack)
[![SRE](https://img.shields.io/badge/SRE-Error%20Budgets%20%26%20SLOs-10b981)](https://github.com/Eduardomr1/pulsetrack)

* **Distributed Synthetic Probing:** Non-blocking async execution monitoring REST endpoints, response codes, and TLS certificate expiration with sub-millisecond resolution.
* **Statistical Latency Telemetry:** Quantile analysis (P50, P90, P99), jitter computation, and early warning triggers before SLA breaches occur.
* **Flapping Control & Webhook Dispatch:** Intelligent multi-channel alert delivery with hysteresis stabilization windows to eliminate notification fatigue during transient blips.

---

### 📱 Fullstack & Mobile Engineering

#### 5. 📱 [Control de Gastos](https://github.com/Eduardomr1/control-de-gastos) · Offline-First Mobile Engineering
> **High-precision mobile personal finance manager for iOS & Android with synchronous offline mutation queues and 60 FPS native micro-interactions.**

[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Reanimated](https://img.shields.io/badge/Reanimated-60FPS%20Native-9333ea)](https://docs.swmansion.com/react-native-reanimated/)
[![MMKV](https://img.shields.io/badge/Storage-Synchronous%20MMKV-f59e0b)](https://github.com/mrousavy/react-native-mmkv)
[![Coverage](https://img.shields.io/badge/Coverage-98%25%20(186%20Passed)-059669)](https://github.com/Eduardomr1/control-de-gastos)

* **Offline-First Resilience:** In-memory FIFO mutation queue with synchronous disk persistence via *MMKV* that survives OS-level process kills. Synchronizes via idempotent client-side UUIDs to SQLite local cache and PostgreSQL remote via Supabase RPC.
* **Integer Cent Arithmetic:** Eradicates IEEE-754 floating-point rounding errors across all balances by strictly manipulating integer cents (`assertCents`).
* **Deep Dynamic Type Accessibility:** Fluid layout supporting up to 310% system font scaling without container overflow or truncated numerical values.

#### 6. 📅 [AgendaCitas / Reservas](https://github.com/Eduardomr1/agendacitas) · Multi-Tenant Clean Architecture SaaS
> **Appointment booking and resource management SaaS platform featuring strict multi-layer Clean Architecture and a deterministic mathematical anti-collision engine.**

[![Next.js](https://img.shields.io/badge/Next.js-16%20(React%2019)-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3%20Composition%20API-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle%20ORM-PostgreSQL-C5F74F?logoColor=black)](https://orm.drizzle.team/)
[![Architecture](https://img.shields.io/badge/Clean%20Arch-Domain%20%7C%20Data%20%7C%20UI-4338ca)](#)

* **Layered Domain Isolation:** Strict boundary segregation: `Domain` (pure business models and use cases), `Data` (Drizzle ORM repository implementations), and `Presentation` (server/client components).
* **Client/Server Barrel Segregation:** Discrete entry barrels (`index.ts` vs `server.ts`) preventing Node.js server modules, database drivers, or environment secrets from leaking into client bundles.
* **Deterministic Anti-Collision Scheduling:** Algorithmic verification of provider working hours, overlapping appointment windows, and atomic booking slots with semantic domain `Failure` handling.

#### 7. 🔍 [Proyectos de Programación](https://github.com/Eduardomr1/proyectos-de-programacion) · REST API + Inverted Index BM25 Engine
> **JWT authenticated REST API in Node.js/Express, responsive React frontend, and a zero-dependency full-text search engine implementing an Inverted Index with Okapi BM25.**

[![Node.js](https://img.shields.io/badge/Node.js-Express%20REST-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![BM25](https://img.shields.io/badge/Search-BM25%20Inverted%20Index-blueviolet)](#)
[![Performance](https://img.shields.io/badge/Speedup-593x%20vs%20Linear-10b981)](#)

* **BM25 Search Engine:** Custom text tokenizer, stop-word filtering, term-frequency inverted index, and BM25 relevance ranking built from scratch with zero third-party dependencies, benchmarking at up to 593x faster than linear scans.
* **Robust Auth & Security:** Express REST service implementing normalized email handling (case-insensitive login resilience), brute-force attempt throttling, password strength policies, and JWT token authorization.

---

### 🧪 Quality Assurance, Test Automation & Chaos Engineering

#### 8. 🎭 [Proyectos de QA](https://github.com/Eduardomr1/proyectos-de-qa) · Playwright POM, A11y & Network Chaos
> **End-to-end testing framework with Page Object Model, automated accessibility auditing with Axe-Core, and CI-driven API contract tests with Newman.**

[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Automation-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Axe Core](https://img.shields.io/badge/%40axe--core%2Fplaywright-WCAG%202.1%20AA-8b5cf6)](https://www.deque.com/axe/)
[![Newman](https://img.shields.io/badge/Newman-API%20Contracts%20(96%20Assertions)-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)
[![Flakiness](https://img.shields.io/badge/Flakiness-0%25%20(No%20Fixed%20Sleeps)-10b981)](#)

* **Resilient Page Object Model:** Pure encapsulation of DOM locators and workflows into `AuthPage` and `TareasPage`, prioritizing accessible ARIA role selectors (`getByRole`, `getByLabel`).
* **Automated Accessibility Testing:** Runs `@axe-core/playwright` across user flows to enforce WCAG 2.1 AA compliance (contrast ratios, heading hierarchies, keyboard focus management).
* **Network Chaos & Error Simulation:** Mocks backend failures (HTTP 500, 404), network offline cutoffs, and throttled Slow-3G scenarios to verify frontend graceful degradation.
* **Contract Verification:** Newman CLI automation running Postman suites across 25 requests and 96 assertions with rich *htmlextra* reporting in GitHub Actions.

---

## 🛠️ Technology Stack & Toolkit

<table width="100%">
  <thead>
    <tr>
      <th width="25%">Category</th>
      <th width="45%">Technologies & Tools</th>
      <th width="30%">Standards & Focus</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Languages & Runtimes</b></td>
      <td>
        <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
        <img src="https://img.shields.io/badge/JavaScript%20(ESNext)-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
        <img src="https://img.shields.io/badge/Node.js%20%E2%89%A520-339933?style=flat-square&logo=node.js&logoColor=white"/>
        <img src="https://img.shields.io/badge/SQL-336791?style=flat-square&logo=postgresql&logoColor=white"/>
        <img src="https://img.shields.io/badge/PHP%207.4+-777BB4?style=flat-square&logo=php&logoColor=white"/>
      </td>
      <td>Strict TypeScript, 0% <code>any</code>, <code>exactOptionalPropertyTypes</code>, Native ES Modules.</td>
    </tr>
    <tr>
      <td><b>Frontend & Mobile</b></td>
      <td>
        <img src="https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black"/>
        <img src="https://img.shields.io/badge/Next.js%2016-000000?style=flat-square&logo=next.js&logoColor=white"/>
        <img src="https://img.shields.io/badge/React%20Native-61DAFB?style=flat-square&logo=react&logoColor=black"/>
        <img src="https://img.shields.io/badge/Expo%2057-000020?style=flat-square&logo=expo&logoColor=white"/>
        <img src="https://img.shields.io/badge/Vue%203-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white"/>
        <img src="https://img.shields.io/badge/Tailwind%204-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/>
        <img src="https://img.shields.io/badge/Reanimated-9333ea?style=flat-square"/>
      </td>
      <td>Feature-First structure, 60 FPS native animations, Server Actions, $\ge 44$px touch targets.</td>
    </tr>
    <tr>
      <td><b>Backend, Data & Storage</b></td>
      <td>
        <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
        <img src="https://img.shields.io/badge/Redis%20%2F%20RESP-DC382D?style=flat-square&logo=redis&logoColor=white"/>
        <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white"/>
        <img src="https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=flat-square&logoColor=black"/>
        <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white"/>
        <img src="https://img.shields.io/badge/MMKV-F59E0B?style=flat-square"/>
        <img src="https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white"/>
        <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white"/>
      </td>
      <td>Offline-first synchronization, synchronous disk queues, idempotent RPCs, strict schema typing.</td>
    </tr>
    <tr>
      <td><b>Testing & QA Automation</b></td>
      <td>
        <img src="https://img.shields.io/badge/Playwright-45ba4b?style=flat-square&logo=playwright&logoColor=white"/>
        <img src="https://img.shields.io/badge/%40axe--core%2Fplaywright-8B5CF6?style=flat-square"/>
        <img src="https://img.shields.io/badge/Newman%20CLI-FF6C37?style=flat-square&logo=postman&logoColor=white"/>
        <img src="https://img.shields.io/badge/Vitest-FCC72B?style=flat-square&logo=vitest&logoColor=black"/>
        <img src="https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white"/>
        <img src="https://img.shields.io/badge/Maestro-2563EB?style=flat-square"/>
      </td>
      <td>Page Object Model (POM), WCAG 2.1 AA audits, network chaos resilience, 0% flakiness in CI.</td>
    </tr>
    <tr>
      <td><b>Tooling & DevOps</b></td>
      <td>
        <img src="https://img.shields.io/badge/TypeScript%20Compiler%20API-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
        <img src="https://img.shields.io/badge/OASIS%20SARIF%20v2.1.0-7C3AED?style=flat-square"/>
        <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white"/>
        <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"/>
        <img src="https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white"/>
      </td>
      <td>AST static analysis, GitHub Code Scanning SARIF, multi-stage Docker builds, parallel CI workflows.</td>
    </tr>
  </tbody>
</table>

---

## 📊 GitHub Analytics

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-stats.vercel.app/api?username=Eduardomr1&show_icons=true&theme=tokyonight&hide_border=true&bg_color=0d1117&title_color=38bdf8&icon_color=60a5fa&text_color=94a3b8">
  <source media="(prefers-color-scheme: light)" srcset="https://github-readme-stats.vercel.app/api?username=Eduardomr1&show_icons=true&theme=default&hide_border=true&bg_color=f8fafc&title_color=0284c7&icon_color=2563eb&text_color=475569">
  <img src="https://github-readme-stats.vercel.app/api?username=Eduardomr1&show_icons=true&theme=tokyonight&hide_border=true&bg_color=0d1117" alt="Eduardo Maytorena GitHub Stats" width="49%">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-stats.vercel.app/api/top-langs/?username=Eduardomr1&layout=compact&theme=tokyonight&hide_border=true&bg_color=0d1117&title_color=38bdf8&text_color=94a3b8">
  <source media="(prefers-color-scheme: light)" srcset="https://github-readme-stats.vercel.app/api/top-langs/?username=Eduardomr1&layout=compact&theme=default&hide_border=true&bg_color=f8fafc&title_color=0284c7&text_color=475569">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Eduardomr1&layout=compact&theme=tokyonight&hide_border=true&bg_color=0d1117" alt="Top Languages" width="49%">
</picture>

</div>

---

## 📬 Let's Connect

I am open to opportunities as a **Fullstack Developer**, **QA Automation Engineer**, or **Software Engineer** with teams building robust, high-reliability software.

* 📧 **Email:** [eduardo_maytorenar@outlook.com](mailto:eduardo_maytorenar@outlook.com)
* 🐙 **GitHub:** [github.com/Eduardomr1](https://github.com/Eduardomr1)
* 📍 **Location:** Culiacán, Sinaloa, Mexico (MST / UTC-7) — *Available for Remote, Hybrid & On-site*
* 💬 **Languages:** Spanish (Native) · English (Professional Working Proficiency)

<br/>

<div align="center">
  <sub>Engineered with architectural rigor and deterministic verification • GitHub Profile 2026</sub>
</div>
