import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { calculateProfessionalRankingScore } from '@/lib/professionalRanking'

export const dynamic = 'force-dynamic'

type BrokerDoc = Record<string, any>

type ListingDoc = Record<string, any>

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

function normalizeSlugKey(value: string): string {
  return slugify(value).replace(/-/g, '')
}

function toDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate()
    return parsed instanceof Date ? parsed : null
  }
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000)
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function daysBetween(startValue: any, endValue: any): number {
  const start = toDate(startValue)
  const end = toDate(endValue)
  if (!start || !end) return 0
  const delta = end.getTime() - start.getTime()
  return delta > 0 ? delta / (1000 * 60 * 60 * 24) : 0
}

function avg(values: number[]): number {
  if (!values.length) return 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

export async function GET(_: Request, context: { params: { slug: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 500 })

    const slugParam = safeText(context.params.slug).toLowerCase()
    if (!slugParam) return NextResponse.json({ ok: false, error: 'Invalid broker slug' }, { status: 400 })

    let brokerDoc: { id: string; data: BrokerDoc } | null = null

    const byIdSnap = await db.collection('users').doc(slugParam).get()
    if (byIdSnap.exists) {
      brokerDoc = { id: byIdSnap.id, data: byIdSnap.data() || {} }
    }

    if (!brokerDoc) {
      const slugSnap = await db
        .collection('users')
        .where('role', '==', 'broker')
        .where('slug', '==', slugParam)
        .limit(1)
        .get()

      if (!slugSnap.empty) {
        const first = slugSnap.docs[0]
        brokerDoc = { id: first.id, data: first.data() || {} }
      }
    }

    if (!brokerDoc) {
      const roleSnap = await db
        .collection('users')
        .where('role', '==', 'broker')
        .limit(500)
        .get()

      for (const doc of roleSnap.docs) {
        const data = doc.data() || {}
        const candidate = normalizeSlugKey(
          safeText(data.slug) || safeText(data.company || data.name || data.displayName || doc.id)
        )
        if (candidate === normalizeSlugKey(slugParam)) {
          brokerDoc = { id: doc.id, data }
          break
        }
      }
    }

    if (!brokerDoc) return NextResponse.json({ ok: false, error: 'Broker not found' }, { status: 404 })

    const broker = brokerDoc.data
    const role = safeText(broker.role).toLowerCase()
    if (role !== 'broker') return NextResponse.json({ ok: false, error: 'Broker not found' }, { status: 404 })
    if (broker.publicProfileEnabled === false) {
      return NextResponse.json({ ok: false, error: 'Broker profile unavailable' }, { status: 404 })
    }

    const listingQueries = [
      db.collection('properties').where('brokerId', '==', brokerDoc.id).limit(1200).get(),
      db.collection('properties').where('createdByBrokerId', '==', brokerDoc.id).limit(1200).get(),
      db.collection('properties').where('brokerageId', '==', brokerDoc.id).limit(1200).get(),
    ]

    const listingSnapshots = await Promise.all(listingQueries)
    const listingMap = new Map<string, ListingDoc>()
    for (const snapshot of listingSnapshots) {
      for (const doc of snapshot.docs) {
        listingMap.set(doc.id, doc.data() || {})
      }
    }
    const listings = Array.from(listingMap.values())

    const activeListings = listings.filter((row) => safeText(row.status).toLowerCase() === 'active')
    const soldListings = listings.filter((row) => {
      const status = safeText(row.status).toLowerCase()
      return status === 'sold' || status === 'rented'
    })

    const soldPrices = soldListings
      .map((row) => Number(row.price || 0))
      .filter((value) => Number.isFinite(value) && value > 0)

    const domValues = soldListings
      .map((row) => daysBetween(row.createdAt, row.updatedAt || row.soldAt || row.closedAt))
      .filter((value) => value > 0)

    const avgSalePrice = soldPrices.length
      ? Number((soldPrices.reduce((sum, value) => sum + value, 0) / soldPrices.length).toFixed(2))
      : 0

    const rating = Number(broker.rating || 4.7)
    const reviewCount = Number(broker.reviewCount || 0)
    const salesCount = Number(broker.salesCount || soldListings.length)
    const yearsExperience = Number(broker.yearsExperience || broker.yearsInBusiness || 0)
    const professionalCode = safeText(broker.professionalCode || broker.brokerCode)

    const profile = {
      id: brokerDoc.id,
      slug: safeText(broker.slug) || slugify(safeText(broker.company || broker.name || broker.displayName || brokerDoc.id)),
      role: 'broker',
      name: safeText(broker.name || broker.displayName || broker.company || 'Broker'),
      company: safeText(broker.company || broker.displayName || broker.name || ''),
      email: safeText(broker.email),
      phone: safeText(broker.phone),
      image: safeText(broker.profileImage || broker.companyLogo || broker.photoURL || broker.photo),
      bio: safeText(broker.bio || broker.description),
      specialties: Array.isArray(broker.specialties)
        ? broker.specialties.map((item: unknown) => safeText(item)).filter(Boolean)
        : safeText(broker.specialties)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      languages: Array.isArray(broker.languages)
        ? broker.languages.map((item: unknown) => safeText(item)).filter(Boolean)
        : safeText(broker.languages || 'Español')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      areasServed: safeText(broker.area || broker.markets || broker.city || 'República Dominicana'),
      yearsExperience,
      activeListingsCount: activeListings.length,
      soldListingsCount: soldListings.length,
      avgDom: avg(domValues),
      avgSalePrice,
      rating,
      reviewsCount: reviewCount,
      emailVerified: Boolean(broker.emailVerified || broker.verified),
      identityVerified: Boolean(broker.verified),
      activeSubscription: Boolean(broker.activeSubscription),
      professionalCode,
      website: safeText(broker.website),
      socialLinks: {
        instagram: safeText((broker.socialLinks || {}).instagram || broker.instagram),
        facebook: safeText((broker.socialLinks || {}).facebook || broker.facebook),
        linkedin: safeText((broker.socialLinks || {}).linkedin || broker.linkedin),
      },
      certifications: Array.isArray(broker.certifications)
        ? broker.certifications.map((item: unknown) => safeText(item)).filter(Boolean)
        : [],
      officeAddress: safeText(broker.officeAddress),
      rankingScore: calculateProfessionalRankingScore({
        rating,
        reviewsCount: reviewCount,
        salesCount,
        yearsExperience,
        emailVerified: Boolean(broker.emailVerified || broker.verified),
        identityVerified: Boolean(broker.verified),
        hasProfessionalCode: Boolean(professionalCode),
        hasActiveSubscription: Boolean(broker.activeSubscription),
      }),
    }

    return NextResponse.json({ ok: true, profile })
  } catch (error: any) {
    console.error('[api/brokers/profile/[slug]] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load broker profile' }, { status: 500 })
  }
}
