# Arquitectura Offline-First & Sincronización Idempotente
### Caso de Estudio: Aplicación Móvil Control de Gastos

[![App Móvil](https://img.shields.io/badge/App-React%20Native%20%7C%20Expo-blue)](../../gastos)
[![Persistencia](https://img.shields.io/badge/Storage-MMKV%20%2B%20SQLite-orange)](../../gastos)
[![Backend](https://img.shields.io/badge/Backend-Supabase%20Postgres%20RPC-green)](../../gastos/supabase)

Este documento detalla los principios de diseño, la topología de almacenamiento local, el ciclo de vida de las mutaciones optimistas y el protocolo de resolución de conflictos implementado en la aplicación de control de gastos personales.

---

## 1. Principio Rector: Offline como Ciudadano de Primera Clase

La gran mayoría de las aplicaciones móviles tratan el modo offline como una condición excepcional o de error. En **Control de Gastos**, el diseño invierte esa premisa:

1. **La UI nunca espera a la red:** Toda operación de guardado, actualización o borrado impacta de manera inmediata (< 16ms) en la interfaz del usuario.
2. **Escritura síncrona en dos subsistemas desacoplados:**
   - **Copia Local (SQLite - `gastos.db`):** Sirve como la réplica de lectura offline estructurada. Las consultas SQL y filtros de UI se ejecutan contra esta base de datos local.
   - **Cola de Sincronización (MMKV - `syncQueue`):** Almacena las operaciones pendientes por enviar al servidor en orden FIFO. Se implementa en MMKV debido a que las escrituras son síncronas en disco y no dependen del event loop asíncrono de React Native, asegurando que un cierre repentino de la aplicación por el sistema operativo nunca pierda un gasto registrado.

---

## 2. Diagrama de Arquitectura de Almacenamiento y Sincronización

```mermaid
flowchart TD
    subgraph UI_Layer["Capa de Presentación (React Native / Expo)"]
        User["👤 Usuario"] --> Screen["Pantalla Agregar Gasto"]
        Screen --> DomainValidation["Validación de Dominio<br/>assertCents() + UUIDv4"]
        DomainValidation --> RQCache["TanStack Query Cache<br/>(Mutación Optimista)"]
    end

    subgraph Storage_Layer["Persistencia Local en Dispositivo"]
        DomainValidation -->|"Escritura Síncrona"| MMKVQueue["Cola de Sync en MMKV<br/>(Sobrevive a Force Close)"]
        DomainValidation -->|"Escritura Síncrona"| SQLiteReplica["SQLite Local (gastos.db)<br/>(Consultas y Totales Offline)"]
    end

    subgraph Sync_Engine["Motor de Sincronización (sync-engine.ts)"]
        NetDetector{"NetInfo<br/>¿Conexión Activa?"}
        SyncWorker["Worker de Cola (FIFO)"]
        Reconciler["Reconciliador de Conflictos<br/>resolveConflict() (LWW)"]
        
        MMKVQueue -.->|"Lectura de pendientes"| SyncWorker
        NetDetector -->|"Online"| SyncWorker
        SyncWorker --> Reconciler
    end

    subgraph Remote_Supabase["Supabase Cloud (PostgreSQL)"]
        PushRPC["RPC sync_expense(UUID, ...)<br/>(Upsert Idempotente)"]
        PullRPC["RPC pull_changes(cursor)<br/>(Delta de Modificaciones)"]
        RLS["Row Level Security (RLS)<br/>auth.uid() = user_id"]
        DBTable[("Tabla gastos<br/>PostgreSQL")]

        PushRPC --> RLS --> DBTable
        DBTable --> PullRPC
    end

    SyncWorker ==>|"HTTP POST (RPC)"| PushRPC
    PullRPC ==>|"Delta de Servidor"| Reconciler
    Reconciler -->|"Actualiza registros"| SQLiteReplica
    Reconciler -->|"Desencola ítem confirmado"| MMKVQueue
    Reconciler -->|"Invalida queries"| RQCache
    RQCache -->|"Renderizado reactivo"| Screen

    classDef primary fill:#1e3a8a,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef secondary fill:#064e3b,stroke:#059669,stroke-width:2px,color:#fff;
    classDef storage fill:#78350f,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef cloud fill:#4c1d95,stroke:#7c3aed,stroke-width:2px,color:#fff;

    class Screen,DomainValidation,RQCache primary;
    class MMKVQueue,SQLiteReplica storage;
    class SyncWorker,Reconciler,NetDetector secondary;
    class PushRPC,PullRPC,RLS,DBTable cloud;
```

---

## 3. Protocolo de Sincronización Idempotente

### 3.1 Identificadores en el Cliente (UUIDv4)
En lugar de depender de claves auto-incrementales del servidor, el identificador único del gasto se genera en el cliente al momento de crearlo. Esto aporta tres beneficios arquitectónicos fundamentales:
- **Idempotencia ante fallos de red:** Si la petición HTTP viaja al servidor, se procesa, pero la respuesta de confirmación se pierde por un corte de red, el reintento posterior del cliente envía exactamente el mismo UUID. El RPC de Postgres ejecuta un `ON CONFLICT (id) DO UPDATE`, evitando duplicidades.
- **Inmunidad a doble tap:** Pulsaciones múltiples o accidentales sobre el botón de guardar generan una sola entidad en la base de datos.
- **Relaciones locales inmediatas:** Si en el futuro se asociaran recibos fotográficos o etiquetas al gasto, las relaciones pueden establecerse de forma local y offline con el UUID antes de tocar la red.

### 3.2 Diagrama de Secuencia Detallado

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Formulario UI
    participant RQ as TanStack Query
    participant MMKV as Cola MMKV
    participant SQLite as gastos.db (SQLite)
    participant Worker as Sync Engine Worker
    participant Supabase as Supabase PostgreSQL RPC

    Usuario->>UI: Guarda gasto $250.00 MXN en "Supermercado"
    UI->>UI: assertCents(25000) & genera UUIDv4 (ej: '550e8400...')
    UI->>RQ: Mutación optimista en cache de consultas
    
    par Persistencia Síncrona Inmediata
        UI->>SQLite: INSERT INTO gastos (id, cents, category, date...)
        UI->>MMKV: push({ id: '550e8400...', action: 'upsert', cents: 25000, version: 1 })
    end
    UI-->>Usuario: Feedback visual instantáneo (< 16ms)

    Note over Worker,Supabase: La sincronización corre en segundo plano sin bloquear la UI
    Worker->>Worker: Detecta conexión activa & cola no vacía
    Worker->>MMKV: peek() -> Obtiene primer ítem
    Worker->>Supabase: POST /rpc/sync_expense({ id: '550e8400...', cents: 25000, ... })
    
    alt Servidor responde HTTP 200 OK
        Supabase-->>Worker: { success: true, server_version: 1, synced_at: '2026-10-11T...' }
        Worker->>MMKV: pop('550e8400...') -> Remueve de la cola
        Worker->>SQLite: UPDATE gastos SET synced = 1 WHERE id = '550e8400...'
        Worker->>RQ: Invalida ['gastos', 'resumen']
    else Fallo de Red / Timeout / HTTP 5xx
        Supabase-->>Worker: Network Error / Timeout
        Worker->>Worker: Aplica algoritmo de backoff exponencial
        Note over MMKV: El ítem permanece intacto en MMKV para el siguiente reintento
    end
```

---

## 4. Resolución de Conflictos y Simetría Cliente-Servidor

Cuando un registro es modificado en dos dispositivos distintos sin conexión previa, la convergencia se resuelve mediante una estrategia determinista de **Last-Write-Wins (LWW)** basada en marcas temporales ISO y números de versión monótonos crecientes:

- La función `resolveConflict(local, remote)` implementa exactamente la misma regla en el cliente TypeScript (`src/shared/lib/sync-engine.ts`) que la función PL/pgSQL en el servidor (`sync_expense`).
- **Simetría garantizada:** Sin importar el orden en que los paquetes de sincronización alcancen los dispositivos, el resultado final convergente es matemática y lógicamente idéntico.

---

## 5. Prevención de Pérdida de Datos en Cierre de Sesión

Un riesgo común en arquitecturas offline-first es la filtración de datos entre diferentes cuentas de usuario en un mismo dispositivo compartido (descubierto y documentado como **BUG-013** en el proyecto):

1. **Intento de Flush previo:** Al solicitar logout, el motor intenta vaciar la cola pendiente en el servidor.
2. **Purgado de Réplica Local:** Se truncan las tablas locales en SQLite y se eliminan las colas de MMKV asociadas al usuario saliente.
3. **Invalidación de Token:** Finalmente, se revoca la sesión en Supabase Auth.
4. **Resultado:** Ningún dato del usuario previo queda expuesto para la siguiente sesión que inicie en el dispositivo.
