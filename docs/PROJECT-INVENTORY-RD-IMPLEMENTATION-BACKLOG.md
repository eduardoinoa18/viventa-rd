# Backlog de Implementación — Project Inventory RD

## Viventa — Tickets Ejecutables para VS Code AI Agent

Guía operativa diaria de Sprint 1:
- [PROJECT-INVENTORY-RD-SPRINT-1-EXECUTION-PLAN.md](docs/PROJECT-INVENTORY-RD-SPRINT-1-EXECUTION-PLAN.md)

## Cómo usar este backlog

1. Ejecutar por épicas en orden.
2. No saltar tickets con dependencia bloqueante.
3. Mantener namespace operativo en `/master/*` y APIs en `/api/admin/*`, `/api/broker/*`.
4. Cada ticket se cierra solo con criterios de aceptación cumplidos.

---

## Sprint Map recomendado

- Sprint 1: EPIC-01 + EPIC-02
- Sprint 2: EPIC-03 + EPIC-04
- Sprint 3: EPIC-05 + EPIC-06
- Sprint 4: EPIC-07 + EPIC-08

---

## EPIC-01 — Data Foundation

Objetivo: habilitar estructuras de datos y validaciones base para proyectos, unidades, reservas y auditoría.

### INV-001 — Definir contratos TypeScript del dominio

- Tipo: Backend/Foundation
- Entregable:
  - Tipos en `types/` para `Project`, `ProjectUnit`, `Reservation`, `ProjectInventoryEvent`.
- Criterios de aceptación:
  - Todos los estados definidos en blueprint RD existen como unions de TypeScript.
  - No se usa `any` en contratos de dominio.
  - Compila sin errores de tipos.

### INV-002 — Crear utilidades de validación de estado y transición

- Tipo: Backend/Domain
- Entregable:
  - Helpers de transición para `project`, `unit`, `reservation`.
- Criterios de aceptación:
  - Se rechazan transiciones inválidas con error consistente.
  - Se permite solo flujo definido en arquitectura.

### INV-003 — Implementar capa de repositorio Firestore para inventario

- Tipo: Backend/Data
- Entregable:
  - Funciones de acceso encapsuladas para `projects`, `project_units`, `reservations`, `project_inventory_events`.
- Criterios de aceptación:
  - Lecturas/escrituras centralizadas en una capa reusable.
  - Manejo de errores consistente y trazable.

### INV-004 — Configurar índices Firestore del módulo

- Tipo: Infra
- Entregable:
  - Entradas de índices en `firestore.indexes.json` según blueprint técnico.
- Criterios de aceptación:
  - Consultas críticas del módulo funcionan sin error de índice faltante en staging.

---

## EPIC-02 — Project & Units APIs

Objetivo: habilitar CRUD y operación de inventario con permisos por rol.

### INV-005 — API listar proyectos por alcance de rol

- Tipo: Backend/API
- Endpoint: `GET /api/broker/projects`
- Criterios de aceptación:
  - `broker/agent` solo ven proyectos permitidos por oficina/asignación.
  - `admin/master_admin` pueden listar global con filtros.

### INV-006 — API crear proyecto (admin/constructora)

- Tipo: Backend/API
- Endpoint: `POST /api/admin/projects`
- Criterios de aceptación:
  - Solo `admin/master_admin/constructora` autorizada puede crear.
  - Se inicializan contadores (`totalUnits`, `availableUnits`, etc.) en cero.

### INV-007 — API editar proyecto + publicar

- Tipo: Backend/API
- Endpoints:
  - `PATCH /api/admin/projects/:id`
  - `POST /api/admin/projects/:id/publish`
- Criterios de aceptación:
  - Cambios de `status/publishMode` respetan transición válida.
  - Se registra evento de auditoría por cada cambio crítico.

### INV-008 — API de unidades por proyecto

- Tipo: Backend/API
- Endpoints:
  - `GET /api/broker/projects/:id/units`
  - `POST /api/admin/projects/:id/units`
  - `PATCH /api/admin/projects/:id/units/:unitId`
- Criterios de aceptación:
  - Unicidad de `unitCode` por proyecto validada en backend.
  - Filtros por `status/phase/price` funcionales.

---

## EPIC-03 — Reservations Engine (Transaccional)

Objetivo: impedir dobles reservas y asegurar consistencia de estados.

### INV-009 — Reserva transaccional de unidad

- Tipo: Backend/API Crítica
- Endpoint: `POST /api/broker/projects/:id/reservations`
- Criterios de aceptación:
  - Usa transacción Firestore.
  - Solo reserva si unidad está `available` en lectura transaccional.
  - Actualiza unidad a `reserved` y vincula `reservationId`.
  - Crea evento `unit_reserved`.

### INV-010 — Cancelación de reserva

- Tipo: Backend/API
- Endpoint: `PATCH /api/broker/reservations/:reservationId/cancel`
- Criterios de aceptación:
  - Permiso por oficina/rol validado.
  - Cambia reserva a `cancelled`.
  - Revierte unidad a `available`.
  - Registra evento `reservation_cancelled`.

### INV-011 — Conversión de reserva a contrato

- Tipo: Backend/API
- Endpoint: `PATCH /api/admin/reservations/:reservationId/convert`
- Criterios de aceptación:
  - Cambia reserva a `converted_to_contract`.
  - Cambia unidad a `sold`.
  - Actualiza contadores del proyecto.
  - Registra evento `reservation_converted`.

### INV-012 — Listado operativo de reservas

- Tipo: Backend/API
- Endpoint: `GET /api/broker/reservations`
- Criterios de aceptación:
  - Filtros por `status`, proyecto, fecha, vencimiento.
  - `broker/agent` solo ven reservas de su alcance.

---

## EPIC-04 — Expiration & Counters Automation

Objetivo: automatizar vencimientos y mantener métricas de inventario correctas.

### INV-013 — Job de expiración de reservas

- Tipo: Backend/Job
- Endpoint interno: `POST /api/admin/reservations/expire-run`
- Criterios de aceptación:
  - Marca `reserved -> expired` cuando `expiresAt` venció.
  - Revierte unidad a `available`.
  - Registra evento `reservation_expired`.
  - Soporta ejecución idempotente.

### INV-014 — Reconciliación de contadores por proyecto

- Tipo: Backend/Maintenance
- Entregable:
  - Función que recalcula `available/reserved/sold/total` por proyecto.
- Criterios de aceptación:
  - Se ejecuta tras mutaciones críticas.
  - Corrige drift de contadores sin intervención manual.

---

## EPIC-05 — UI Projects Workspace

Objetivo: habilitar operación diaria del broker/admin en panel.

### INV-015 — Página `/master/projects`

- Tipo: Frontend
- Criterios de aceptación:
  - Tabla de proyectos con filtros por estado, desarrollador y zona.
  - KPIs visibles: totales, disponibles, reservadas, vendidas.
  - Acción rápida para crear proyecto (según rol).

### INV-016 — Página `/master/projects/[id]/units`

- Tipo: Frontend
- Criterios de aceptación:
  - Grid/tabla de unidades con filtros por fase/tipo/estado/precio.
  - Etiquetas visuales de estado comercial.
  - Acción de reservar visible para roles autorizados.

### INV-017 — Página `/master/reservations`

- Tipo: Frontend
- Criterios de aceptación:
  - Lista de reservas con countdown de vencimiento.
  - Acciones: cancelar, convertir a contrato (según rol).
  - Vista de historial por reserva.

---

## EPIC-06 — Permissions Hardening

Objetivo: blindar acceso por rol y alcance de oficina.

### INV-018 — Matriz de permisos centralizada

- Tipo: Backend/Security
- Entregable:
  - Guardas reutilizables por módulo de inventario.
- Criterios de aceptación:
  - Restricciones de `constructora`, `broker`, `agent`, `admin`, `master_admin` aplicadas en APIs.
  - Casos denegados responden 403 con mensaje consistente.

### INV-019 — Validación de scope por oficina/proyecto

- Tipo: Backend/Security
- Criterios de aceptación:
  - Ningún broker/agent accede o muta inventario fuera de su alcance.
  - Se cubre reserva, cancelación y listados.

---

## EPIC-07 — Analytics & Dashboard Integration

Objetivo: exponer señales operativas del inventario en panel de broker.

### INV-020 — KPIs de inventario para dashboard

- Tipo: Backend/API + Frontend
- Criterios de aceptación:
  - Se muestran: fill rate, reservation-to-contract, expiry rate, velocity 30d.
  - Filtros por zona y proyecto aplican correctamente.

### INV-021 — Alertas operativas

- Tipo: Frontend
- Criterios de aceptación:
  - Alertas para reservas por vencer.
  - Alertas para proyectos sin disponibilidad.

---

## EPIC-08 — QA, E2E y Release Readiness

Objetivo: salir a producción sin riesgo de inconsistencias comerciales.

### INV-022 — Pruebas E2E críticas de concurrencia

- Tipo: Testing
- Criterios de aceptación:
  - Caso simultáneo: dos usuarios intentan reservar misma unidad.
  - Resultado esperado: una sola reserva exitosa.

### INV-023 — Pruebas de permisos por rol

- Tipo: Testing
- Criterios de aceptación:
  - Matriz de pruebas para `master_admin/admin/constructora/broker/agent`.
  - Ningún rol excede su alcance.

### INV-024 — Checklist de salida a producción

- Tipo: Release
- Criterios de aceptación:
  - Build, typecheck y lint en verde.
  - Endpoints críticos con logs y manejo de errores.
  - Auditoría confirmada en transiciones críticas.

---

## Dependencias clave entre tickets

- INV-001/002/003 bloquean INV-005 en adelante.
- INV-009 bloquea INV-015/016/017 (flujo completo de reserva en UI).
- INV-013 y INV-014 deben estar antes del release de producción.
- INV-018/019 deben estar completos antes de pruebas finales INV-023.

---

## Riesgos y mitigación

1. Doble reserva por condiciones de carrera
- Mitigación: INV-009 transaccional + E2E INV-022.

2. Drift de contadores de proyecto
- Mitigación: INV-014 reconciliación + validaciones post-mutate.

3. Fuga de datos entre oficinas
- Mitigación: INV-018/019 + pruebas de permisos INV-023.

---

## Definition of Done global del módulo

- No hay dobles reservas bajo concurrencia.
- Estados y transiciones cumplen el blueprint.
- RBAC verificado por rol y oficina.
- KPIs críticos visibles en dashboard.
- Auditoría activa en eventos clave.
- Build de producción en verde.