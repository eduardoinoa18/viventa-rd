import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { createProject } from '@/lib/projectInventory/repositories/projectsRepository'
import { logProjectCreated } from '@/lib/projectInventory/repositories/eventsRepository'
import { isAdminRole } from '@/lib/projectInventory/permissions'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 })
}

export async function POST(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (!isAdminRole(context.role) && context.role !== 'constructora') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const name = safeText(body?.name)
    const developerName = safeText(body?.developerName)
    const city = safeText(body?.location?.city)
    const sector = safeText(body?.location?.sector)
    const currency = safeText(body?.currency) === 'DOP' ? 'DOP' : 'USD'

    if (!name) return badRequest('Project name is required')
    if (!developerName) return badRequest('Developer name is required')
    if (!city || !sector) return badRequest('Project location city and sector are required')

    const derivedDeveloperId =
      context.role === 'constructora'
        ? safeText(context.constructoraCode || context.professionalCode || context.uid)
        : safeText(body?.developerId)

    if (!derivedDeveloperId) return badRequest('Developer id is required')

    const project = await createProject({
      name,
      developerId: derivedDeveloperId,
      developerName,
      brokerageId: safeText(body?.brokerageId) || (context.officeId || null),
      location: {
        city,
        sector,
        address: safeText(body?.location?.address) || undefined,
        lat: typeof body?.location?.lat === 'number' ? body.location.lat : undefined,
        lng: typeof body?.location?.lng === 'number' ? body.location.lng : undefined,
      },
      currency,
      publishMode: body?.publishMode,
      createdBy: context.uid,
    })

    await logProjectCreated({
      projectId: project.id,
      actorUid: context.uid,
      actorRole: context.role,
      projectData: {
        name: project.name,
        developerId: project.developerId,
        publishMode: project.publishMode,
        status: project.status,
      },
    })

    return NextResponse.json({ ok: true, project }, { status: 201 })
  } catch (error: any) {
    console.error('[api/admin/projects] POST error', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to create project' }, { status: 500 })
  }
}
