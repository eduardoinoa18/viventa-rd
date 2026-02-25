// app/api/projects/create/route.ts
// POST /api/projects/create - Create new project

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebaseClient';
import { createProject } from '@/lib/projectService';
import { CreateProjectInput } from '@/types/project';

export async function POST(request: NextRequest) {
  try {
    // Auth check (for developer/admin)
    // In production, verify auth token from request
    const body = (await request.json()) as CreateProjectInput;

    // Validation
    const requiredFields = [
      'name',
      'description',
      'city',
      'sector',
      'address',
      'latitude',
      'longitude',
      'googleMapsUrl',
      'totalUnits',
      'constructionStatus',
      'deliveryDate',
      'amenities',
      'images',
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof CreateProjectInput]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (body.name.length < 3) {
      return NextResponse.json(
        { error: 'Project name must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (body.description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    // For now, use hardcoded developerId (in production, get from auth token)
    const developerId = 'mock-developer-id'; // TODO: Get from auth

    const projectId = await createProject(body, developerId);

    return NextResponse.json({
      status: 'success',
      projectId,
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: String(error) },
      { status: 500 }
    );
  }
}
