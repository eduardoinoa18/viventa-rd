import type { Firestore } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ProjectInventoryError, toProjectInventoryError } from '../errors'
import type {
  ProjectInventoryEvent,
  ProjectInventoryEventType,
} from '@/types/project-inventory'
import {
  mapFirestoreToEvent,
  mapEventToFirestore,
  type FirestoreProjectInventoryEvent,
} from '../mappers'

const EVENTS_COLLECTION = 'project_inventory_events'

/**
 * Get Firestore instance with error handling
 */
function getDb(): Firestore {
  const db = getAdminDb()
  if (!db) {
    throw new ProjectInventoryError({
      code: 'FIRESTORE_OPERATION_FAILED',
      message: 'Firestore Admin not initialized',
      status: 500,
    })
  }
  return db
}

/**
 * Create a new audit event
 */
export async function createEvent(params: {
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
}): Promise<ProjectInventoryEvent> {
  try {
    const db = getDb()
    const now = new Date()

    const newEvent: Omit<ProjectInventoryEvent, 'id'> = {
      projectId: params.projectId,
      unitId: params.unitId ?? null,
      reservationId: params.reservationId ?? null,
      eventType: params.eventType,
      actorUid: params.actorUid,
      actorRole: params.actorRole,
      officeId: params.officeId ?? null,
      before: params.before ?? null,
      after: params.after ?? null,
      reason: params.reason ?? null,
      createdAt: now,
    }

    const firestoreData = mapEventToFirestore(newEvent)
    const docRef = await db.collection(EVENTS_COLLECTION).add(firestoreData)

    return {
      ...newEvent,
      id: docRef.id,
    }
  } catch (error) {
    throw toProjectInventoryError(error, 'Failed to create inventory event')
  }
}

/**
 * Get events for a project
 */
export async function getProjectEvents(
  projectId: string,
  limit?: number
): Promise<ProjectInventoryEvent[]> {
  try {
    const db = getDb()
    let query = db
      .collection(EVENTS_COLLECTION)
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc') as any

    if (limit) {
      query = query.limit(limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as FirestoreProjectInventoryEvent
      return mapFirestoreToEvent(doc.id, data)
    })
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to get events for project ${projectId}`)
  }
}

/**
 * Get events for a specific unit
 */
export async function getUnitEvents(
  projectId: string,
  unitId: string,
  limit?: number
): Promise<ProjectInventoryEvent[]> {
  try {
    const db = getDb()
    let query = db
      .collection(EVENTS_COLLECTION)
      .where('projectId', '==', projectId)
      .where('unitId', '==', unitId)
      .orderBy('createdAt', 'desc') as any

    if (limit) {
      query = query.limit(limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as FirestoreProjectInventoryEvent
      return mapFirestoreToEvent(doc.id, data)
    })
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to get events for unit ${unitId}`)
  }
}

/**
 * Get events for a specific reservation
 */
export async function getReservationEvents(
  reservationId: string,
  limit?: number
): Promise<ProjectInventoryEvent[]> {
  try {
    const db = getDb()
    let query = db
      .collection(EVENTS_COLLECTION)
      .where('reservationId', '==', reservationId)
      .orderBy('createdAt', 'desc') as any

    if (limit) {
      query = query.limit(limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as FirestoreProjectInventoryEvent
      return mapFirestoreToEvent(doc.id, data)
    })
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to get events for reservation ${reservationId}`)
  }
}

/**
 * Get events by type across projects (for analytics)
 */
export async function getEventsByType(
  eventType: ProjectInventoryEventType,
  limit?: number
): Promise<ProjectInventoryEvent[]> {
  try {
    const db = getDb()
    let query = db
      .collection(EVENTS_COLLECTION)
      .where('eventType', '==', eventType)
      .orderBy('createdAt', 'desc') as any

    if (limit) {
      query = query.limit(limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as FirestoreProjectInventoryEvent
      return mapFirestoreToEvent(doc.id, data)
    })
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to get events by type ${eventType}`)
  }
}

/**
 * Get events by actor (for audit trail)
 */
export async function getEventsByActor(
  actorUid: string,
  limit?: number
): Promise<ProjectInventoryEvent[]> {
  try {
    const db = getDb()
    let query = db
      .collection(EVENTS_COLLECTION)
      .where('actorUid', '==', actorUid)
      .orderBy('createdAt', 'desc') as any

    if (limit) {
      query = query.limit(limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as FirestoreProjectInventoryEvent
      return mapFirestoreToEvent(doc.id, data)
    })
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to get events by actor ${actorUid}`)
  }
}

/**
 * Get events for an office (for broker management)
 */
export async function getOfficeEvents(
  officeId: string,
  limit?: number
): Promise<ProjectInventoryEvent[]> {
  try {
    const db = getDb()
    let query = db
      .collection(EVENTS_COLLECTION)
      .where('officeId', '==', officeId)
      .orderBy('createdAt', 'desc') as any

    if (limit) {
      query = query.limit(limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as FirestoreProjectInventoryEvent
      return mapFirestoreToEvent(doc.id, data)
    })
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to get events for office ${officeId}`)
  }
}

/**
 * Helper: Log project creation
 */
export async function logProjectCreated(params: {
  projectId: string
  actorUid: string
  actorRole: string
  projectData: Record<string, unknown>
}): Promise<void> {
  await createEvent({
    projectId: params.projectId,
    eventType: 'project_created',
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    after: params.projectData,
  })
}

/**
 * Helper: Log project status change
 */
export async function logProjectStatusChanged(params: {
  projectId: string
  actorUid: string
  actorRole: string
  oldStatus: string
  newStatus: string
  reason?: string
}): Promise<void> {
  await createEvent({
    projectId: params.projectId,
    eventType: 'project_status_changed',
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    before: { status: params.oldStatus },
    after: { status: params.newStatus },
    reason: params.reason,
  })
}

/**
 * Helper: Log project published
 */
export async function logProjectPublished(params: {
  projectId: string
  actorUid: string
  actorRole: string
  publishMode: string
}): Promise<void> {
  await createEvent({
    projectId: params.projectId,
    eventType: 'project_published',
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    after: { publishMode: params.publishMode },
  })
}

/**
 * Helper: Log unit created
 */
export async function logUnitCreated(params: {
  projectId: string
  unitId: string
  actorUid: string
  actorRole: string
  officeId?: string
  unitData: Record<string, unknown>
}): Promise<void> {
  await createEvent({
    projectId: params.projectId,
    unitId: params.unitId,
    eventType: 'unit_created',
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    officeId: params.officeId,
    after: params.unitData,
  })
}

/**
 * Helper: Log unit status change
 */
export async function logUnitStatusChanged(params: {
  projectId: string
  unitId: string
  actorUid: string
  actorRole: string
  officeId?: string
  oldStatus: string
  newStatus: string
  reason?: string
}): Promise<void> {
  await createEvent({
    projectId: params.projectId,
    unitId: params.unitId,
    eventType: 'unit_status_changed',
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    officeId: params.officeId,
    before: { status: params.oldStatus },
    after: { status: params.newStatus },
    reason: params.reason,
  })
}

/**
 * Helper: Log unit reserved
 */
export async function logUnitReserved(params: {
  projectId: string
  unitId: string
  reservationId: string
  actorUid: string
  actorRole: string
  officeId: string
  clientName: string
  reservationAmount: number
}): Promise<void> {
  await createEvent({
    projectId: params.projectId,
    unitId: params.unitId,
    reservationId: params.reservationId,
    eventType: 'unit_reserved',
    actorUid: params.actorUid,
    actorRole: params.actorRole,
    officeId: params.officeId,
    after: {
      clientName: params.clientName,
      reservationAmount: params.reservationAmount,
    },
  })
}
