import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import type { DocumentData, QuerySnapshot } from 'firebase-admin/firestore'
import { calculateProfessionalRankingScore } from '@/lib/professionalRanking'

export const dynamic = 'force-dynamic'

type BrokerDoc = {
  name?: string
  displayName?: string
  company?: string
  email?: string
  phone?: string
  city?: string
  area?: string
  markets?: string
  photoURL?: string
  photo?: string
  profileImage?: string
  companyLogo?: string
  brokerCode?: string
  professionalCode?: string
  rating?: number
  languages?: string
  status?: string
  approved?: boolean
  emailVerified?: boolean
  verified?: boolean
  yearsExperience?: number
  yearsInBusiness?: number
  teamSize?: number
  agents?: number
  activeListings?: number
  salesCount?: number
  reviewCount?: number
  activeSubscription?: boolean
  slug?: string
  publicProfileEnabled?: boolean
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

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: true, data: [] })
    }

    const { searchParams } = new URL(req.url)
    const limitParam = Number(searchParams.get('limit') || '200')
    const safeLimit = Math.min(Math.max(limitParam, 1), 500)

    const ref: any = db
      .collection('users')
      .where('role', '==', 'broker')
      .where('status', '==', 'active')
      .where('approved', '==', true)

    let snap: QuerySnapshot<DocumentData>
    try {
      snap = await ref.orderBy('updatedAt', 'desc').limit(safeLimit).get()
    } catch {
      try {
        snap = await ref.limit(safeLimit).get()
      } catch {
        snap = await db.collection('users').where('role', '==', 'broker').limit(safeLimit).get()
      }
    }

    const data = snap.docs
      .map((d) => {
        const broker = (d.data() || {}) as BrokerDoc
        const rating = Number(broker.rating || 4.7)
        const reviewsCount = Number(broker.reviewCount || 0)
        const salesCount = Number(broker.salesCount || 0)
        const yearsExperience = Number(broker.yearsExperience || broker.yearsInBusiness || 0)

        return {
          id: d.id,
          slug: broker.slug || slugify(String(broker.company || broker.name || broker.displayName || d.id)),
          name: broker.name || broker.displayName || broker.company || 'Broker',
          company: broker.company || broker.displayName || broker.name || '',
          email: broker.email || '',
          phone: broker.phone || '',
          city: broker.city || broker.area || '',
          area: broker.area || broker.markets || broker.city || '',
          markets: broker.markets || '',
          photo: broker.photoURL || broker.companyLogo || broker.profileImage || broker.photo || '',
          profileImage: broker.profileImage || broker.companyLogo || broker.photoURL || broker.photo || '',
          companyLogo: broker.companyLogo || broker.profileImage || broker.photoURL || broker.photo || '',
          brokerCode: broker.brokerCode || broker.professionalCode || '',
          rating,
          languages: broker.languages || 'Español',
          teamSize: Number(broker.teamSize || broker.agents || 0),
          activeListings: Number(broker.activeListings || 0),
          yearsExperience,
          salesCount,
          reviewsCount,
          status: broker.status || '',
          approved: Boolean(broker.approved),
          emailVerified: Boolean(broker.emailVerified || broker.verified),
          publicProfileEnabled: broker.publicProfileEnabled !== false,
          rankingScore: calculateProfessionalRankingScore({
            rating,
            reviewsCount,
            salesCount,
            yearsExperience,
            emailVerified: Boolean(broker.emailVerified || broker.verified),
            identityVerified: Boolean(broker.verified),
            hasProfessionalCode: Boolean(broker.brokerCode || broker.professionalCode),
            hasActiveSubscription: Boolean(broker.activeSubscription),
          }),
        }
      })
      .filter((u) => u.status === 'active' && u.approved && u.publicProfileEnabled)

    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    console.error('[api/brokers] GET error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to load brokers', data: [] }, { status: 500 })
  }
}
