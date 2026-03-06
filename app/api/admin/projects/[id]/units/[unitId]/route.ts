import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { canManageProject } from '@/lib/projectInventory/permissions'
import { getProjectByIdOrThrow, updateProjectCounters } from '@/lib/projectInventory/repositories/projectsRepository'
import { getUnitByIdOrThrow, updateUnit } from '@/lib/projectInventory/repositories/unitsRepository'
import { logUnitStatusChanged } from '@/lib/projectInventory/repositories/eventsRepository'
import { validateProjectUnitStatusTransition } from '@/lib/projectInventory/transitions'
import type { ProjectUnitStatus } from '@/types/project-inventory'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function getStatusCounterDelta(fromStatus: ProjectUnitStatus, toStatus: ProjectUnitStatus) {
  const counters = {
    availableUnits: 0,
    reservedUnits: 0,
    soldUnits: 0,
  }

  if (fromStatus === toStatus) return counters

  if (fromStatus === 'available') counters.availableUnits -= 1
  if (fromStatus === 'reserved') counters.reservedUnits -= 1
  if (fromStatus === 'sold') counters.soldUnits -= 1

  if (toStatus === 'available') counters.availableUnits += 1
  if (toStatus === 'reserved') counters.reservedUnits += 1
  if (toStatus === 'sold') counters.soldUnits += 1

  return counters
}

export async function PATCH(req: Request, { params }: { params: { id: string; unitId: string } }) {
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

    const currentUnit = await getUnitByIdOrThrow(params.id, params.unitId)
    const body = await req.json().catch(() => ({}))

    if (body?.status !== undefined) {
      const transition = validateProjectUnitStatusTransition({
        currentStatus: currentUnit.status,
        nextStatus: body.status,
      })
      if (!transition.ok) {
        return NextResponse.json({ ok: false, error: transition.error }, { status: 400 })
      }
    }

    const updated = await updateUnit(params.id, params.unitId, {
      phase: body?.phase,
      propertyType: body?.propertyType,
      beds: body?.beds,
      baths: body?.baths,
      parking: body?.parking,
      areaM2: body?.areaM2,
      price: body?.price,
      maintenanceFee: body?.maintenanceFee,
      ownerType: body?.ownerType,
      assignedBrokerageId: body?.assignedBrokerageId,
      availabilityDate: body?.availabilityDate ? new Date(body.availabilityDate) : undefined,
      status: body?.status,
      reservationId: body?.reservationId,
    })

    if (updated.status !== currentUnit.status) {
      const delta = getStatusCounterDelta(currentUnit.status, updated.status)
      await updateProjectCounters(project.id, delta)

      await logUnitStatusChanged({
        projectId: project.id,
        unitId: updated.id,
        actorUid: context.uid,
        actorRole: context.role,
        officeId: context.officeId || undefined,
        oldStatus: currentUnit.status,
        newStatus: updated.status,
        reason: safeText(body?.reason) || 'unit_status_update',
      })
    }

    return NextResponse.json({ ok: true, unit: updated })
  } catch (error: any) {
    console.error('[api/admin/projects/[id]/units/[unitId]] PATCH error', error)
    const status = error?.status || (String(error?.message || '').includes('not found') ? 404 : 500)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to update unit' }, { status })
  }
}
