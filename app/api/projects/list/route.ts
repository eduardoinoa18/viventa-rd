// app/api/projects/list/route.ts
// GET /api/projects/list - List projects with filters

import { NextRequest, NextResponse } from 'next/server';
import { listProjects } from '@/lib/projectService';

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing projects:', error);
    return NextResponse.json(
      { error: 'Failed to list projects', details: String(error) },
      { status: 500 }
    );
  }
}
