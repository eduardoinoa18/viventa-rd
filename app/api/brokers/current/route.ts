import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()

    if (!db) {
      return NextResponse.json({ ok: false, error: 'Service unavailable' }, { status: 500 })
    }

    // Get session from request
    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    const uid = session.uid

    // Get the user document
    const userDoc = await db.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data() || {}

    // Verify they are a broker
    if (String(userData.role || '').toLowerCase() !== 'broker') {
      return NextResponse.json({ ok: false, error: 'Not a broker' }, { status: 403 })
    }

    // Return the broker profile
    const broker = {
      id: uid,
      company: userData.company || userData.brokerName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      website: userData.website || '',
      description: userData.description || userData.bio || '',
      logo: userData.logo || userData.logoUrl || '',
      city: userData.city || '',
      areasServed: Array.isArray(userData.areasServed) ? userData.areasServed : [],
      languages: Array.isArray(userData.languages) ? userData.languages : [],
      yearsEstablished: userData.yearsEstablished || 0,
      slug: userData.slug || '',
      publicProfileEnabled: userData.publicProfileEnabled !== false,
      professionalCode: userData.professionalCode || userData.brokerCode || '',
      officeAddress: userData.officeAddress || '',
    }

    return NextResponse.json({ ok: true, broker })
  } catch (error) {
    console.error('Error fetching broker profile:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getAdminDb()

    if (!db) {
      return NextResponse.json({ ok: false, error: 'Service unavailable' }, { status: 500 })
    }

    // Get session from request
    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    const uid = session.uid

    // Get the user document
    const userDoc = await db.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data() || {}

    // Verify they are a broker
    if (String(userData.role || '').toLowerCase() !== 'broker') {
      return NextResponse.json({ ok: false, error: 'Not a broker' }, { status: 403 })
    }

    // Get the updated data from the request body
    const body = await req.json().catch(() => ({}))

    // Update only allowed fields
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    }

    // Allowed fields for brokers to update
    const allowedFields = [
      'company',
      'phone',
      'website',
      'description',
      'logo',
      'city',
      'areasServed',
      'languages',
      'yearsEstablished',
      'officeAddress',
      'publicProfileEnabled',
    ]

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Update the document
    await db.collection('users').doc(uid).update(updateData)

    // Return the updated profile
    const broker = {
      id: uid,
      company: body.company || userData.company || '',
      email: userData.email || '',
      phone: body.phone || userData.phone || '',
      website: body.website || userData.website || '',
      description: body.description || userData.description || '',
      logo: body.logo || userData.logo || '',
      city: body.city || userData.city || '',
      areasServed: body.areasServed || userData.areasServed || [],
      languages: body.languages || userData.languages || [],
      yearsEstablished: body.yearsEstablished ?? userData.yearsEstablished ?? 0,
      slug: userData.slug || '',
      publicProfileEnabled: body.publicProfileEnabled ?? userData.publicProfileEnabled !== false,
      professionalCode: userData.professionalCode || userData.brokerCode || '',
      officeAddress: body.officeAddress || userData.officeAddress || '',
    }

    return NextResponse.json({ ok: true, broker })
  } catch (error) {
    console.error('Error updating broker profile:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
