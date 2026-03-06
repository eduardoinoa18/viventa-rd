import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { canManageProject, normalizePublishMode } from '@/lib/projectInventory/permissions'
import { getProjectByIdOrThrow, updateProject } from '@/lib/projectInventory/repositories/projectsRepository'
import { logProjectPublished, logProjectStatusChanged } from '@/lib/projectInventory/repositories/eventsRepository'
import { validateProjectStatusTransition } from '@/lib/projectInventory/transitions'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
    const publishMode = normalizePublishMode(body?.publishMode || project.publishMode)

    if (project.status !== 'active') {
      const transition = validateProjectStatusTransition({
        currentStatus: project.status,
        nextStatus: 'active',
      })
      if (!transition.ok) {
        return NextResponse.json({ ok: false, error: transition.error }, { status: 400 })
      }
    }

    const updated = await updateProject(params.id, {
      publishMode,
      status: project.status === 'active' ? undefined : 'active',
    })

    await logProjectPublished({
      projectId: project.id,
      actorUid: context.uid,
      actorRole: context.role,
      publishMode,
    })

    if (project.status !== updated.status) {
      await logProjectStatusChanged({
        projectId: project.id,
        actorUid: context.uid,
        actorRole: context.role,
        oldStatus: project.status,
        newStatus: updated.status,
        reason: safeText(body?.reason) || 'project_publish',
      })
    }

    return NextResponse.json({ ok: true, project: updated })
  } catch (error: any) {
    console.error('[api/admin/projects/[id]/publish] POST error', error)
    const status = error?.status || (String(error?.message || '').includes('not found') ? 404 : 500)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to publish project' }, { status })
  }
}
