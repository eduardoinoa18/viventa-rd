import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { getProjectByIdOrThrow, updateProject } from '@/lib/projectInventory/repositories/projectsRepository'
import { logProjectStatusChanged } from '@/lib/projectInventory/repositories/eventsRepository'
import { canManageProject } from '@/lib/projectInventory/permissions'
import { validateProjectStatusTransition } from '@/lib/projectInventory/transitions'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    const project = await getProjectByIdOrThrow(params.id)

    if (!canManageProject(project as unknown as Record<string, unknown>, context)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))

    if (body?.status !== undefined) {
      const transition = validateProjectStatusTransition({
        currentStatus: project.status,
        nextStatus: body.status,
      })
      if (!transition.ok) {
        return NextResponse.json({ ok: false, error: transition.error }, { status: 400 })
      }
    }

    const updated = await updateProject(params.id, {
      name: body?.name,
      developerName: body?.developerName,
      brokerageId: body?.brokerageId,
      currency: body?.currency,
      publishMode: body?.publishMode,
      status: body?.status,
      location: body?.location,
    })

    if (body?.status && body.status !== project.status) {
      await logProjectStatusChanged({
        projectId: project.id,
        actorUid: context.uid,
        actorRole: context.role,
        oldStatus: project.status,
        newStatus: updated.status,
        reason: safeText(body?.reason) || 'manual_update',
      })
    }

    return NextResponse.json({ ok: true, project: updated })
  } catch (error: any) {
    console.error('[api/admin/projects/[id]] PATCH error', error)
    const status = error?.status || (String(error?.message || '').includes('not found') ? 404 : 500)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to update project' }, { status })
  }
}
