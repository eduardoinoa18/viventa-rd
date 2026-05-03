import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { calculateProfessionalRankingScore } from '@/lib/professionalRanking'

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

function resolveProfileImage(data: Record<string, any>): string {
  return safeText(
    data.profileImage ||
    data.profileImageUrl ||
    data.photoUrl ||
    data.photoURL ||
    data.photo ||
    data.avatar ||
    data.avatarUrl ||
    data.companyLogo ||
    data.logoUrl
  )
}

export async function GET(_: Request, context: { params: { slug: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const slugParam = safeText(context.params.slug).toLowerCase()
    if (!slugParam) return NextResponse.json({ ok: false, error: 'Invalid agent slug' }, { status: 400 })

    let agentDoc: { id: string; data: Record<string, any> } | null = null

    const byIdSnap = await db.collection('users').doc(slugParam).get()
    if (byIdSnap.exists) {
      const data = byIdSnap.data() || {}
      if (safeText(data.role).toLowerCase() === 'agent') {
        agentDoc = { id: byIdSnap.id, data }
      }
    }

    if (!agentDoc) {
      // Query all agents by role only — status/approved filters are too strict and cause
      // 404s for agents whose documents were created without those flags (e.g. dev accounts).
      // Visibility is enforced below via the publicProfileEnabled check.
      const roleSnap = await db
        .collection('users')
        .where('role', '==', 'agent')
        .limit(500)
        .get()

      for (const doc of roleSnap.docs) {
        const data = doc.data() || {}
        const candidate = safeText(data.slug) || slugify(safeText(data.name || data.displayName || doc.id))
        if (candidate === slugParam) {
          agentDoc = { id: doc.id, data }
          break
        }
      }
    }

    if (!agentDoc) return NextResponse.json({ ok: false, error: 'Agent not found' }, { status: 404 })

    const data = agentDoc.data
    if (safeText(data.role).toLowerCase() !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Agent not found' }, { status: 404 })
    }

    // Block explicitly suspended/banned agents (allow missing status as active)
    const agentStatus = safeText(data.status).toLowerCase()
    if (agentStatus && agentStatus !== 'active') {
      return NextResponse.json({ ok: false, error: 'Agent profile unavailable' }, { status: 404 })
    }

    if (data.publicProfileEnabled === false) {
      return NextResponse.json({ ok: false, error: 'Agent profile unavailable' }, { status: 404 })
    }

    const rating = Number(data.rating || 4.5)
    const reviewsCount = Number(data.reviewCount || 0)
    const salesCount = Number(data.salesCount || 0)
    const yearsExperience = Number(data.yearsExperience || 0)
    const professionalCode = safeText(data.professionalCode || data.agentCode)

    const profile = {
      id: agentDoc.id,
      slug: safeText(data.slug) || slugify(safeText(data.name || data.displayName || agentDoc.id)),
      role: 'agent',
      name: safeText(data.name || data.displayName || 'Agente'),
      company: safeText(data.company),
      email: safeText(data.email),
      phone: safeText(data.phone),
      image: resolveProfileImage(data),
      bio: safeText(data.bio || data.description),
      specialties: toArray(data.specialties),
      languages: toArray(data.languages),
      areasServed: safeText(data.area || data.markets || data.city || 'República Dominicana'),
      yearsExperience,
      salesCount,
      activeListingsCount: Number(data.activeListings || 0),
      rating,
      reviewsCount,
      emailVerified: Boolean(data.emailVerified || data.verified),
      identityVerified: Boolean(data.verified),
      activeSubscription: Boolean(data.activeSubscription),
      professionalCode,
      website: safeText(data.website),
      officeAddress: safeText(data.officeAddress),
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
    console.error('[api/agents/profile/[slug]] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load agent profile' }, { status: 500 })
  }
}
