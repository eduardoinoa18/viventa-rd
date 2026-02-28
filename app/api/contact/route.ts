import { NextRequest, NextResponse } from 'next/server'
import { db, isFirebaseConfigured } from '../../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ingestLead } from '@/lib/leadIngestion'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, type, message } = body

    // Validate required fields
    if (!name || !email || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured || !db) {
      console.error('Firebase not configured; contact form submission blocked')
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 })
    }

    // Save to Firestore
    await addDoc(collection(db, 'marketing_leads'), {
      name,
      email,
      phone: phone || '',
      type,
      message: message || '',
      createdAt: serverTimestamp()
    })

    try {
      await ingestLead({
        type: 'request-info',
        source: 'project',
        sourceId: 'marketing-contact',
        buyerName: name,
        buyerEmail: email,
        buyerPhone: phone,
        message,
        payload: {
          contactType: type,
          legacySource: 'marketing_leads',
        },
      })
    } catch (ingestError) {
      console.error('Lead ingest failed for contact route:', ingestError)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
