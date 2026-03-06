import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function safeLower(value: unknown): string {
  return safeText(value).toLowerCase()
}

function toMillis(value: any): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date.getTime() : 0
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
}

function asProject(data: Record<string, any>, id: string) {
  return {
    id,
    name: safeText(data.name || 'Proyecto'),
    city: safeText(data.location?.city || data.city || ''),
    status: safeLower(data.status || 'active'),
    availableUnits: Number(data.availableUnits || 0),
    totalUnits: Number(data.totalUnits || 0),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function belongsToConstructora(project: Record<string, any>, context: {
  uid: string
  constructoraCode: string
  professionalCode: string
}) {
  const ownerCandidates = [
    safeText(project.developerId),
    safeText(project.ownerId),
    safeText(project.constructoraId),
    safeText(project.companyId),
  ].filter(Boolean)

  const scopedCodes = [safeText(context.uid), safeText(context.constructoraCode), safeText(context.professionalCode)].filter(Boolean)
  return ownerCandidates.some((owner) => scopedCodes.includes(owner))
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const projectsSnap = await db.collection('projects').limit(600).get()
    const projects = projectsSnap.docs
      .map((doc) => asProject(doc.data() as Record<string, any>, doc.id))
      .filter((project) => belongsToConstructora(project as any, context))

    let totalUnits = 0
    let availableUnits = 0
    let reservedUnits = 0
    let soldUnits = 0
    let inProcessUnits = 0

    for (const project of projects.slice(0, 60)) {
      const unitsSnap = await db.collection('projects').doc(project.id).collection('units').limit(2000).get()
      for (const unitDoc of unitsSnap.docs) {
        const unit = unitDoc.data() as Record<string, any>
        totalUnits += 1
        const status = safeLower(unit.status)
        if (status === 'disponible' || status === 'available') availableUnits += 1
        if (status === 'reservado' || status === 'separado') reservedUnits += 1
        if (status === 'vendido' || status === 'sold') soldUnits += 1
        if (status === 'en-proceso' || status === 'in_process' || status === 'in-process') inProcessUnits += 1
      }
    }

    const cityMap = new Map<string, number>()
    for (const project of projects) {
      if (!project.city) continue
      cityMap.set(project.city, (cityMap.get(project.city) || 0) + 1)
    }

    const topCities = Array.from(cityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, projects: count }))

    const recentProjects = [...projects]
      .sort((a, b) => toMillis((b as any).updatedAt || (b as any).createdAt) - toMillis((a as any).updatedAt || (a as any).createdAt))
      .slice(0, 8)
      .map((project) => ({
        id: project.id,
        name: project.name,
        city: project.city,
        status: project.status,
        availableUnits: project.availableUnits,
        totalUnits: project.totalUnits,
      }))

    const activeProjects = projects.filter((project) => project.status === 'active').length

    return NextResponse.json({
      ok: true,
      summary: {
        totalProjects: projects.length,
        activeProjects,
        totalUnits,
        availableUnits,
        reservedUnits,
        soldUnits,
        inProcessUnits,
      },
      topCities,
      recentProjects,
    })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/overview] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load constructora dashboard overview' }, { status: 500 })
  }
}
