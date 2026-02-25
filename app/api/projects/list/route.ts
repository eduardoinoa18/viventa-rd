// app/api/projects/list/route.ts
// GET /api/projects/list - List projects with filters

import { NextRequest, NextResponse } from 'next/server';
import { listProjects } from '@/lib/projectService';
import { db } from '@/lib/firebaseClient';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || 'active';
    const constructionStatus = searchParams.get('constructionStatus') || undefined;
    const city = searchParams.get('city') || undefined;
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as
      | 'createdAt'
      | 'views'
      | 'availableUnits';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await listProjects({
      status,
      constructionStatus,
      city,
      sortBy,
      sortOrder,
      page,
      limit,
    });
    const projectIds = result.projects.map((project) => project.id).filter(Boolean);
    const promotionsByProject: Record<string, boolean> = {};

    if (projectIds.length > 0) {
      const now = Date.now();
      const chunks: string[][] = [];
      for (let i = 0; i < projectIds.length; i += 10) {
        chunks.push(projectIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const offersQuery = query(
          collection(db, 'promotionalOffers'),
          where('projectId', 'in', chunk)
        );
        const offersSnapshot = await getDocs(offersQuery);

        offersSnapshot.forEach((docSnap: any) => {
          const offer = docSnap.data() as any;
          const validFrom = offer.validFrom?.toDate
            ? offer.validFrom.toDate()
            : offer.validFrom
              ? new Date(offer.validFrom)
              : null;
          const validUntil = offer.validUntil?.toDate
            ? offer.validUntil.toDate()
            : offer.validUntil
              ? new Date(offer.validUntil)
              : null;

          const isActive = offer.active !== false;
          const inWindow =
            (!validFrom || validFrom.getTime() <= now) &&
            (!validUntil || validUntil.getTime() >= now);

          if (offer.projectId && isActive && inWindow) {
            promotionsByProject[offer.projectId] = true;
          }
        });
      }
    }

    const projectsWithPromotion = result.projects.map((project) => ({
      ...project,
      hasPromotion: promotionsByProject[project.id] || false,
    }));

    return NextResponse.json({
      ...result,
      projects: projectsWithPromotion,
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    return NextResponse.json(
      { error: 'Failed to list projects', details: String(error) },
      { status: 500 }
    );
  }
}
