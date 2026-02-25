// app/api/projects/[projectId]/stats/route.ts
// GET /api/projects/:projectId/stats - Get project statistics

import { NextRequest, NextResponse } from 'next/server';
import { getProjectStats, getUnitInventorySummary } from '@/lib/projectService';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const stats = await getProjectStats(projectId);
    const inventory = await getUnitInventorySummary(projectId);

    if (!stats) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      stats,
      inventory,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: String(error) },
      { status: 500 }
    );
  }
}
