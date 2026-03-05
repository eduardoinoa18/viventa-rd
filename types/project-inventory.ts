export const PROJECT_STATUSES = ['draft', 'active', 'paused', 'sold_out', 'archived'] as const
export type ProjectLifecycleStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_PUBLISH_MODES = ['private_office', 'multi_broker', 'public_market'] as const
export type ProjectPublishMode = (typeof PROJECT_PUBLISH_MODES)[number]

export const PROJECT_UNIT_STATUSES = ['available', 'reserved', 'sold', 'blocked'] as const
export type ProjectUnitStatus = (typeof PROJECT_UNIT_STATUSES)[number]

export const PROJECT_UNIT_OWNER_TYPES = ['developer_inventory', 'broker_inventory'] as const
export type ProjectUnitOwnerType = (typeof PROJECT_UNIT_OWNER_TYPES)[number]

export const RESERVATION_STATUSES = ['reserved', 'cancelled', 'expired', 'converted_to_contract'] as const
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

export const RESERVATION_PAYMENT_METHODS = ['cash', 'transfer', 'card', 'other'] as const
export type ReservationPaymentMethod = (typeof RESERVATION_PAYMENT_METHODS)[number]

export type ProjectInventoryEventType =
  | 'project_created'
  | 'project_published'
  | 'project_status_changed'
  | 'unit_created'
  | 'unit_status_changed'
  | 'unit_reserved'
  | 'reservation_expired'
  | 'reservation_cancelled'
  | 'reservation_converted'

export interface ProjectLocation {
  city: string
  sector: string
  address?: string
  lat?: number
  lng?: number
}

export interface Project {
  id: string
  name: string
  developerId: string
  developerName: string
  brokerageId?: string | null
  location: ProjectLocation
  currency: 'DOP' | 'USD'
  status: ProjectLifecycleStatus
  publishMode: ProjectPublishMode
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  soldUnits: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectUnit {
  id: string
  projectId: string
  unitCode: string
  phase: string
  propertyType: string
  beds: number
  baths: number
  parking: number
  areaM2: number
  price: number
  maintenanceFee?: number | null
  status: ProjectUnitStatus
  availabilityDate?: Date | null
  ownerType: ProjectUnitOwnerType
  assignedBrokerageId?: string | null
  reservationId?: string | null
  lastStatusChangedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface Reservation {
  id: string
  projectId: string
  unitId: string
  unitCode: string
  clientId?: string | null
  clientName: string
  clientPhone: string
  clientEmail?: string | null
  reservedByUid: string
  reservedByRole: string
  officeId: string
  reservationAmount: number
  currency: 'DOP' | 'USD'
  paymentMethod: ReservationPaymentMethod
  status: ReservationStatus
  expiresAt: Date
  cancelReason?: string | null
  convertedAt?: Date | null
  contractId?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectInventoryEvent {
  id: string
  projectId: string
  unitId?: string | null
  reservationId?: string | null
  eventType: ProjectInventoryEventType
  actorUid: string
  actorRole: string
  officeId?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  reason?: string | null
  createdAt: Date
}

export interface CreateProjectInput {
  name: string
  developerId: string
  developerName: string
  brokerageId?: string | null
  location: ProjectLocation
  currency: 'DOP' | 'USD'
  publishMode?: ProjectPublishMode
  createdBy: string
}

export interface UpdateProjectInput {
  name?: string
  developerName?: string
  brokerageId?: string | null
  location?: Partial<ProjectLocation>
  currency?: 'DOP' | 'USD'
  publishMode?: ProjectPublishMode
  status?: ProjectLifecycleStatus
}

export interface CreateProjectUnitInput {
  projectId: string
  unitCode: string
  phase: string
  propertyType: string
  beds: number
  baths: number
  parking: number
  areaM2: number
  price: number
  maintenanceFee?: number | null
  ownerType: ProjectUnitOwnerType
  assignedBrokerageId?: string | null
  availabilityDate?: Date | null
}

export interface UpdateProjectUnitInput {
  phase?: string
  propertyType?: string
  beds?: number
  baths?: number
  parking?: number
  areaM2?: number
  price?: number
  maintenanceFee?: number | null
  ownerType?: ProjectUnitOwnerType
  assignedBrokerageId?: string | null
  availabilityDate?: Date | null
  status?: ProjectUnitStatus
  reservationId?: string | null
}

export interface ProjectListFilters {
  status?: ProjectLifecycleStatus
  publishMode?: ProjectPublishMode
  developerId?: string
  brokerageId?: string
  city?: string
  limit?: number
}

export interface ProjectUnitListFilters {
  projectId: string
  status?: ProjectUnitStatus
  phase?: string
  minPrice?: number
  maxPrice?: number
  limit?: number
}
