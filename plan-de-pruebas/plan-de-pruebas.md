# Plan de pruebas - SauceDemo

## 1. Objetivo

Validar el flujo funcional principal de SauceDemo (autenticacion, catalogo, carrito y checkout) para asegurar que un usuario puede completar una compra sin errores y que el sistema maneja correctamente los casos invalidos.

## 2. Alcance

Incluye:
- Login (usuarios validos, invalidos y bloqueados)
- Listado e inventario de productos (ordenamiento, detalle de producto)
- Carrito de compras (agregar, quitar, persistencia entre paginas)
- Checkout (datos del comprador, resumen de orden, confirmacion)

No incluye:
- Pruebas de carga/performance
- Pruebas de seguridad a fondo (solo validaciones basicas de login)
- Pruebas en dispositivos moviles nativos

## 3. Estrategia

- Pruebas manuales exploratorias + basadas en casos escritos.
- Enfoque en caja negra sobre la UI publica.
- Usuarios de prueba provistos por el propio sitio (standard_user, locked_out_user, problem_user, performance_glitch_user).
- Prioridad: primero flujo feliz (happy path), luego negativos, luego edge cases.

## 4. Criterios de entrada

- El sitio esta disponible y accesible publicamente.
- Se cuenta con las credenciales de prueba publicadas por SauceDemo.

## 5. Criterios de salida

- 100% de los casos criticos (login, agregar al carrito, completar checkout) ejecutados.
- Todos los bugs encontrados documentados con severidad y evidencia.
- Sin bugs de severidad critica/bloqueante sin reportar.

## 6. Riesgos

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| El sitio es una demo y puede tener bugs intencionales | Medio | Documentar como hallazgos esperados vs. reales |
| Cambios en el sitio entre sesiones de prueba | Bajo | Fijar fecha de ejecucion en el reporte |
| Usuarios de prueba con comportamiento especial (problem_user, error_user) | Medio | Casos de prueba especificos por tipo de usuario |

## 7. Entregables

- Este documento
- `casos-de-prueba.md` con la matriz de casos
- `matriz-trazabilidad-automatizacion.md` con la matriz de trazabilidad QA manual ↔ automatización
