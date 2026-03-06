import type { Firestore } from 'firebase-admin/firestore'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ProjectInventoryError, toProjectInventoryError } from '../errors'
import type {
  ProjectUnit,
  CreateProjectUnitInput,
  UpdateProjectUnitInput,
  ProjectUnitListFilters,
  ProjectUnitStatus,
} from '@/types/project-inventory'
import {
  dateToTimestamp,
  mapFirestoreToProjectUnit,
  mapProjectUnitToFirestore,
  type FirestoreProjectUnit,
} from '../mappers'

const PROJECTS_COLLECTION = 'projects'
const UNITS_SUBCOLLECTION = 'units'

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
 * Get a unit by ID
 */
export async function getUnitById(projectId: string, unitId: string): Promise<ProjectUnit | null> {
  try {
    const db = getDb()
    const docRef = db
      .collection(PROJECTS_COLLECTION)
      .doc(projectId)
      .collection(UNITS_SUBCOLLECTION)
      .doc(unitId)
    const doc = await docRef.get()

    if (!doc.exists) return null

    const data = doc.data() as FirestoreProjectUnit
    return mapFirestoreToProjectUnit(doc.id, data)
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to get unit ${unitId} in project ${projectId}`)
  }
}

/**
 * Get a unit by ID, throw if not found
 */
export async function getUnitByIdOrThrow(projectId: string, unitId: string): Promise<ProjectUnit> {
  const unit = await getUnitById(projectId, unitId)
  if (!unit) {
    throw new ProjectInventoryError({
      code: 'UNIT_NOT_FOUND',
      message: `Unit not found: ${unitId} in project ${projectId}`,
      status: 404,
    })
  }
  return unit
}

/**
 * List units for a project with filters
 */
export async function listUnits(filters: ProjectUnitListFilters): Promise<ProjectUnit[]> {
  try {
    const db = getDb()
    let query = db
      .collection(PROJECTS_COLLECTION)
      .doc(filters.projectId)
      .collection(UNITS_SUBCOLLECTION) as any

    // Apply filters
    if (filters.status) {
      query = query.where('status', '==', filters.status)
    }
    if (filters.phase) {
      query = query.where('phase', '==', filters.phase)
    }
    if (filters.minPrice !== undefined) {
      query = query.where('price', '>=', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.where('price', '<=', filters.maxPrice)
    }

    // Order by unit code and limit
    query = query.orderBy('unitCode', 'asc')
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as FirestoreProjectUnit
      return mapFirestoreToProjectUnit(doc.id, data)
    })
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to list units for project ${filters.projectId}`)
  }
}

/**
 * Check if unit code exists in project (for uniqueness validation)
 */
export async function unitCodeExists(projectId: string, unitCode: string): Promise<boolean> {
  try {
    const db = getDb()
    const snapshot = await db
      .collection(PROJECTS_COLLECTION)
      .doc(projectId)
      .collection(UNITS_SUBCOLLECTION)
      .where('unitCode', '==', unitCode)
      .limit(1)
      .get()

    return !snapshot.empty
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to check unit code existence: ${unitCode}`)
  }
}

/**
 * Create a new unit
 */
export async function createUnit(input: CreateProjectUnitInput): Promise<ProjectUnit> {
  try {
    const db = getDb()
    const now = new Date()

    // Check unit code uniqueness
    const exists = await unitCodeExists(input.projectId, input.unitCode)
    if (exists) {
      throw new ProjectInventoryError({
        code: 'DUPLICATE_UNIT_CODE',
        message: `Unit code ${input.unitCode} already exists in project ${input.projectId}`,
        status: 400,
      })
    }

    const newUnit: Omit<ProjectUnit, 'id'> = {
      projectId: input.projectId,
      unitCode: input.unitCode,
      phase: input.phase,
      propertyType: input.propertyType,
      beds: input.beds,
      baths: input.baths,
      parking: input.parking,
      areaM2: input.areaM2,
      price: input.price,
      maintenanceFee: input.maintenanceFee ?? null,
      status: 'available',
      availabilityDate: input.availabilityDate ?? null,
      ownerType: input.ownerType,
      assignedBrokerageId: input.assignedBrokerageId ?? null,
      reservationId: null,
      lastStatusChangedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    const firestoreData = mapProjectUnitToFirestore(newUnit)
    const docRef = await db
      .collection(PROJECTS_COLLECTION)
      .doc(input.projectId)
      .collection(UNITS_SUBCOLLECTION)
      .add(firestoreData)

    return {
      ...newUnit,
      id: docRef.id,
    }
  } catch (error) {
    if (error instanceof ProjectInventoryError) throw error
    throw toProjectInventoryError(error, 'Failed to create unit')
  }
}

/**
 * Update a unit
 */
export async function updateUnit(
  projectId: string,
  unitId: string,
  updates: UpdateProjectUnitInput
): Promise<ProjectUnit> {
  try {
    const db = getDb()
    const docRef = db
      .collection(PROJECTS_COLLECTION)
      .doc(projectId)
      .collection(UNITS_SUBCOLLECTION)
      .doc(unitId)

    // Get existing unit
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new ProjectInventoryError({
        code: 'UNIT_NOT_FOUND',
        message: `Unit not found: ${unitId} in project ${projectId}`,
        status: 404,
      })
    }

    const existingData = doc.data() as FirestoreProjectUnit

    // Build update payload
    const updatePayload: Record<string, any> = {
      updatedAt: Timestamp.now(),
    }

    if (updates.phase !== undefined) updatePayload.phase = updates.phase
    if (updates.propertyType !== undefined) updatePayload.propertyType = updates.propertyType
    if (updates.beds !== undefined) updatePayload.beds = updates.beds
    if (updates.baths !== undefined) updatePayload.baths = updates.baths
    if (updates.parking !== undefined) updatePayload.parking = updates.parking
    if (updates.areaM2 !== undefined) updatePayload.areaM2 = updates.areaM2
    if (updates.price !== undefined) updatePayload.price = updates.price
    if (updates.maintenanceFee !== undefined) updatePayload.maintenanceFee = updates.maintenanceFee ?? null
    if (updates.ownerType !== undefined) updatePayload.ownerType = updates.ownerType
    if (updates.assignedBrokerageId !== undefined) updatePayload.assignedBrokerageId = updates.assignedBrokerageId ?? null
    if (updates.availabilityDate !== undefined) {
      updatePayload.availabilityDate = dateToTimestamp(updates.availabilityDate)
    }
    if (updates.reservationId !== undefined) updatePayload.reservationId = updates.reservationId ?? null

    // Track status changes
    if (updates.status !== undefined && updates.status !== existingData.status) {
      updatePayload.status = updates.status
      updatePayload.lastStatusChangedAt = Timestamp.now()
    }

    await docRef.update(updatePayload)

    // Fetch and return updated unit
    const updatedDoc = await docRef.get()
    const updatedData = updatedDoc.data() as FirestoreProjectUnit
    return mapFirestoreToProjectUnit(updatedDoc.id, updatedData)
  } catch (error) {
    if (error instanceof ProjectInventoryError) throw error
    throw toProjectInventoryError(error, `Failed to update unit ${unitId} in project ${projectId}`)
  }
}

/**
 * Update unit status with validation
 */
export async function updateUnitStatus(
  projectId: string,
  unitId: string,
  newStatus: ProjectUnitStatus
): Promise<ProjectUnit> {
  return updateUnit(projectId, unitId, { status: newStatus })
}

/**
 * Link a reservation to a unit
 */
export async function linkReservationToUnit(
  projectId: string,
  unitId: string,
  reservationId: string
): Promise<ProjectUnit> {
  return updateUnit(projectId, unitId, {
    status: 'reserved',
    reservationId,
  })
}

/**
 * Unlink a reservation from a unit (when cancelled/expired)
 */
export async function unlinkReservationFromUnit(
  projectId: string,
  unitId: string
): Promise<ProjectUnit> {
  return updateUnit(projectId, unitId, {
    status: 'available',
    reservationId: null,
  })
}

/**
 * Mark a unit as sold
 */
export async function markUnitAsSold(
  projectId: string,
  unitId: string
): Promise<ProjectUnit> {
  return updateUnit(projectId, unitId, {
    status: 'sold',
    reservationId: null,
  })
}

/**
 * Delete a unit (hard delete - use with caution)
 */
export async function deleteUnit(projectId: string, unitId: string): Promise<void> {
  try {
    const db = getDb()
    const docRef = db
      .collection(PROJECTS_COLLECTION)
      .doc(projectId)
      .collection(UNITS_SUBCOLLECTION)
      .doc(unitId)

    await docRef.delete()
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to delete unit ${unitId} in project ${projectId}`)
  }
}

/**
 * Count units by status for a project
 */
export async function countUnitsByStatus(projectId: string): Promise<Record<ProjectUnitStatus, number>> {
  try {
    const db = getDb()
    const snapshot = await db
      .collection(PROJECTS_COLLECTION)
      .doc(projectId)
      .collection(UNITS_SUBCOLLECTION)
      .get()

    const counts: Record<ProjectUnitStatus, number> = {
      available: 0,
      reserved: 0,
      sold: 0,
      blocked: 0,
    }

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as FirestoreProjectUnit
      const status = data.status as ProjectUnitStatus
      if (status in counts) {
        counts[status]++
      }
    })

    return counts
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to count units by status for project ${projectId}`)
  }
}
