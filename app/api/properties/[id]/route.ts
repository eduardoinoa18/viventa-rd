// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function normalizeTimestamp(value: any): string | null {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return null
}

function serializeProperty(id: string, data: any) {
  return {
    id,
    ...data,
    createdAt: normalizeTimestamp(data?.createdAt),
    updatedAt: normalizeTimestamp(data?.updatedAt),
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })
    }

    const snap = await db.collection('properties').doc(id).get()
    if (snap.exists) {
      return NextResponse.json({ ok: true, data: serializeProperty(snap.id, snap.data()) })
    }

    const fallbackSnap = await db
      .collection('properties')
      .where('listingId', '==', id)
      .limit(1)
      .get()

    if (fallbackSnap.empty) {
      return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 })
    }

    const fallbackDoc = fallbackSnap.docs[0]
    return NextResponse.json({ ok: true, data: serializeProperty(fallbackDoc.id, fallbackDoc.data()) })
  } catch (error: any) {
    logger.error('Error fetching property', error)
    return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch property' }, { status: 500 })
  }
}
