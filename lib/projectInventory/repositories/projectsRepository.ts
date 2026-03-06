import type { Firestore } from 'firebase-admin/firestore'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ProjectInventoryError, toProjectInventoryError } from '../errors'
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectListFilters,
  ProjectLifecycleStatus,
} from '@/types/project-inventory'
import {
  mapFirestoreToProject,
  mapProjectToFirestore,
  type FirestoreProject,
} from '../mappers'

const PROJECTS_COLLECTION = 'projects'

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
 * Get a project by ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const db = getDb()
    const docRef = db.collection(PROJECTS_COLLECTION).doc(projectId)
    const doc = await docRef.get()

    if (!doc.exists) return null

    const data = doc.data() as FirestoreProject
    return mapFirestoreToProject(doc.id, data)
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to get project ${projectId}`)
  }
}

/**
 * Get a project by ID, throw if not found
 */
export async function getProjectByIdOrThrow(projectId: string): Promise<Project> {
  const project = await getProjectById(projectId)
  if (!project) {
    throw new ProjectInventoryError({
      code: 'PROJECT_NOT_FOUND',
      message: `Project not found: ${projectId}`,
      status: 404,
    })
  }
  return project
}

/**
 * List projects with filters
 */
export async function listProjects(filters: ProjectListFilters): Promise<Project[]> {
  try {
    const db = getDb()
    let query = db.collection(PROJECTS_COLLECTION) as any

    // Apply filters
    if (filters.status) {
      query = query.where('status', '==', filters.status)
    }
    if (filters.publishMode) {
      query = query.where('publishMode', '==', filters.publishMode)
    }
    if (filters.developerId) {
      query = query.where('developerId', '==', filters.developerId)
    }
    if (filters.brokerageId) {
      query = query.where('brokerageId', '==', filters.brokerageId)
    }
    if (filters.city) {
      query = query.where('location.city', '==', filters.city)
    }

    // Order by creation date and limit
    query = query.orderBy('createdAt', 'desc')
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as FirestoreProject
      return mapFirestoreToProject(doc.id, data)
    })
  } catch (error) {
    throw toProjectInventoryError(error, 'Failed to list projects')
  }
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  try {
    const db = getDb()
    const now = new Date()

    const newProject: Omit<Project, 'id'> = {
      name: input.name,
      developerId: input.developerId,
      developerName: input.developerName,
      brokerageId: input.brokerageId ?? null,
      location: input.location,
      currency: input.currency,
      status: 'draft',
      publishMode: input.publishMode ?? 'private_office',
      totalUnits: 0,
      availableUnits: 0,
      reservedUnits: 0,
      soldUnits: 0,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const firestoreData = mapProjectToFirestore(newProject)
    const docRef = await db.collection(PROJECTS_COLLECTION).add(firestoreData)

    return {
      ...newProject,
      id: docRef.id,
    }
  } catch (error) {
    throw toProjectInventoryError(error, 'Failed to create project')
  }
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  updates: UpdateProjectInput
): Promise<Project> {
  try {
    const db = getDb()
    const docRef = db.collection(PROJECTS_COLLECTION).doc(projectId)

    // Get existing project
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new ProjectInventoryError({
        code: 'PROJECT_NOT_FOUND',
        message: `Project not found: ${projectId}`,
        status: 404,
      })
    }

    const existingData = doc.data() as FirestoreProject

    // Build update payload
    const updatePayload: Record<string, any> = {
      updatedAt: Timestamp.now(),
    }

    if (updates.name !== undefined) updatePayload.name = updates.name
    if (updates.developerName !== undefined) updatePayload.developerName = updates.developerName
    if (updates.brokerageId !== undefined) updatePayload.brokerageId = updates.brokerageId ?? null
    if (updates.currency !== undefined) updatePayload.currency = updates.currency
    if (updates.publishMode !== undefined) updatePayload.publishMode = updates.publishMode
    if (updates.status !== undefined) updatePayload.status = updates.status

    // Handle partial location updates
    if (updates.location) {
      const existingLocation = existingData.location
      updatePayload.location = {
        city: updates.location.city ?? existingLocation.city,
        sector: updates.location.sector ?? existingLocation.sector,
        address: updates.location.address ?? existingLocation.address,
        lat: updates.location.lat ?? existingLocation.lat,
        lng: updates.location.lng ?? existingLocation.lng,
      }
    }

    await docRef.update(updatePayload)

    // Fetch and return updated project
    const updatedDoc = await docRef.get()
    const updatedData = updatedDoc.data() as FirestoreProject
    return mapFirestoreToProject(updatedDoc.id, updatedData)
  } catch (error) {
    if (error instanceof ProjectInventoryError) throw error
    throw toProjectInventoryError(error, `Failed to update project ${projectId}`)
  }
}

/**
 * Update project status with validation
 */
export async function updateProjectStatus(
  projectId: string,
  newStatus: ProjectLifecycleStatus
): Promise<Project> {
  return updateProject(projectId, { status: newStatus })
}

/**
 * Increment/decrement unit counters atomically
 */
export async function updateProjectCounters(
  projectId: string,
  counters: {
    totalUnits?: number
    availableUnits?: number
    reservedUnits?: number
    soldUnits?: number
  }
): Promise<void> {
  try {
    const db = getDb()
    const docRef = db.collection(PROJECTS_COLLECTION).doc(projectId)
    const updatePayload: Record<string, any> = {
      updatedAt: Timestamp.now(),
    }

    if (counters.totalUnits !== undefined) {
      updatePayload.totalUnits = FieldValue.increment(counters.totalUnits)
    }
    if (counters.availableUnits !== undefined) {
      updatePayload.availableUnits = FieldValue.increment(counters.availableUnits)
    }
    if (counters.reservedUnits !== undefined) {
      updatePayload.reservedUnits = FieldValue.increment(counters.reservedUnits)
    }
    if (counters.soldUnits !== undefined) {
      updatePayload.soldUnits = FieldValue.increment(counters.soldUnits)
    }

    await docRef.update(updatePayload)
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to update project counters for ${projectId}`)
  }
}

/**
 * Delete a project (soft delete by archiving)
 */
export async function archiveProject(projectId: string): Promise<void> {
  try {
    await updateProjectStatus(projectId, 'archived')
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to archive project ${projectId}`)
  }
}

/**
 * Check if a project exists
 */
export async function projectExists(projectId: string): Promise<boolean> {
  try {
    const db = getDb()
    const docRef = db.collection(PROJECTS_COLLECTION).doc(projectId)
    const doc = await docRef.get()
    return doc.exists
  } catch (error) {
    throw toProjectInventoryError(error, `Failed to check project existence ${projectId}`)
  }
}
