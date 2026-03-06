import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { listProjects } from '@/lib/projectInventory/repositories/projectsRepository'
import { canReadProject, isAdminRole } from '@/lib/projectInventory/permissions'

export const dynamic = 'force-dynamic'

function toSafeInt(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.floor(parsed)))
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (!['master_admin', 'admin', 'broker', 'agent'].includes(context.role)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = (searchParams.get('status') || '').trim() || undefined
    const publishMode = (searchParams.get('publishMode') || '').trim() || undefined
    const city = (searchParams.get('city') || '').trim() || undefined
    const developerId = (searchParams.get('developerId') || '').trim() || undefined
    const limit = toSafeInt(searchParams.get('limit'), 100, 1, 300)

    const projects = await listProjects({
      status: status as any,
      publishMode: publishMode as any,
      city,
      developerId,
      limit,
    })

    const visibleProjects = isAdminRole(context.role)
      ? projects
      : projects.filter((project) => canReadProject(project as unknown as Record<string, unknown>, context))

    return NextResponse.json({
      ok: true,
      scope: isAdminRole(context.role) ? 'global' : context.officeId ? 'office+market' : 'market',
      officeId: context.officeId || null,
      total: visibleProjects.length,
      projects: visibleProjects,
    })
  } catch (error: any) {
    console.error('[api/broker/projects] GET error', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to list projects' }, { status: 500 })
  }
}
