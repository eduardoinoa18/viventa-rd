import { cookies } from 'next/headers';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { algoliaClient } from '@/lib/algoliaClient';
import { NextResponse } from 'next/server';

// Deprecated route: Algolia sync disabled. Returning 410 Gone.

/**
 * POST /api/admin/sync-search
 * Syncs all active properties to Algolia search index
 * Admin only
 */







export async function POST() {
  return new Response('Algolia sync disabled', { status: 410 })
}
