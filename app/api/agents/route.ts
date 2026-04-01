import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import type { DocumentData, QuerySnapshot } from 'firebase-admin/firestore'
import { calculateProfessionalRankingScore } from '@/lib/professionalRanking'

export const dynamic = 'force-dynamic'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

type AgentDoc = {
  name?: string
  displayName?: string
  email?: string
  phone?: string
  city?: string
  area?: string
  photoURL?: string
  photo?: string
  profileImage?: string
  agentCode?: string
  professionalCode?: string
  rating?: number
  online?: boolean
  languages?: string
  status?: string
  approved?: boolean
  emailVerified?: boolean
  verified?: boolean
  salesCount?: number
  reviewCount?: number
  yearsExperience?: number
  activeSubscription?: boolean
  publicProfileEnabled?: boolean
  slug?: string
  role?: string
  brokerId?: string
  brokerageId?: string
  officeId?: string
}

type AgentPublic = {
  id: string
  slug: string
  name: string
  email: string
  phone: string
  city: string
  area: string
  photo: string
  profileImage: string
  agentCode: string
  rating: number
  online: boolean
  languages: string
  status: string
  approved: boolean
  emailVerified: boolean
  publicProfileEnabled: boolean
  rankingScore: number
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: true, data: [] })
    }

    const { searchParams } = new URL(req.url)
    const limitParam = Number(searchParams.get('limit') || '200')
    const safeLimit = Math.min(Math.max(limitParam, 1), 500)
    const brokerId = String(searchParams.get('brokerId') || '').trim()

    const ref: any = db
      .collection('users')
      .where('role', '==', 'agent')
      .where('status', '==', 'active')

    let snap: QuerySnapshot<DocumentData>
    try {
      snap = await ref.orderBy('updatedAt', 'desc').limit(safeLimit).get()
    } catch {
      try {
        snap = await ref.limit(safeLimit).get()
      } catch {
        snap = await db.collection('users').where('role', '==', 'agent').limit(safeLimit).get()
      }
    }

    const data: AgentPublic[] = snap.docs
      .map((d) => {
        const user = (d.data() || {}) as AgentDoc
        const rating = Number(user.rating || 4.5)
        const reviewsCount = Number(user.reviewCount || 0)
        const salesCount = Number(user.salesCount || 0)
        const yearsExperience = Number(user.yearsExperience || 0)

        return {
          id: d.id,
          slug: user.slug || slugify(String(user.name || user.displayName || d.id)),
          name: user.name || user.displayName || 'Agente',
          email: user.email || '',
          phone: user.phone || '',
          city: user.city || user.area || '',
          area: user.area || user.city || '',
          photo: user.photoURL || user.photo || user.profileImage || '',
          profileImage: user.profileImage || user.photoURL || user.photo || '',
          agentCode: user.agentCode || user.professionalCode || '',
          rating,
          online: Boolean(user.online),
          languages: user.languages || 'Español',
          status: user.status || '',
          approved: Boolean(user.approved),
          emailVerified: Boolean(user.emailVerified || user.verified),
          publicProfileEnabled: user.publicProfileEnabled !== false,
          rankingScore: calculateProfessionalRankingScore({
            rating,
            reviewsCount,
            salesCount,
            yearsExperience,
            emailVerified: Boolean(user.emailVerified || user.verified),
            identityVerified: Boolean(user.verified),
            hasProfessionalCode: Boolean(user.agentCode || user.professionalCode),
            hasActiveSubscription: Boolean(user.activeSubscription),
          }),
        }
      })
      .filter((u, index) => {
        const raw = (snap.docs[index]?.data?.() || {}) as AgentDoc
        const role = String(raw.role || '').toLowerCase()
        const isActive = u.status === 'active'
        const isPublic = u.publicProfileEnabled
        const hasProfessionalCode = Boolean(raw.agentCode || raw.professionalCode)
        const isApprovedOrQualified = u.approved || hasProfessionalCode
        const belongsToBroker = brokerId
          ? [raw.brokerId, raw.brokerageId, raw.officeId].some((value) => String(value || '').trim() === brokerId)
          : true

        return role === 'agent' && isActive && isPublic && isApprovedOrQualified && belongsToBroker
      })

    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    console.error('[api/agents] GET error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to load agents', data: [] }, { status: 500 })
  }
}
