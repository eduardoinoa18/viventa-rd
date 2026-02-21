import { cookies } from 'next/headers';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { algoliaClient } from '@/lib/algoliaClient';
import { NextResponse } from 'next/server';
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

// Deprecated route: Algolia sync disabled. Returning 410 Gone.

/**
 * POST /api/admin/sync-search
 * Syncs all active properties to Algolia search index
 * Admin only
 */







export async function POST() {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN'] })
  if (authResult instanceof Response) return authResult

  return new Response('Algolia sync disabled', { status: 410 })
}
