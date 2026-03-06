import type { Timestamp } from 'firebase-admin/firestore'
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'
import type {
  Project,
  ProjectUnit,
  Reservation,
  ProjectInventoryEvent,
} from '@/types/project-inventory'
import {
  normalizeProjectStatus,
  normalizeProjectUnitStatus,
  normalizeReservationStatus,
} from './transitions'

/**
 * Firestore document type with Timestamp fields
 */
export type FirestoreProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type FirestoreProjectUnit = Omit<ProjectUnit, 'id' | 'createdAt' | 'updatedAt' | 'lastStatusChangedAt' | 'availabilityDate'> & {
  availabilityDate: Timestamp | null
  lastStatusChangedAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type FirestoreReservation = Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt' | 'convertedAt'> & {
  expiresAt: Timestamp
  convertedAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type FirestoreProjectInventoryEvent = Omit<ProjectInventoryEvent, 'id' | 'createdAt'> & {
  createdAt: Timestamp
}

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts) return null
  return ts.toDate()
}

/**
 * Convert Date to Firestore Timestamp (for writes)
 */
export function dateToTimestamp(date: Date | null | undefined): Timestamp | null {
  if (!date) return null
  return AdminTimestamp.fromDate(date)
}

/**
 * Map Firestore document to Project domain model
 */
export function mapFirestoreToProject(id: string, data: FirestoreProject): Project {
  return {
    id,
    name: data.name,
    developerId: data.developerId,
    developerName: data.developerName,
    brokerageId: data.brokerageId ?? null,
    location: data.location,
    currency: data.currency,
    status: normalizeProjectStatus(data.status),
    publishMode: data.publishMode,
    totalUnits: data.totalUnits,
    availableUnits: data.availableUnits,
    reservedUnits: data.reservedUnits,
    soldUnits: data.soldUnits,
    createdBy: data.createdBy,
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
    updatedAt: timestampToDate(data.updatedAt) ?? new Date(),
  }
}

/**
 * Map Project domain model to Firestore document (without id)
 */
export function mapProjectToFirestore(project: Omit<Project, 'id'>): FirestoreProject {
  return {
    name: project.name,
    developerId: project.developerId,
    developerName: project.developerName,
    brokerageId: project.brokerageId ?? null,
    location: project.location,
    currency: project.currency,
    status: project.status,
    publishMode: project.publishMode,
    totalUnits: project.totalUnits,
    availableUnits: project.availableUnits,
    reservedUnits: project.reservedUnits,
    soldUnits: project.soldUnits,
    createdBy: project.createdBy,
    createdAt: AdminTimestamp.fromDate(project.createdAt),
    updatedAt: AdminTimestamp.fromDate(project.updatedAt),
  }
}

/**
 * Map Firestore document to ProjectUnit domain model
 */
export function mapFirestoreToProjectUnit(id: string, data: FirestoreProjectUnit): ProjectUnit {
  return {
    id,
    projectId: data.projectId,
    unitCode: data.unitCode,
    phase: data.phase,
    propertyType: data.propertyType,
    beds: data.beds,
    baths: data.baths,
    parking: data.parking,
    areaM2: data.areaM2,
    price: data.price,
    maintenanceFee: data.maintenanceFee ?? null,
    status: normalizeProjectUnitStatus(data.status),
    availabilityDate: timestampToDate(data.availabilityDate),
    ownerType: data.ownerType,
    assignedBrokerageId: data.assignedBrokerageId ?? null,
    reservationId: data.reservationId ?? null,
    lastStatusChangedAt: timestampToDate(data.lastStatusChangedAt) ?? new Date(),
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
    updatedAt: timestampToDate(data.updatedAt) ?? new Date(),
  }
}

/**
 * Map ProjectUnit domain model to Firestore document (without id)
 */
export function mapProjectUnitToFirestore(unit: Omit<ProjectUnit, 'id'>): FirestoreProjectUnit {
  return {
    projectId: unit.projectId,
    unitCode: unit.unitCode,
    phase: unit.phase,
    propertyType: unit.propertyType,
    beds: unit.beds,
    baths: unit.baths,
    parking: unit.parking,
    areaM2: unit.areaM2,
    price: unit.price,
    maintenanceFee: unit.maintenanceFee ?? null,
    status: unit.status,
    availabilityDate: dateToTimestamp(unit.availabilityDate),
    ownerType: unit.ownerType,
    assignedBrokerageId: unit.assignedBrokerageId ?? null,
    reservationId: unit.reservationId ?? null,
    lastStatusChangedAt: AdminTimestamp.fromDate(unit.lastStatusChangedAt),
    createdAt: AdminTimestamp.fromDate(unit.createdAt),
    updatedAt: AdminTimestamp.fromDate(unit.updatedAt),
  }
}

/**
 * Map Firestore document to Reservation domain model
 */
export function mapFirestoreToReservation(id: string, data: FirestoreReservation): Reservation {
  return {
    id,
    projectId: data.projectId,
    unitId: data.unitId,
    unitCode: data.unitCode,
    clientId: data.clientId ?? null,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    clientEmail: data.clientEmail ?? null,
    reservedByUid: data.reservedByUid,
    reservedByRole: data.reservedByRole,
    officeId: data.officeId,
    reservationAmount: data.reservationAmount,
    currency: data.currency,
    paymentMethod: data.paymentMethod,
    status: normalizeReservationStatus(data.status),
    expiresAt: timestampToDate(data.expiresAt) ?? new Date(),
    cancelReason: data.cancelReason ?? null,
    convertedAt: timestampToDate(data.convertedAt),
    contractId: data.contractId ?? null,
    notes: data.notes ?? null,
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
    updatedAt: timestampToDate(data.updatedAt) ?? new Date(),
  }
}

/**
 * Map Reservation domain model to Firestore document (without id)
 */
export function mapReservationToFirestore(reservation: Omit<Reservation, 'id'>): FirestoreReservation {
  return {
    projectId: reservation.projectId,
    unitId: reservation.unitId,
    unitCode: reservation.unitCode,
    clientId: reservation.clientId ?? null,
    clientName: reservation.clientName,
    clientPhone: reservation.clientPhone,
    clientEmail: reservation.clientEmail ?? null,
    reservedByUid: reservation.reservedByUid,
    reservedByRole: reservation.reservedByRole,
    officeId: reservation.officeId,
    reservationAmount: reservation.reservationAmount,
    currency: reservation.currency,
    paymentMethod: reservation.paymentMethod,
    status: reservation.status,
    expiresAt: AdminTimestamp.fromDate(reservation.expiresAt),
    cancelReason: reservation.cancelReason ?? null,
    convertedAt: dateToTimestamp(reservation.convertedAt),
    contractId: reservation.contractId ?? null,
    notes: reservation.notes ?? null,
    createdAt: AdminTimestamp.fromDate(reservation.createdAt),
    updatedAt: AdminTimestamp.fromDate(reservation.updatedAt),
  }
}

/**
 * Map Firestore document to ProjectInventoryEvent domain model
 */
export function mapFirestoreToEvent(id: string, data: FirestoreProjectInventoryEvent): ProjectInventoryEvent {
  return {
    id,
    projectId: data.projectId,
    unitId: data.unitId ?? null,
    reservationId: data.reservationId ?? null,
    eventType: data.eventType,
    actorUid: data.actorUid,
    actorRole: data.actorRole,
    officeId: data.officeId ?? null,
    before: data.before ?? null,
    after: data.after ?? null,
    reason: data.reason ?? null,
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
  }
}

/**
 * Map ProjectInventoryEvent domain model to Firestore document (without id)
 */
export function mapEventToFirestore(event: Omit<ProjectInventoryEvent, 'id'>): FirestoreProjectInventoryEvent {
  return {
    projectId: event.projectId,
    unitId: event.unitId ?? null,
    reservationId: event.reservationId ?? null,
    eventType: event.eventType,
    actorUid: event.actorUid,
    actorRole: event.actorRole,
    officeId: event.officeId ?? null,
    before: event.before ?? null,
    after: event.after ?? null,
    reason: event.reason ?? null,
    createdAt: AdminTimestamp.fromDate(event.createdAt),
  }
}
