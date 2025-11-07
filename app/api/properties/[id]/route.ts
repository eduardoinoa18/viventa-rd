// app/api/properties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminDb } from '@/lib/firebaseAdmin'

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
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 })
    }

    const data = snap.data()
    return NextResponse.json({ ok: true, data: { id: snap.id, ...data } })
  } catch (error: any) {
    console.error('Error fetching property:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch property' }, { status: 500 })
  }
}
