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

    // Verify they are an agent
    if (String(userData.role || '').toLowerCase() !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Not an agent' }, { status: 403 })
    }

    // Return the agent profile
    const agent = {
      id: uid,
      name: userData.name || userData.displayName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      company: userData.company || userData.brokerName || '',
      bio: userData.bio || userData.description || '',
      profileImage: userData.profileImage || userData.photoURL || userData.photo || '',
      city: userData.city || '',
      area: userData.area || userData.markets || '',
      languages: Array.isArray(userData.languages) ? userData.languages : [],
      specialties: Array.isArray(userData.specialties) ? userData.specialties : [],
      yearsExperience: userData.yearsExperience || 0,
      websiteUrl: userData.website || '',
      slug: userData.slug || '',
      publicProfileEnabled: userData.publicProfileEnabled !== false,
      professionalCode: userData.professionalCode || userData.agentCode || '',
    }

    return NextResponse.json({ ok: true, agent })
  } catch (error) {
    console.error('Error fetching agent profile:', error)
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

    // Verify they are an agent
    if (String(userData.role || '').toLowerCase() !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Not an agent' }, { status: 403 })
    }

    // Get the updated data from the request body
    const body = await req.json().catch(() => ({}))

    // Update only allowed fields
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    }

    // Allowed fields for agents to update
    const allowedFields = [
      'name',
      'phone',
      'company',
      'bio',
      'profileImage',
      'city',
      'area',
      'languages',
      'specialties',
      'yearsExperience',
      'website',
      'publicProfileEnabled',
    ]

    for (const field of allowedFields) {
      if (field in body) {
        if (field === 'website') {
          updateData.website = String(body.websiteUrl || '').trim()
        } else {
          updateData[field] = body[field]
        }
      }
    }

    // Update the document
    await db.collection('users').doc(uid).update(updateData)

    // Return the updated profile
    const agent = {
      id: uid,
      name: body.name || userData.name || '',
      email: userData.email || '',
      phone: body.phone || userData.phone || '',
      company: body.company || userData.company || '',
      bio: body.bio || userData.bio || '',
      profileImage: body.profileImage || userData.profileImage || '',
      city: body.city || userData.city || '',
      area: body.area || userData.area || '',
      languages: body.languages || userData.languages || [],
      specialties: body.specialties || userData.specialties || [],
      yearsExperience: body.yearsExperience ?? userData.yearsExperience ?? 0,
      websiteUrl: body.websiteUrl || userData.website || '',
      slug: userData.slug || '',
      publicProfileEnabled: body.publicProfileEnabled ?? userData.publicProfileEnabled !== false,
      professionalCode: userData.professionalCode || userData.agentCode || '',
    }

    return NextResponse.json({ ok: true, agent })
  } catch (error) {
    console.error('Error updating agent profile:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
