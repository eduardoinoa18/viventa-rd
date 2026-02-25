// app/api/projects/[projectId]/units/route.ts
// GET/POST /api/projects/:projectId/units - List, create, or bulk create units

import { NextRequest, NextResponse } from 'next/server';
import { getProjectUnits, createUnit, bulkCreateUnits } from '@/lib/projectService';
import { CreateUnitInput, BulkCreateUnitsInput } from '@/types/project';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || undefined;
    const sortBy = (searchParams.get('sortBy') || undefined) as
      | 'priceUSD'
      | 'meters'
      | 'bedrooms'
      | undefined;
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    const units = await getProjectUnits(projectId, {
      status: status || undefined,
      sortBy,
      sortOrder,
    });

    // Calculate summary
    const summary = {
      total: units.length,
      disponible: units.filter((u) => u.status === 'disponible').length,
      separado: units.filter((u) => u.status === 'separado').length,
      enProceso: units.filter((u) => u.status === 'en-proceso').length,
      vendido: units.filter((u) => u.status === 'vendido').length,
      reservado: units.filter((u) => u.status === 'reservado').length,
      bloqueado: units.filter((u) => u.status === 'bloqueado').length,
    };

    return NextResponse.json({ units, summary });
  } catch (error) {
    console.error('Error listing units:', error);
    return NextResponse.json(
      { error: 'Failed to list units', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await request.json();

    // Check if bulk or single unit
    if (body.units && Array.isArray(body.units)) {
      // Bulk create
      const input = body as BulkCreateUnitsInput;
      const result = await bulkCreateUnits(projectId, input);
      return NextResponse.json({
        status: 'success',
        message: `Created ${result.created} units, ${result.failed} failed`,
        ...result,
      });
    } else {
      // Single unit create
      const input = body as CreateUnitInput;

      if (!input.unitNumber || !input.bedrooms === undefined || !input.bathrooms === undefined || !input.meters || !input.priceUSD) {
        return NextResponse.json(
          { error: 'Missing required unit fields' },
          { status: 400 }
        );
      }

      const unitId = await createUnit(projectId, input);
      return NextResponse.json({
        status: 'success',
        unitId,
        message: 'Unit created successfully',
      });
    }
  } catch (error) {
    console.error('Error creating unit(s):', error);
    return NextResponse.json(
      { error: 'Failed to create unit(s)', details: String(error) },
      { status: 500 }
    );
  }
}
