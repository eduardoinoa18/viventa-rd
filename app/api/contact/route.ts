import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, type, message } = body

    // Validate required fields
    if (!name || !email || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // TODO: Send email via SendGrid to admin_emails
    // await sendEmailNotification({ name, email, type, message })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
