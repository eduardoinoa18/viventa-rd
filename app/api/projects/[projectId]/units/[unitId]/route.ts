// app/api/projects/[projectId]/units/[unitId]/route.ts
// PUT /api/projects/:projectId/units/:unitId - Update a specific unit

import { NextRequest, NextResponse } from 'next/server';
import { updateUnit } from '@/lib/projectService';
import { Unit } from '@/types/project';

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; unitId: string } }
) {
  try {
    const { projectId, unitId } = params;
    const body = (await request.json()) as Partial<Unit>;

    // Validate at least one field to update
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Prevent updating certain fields directly
    const restrictedFields = ['id', 'projectId', 'createdAt'];
    for (const field of restrictedFields) {
      if (field in body) {
        return NextResponse.json(
          { error: `Cannot modify field: ${field}` },
          { status: 400 }
        );
      }
    }

    await updateUnit(projectId, unitId, body);

    return NextResponse.json({
      status: 'success',
      message: 'Unit updated successfully',
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    return NextResponse.json(
      { error: 'Failed to update unit', details: String(error) },
      { status: 500 }
    );
  }
}
