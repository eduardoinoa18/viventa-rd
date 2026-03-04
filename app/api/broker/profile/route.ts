import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => safeText(item)).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const userSnap = await db.collection('users').doc(session.uid).get()
    if (!userSnap.exists) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })

    const user = userSnap.data() || {}
    const role = safeText(user.role).toLowerCase()
    if (role !== 'broker' && role !== 'master_admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      ok: true,
      profile: {
        id: session.uid,
        slug: safeText(user.slug) || slugify(safeText(user.company || user.name || user.displayName || session.uid)),
        bio: safeText(user.bio || user.description),
        profileImage: safeText(user.profileImage || user.companyLogo || user.photoURL || user.photo),
        phone: safeText(user.phone),
        email: safeText(user.email),
        socialLinks: {
          instagram: safeText((user.socialLinks || {}).instagram || user.instagram),
          facebook: safeText((user.socialLinks || {}).facebook || user.facebook),
          linkedin: safeText((user.socialLinks || {}).linkedin || user.linkedin),
        },
        certifications: toArray(user.certifications),
        languages: toArray(user.languages),
        officeAddress: safeText(user.officeAddress),
        areasServed: safeText(user.area || user.markets || user.city),
        specialties: toArray(user.specialties),
      },
    })
  } catch (error: any) {
    console.error('[api/broker/profile][GET] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load broker profile' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const userRef = db.collection('users').doc(session.uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })

    const user = userSnap.data() || {}
    const role = safeText(user.role).toLowerCase()
    if (role !== 'broker' && role !== 'master_admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))

    const bio = safeText(body.bio).slice(0, 2000)
    const profileImage = safeText(body.profileImage)
    const phone = safeText(body.phone)
    const email = safeText(body.email)
    const officeAddress = safeText(body.officeAddress)
    const areasServed = safeText(body.areasServed)
    const specialties = toArray(body.specialties).slice(0, 40)
    const languages = toArray(body.languages).slice(0, 20)
    const certifications = toArray(body.certifications).slice(0, 30)

    const socialLinks = {
      instagram: safeText(body.socialLinks?.instagram),
      facebook: safeText(body.socialLinks?.facebook),
      linkedin: safeText(body.socialLinks?.linkedin),
    }

    const slug = safeText(user.slug) || slugify(safeText(user.company || user.name || user.displayName || session.uid))

    await userRef.set(
      {
        slug,
        bio,
        description: bio,
        profileImage,
        phone,
        email,
        officeAddress,
        area: areasServed,
        markets: areasServed,
        specialties,
        languages,
        certifications,
        socialLinks,
        instagram: socialLinks.instagram,
        facebook: socialLinks.facebook,
        linkedin: socialLinks.linkedin,
        updatedAt: new Date(),
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true, slug })
  } catch (error: any) {
    console.error('[api/broker/profile][PATCH] error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update broker profile' }, { status: 500 })
  }
}
