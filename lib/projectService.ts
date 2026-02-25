// lib/projectService.ts
// Firestore operations for projects and units

import { db } from '@/lib/firebaseClient';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
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

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput, developerId: string): Promise<string> {
  try {
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

    const projectsRef = collection(db, 'projects');
    const docRef = await addDoc(projectsRef, projectData);
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
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) return null;

    const projectData = projectDoc.data() as Project;

    // Get units
    const unitsSnapshot = await getDocs(collection(db, `projects/${projectId}/units`));
    const units = unitsSnapshot.docs.map((docSnap: any) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as Unit[];

    // Get promotional offers
    const offersSnapshot = await getDocs(
      query(collection(db, 'promotionalOffers'), where('projectId', '==', projectId))
    );
    const promotionalOffers = offersSnapshot.docs.map((docSnap: any) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));

    // Get financing options
    const financingSnapshot = await getDocs(
      query(collection(db, 'financingOptions'), where('projectId', '==', projectId))
    );
    const financingOptions = financingSnapshot.docs.map((docSnap: any) => ({
      ...docSnap.data(),
      id: docSnap.id,
    }));

    // Calculate stats
    const unitsSold = units.filter((u) => u.status === 'vendido').length;
    const unitsSeparated = units.filter((u) => u.status === 'separado').length;

    // Increment view count
    await updateDoc(doc(db, 'projects', projectId), {
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
    const {
      status = 'active',
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit: pageSize = 20,
    } = options;

    const constraints: any[] = [];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    if (options.constructionStatus) {
      constraints.push(where('constructionStatus', '==', options.constructionStatus));
    }

    if (city) {
      constraints.push(where('location.city', '==', city));
    }

    constraints.push(orderBy(sortBy, sortOrder === 'desc' ? 'desc' : 'asc'));

    const offset = (page - 1) * pageSize;
    constraints.push(limit(pageSize + 1)); // +1 to check if there are more

    const q = query(collection(db, 'projects'), ...constraints);
    const snapshot = await getDocs(q);

    const projects = snapshot.docs.slice(0, pageSize).map((docSnap: any) => ({
      ...docSnap.data(),
      id: docSnap.id,
    })) as Project[];

    const hasMore = snapshot.docs.length > pageSize;
    const total = snapshot.docs.length;

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

    const unitsRef = collection(db, `projects/${projectId}/units`);
    const docRef = await addDoc(unitsRef, unitData);

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
    const results = { created: 0, failed: 0, errors: [] as Array<{ line: number; error: string }> };
    const unitsRef = collection(db, `projects/${projectId}/units`);

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

        await addDoc(unitsRef, unitData);
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
    const unitRef = doc(db, `projects/${projectId}/units`, unitId);
    await updateDoc(unitRef, {
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
    const constraints: any[] = [];

    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options?.sortBy) {
      constraints.push(
        orderBy(options.sortBy, options.sortOrder === 'desc' ? 'desc' : 'asc')
      );
    }

    const q = query(collection(db, `projects/${projectId}/units`), ...constraints);
    const snapshot = await getDocs(q);

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
    const units = await getProjectUnits(projectId);

    const availableUnits = units.filter((u) => u.status === 'disponible').length;
    const smallestUnitMeters = Math.min(...units.map((u) => u.meters));
    const smallestUnitPrice = {
      usd: Math.min(...units.map((u) => u.priceUSD)),
      dop: Math.min(...units.map((u) => u.priceDOP)),
    };

    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      availableUnits,
      smallestUnitMeters,
      smallestUnitPrice,
      updatedAt: new Date(),
    });
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
    const project = await getDoc(doc(db, 'projects', projectId));
    if (!project.exists()) throw new Error('Project not found');

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
