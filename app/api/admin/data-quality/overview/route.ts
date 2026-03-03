import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

type QualityRow = {
  id: string
  title: string
  status: string
  city: string
  sector: string
  completenessScore: number
  imageCount: number
  verified: boolean
  duplicateKey: string
  updatedAt: string
}

function normalizedString(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function asIsoDate(value: any): string {
  if (!value) return ''
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return Number.isFinite(date?.getTime?.()) ? date.toISOString() : ''
  }
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : ''
}

function calculateCompleteness(source: any): number {
  const checks = [
    Boolean(source?.title),
    Boolean(source?.description || source?.publicRemarks),
    Number(source?.price || 0) > 0,
    Boolean(source?.city || source?.location),
    Boolean(source?.sector || source?.neighborhood),
    Number(source?.bedrooms || 0) >= 0,
    Number(source?.bathrooms || 0) >= 0,
    Number(source?.area || source?.squareMeters || 0) > 0,
    Array.isArray(source?.images) && source.images.length > 0,
  ]

  const passed = checks.filter(Boolean).length
  return Math.round((passed / checks.length) * 100)
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: 'Admin SDK not configured' },
        { status: 503 }
      )
    }

    const snap = await adminDb.collection('properties').limit(1500).get()

    const rows: QualityRow[] = snap.docs.map((doc) => {
      const data = doc.data() as any
      const title = String(data?.title || '').trim()
      const city = String(data?.city || data?.location || '').trim()
      const sector = String(data?.sector || data?.neighborhood || '').trim()
      const price = Number(data?.price || 0)
      const duplicateKey = `${normalizedString(title)}|${normalizedString(city)}|${price > 0 ? price : 0}`

      return {
        id: doc.id,
        title: title || 'Untitled listing',
        status: String(data?.status || 'unknown'),
        city,
        sector,
        completenessScore: calculateCompleteness(data),
        imageCount: Array.isArray(data?.images) ? data.images.length : 0,
        verified: Boolean(data?.verified),
        duplicateKey,
        updatedAt: asIsoDate(data?.updatedAt || data?.createdAt),
      }
    })

    const duplicateGroups = new Map<string, QualityRow[]>()
    for (const row of rows) {
      if (!duplicateGroups.has(row.duplicateKey)) {
        duplicateGroups.set(row.duplicateKey, [])
      }
      duplicateGroups.get(row.duplicateKey)!.push(row)
    }

    const possibleDuplicates = Array.from(duplicateGroups.values())
      .filter((group) => group.length > 1 && group[0]?.duplicateKey !== '||0')
      .map((group) => ({
        key: group[0].duplicateKey,
        count: group.length,
        sample: group.slice(0, 3).map((item) => ({ id: item.id, title: item.title, city: item.city })),
      }))
      .sort((a, b) => b.count - a.count)

    const totals = {
      listings: rows.length,
      verified: rows.filter((row) => row.verified).length,
      missingImages: rows.filter((row) => row.imageCount === 0).length,
      lowCompleteness: rows.filter((row) => row.completenessScore < 60).length,
      duplicateRisk: possibleDuplicates.reduce((acc, group) => acc + group.count, 0),
      avgCompleteness: rows.length === 0
        ? 0
        : Math.round(rows.reduce((acc, row) => acc + row.completenessScore, 0) / rows.length),
    }

    const verificationRate = totals.listings === 0 ? 0 : Math.round((totals.verified / totals.listings) * 100)

    const qualityRows = rows
      .sort((a, b) => a.completenessScore - b.completenessScore)
      .slice(0, 20)

    return NextResponse.json({
      ok: true,
      data: {
        totals: {
          ...totals,
          verificationRate,
        },
        possibleDuplicates: possibleDuplicates.slice(0, 15),
        lowestQualityListings: qualityRows,
      },
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[admin/data-quality/overview] error', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to load data quality overview' },
      { status: 500 }
    )
  }
}
