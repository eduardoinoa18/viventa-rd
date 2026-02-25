// app/api/projects/[projectId]/route.ts
// GET /api/projects/:projectId - Get single project with all details

import { NextRequest, NextResponse } from 'next/server';
import { getProjectDetail } from '@/lib/projectService';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const project = await getProjectDetail(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project', details: String(error) },
      { status: 500 }
    );
  }
}
