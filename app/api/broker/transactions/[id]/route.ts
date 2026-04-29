import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { emitActivityEvent } from '@/lib/activityEvents'
import { TRANSACTION_STAGES, type TransactionStage } from '@/lib/domain/transaction'
import { mapCrmDealStageToLeadStage } from '@/lib/domain/crmDeal'
import { stageToLegacyStatus } from '@/lib/leadLifecycle'
import { createStagePlaybookTasks } from '@/lib/stagePlaybooks'

export const dynamic = 'force-dynamic'

function safeText(v: unknown) { return String(v ?? '').trim() }

function normalizePipelineStage(value: unknown): TransactionStage {
  const s = safeText(value).toLowerCase()
  if ((TRANSACTION_STAGES as readonly string[]).includes(s)) return s as TransactionStage
  if (s === 'oferta') return 'offer'
  if (s === 'contrato_firmado') return 'contract'
  if (s === 'cierre') return 'closing'
  if (s === 'completado' || s === 'won' || s === 'closed') return 'completed'
  return 'lead'
}

function getCanonicalDealId(record: Record<string, any>, fallbackId: string): string {
  const dealId = safeText(record.dealId)
  return dealId || fallbackId
}

// ── GET single transaction ────────────────────────────────────────────────────
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const snap = await db.collection('transactions').doc(params.id).get()
    if (!snap.exists) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const data = snap.data() as Record<string, any>
    if (context.role === 'broker' && data.officeId !== context.officeId) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (context.role === 'agent' && data.agentId !== context.uid) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ ok: true, transaction: { id: snap.id, ...data } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'Failed to load transaction' }, { status: 500 })
  }
}

// ── PATCH – update stage (Kanban drag) ───────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const ref = db.collection('transactions').doc(params.id)
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    const current = snap.data() as Record<string, any>
    if (context.role === 'broker' && current.officeId !== context.officeId) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (context.role === 'agent' && current.agentId !== context.uid) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const update: Record<string, any> = { updatedAt: new Date(), updatedBy: context.uid }

    const prevStage = normalizePipelineStage(current.stage)
    let nextStage = prevStage

    if (body.stage !== undefined) {
      nextStage = normalizePipelineStage(body.stage)
      if (nextStage === 'lost') {
        const lostReason = safeText(body.lostReason)
        if (!lostReason) {
          return NextResponse.json({ ok: false, error: 'lostReason is required when stage is lost' }, { status: 400 })
        }
        update.lostReason = lostReason
        update.lostAt = new Date()
      }
      if (nextStage === 'archived') {
        update.archivedAt = new Date()
      }
      update.stage = nextStage
    }
    if (body.notes !== undefined) update.notes = safeText(body.notes)
    if (body.clientName !== undefined) update.clientName = safeText(body.clientName)

    await ref.set(update, { merge: true })

    // Emit deal_stage_changed when stage transitions
    if (nextStage !== prevStage) {
      await emitActivityEvent(db, {
        type: 'deal_stage_changed',
        actorId: context.uid,
        actorRole: context.role,
        entityType: 'transaction',
        entityId: params.id,
        transactionId: params.id,
        dealId: getCanonicalDealId(current, params.id),
        listingId: safeText(current.propertyId || current.listingId) || null,
        projectId: safeText(current.projectId) || null,
        brokerId: context.role === 'broker' ? context.uid : (safeText(current.brokerId) || null),
        agentId: context.role === 'agent' ? context.uid : (safeText(current.agentId) || null),
        officeId: safeText(current.officeId) || null,
        metadata: {
          from: prevStage,
          to: nextStage,
          clientName: safeText(current.clientName),
          salePrice: Number(current.salePrice || 0),
          eventVersion: 1,
        },
      })

      await createStagePlaybookTasks({
        db,
        stage: nextStage,
        dealId: getCanonicalDealId(current, params.id),
        officeId: safeText(current.officeId),
        agentId: safeText(current.agentId) || null,
        createdBy: context.uid,
        linkedTransactionId: params.id,
      })

      const linkedLeadId = safeText(current.leadId)
      if (linkedLeadId) {
        const syncedLeadStage = mapCrmDealStageToLeadStage(nextStage)
        await db.collection('leads').doc(linkedLeadId).set(
          {
            leadStage: syncedLeadStage,
            status: stageToLegacyStatus(syncedLeadStage),
            legacyStatus: stageToLegacyStatus(syncedLeadStage),
            stageChangedAt: new Date(),
            stageChangedBy: context.uid,
            stageChangeReason: 'transaction_stage_sync',
            linkedDealId: getCanonicalDealId(current, params.id),
            linkedTransactionId: params.id,
            updatedAt: new Date(),
          },
          { merge: true }
        )
      }
    }

    const saved = await ref.get()
    return NextResponse.json({ ok: true, transaction: { id: saved.id, ...(saved.data() as Record<string, any>) } })
  } catch (e: any) {
    console.error('[api/broker/transactions/[id]] PATCH error', e)
    return NextResponse.json({ ok: false, error: 'Failed to update transaction' }, { status: 500 })
  }
}
