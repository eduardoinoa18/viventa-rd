// lib/projectService.ts
// Firestore operations for projects and units

import { getAdminDb } from '@/lib/firebaseAdmin';
import type { Query } from 'firebase-admin/firestore';
import {
  Project,
  Unit,
  ProjectDetail,
  CreateProjectInput,
  CreateUnitInput,
  BulkCreateUnitsInput,
  UnitInventorySummary,
  ProjectStats,
} from '@/types/project';

function getDbOrThrow() {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Admin Firestore not initialized');
  }
  return db;
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput, developerId: string): Promise<string> {
  try {
    const db = getDbOrThrow();

    const projectData: Omit<Project, 'id'> = {
      developerId,
      name: input.name,
      description: input.description,
      shortDescription: input.shortDescription,
      location: {
        city: input.city,
        sector: input.sector,
        address: input.address,
      },
      coordinates: {
        latitude: input.latitude,
        longitude: input.longitude,
      },
      googleMapsUrl: input.googleMapsUrl,
      status: 'active',
      constructionStatus: input.constructionStatus,
      deliveryDate: new Date(input.deliveryDate),
      completionPercent: input.constructionStatus === 'entregado' ? 100 : 0,
      totalUnits: input.totalUnits,
      availableUnits: input.totalUnits,
      images: input.images,
      featuredImage: input.images[0] || '',
      amenities: input.amenities,
      features: [],
      verificationStatus: 'unverified',
      views: 0,
      favorites: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('projects').add(projectData as any);
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Get single project with all related data
 */
export async function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  try {
    const db = getDbOrThrow();

    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) return null;

    const projectData = projectDoc.data() as Project;

    // Get units
    const unitsSnapshot = await db.collection('projects').doc(projectId).collection('units').get();
    const units = unitsSnapshot.docs.map((docSnap: any) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as Unit[];

    // Get promotional offers
    const offersSnapshot = await db
      .collection('promotionalOffers')
      .where('projectId', '==', projectId)
      .get();
    const promotionalOffers = offersSnapshot.docs.map((docSnap: any) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));

    // Get financing options
    const financingSnapshot = await db
      .collection('financingOptions')
      .where('projectId', '==', projectId)
      .get();
    const financingOptions = financingSnapshot.docs.map((docSnap: any) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));

    // Calculate stats
    const unitsSold = units.filter((u) => u.status === 'vendido').length;
    const unitsSeparated = units.filter((u) => u.status === 'separado').length;

    // Increment view count
    await db.collection('projects').doc(projectId).update({
      views: (projectData.views || 0) + 1,
    });

    return {
      ...projectData,
      id: projectId,
      units,
      promotionalOffers,
      financingOptions,
      stats: {
        viewsLastWeek: projectData.views || 0,
        favoritesCount: projectData.favorites || 0,
        unitsSeparated,
        unitsSold,
      },
    };
  } catch (error) {
    console.error('Error getting project detail:', error);
    throw error;
  }
}

/**
 * List projects with filters and pagination
 */
export async function listProjects(options: {
  status?: string;
  constructionStatus?: string;
  city?: string;
  sortBy?: 'createdAt' | 'views' | 'availableUnits';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<{ projects: Project[]; total: number; page: number; hasMore: boolean }> {
  try {
    const db = getDbOrThrow();

    const {
      status = 'active',
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit: pageSize = 20,
    } = options;

    let q = db.collection('projects') as Query;

    if (status) {
      q = q.where('status', '==', status);
    }

    if (options.constructionStatus) {
      q = q.where('constructionStatus', '==', options.constructionStatus);
    }

    if (city) {
      q = q.where('location.city', '==', city);
    }

    let snapshot: any = null
    try {
      const ordered = q.orderBy(sortBy, sortOrder === 'desc' ? 'desc' : 'asc').limit(pageSize + 1)
      snapshot = await ordered.get()
    } catch (error: any) {
      const message = String(error?.message || '')
      const missingIndex =
        message.toLowerCase().includes('requires an index') ||
        message.toLowerCase().includes('failed-precondition') ||
        message.toLowerCase().includes('the query requires an index')

      if (!missingIndex) throw error

      // Fallback path: fetch by filters only, then sort in memory.
      const fallbackLimit = Math.min(Math.max(pageSize * Math.max(page, 1) + 1, pageSize + 1), 400)
      snapshot = await q.limit(fallbackLimit).get()
    }

    const rows = snapshot.docs.map((docSnap: any) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as Project[]

    const sorted = [...rows].sort((a: any, b: any) => {
      const aVal = Number(a?.[sortBy] || 0)
      const bVal = Number(b?.[sortBy] || 0)
      if (sortBy === 'createdAt') {
        const aTime = a?.createdAt?.toDate?.()?.getTime?.() || new Date(a?.createdAt || 0).getTime() || 0
        const bTime = b?.createdAt?.toDate?.()?.getTime?.() || new Date(b?.createdAt || 0).getTime() || 0
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    const start = Math.max(0, (page - 1) * pageSize)
    const projects = sorted.slice(start, start + pageSize)
    const hasMore = sorted.length > start + pageSize
    const total = sorted.length

    return { projects, total, page, hasMore };
  } catch (error) {
    console.error('Error listing projects:', error);
    throw error;
  }
}

/**
 * Create a single unit
 */
export async function createUnit(projectId: string, input: CreateUnitInput): Promise<string> {
  try {
    const db = getDbOrThrow();

    const pricePerM2 = input.priceUSD / input.meters;

    const unitData: Omit<Unit, 'id'> = {
      projectId,
      unitNumber: input.unitNumber,
      unitType: input.unitType,
      floor: input.floor,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      meters: input.meters,
      lotMeters: input.lotMeters,
      priceUSD: input.priceUSD,
      priceDOP: input.priceDOP || input.priceUSD * 58, // Default DOP rate
      pricePerM2,
      status: 'disponible',
      separationAmount: input.separationAmount
        ? { usd: input.separationAmount }
        : undefined,
      initialPercent: input.initialPercent || 20,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('projects').doc(projectId).collection('units').add(unitData as any);

    // Update project metadata
    await updateProjectMetadata(projectId);

    return docRef.id;
  } catch (error) {
    console.error('Error creating unit:', error);
    throw error;
  }
}

/**
 * Bulk create units
 */
export async function bulkCreateUnits(
  projectId: string,
  input: BulkCreateUnitsInput
): Promise<{ created: number; failed: number; errors: Array<{ line: number; error: string }> }> {
  try {
    const db = getDbOrThrow();

    const results = { created: 0, failed: 0, errors: [] as Array<{ line: number; error: string }> };
    const unitsRef = db.collection('projects').doc(projectId).collection('units');

    for (let i = 0; i < input.units.length; i++) {
      try {
        const unit = input.units[i];
        const pricePerM2 = unit.priceUSD / unit.meters;

        const unitData: Omit<Unit, 'id'> = {
          projectId,
          unitNumber: unit.unitNumber,
          unitType: unit.unitType,
          floor: unit.floor,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          meters: unit.meters,
          lotMeters: unit.lotMeters,
          priceUSD: unit.priceUSD,
          priceDOP: unit.priceDOP || unit.priceUSD * 58,
          pricePerM2,
          status: 'disponible',
          separationAmount: unit.separationAmount
            ? { usd: unit.separationAmount }
            : undefined,
          initialPercent: unit.initialPercent || 20,
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await unitsRef.add(unitData as any);
        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          line: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update project metadata once
    await updateProjectMetadata(projectId);

    return results;
  } catch (error) {
    console.error('Error bulk creating units:', error);
    throw error;
  }
}

/**
 * Update unit status or properties
 */
export async function updateUnit(
  projectId: string,
  unitId: string,
  updates: Partial<Unit>
): Promise<void> {
  try {
    const db = getDbOrThrow();

    const unitRef = db.collection('projects').doc(projectId).collection('units').doc(unitId);
    await unitRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    // Update project metadata if status changed
    await updateProjectMetadata(projectId);
  } catch (error) {
    console.error('Error updating unit:', error);
    throw error;
  }
}

/**
 * Get all units for a project (with optional filters)
 */
export async function getProjectUnits(
  projectId: string,
  options?: {
    status?: string;
    sortBy?: 'priceUSD' | 'meters' | 'bedrooms';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<Unit[]> {
  try {
    const db = getDbOrThrow();

    let q = db.collection('projects').doc(projectId).collection('units') as Query;

    if (options?.status) {
      q = q.where('status', '==', options.status);
    }

    if (options?.sortBy) {
      q = q.orderBy(options.sortBy, options.sortOrder === 'desc' ? 'desc' : 'asc');
    }

    const snapshot = await q.get();

    return snapshot.docs.map((docSnap: any) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as Unit[];
  } catch (error) {
    console.error('Error getting project units:', error);
    throw error;
  }
}

/**
 * Get unit inventory summary for a project
 */
export async function getUnitInventorySummary(projectId: string): Promise<UnitInventorySummary> {
  try {
    const units = await getProjectUnits(projectId);

    const summary: UnitInventorySummary = {
      total: units.length,
      disponible: units.filter((u) => u.status === 'disponible').length,
      separado: units.filter((u) => u.status === 'separado').length,
      enProceso: units.filter((u) => u.status === 'en-proceso').length,
      vendido: units.filter((u) => u.status === 'vendido').length,
      reservado: units.filter((u) => u.status === 'reservado').length,
      bloqueado: units.filter((u) => u.status === 'bloqueado').length,
    };

    return summary;
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    throw error;
  }
}

/**
 * Update project metadata (availableUnits, smallestPrice, smallestMeters)
 * Call this after any unit is created/updated/deleted
 */
export async function updateProjectMetadata(projectId: string): Promise<void> {
  try {
    const db = getDbOrThrow();

    const units = await getProjectUnits(projectId);

    const availableUnits = units.filter((u) => u.status === 'disponible').length;
    const metadataUpdate: Record<string, unknown> = {
      availableUnits,
      updatedAt: new Date(),
    };

    if (units.length > 0) {
      metadataUpdate.smallestUnitMeters = Math.min(...units.map((u) => u.meters));
      metadataUpdate.smallestUnitPrice = {
        usd: Math.min(...units.map((u) => u.priceUSD)),
        dop: Math.min(...units.map((u) => u.priceDOP)),
      };
    }

    await db.collection('projects').doc(projectId).update(metadataUpdate);
  } catch (error) {
    console.error('Error updating project metadata:', error);
    throw error;
  }
}

/**
 * Get project statistics
 */
export async function getProjectStats(projectId: string): Promise<ProjectStats> {
  try {
    const db = getDbOrThrow();

    const project = await db.collection('projects').doc(projectId).get();
    if (!project.exists) throw new Error('Project not found');

    const projectData = project.data() as Project;
    const units = await getProjectUnits(projectId);

    const unitsSold = units.filter((u) => u.status === 'vendido').length;
    const unitsSeparated = units.filter((u) => u.status === 'separado').length;
    const availableUnits = units.filter((u) => u.status === 'disponible').length;

    const totalRevenue = units
      .filter((u) => u.status === 'vendido')
      .reduce(
        (acc, u) => ({
          usd: acc.usd + u.priceUSD,
          dop: acc.dop + u.priceDOP,
        }),
        { usd: 0, dop: 0 }
      );

    return {
      projectId,
      views: projectData.views || 0,
      viewsLastWeek: projectData.views || 0,
      favorites: projectData.favorites || 0,
      unitsSold,
      unitsSeparated,
      availableUnits,
      revenue: totalRevenue,
    };
  } catch (error) {
    console.error('Error getting project stats:', error);
    throw error;
  }
}
