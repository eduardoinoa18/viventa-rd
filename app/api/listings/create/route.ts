// app/api/listings/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { propertyData, agentId, agentEmail } = body

    if (!agentId || !propertyData) {
      return NextResponse.json({ ok: false, error: 'Missing required data' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Firebase Admin not initialized' }, { status: 500 })
    }

    // Generate listing ID
    const year = new Date().getFullYear()
    const countersRef = adminDb.collection('counters').doc('listings')
    const listingId = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(countersRef)
      const data = snap.exists ? snap.data() as Record<string, number> : {}
      const current = data[String(year)] || 0
      const next = current + 1
      if (!snap.exists) {
        tx.set(countersRef, { [String(year)]: next })
      } else {
        tx.update(countersRef, { [String(year)]: next })
      }
      return `VIV-${year}-${String(next).padStart(6, '0')}`
    })

    // Add timestamps
    const dataWithTimestamps = {
      ...propertyData,
      listingId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    // Create property document
    const docRef = await adminDb.collection('properties').add(dataWithTimestamps)

    // Send notification email (fire-and-forget)
    fetch(new URL('/api/listings/email', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'received',
        listingId: docRef.id,
        listingTitle: propertyData.title,
        agentEmail,
        agentName: propertyData.agentName || agentEmail
      })
    }).catch(() => {})

    return NextResponse.json({ 
      ok: true, 
      listingId: docRef.id,
      message: 'Propiedad creada exitosamente'
    })

  } catch (error: any) {
    console.error('Listing creation error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Error al crear la propiedad' 
    }, { status: 500 })
  }
}
