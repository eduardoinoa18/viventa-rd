# Sprint 1 Execution Plan — Project Inventory RD

Seguimiento continuo de plataforma (estado global de cobertura/prioridades):
- [PLATFORM-CONTINUOUS-IMPROVEMENT-PIPELINE.md](docs/PLATFORM-CONTINUOUS-IMPROVEMENT-PIPELINE.md)

## Objetivo del sprint

Completar EPIC-01 y EPIC-02 del backlog de inventario RD:

- INV-001 a INV-004
- INV-005 a INV-008

Resultado esperado del sprint:

- Base de dominio y validaciones lista
- Índices Firestore definidos
- APIs de proyectos y unidades funcionales con RBAC
- Listo para iniciar motor de reservas en Sprint 2

---

## Secuencia de ejecución recomendada (5 días)

## Día 1 — Dominio y tipos

Tickets:

- INV-001
- INV-002

Acciones:

1. Crear contratos de dominio en types.
2. Definir enums/unions de estados y modos de publicación.
3. Crear utilidades puras de transición con validación de reglas.

Archivos objetivo sugeridos:

- types/project-inventory.ts
- lib/projectInventory/transitions.ts
- lib/projectInventory/errors.ts

Criterio de salida día 1:

- Tipos compilando sin any
- Tests unitarios mínimos de transición válidos

---

## Día 2 — Repositorio y acceso a datos

Ticket:

- INV-003

Acciones:

1. Crear capa repository para projects y units.
2. Estandarizar mappers Firestore <-> dominio.
3. Centralizar manejo de errores de lectura/escritura.

Archivos objetivo sugeridos:

- lib/projectInventory/repositories/projectsRepository.ts
- lib/projectInventory/repositories/unitsRepository.ts
- lib/projectInventory/repositories/eventsRepository.ts
- lib/projectInventory/mappers.ts

Criterio de salida día 2:

- Repositorio reusable por endpoints
- Operaciones CRUD básicas disponibles por función

---

## Día 3 — Índices y API de lectura

Tickets:

- INV-004
- INV-005

Acciones:

1. Agregar índices requeridos en firestore.indexes.json.
2. Implementar GET de proyectos con scope por rol.
3. Validar filtros base y paginación simple.

Archivos objetivo sugeridos:

- firestore.indexes.json
- app/api/broker/projects/route.ts
- lib/projectInventory/permissions.ts

Criterio de salida día 3:

- API lista proyectos por alcance correcto
- Sin errores de índices faltantes en pruebas locales/emulador

---

## Día 4 — API de creación/edición/publicación de proyectos

Tickets:

- INV-006
- INV-007

Acciones:

1. Implementar POST crear proyecto con permisos.
2. Implementar PATCH de actualización de proyecto.
3. Implementar publish endpoint con transición validada.
4. Registrar eventos de auditoría en cambios críticos.

Archivos objetivo sugeridos:

- app/api/admin/projects/route.ts
- app/api/admin/projects/[id]/route.ts
- app/api/admin/projects/[id]/publish/route.ts

Criterio de salida día 4:

- Proyecto se crea y actualiza con RBAC
- Publicación respeta reglas de estado
- Eventos auditados persisten

---

## Día 5 — APIs de unidades + hardening

Ticket:

- INV-008

Acciones:

1. Implementar GET unidades por proyecto con filtros.
2. Implementar POST creación de unidades.
3. Implementar PATCH edición de unidad.
4. Validar unicidad de unitCode por projectId en backend.

Archivos objetivo sugeridos:

- app/api/broker/projects/[id]/units/route.ts
- app/api/admin/projects/[id]/units/route.ts
- app/api/admin/projects/[id]/units/[unitId]/route.ts

Criterio de salida día 5:

- CRUD de unidades operativo
- Validación de duplicados confirmada
- Build del sprint en verde

---

## Prompts listos para VS Code AI Agent (Builder)

## Prompt A — INV-001 + INV-002

Implementa INV-001 e INV-002 del documento docs/PROJECT-INVENTORY-RD-IMPLEMENTATION-BACKLOG.md.

Requisitos:
- Crear tipos de dominio para projects, project_units, reservations y project_inventory_events
- Definir unions para estados: project, unit, reservation y publishMode
- Crear utilidades de transición válidas con funciones puras
- Rechazar transiciones inválidas con errores tipados
- No usar any
- Mantener estilo TypeScript estricto del repositorio

Entregar:
- Nuevos archivos en types y lib/projectInventory
- Resumen de funciones expuestas
- Resultado de typecheck

## Prompt B — INV-003 + INV-004

Implementa INV-003 e INV-004 del backlog.

Requisitos:
- Crear repositories Firestore para projects, units y events
- Centralizar mapping data <-> dominio
- Añadir índices requeridos en firestore.indexes.json
- Mantener manejo de errores consistente

Entregar:
- Archivos repository + mappers
- Diff de firestore.indexes.json
- Validación de consultas críticas

## Prompt C — INV-005 a INV-008

Implementa INV-005, INV-006, INV-007 e INV-008.

Requisitos:
- Endpoints:
  - GET /api/broker/projects
  - POST /api/admin/projects
  - PATCH /api/admin/projects/:id
  - POST /api/admin/projects/:id/publish
  - GET /api/broker/projects/:id/units
  - POST /api/admin/projects/:id/units
  - PATCH /api/admin/projects/:id/units/:unitId
- Aplicar RBAC por rol y alcance
- Validar unicidad unitCode por proyecto
- Registrar eventos de auditoría en cambios críticos

Entregar:
- Endpoints funcionales
- Casos de prueba manual (curl o fetch)
- Resultado build/typecheck

---

## Checklist de QA de Sprint 1

- [ ] Tipo Project compila y refleja estados blueprint
- [ ] Tipo ProjectUnit compila y refleja estados blueprint
- [ ] Reglas de transición bloquean cambios inválidos
- [ ] GET projects filtra por alcance de rol correctamente
- [ ] POST project restringido a roles autorizados
- [ ] PATCH publish respeta transición permitida
- [ ] GET/POST/PATCH units operan con validación de unicidad
- [ ] Eventos de auditoría se guardan en cambios críticos
- [ ] build y typecheck del repo terminan en verde

---

## Definition of Done del Sprint 1

Sprint 1 se considera cerrado cuando:

1. INV-001 a INV-008 están cerrados con aceptación completa.
2. No hay bypass de permisos en endpoints de proyectos/unidades.
3. No hay errores de tipos ni build para el alcance del sprint.
4. Documentación de endpoint y payloads mínimos está actualizada.

---

## Handoff recomendado para iniciar Sprint 2

Con Sprint 1 cerrado, ejecutar inmediatamente:

- INV-009 (reserva transaccional)
- INV-010 (cancelación)
- INV-011 (conversión a contrato)

Esto habilita el corazón comercial del módulo sin esperar al resto de UI.