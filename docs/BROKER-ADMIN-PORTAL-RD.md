# Portal Administrativo del Broker (RD)

## Viventa — Sistema Operativo para Brokerages en República Dominicana

Documento técnico complementario del núcleo de inventario:
- [PROJECT-INVENTORY-SYSTEM-RD.md](docs/PROJECT-INVENTORY-SYSTEM-RD.md)

## Objetivo

Convertir a Viventa en el centro operativo diario del broker dominicano:

- Inventario
- Leads y clientes
- Equipo
- Transacciones
- Rendimiento del negocio

No es un portal de listados. Es el sistema operativo de la oficina.

---

## Contexto local RD (principios de diseño)

El producto debe reflejar estas realidades:

1. No existe un MLS central dominante.
2. Muchas oficinas operan con equipos semiautónomos.
3. Las comisiones se negocian caso por caso.
4. El canal WhatsApp y referidos pesa más que en EE.UU.
5. Constructoras manejan inventario directo y simultáneo.
6. Los cierres pueden tomar meses por legal/financiamiento.
7. Un broker puede operar múltiples proyectos en paralelo.

Implicación: el portal debe priorizar coordinación, seguimiento y control operativo real.

---

## Modelo de Roles (autoridad)

### `master_admin`
- Control total de plataforma.
- Override global sobre datos, permisos y operación.

### `admin`
- Operación global delegada por `master_admin`.

### `broker`
- Control total de su oficina (inventario, leads, equipo, pipeline, configuración).
- Sin acceso de edición a inventario de otras oficinas.

### `agent`
- Ejecución operativa sobre su cartera asignada.

### `buyer` / `user`
- Experiencia pública + panel de comprador.

---

## Arquitectura funcional (6 áreas núcleo)

1. Dashboard del Broker
2. Gestión de Propiedades
3. Gestión de Leads y Clientes
4. Gestión del Equipo
5. Pipeline de Transacciones
6. Perfil Público del Broker

Módulos de soporte:

7. Marketing
8. Reportes y Analíticas
9. Documentos
10. Notificaciones
11. Configuración de Oficina

---

## 1) Dashboard del Broker (Centro de Comando)

Debe responder en segundos: “¿cómo va mi negocio hoy?”

### KPIs de Inventario
- Propiedades activas
- Nuevas propiedades (mes)
- Bajo contrato
- Vendidas (mes)
- Promedio días en mercado

### KPIs de Leads
- Leads recibidos hoy
- Pendientes de asignar
- Contactados
- Convertidos a cliente

### Producción de Oficina
- Ventas cerradas del mes
- Valor total vendido
- Comisiones estimadas
- Pipeline de ventas

### Actividad del Equipo
- Top agentes
- Leads activos por agente
- Propiedades activas por agente
- Conversión por agente

### Mercado RD
- Precio promedio de venta
- Precio promedio por m²
- Inventario disponible por zona
- Tendencia de demanda

---

## 2) Gestión de Propiedades

### 2.1 Propiedades de la Oficina
Acciones:
- Crear/editar publicación
- Cambiar precio
- Subir fotos, videos, planos, docs legales
- Marcar vendida/reservada
- Duplicar

### 2.2 Propiedades de Agentes
Acciones del broker:
- Ver y auditar
- Ver rendimiento
- Reasignar responsable

Regla:
- No modificar campos críticos sin política/permisos.

### 2.3 Propiedades del Mercado (Open Market)
Acciones:
- Buscar
- Comparar
- Guardar
- Compartir con clientes

Regla:
- Solo lectura; sin edición de inventario externo.

### 2.4 Control de Inventario de la Oficina

El broker debe tener tablero de inventario con filtros operativos:

- `activo`
- `vendido`
- `reservado`
- `en negociación`
- `expirado`

Vistas de control:

- Inventario por agente
- Inventario por zona
- Inventario por tipo de propiedad

---

## 3) Gestión de Leads y Clientes

### Fuentes de lead (RD)
- Búsqueda en portal
- Proyectos
- Formularios
- Publicidad digital
- Referidos
- Redes sociales
- WhatsApp

### Acciones del broker
- Asignar/reasignar
- Ver historial y timeline
- Notas internas
- Contactar
- Clasificar comprador/vendedor
- Convertir a cliente activo

### Integración WhatsApp (crítica para RD)

Cada lead debe incluir:

- Botón directo de WhatsApp
- Abrir conversación en un clic
- Plantilla de mensaje automático editable

Plantilla sugerida:

```txt
Hola {nombre}, soy {agente} de {brokerage}.
Recibimos tu interés en la propiedad {propiedad}.
¿Te gustaría agendar una visita?
```

Impacto esperado:

- Menos fricción operativa
- Mayor velocidad de primer contacto
- Mejor conversión de lead a visita

### Sistema de Referidos (módulo dedicado)

Debe permitir:

- Registrar referidor
- Asociar referidor a transacción
- Registrar % y estado de pago de comisión por referido

Campos mínimos:

- Nombre del referidor
- Teléfono
- Porcentaje de comisión
- Propiedad o transacción relacionada
- Estado de pago

### Automatización
- Round robin
- Enrutamiento por zona
- Enrutamiento por tipo de propiedad
- Enrutamiento por experiencia del agente

---

## 4) Gestión del Equipo

Acciones:
- Invitar/remover/suspender agentes
- Cambiar roles
- Ver desempeño y producción
- Revisar carga de leads

### Ficha de agente (mínimo)
- Leads asignados
- Leads convertidos
- Propiedades activas
- Propiedades vendidas
- Valor vendido
- Tiempo medio de respuesta

---

## 5) Pipeline de Transacciones (adaptado RD)

Etapas recomendadas:

`lead recibido → contacto inicial → visita programada → visita realizada → oferta → negociación → reserva → contrato firmado → proceso legal → cierre`

Capacidades:
- Vista completa de oficina
- Estado de cada operación
- Fechas clave
- Documentos por etapa
- Comisión estimada por operación

### Sistema de Reservas (obligatorio en RD)

Muchas operaciones pasan por reserva antes del contrato.

Debe permitir registrar reserva con:

- Cliente
- Unidad o propiedad
- Monto de reserva
- Fecha de reserva
- Método de pago

Estados de reserva:

- `reservada`
- `cancelada`
- `convertida_a_contrato`

### Inventario de Proyectos (constructoras)

Módulo de proyectos para venta sobre inventario directo de desarrolladores.

Cada proyecto incluye:

- Nombre
- Desarrollador
- Ubicación
- Descripción
- Lista de unidades
- Precios
- Disponibilidad

Broker puede:

- Vender unidades
- Registrar reservas
- Ver disponibilidad en tiempo real

Restricción:

- Solo constructora propietaria o `admin/master_admin` puede editar datos estructurales del proyecto.

---

## 6) Perfil Público del Broker

Mostrar:
- Foto profesional
- Nombre de oficina
- Logo de la oficina
- Años de experiencia
- Biografía
- Historia de la empresa
- Zonas
- Idiomas
- Propiedades activas y vendidas
- Calificaciones
- Testimonios

Editable por broker:
- Foto
- Bio
- Contacto
- Redes
- Logo

---

## 7) Marketing Center

MVP:
- Generador de flyers
- Plantillas para redes
- Compartir propiedades con enlaces rastreables
- Compartir en WhatsApp
- Compartir en Instagram
- Compartir en Facebook

Fase 2:
- Campañas email
- Campañas WhatsApp
- Landing pages para proyectos

---

## 8) Reportes y Analíticas

Reportes clave:
- Propiedades más vistas
- Propiedades con más leads
- Productividad por agente
- Conversión por etapa
- Tiempo medio de cierre

Exportables:
- CSV
- PDF

---

## 9) Documentos

Repositorio por entidad (propiedad/transacción/agente):
- Contratos de exclusividad
- Contratos de venta
- Documentos legales
- Acuerdos con constructoras

---

## 10) Notificaciones

Eventos mínimos:
- Nuevo lead
- Cambio de precio
- Propiedad vendida/reservada
- Firma de contrato
- SLA vencido

Canales:
- In-app
- Email
- WhatsApp (fase futura)

---

## 11) Configuración de Oficina

- Perfil de oficina
- Logo
- Dirección y teléfonos
- Reglas de asignación de leads
- Estructura de comisiones
- Permisos internos por rol

---

## Seguridad y Permisos (regla crítica)

Broker puede editar:
- Propiedades de su oficina
- Propiedades de sus agentes (según política)

Broker NO puede editar:
- Propiedades de otras oficinas
- Inventario global del marketplace
- Proyectos globales fuera de su alcance
- Datos privados de otras oficinas

Solo `master_admin` puede:

- Editar todo el marketplace
- Aprobar proyectos globales
- Ejecutar overrides de plataforma

---

## Menú completo del Broker Portal (UI/UX)

## Menú principal
1. Dashboard
2. Propiedades
   - Oficina
   - Agentes
   - Mercado
3. Leads y Clientes
   - Inbox
   - Asignación
   - Automatización
4. Equipo
   - Agentes
   - Rendimiento
5. Transacciones
   - Pipeline
   - Calendario
6. Reportes
7. Marketing
8. Documentos
9. Perfil Público
10. Configuración

## Estructura sugerida de rutas

Para ejecución técnica en dashboard:

- `/master` → Dashboard broker
- `/master/listings` → Propiedades (oficina/agentes/mercado)
- `/master/projects` → Proyectos y unidades
- `/master/leads` → Leads y clientes
- `/master/users` → Equipo
- `/master/transactions` → Pipeline de transacciones
- `/master/marketing` → Marketing center
- `/master/reports` → Reportes
- `/master/documents` → Documentos
- `/master/settings` → Configuración

## Acciones rápidas (header)
- Crear propiedad
- Asignar lead
- Nueva transacción
- Invitar agente

## Filtros persistentes globales
- Zona
- Tipo de propiedad
- Agente
- Estado de operación
- Rango de fechas

---

## KPIs clave para RD

- Valor total de inventario
- Precio promedio por m²
- Días promedio en mercado
- Leads por propiedad
- Conversión de lead a venta
- Ventas por agente
- Ventas por zona
- Pipeline de comisiones
- Demanda por zona
- Tiempo de respuesta por agente

---

## Prioridad de construcción recomendada

### Fase 1 (crítica)
- Dashboard del broker
- Gestión de propiedades
- Gestión de leads
- Gestión de agentes

### Fase 2
- Pipeline de transacciones
- Inventario de proyectos
- Sistema de reservas

### Fase 3
- Marketing center
- Analíticas avanzadas
- Referidos

---

## Plan de implementación sugerido (4 sprints)

## Sprint 1 — Operación diaria
- Dashboard con KPIs RD
- Propiedades (3 categorías)
- Leads: asignación + SLA básico

## Sprint 2 — Productividad del equipo
- Gestión de agentes + scorecards
- Reglas de autoasignación
- Timeline de cliente y notas

## Sprint 3 — Pipeline de cierre
- Pipeline transaccional por etapas RD
- Fechas críticas + documentos
- Comisiones estimadas

## Sprint 4 — Escala comercial
- Reportes exportables
- Marketing center MVP
- Perfil público del broker

---

## Resultado esperado

Si se ejecuta correctamente, Viventa se vuelve el sistema operativo de la oficina inmobiliaria dominicana y reduce dependencia de:

- Excel fragmentado
- WhatsApp sin trazabilidad
- CRMs legacy
- Herramientas aisladas

---

## Nota estratégica final

Viventa en RD debe reemplazar la operación fragmentada (Excel + WhatsApp desordenado + herramientas separadas) por un único sistema operativo de oficina orientado a ejecución diaria.

---

## Integración con ruta activa de ejecución

Este blueprint queda incorporado al execution pipeline como base obligatoria para:

- `DEM-011` Broker Admin RD
- `DEM-012` Agent Portal RD
- `DEM-013` Constructora RD
- `DEM-014` Permissions Core

Regla operativa de implementación:

1. Todo feature nuevo se diseña desde `master_admin` y se hereda por rol con permisos reducidos.
2. Todo endpoint broker/agent/constructora debe aplicar aislamiento server-side por oficina/proyecto.
3. Todo flujo de transacción debe soportar la secuencia operativa RD con reserva previa.
4. Todo módulo de leads debe contemplar contacto WhatsApp-first y trazabilidad de seguimiento.
5. Todo cambio debe actualizar estado en `docs/PLATFORM-DEMAND-COVERAGE-BOARD.md` antes de cierre.
