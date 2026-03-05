import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { calculateProfessionalRankingScore } from '@/lib/professionalRanking'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = new Set(['agent', 'broker', 'constructora'])

type ProfessionalDoc = {
  role?: string
  status?: string
  approved?: boolean
  name?: string
  displayName?: string
  company?: string
  email?: string
  phone?: string
  city?: string
  area?: string
  markets?: string
  profileImage?: string
  photoURL?: string
  photo?: string
  companyLogo?: string
  bio?: string
  description?: string
  specialties?: string[] | string
  languages?: string[] | string
  website?: string
  officeAddress?: string
  yearsExperience?: number
  yearsInBusiness?: number
  salesCount?: number
  reviewCount?: number
  rating?: number
  emailVerified?: boolean
  verified?: boolean
  activeSubscription?: boolean
  professionalCode?: string
  agentCode?: string
  brokerCode?: string
  constructoraCode?: string
  activeListings?: number
  teamSize?: number
  agents?: number
  publicProfileEnabled?: boolean
}

function toArray(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value.split(',').map((v) => v.trim()).filter(Boolean)
  }
  return []
}

export async function GET(_: Request, context: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const id = context.params.id
    const doc = await db.collection('users').doc(id).get()
    if (!doc.exists) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const data = (doc.data() || {}) as ProfessionalDoc
    const role = String(data.role || '').toLowerCase()
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ ok: false, error: 'Invalid professional type' }, { status: 404 })
    }

    if (data.status !== 'active' || data.approved !== true) {
      return NextResponse.json({ ok: false, error: 'Profile unavailable' }, { status: 404 })
    }

    if (data.publicProfileEnabled === false) {
      return NextResponse.json({ ok: false, error: 'Profile unavailable' }, { status: 404 })
    }

    const rating = Number(data.rating || 4.5)
    const reviewsCount = Number(data.reviewCount || 0)
    const salesCount = Number(data.salesCount || 0)
    const yearsExperience = Number(data.yearsExperience || data.yearsInBusiness || 0)
    const professionalCode =
      data.professionalCode ||
      data.agentCode ||
      data.brokerCode ||
      data.constructoraCode ||
      ''

    const profile = {
      id: doc.id,
      role,
      name: data.name || data.displayName || data.company || 'Profesional',
      company: data.company || data.displayName || '',
      email: data.email || '',
      phone: data.phone || '',
      city: data.city || data.area || '',
      area: data.area || data.markets || data.city || 'República Dominicana',
      markets: data.markets || '',
      image: data.profileImage || data.companyLogo || data.photoURL || data.photo || '',
      bio: data.bio || data.description || '',
      specialties: toArray(data.specialties),
      languages: toArray(data.languages),
      website: data.website || '',
      officeAddress: data.officeAddress || '',
      yearsExperience,
      salesCount,
      activeListings: Number(data.activeListings || 0),
      teamSize: Number(data.teamSize || data.agents || 0),
      rating,
      reviewsCount,
      emailVerified: Boolean(data.emailVerified || data.verified),
      identityVerified: Boolean(data.verified),
      activeSubscription: Boolean(data.activeSubscription),
      professionalCode,
      rankingScore: calculateProfessionalRankingScore({
        rating,
        reviewsCount,
        salesCount,
        yearsExperience,
        emailVerified: Boolean(data.emailVerified || data.verified),
        identityVerified: Boolean(data.verified),
        hasProfessionalCode: Boolean(professionalCode),
        hasActiveSubscription: Boolean(data.activeSubscription),
      }),
    }

    return NextResponse.json({ ok: true, profile })
  } catch (error: any) {
    console.error('[api/professionals/[id]] GET error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to load profile' }, { status: 500 })
  }
}
