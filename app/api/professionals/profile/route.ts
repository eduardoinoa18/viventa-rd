import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

function getAuthInfo(req: NextRequest) {
  const role = req.cookies.get('viventa_role')?.value as string | undefined
  const uid = req.cookies.get('viventa_uid')?.value
  return { role, uid }
}

function canEdit(role?: string) {
  return role === 'agent' || role === 'broker' || role === 'constructora' || role === 'master_admin'
}

// Allowed profile fields to update
const ALLOWED_FIELDS = new Set([
  'bio',
  'description',
  'specialties',
  'languages',
  'officeAddress',
  'website',
  'certifications',
  'photoUrl',
  'profileImage',
  'companyLogo',
  'company',
  'yearsExperience',
  'yearsInBusiness',
  'salesCount',
  'teamSize',
  'markets',
  'city',
  'phone',
  'publicProfileEnabled',
  'slug'
])

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    const legacy = getAuthInfo(req)
    const role = session?.role || legacy.role
    const uid = session?.uid || legacy.uid
    if (!canEdit(role) || !uid) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const userDoc = await db.collection('users').doc(uid).get()
    if (!userDoc.exists) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    const data = userDoc.data() || {}
    const profile = {
      bio: data.bio || '',
      description: data.description || '',
      specialties: data.specialties || [],
      languages: data.languages || [],
      officeAddress: data.officeAddress || '',
      website: data.website || '',
      certifications: data.certifications || '',
      photoUrl: data.photoUrl || '',
      profileImage: data.profileImage || '',
      companyLogo: data.companyLogo || '',
      company: data.company || '',
      yearsExperience: data.yearsExperience || 0,
      yearsInBusiness: data.yearsInBusiness || 0,
      salesCount: data.salesCount || 0,
      teamSize: data.teamSize || 0,
      markets: data.markets || '',
      city: data.city || '',
      phone: data.phone || '',
      publicProfileEnabled: data.publicProfileEnabled !== false,
      slug: data.slug || '',
      professionalCode: data.professionalCode || '',
      role: data.role || '',
      name: data.name || ''
    }
    return NextResponse.json({ ok: true, profile })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    const legacy = getAuthInfo(req)
    const role = session?.role || legacy.role
    const uid = session?.uid || legacy.uid
    if (!canEdit(role) || !uid) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const body = await req.json()
    if (!body || typeof body !== 'object') return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })

    const updates: any = {}
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) {
        if (key === 'specialties' || key === 'languages') {
          updates[key] = Array.isArray(value) ? value.map(v => String(v).trim()).slice(0, 25) : []
        } else if (
          key === 'yearsExperience' ||
          key === 'yearsInBusiness' ||
          key === 'salesCount' ||
          key === 'teamSize'
        ) {
          const parsed = Number(value)
          updates[key] = Number.isFinite(parsed) ? Math.max(0, parsed) : 0
        } else if (key === 'publicProfileEnabled') {
          updates[key] = value !== false
        } else if (typeof value === 'string') {
          updates[key] = value.trim().slice(0, 2000)
        } else {
          updates[key] = value
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid fields to update' }, { status: 400 })
    }

    updates.updatedAt = new Date().toISOString()
    await db.collection('users').doc(uid).update(updates)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed to update profile' }, { status: 500 })
  }
}
