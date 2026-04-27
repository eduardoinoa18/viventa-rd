import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ingestLead } from '@/lib/leadIngestion'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, type, message } = body

    // Validate required fields
    if (!name || !email || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getAdminDb()
    if (!db) {
      console.error('Firebase Admin not configured; contact form submission blocked')
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 })
    }

    // Save to Firestore
    await db.collection('marketing_leads').add({
      name,
      email,
      phone: phone || '',
      type,
      message: message || '',
      createdAt: new Date(),
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
