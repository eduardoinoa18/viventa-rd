# Sistema de Inventario de Proyectos (RD)

## Viventa — Arquitectura Técnica Ejecutable

Backlog de implementación (tickets ejecutables):
- [PROJECT-INVENTORY-RD-IMPLEMENTATION-BACKLOG.md](docs/PROJECT-INVENTORY-RD-IMPLEMENTATION-BACKLOG.md)

Guía de ejecución Sprint 1 (paso a paso):
- [PROJECT-INVENTORY-RD-SPRINT-1-EXECUTION-PLAN.md](docs/PROJECT-INVENTORY-RD-SPRINT-1-EXECUTION-PLAN.md)

## Objetivo

Construir el módulo que permita operar inventario de proyectos inmobiliarios en República Dominicana con control en tiempo real de:

- Proyectos
- Etapas (fases)
- Unidades
- Reservas
- Conversión a contrato
- Trazabilidad comercial y operativa

Este módulo es el núcleo para escalar ventas sobre inventario de constructoras y brokerages.

---

## Alcance MVP (v1)

Incluye:

1. CRUD de proyectos (con permisos)
2. Gestión de unidades por proyecto
3. Reserva de unidad con bloqueo transaccional
4. Vencimiento de reserva (timer)
5. Conversión de reserva a contrato
6. KPIs operativos de inventario
7. Auditoría básica de cambios

No incluye en v1:

- Firma digital de contrato
- Integración bancaria
- Facturación contable
- Workflow legal avanzado multi-firma

---

## Principios RD (no negociables)

1. Una unidad no puede estar reservada/vendida dos veces.
2. El estado comercial visible debe actualizarse en segundos.
3. Reserva siempre deja rastro: quién, cuándo, por qué, monto.
4. Solo roles autorizados pueden editar estructura de proyecto.
5. Broker puede vender inventario autorizado, pero no alterar estructura global.

---

## Arquitectura de Dominio

## Entidades principales

### 1) `projects`
Representa un desarrollo inmobiliario.

Campos mínimos:

- `id`
- `name`
- `developerId`
- `developerName`
- `brokerageId` (nullable si es abierto)
- `location` (ciudad, sector, geodata básica)
- `currency` (`DOP`/`USD`)
- `status` (`draft` | `active` | `paused` | `sold_out` | `archived`)
- `publishMode` (`private_office` | `multi_broker` | `public_market`)
- `totalUnits`
- `availableUnits`
- `reservedUnits`
- `soldUnits`
- `createdBy`
- `createdAt`
- `updatedAt`

### 2) `project_units`
Unidad comercializable (apartamento, villa, local, etc.).

Campos mínimos:

- `id`
- `projectId`
- `unitCode` (único por proyecto)
- `phase` (torre/etapa)
- `propertyType`
- `beds`
- `baths`
- `parking`
- `areaM2`
- `price`
- `maintenanceFee` (nullable)
- `status` (`available` | `reserved` | `sold` | `blocked`)
- `availabilityDate` (nullable)
- `ownerType` (`developer_inventory` | `broker_inventory`)
- `assignedBrokerageId` (nullable)
- `reservationId` (nullable)
- `lastStatusChangedAt`
- `createdAt`
- `updatedAt`

Regla de unicidad:

- Índice único lógico por (`projectId`, `unitCode`).

### 3) `reservations`
Reserva comercial de una unidad.

Campos mínimos:

- `id`
- `projectId`
- `unitId`
- `unitCode`
- `clientId` (nullable)
- `clientName`
- `clientPhone`
- `clientEmail` (nullable)
- `reservedByUid`
- `reservedByRole`
- `officeId`
- `reservationAmount`
- `currency`
- `paymentMethod` (`cash` | `transfer` | `card` | `other`)
- `status` (`reserved` | `cancelled` | `expired` | `converted_to_contract`)
- `expiresAt`
- `cancelReason` (nullable)
- `convertedAt` (nullable)
- `contractId` (nullable)
- `notes` (nullable)
- `createdAt`
- `updatedAt`

### 4) `project_inventory_events`
Bitácora operativa para trazabilidad.

Campos mínimos:

- `id`
- `projectId`
- `unitId` (nullable)
- `reservationId` (nullable)
- `eventType`
- `actorUid`
- `actorRole`
- `officeId`
- `before` (snapshot parcial)
- `after` (snapshot parcial)
- `reason`
- `createdAt`

Eventos sugeridos:

- `project_created`
- `project_published`
- `unit_created`
- `unit_status_changed`
- `unit_reserved`
- `reservation_expired`
- `reservation_cancelled`
- `reservation_converted`

---

## Estados y Transiciones

## Estado de proyecto

`draft -> active -> paused -> active -> sold_out -> archived`

Reglas:

- `sold_out` cuando `availableUnits = 0` y no hay unidades en `reserved`.
- `archived` solo por `admin/master_admin`.

## Estado de unidad

`available -> reserved -> sold`
`available -> blocked -> available`
`reserved -> available` (si reserva expira o se cancela)

Reglas:

- `sold` es terminal (solo rollback por `master_admin`).
- `blocked` requiere razón y fecha de revisión opcional.

## Estado de reserva

`reserved -> converted_to_contract`
`reserved -> cancelled`
`reserved -> expired`

Regla:

- Al cambiar de `reserved` a `cancelled/expired`, la unidad vuelve a `available`.
- Al cambiar a `converted_to_contract`, la unidad pasa a `sold`.

---

## RBAC (Permisos)

### `master_admin`

- Full CRUD sobre proyectos/unidades/reservas
- Overrides y rollback de estados terminales
- Auditoría global

### `admin`

- CRUD completo operativo
- No puede borrar auditoría

### `constructora`

- CRUD estructural sobre proyectos propios
- Puede cargar y editar inventario de sus proyectos
- Puede habilitar brokerages autorizadas

### `broker`

- Puede ver proyectos autorizados
- Puede crear reservas sobre unidades `available`
- Puede cancelar reserva de su oficina (si política lo permite)
- No puede editar estructura de proyecto ni precios globales sin permiso explícito

### `agent`

- Puede reservar en nombre de su oficina
- Puede ver inventario permitido
- No puede alterar estructura ni configuración de proyecto

---

## APIs recomendadas (App Router)

Mantener namespace operativo en `/api/broker/*` y `/api/admin/*`.

## Proyectos

- `GET /api/broker/projects` → lista proyectos permitidos
- `POST /api/admin/projects` → crear proyecto
- `PATCH /api/admin/projects/:id` → editar proyecto
- `POST /api/admin/projects/:id/publish` → cambiar `publishMode/status`

## Unidades

- `GET /api/broker/projects/:id/units` → inventario filtrable
- `POST /api/admin/projects/:id/units` → crear unidad(es)
- `PATCH /api/admin/projects/:id/units/:unitId` → editar unidad
- `PATCH /api/admin/projects/:id/units/:unitId/status` → cambio de estado controlado

## Reservas

- `POST /api/broker/projects/:id/reservations` → reservar unidad
- `PATCH /api/broker/reservations/:reservationId/cancel` → cancelar
- `PATCH /api/admin/reservations/:reservationId/convert` → convertir a contrato
- `GET /api/broker/reservations` → listado con filtros

## Jobs/Automatización

- `POST /api/admin/reservations/expire-run` → expirar reservas vencidas (cron)

---

## Contratos de request/response (mínimo)

## Crear reserva

Request:

```json
{
  "projectId": "proj_123",
  "unitId": "unit_450",
  "clientName": "Juan Pérez",
  "clientPhone": "+1 809-000-0000",
  "clientEmail": "juan@email.com",
  "reservationAmount": 5000,
  "currency": "USD",
  "paymentMethod": "transfer",
  "expiresAt": "2026-03-12T18:00:00.000Z",
  "notes": "Separación inicial"
}
```

Respuesta exitosa:

```json
{
  "ok": true,
  "data": {
    "reservationId": "res_001",
    "unitStatus": "reserved",
    "expiresInSeconds": 604800
  }
}
```

Regla técnica:

- Este endpoint debe usar transacción Firestore para validar `unit.status === available` antes de reservar.

---

## Diseño de rutas UI (alineado con Viventa actual)

Rutas recomendadas en dashboard operativo:

- `/master/projects` → listado de proyectos + KPIs
- `/master/projects/[id]` → detalle proyecto
- `/master/projects/[id]/units` → inventario de unidades
- `/master/reservations` → cola de reservas

Alias opcionales (marketing URL):

- `/broker/projects` -> rewrite a `/master/projects`
- `/broker/reservations` -> rewrite a `/master/reservations`

---

## UX mínimo por pantalla

## `/master/projects`

- Tabla de proyectos
- Filtros: estado, desarrollador, zona
- KPIs: total unidades, disponibles, reservadas, vendidas
- Acción rápida: crear proyecto

## `/master/projects/[id]/units`

- Grid/tabla de unidades
- Filtros: fase, tipología, estado, rango de precio
- Acción rápida: reservar unidad
- Indicadores de urgencia para reservas próximas a vencer

## `/master/reservations`

- Lista de reservas activas e históricas
- Estados + countdown
- Acciones: cancelar, convertir a contrato, ver historial

---

## Reglas de Integridad y Concurrencia

1. Reserva solo con transacción atómica en backend.
2. Nunca confiar en estado enviado por frontend.
3. Recalcular contadores de proyecto tras cada cambio (`available/reserved/sold`).
4. Registrar evento en `project_inventory_events` por cada transición crítica.
5. Validar permisos por sesión (`role`, `officeId`, `project scope`).

---

## Índices Firestore sugeridos

1. `project_units`: `projectId ASC, status ASC, price ASC`
2. `project_units`: `projectId ASC, phase ASC, status ASC`
3. `reservations`: `officeId ASC, status ASC, expiresAt ASC`
4. `reservations`: `projectId ASC, status ASC, createdAt DESC`
5. `projects`: `status ASC, developerId ASC, updatedAt DESC`
6. `project_inventory_events`: `projectId ASC, createdAt DESC`

---

## KPIs operativos del módulo

1. `inventory_fill_rate` = unidades vendidas / unidades totales
2. `reservation_to_contract_rate` = reservas convertidas / reservas creadas
3. `reservation_expiry_rate` = reservas expiradas / reservas creadas
4. `avg_days_reserved_to_contract`
5. `active_units_by_zone`
6. `project_velocity_30d` (unidades reservadas+vendidas en 30 días)

---

## Plan de Implementación (4 sprints)

## Sprint 1 — Fundaciones de inventario

- Esquema `projects` + `project_units`
- APIs base de proyectos/unidades
- Pantalla `/master/projects`
- RBAC estructural (`constructora/admin/master_admin`)

## Sprint 2 — Reservas transaccionales

- Esquema `reservations`
- Endpoint transaccional de reserva
- Pantalla `/master/reservations`
- Countdown y estados de reserva

## Sprint 3 — Conversión + expiración automática

- Convertir reserva a contrato
- Job de expiración programada
- Reversión automática de unidad a `available`
- Eventos de auditoría

## Sprint 4 — Analítica + endurecimiento

- KPIs del módulo en dashboard
- Mejoras de filtros y performance
- Alertas operativas (reserva por vencer)
- Pruebas E2E críticas de concurrencia

---

## Checklist de Definition of Done

Para cerrar el módulo como "production-ready":

- [ ] No existen dobles reservas en pruebas de concurrencia
- [ ] RBAC validado por rol y oficina
- [ ] Todas las transiciones generan evento auditado
- [ ] Expiración automática funcionando en entorno de staging
- [ ] KPIs principales visibles en dashboard
- [ ] Build y lint sin errores

---

## Entregable para VS Code AI Agent (Builder)

Implementar en este orden:

1. Backend transaccional (`projects`, `project_units`, `reservations`)
2. Pantallas `/master/projects` y `/master/reservations`
3. Job de expiración de reservas
4. Conversión a contrato y actualización de estado de unidad
5. KPIs de inventario en dashboard broker

Con esta secuencia, Viventa obtiene el motor comercial que necesita para escalar inventario de proyectos en RD sin perder control operativo.