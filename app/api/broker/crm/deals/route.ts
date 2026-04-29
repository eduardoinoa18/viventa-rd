import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { emitActivityEvent } from '@/lib/activityEvents'
import { normalizeLeadStage, stageToLegacyStatus } from '@/lib/leadLifecycle'
import { CRM_DEAL_STAGE_LABELS, mapCrmDealStageToLeadStage, normalizeCrmDealStage, type CrmDealRecord, type CrmDealStage } from '@/lib/domain/crmDeal'
import { getUnifiedDealAgeDays, getUnifiedDealHealth, getUnifiedDealHealthLabel, getUnifiedDealTimelineLabel, normalizeBrokerDealTimelineStage } from '@/lib/domain/unifiedDeal'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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

async function getOfficeAgentIds(db: FirebaseFirestore.Firestore, officeId: string, currentUid: string) {
  const [byBrokerId, byBrokerageId] = await Promise.all([
    db.collection('users').where('brokerId', '==', officeId).limit(400).get(),
    db.collection('users').where('brokerageId', '==', officeId).limit(400).get(),
  ])

  const officeAgentIds = new Set<string>()
  for (const snapshot of [byBrokerId, byBrokerageId]) {
    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, any>
      const role = safeText(data.role).toLowerCase()
      if (role === 'agent' || role === 'broker') {
        officeAgentIds.add(doc.id)
      }
    }
  }
  officeAgentIds.add(currentUid)
  return officeAgentIds
}

function mapLeadStageToDealStage(leadStage: string): CrmDealStage {
  if (leadStage === 'won') return 'completed'
  if (leadStage === 'negotiating') return 'offer'
  if (leadStage === 'qualified') return 'showing'
  if (leadStage === 'contacted') return 'lead'
  return 'lead'
}

function toDealRecord(id: string, data: Record<string, any>): CrmDealRecord {
  const stage = normalizeCrmDealStage(data.stage)
  const timelineStage = normalizeBrokerDealTimelineStage(stage)
  const health = getUnifiedDealHealth(timelineStage, data.updatedAt || data.createdAt)
  return {
    id,
    dealId: safeText(data.dealId) || id,
    leadId: safeText(data.leadId) || null,
    clientName: safeText(data.clientName) || 'Cliente',
    clientEmail: safeText(data.clientEmail) || null,
    clientPhone: safeText(data.clientPhone) || null,
    stage,
    salePrice: toNumber(data.salePrice),
    currency: safeText(data.currency).toUpperCase() === 'DOP' ? 'DOP' : 'USD',
    totalCommission: toNumber(data.totalCommission),
    commissionStatus: safeText(data.commissionStatus).toLowerCase() === 'paid' ? 'paid' : 'pending',
    agentId: safeText(data.agentId) || null,
    listingId: safeText(data.propertyId || data.listingId) || null,
    projectId: safeText(data.projectId) || null,
    unitId: safeText(data.unitId) || null,
    lostReason: safeText(data.lostReason) || null,
    lostAt: data.lostAt || null,
    notes: safeText(data.notes) || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    timelineStage,
    timelineLabel: getUnifiedDealTimelineLabel(timelineStage),
    healthStatus: health,
    healthLabel: getUnifiedDealHealthLabel(health),
    stageAgeDays: getUnifiedDealAgeDays(data.updatedAt || data.createdAt),
  }
}

async function updateSingleDeal(params: {
  db: FirebaseFirestore.Firestore
  context: Awaited<ReturnType<typeof getListingAccessUserContext>>
  id: string
  stage?: CrmDealStage
  lostReason?: string | null
  notes?: string | null
  commissionStatus?: 'pending' | 'paid'
}) {
  const { db, context, id, stage, lostReason, notes, commissionStatus } = params
  const txRef = db.collection('transactions').doc(id)
  const txSnap = await txRef.get()
  if (!txSnap.exists) {
    return { ok: false as const, error: 'Deal not found', status: 404 }
  }

  const tx = txSnap.data() as Record<string, any>
  if (safeText(tx.officeId) !== context.officeId) {
    return { ok: false as const, error: 'Forbidden', status: 403 }
  }
  if (context.role === 'agent' && safeText(tx.agentId) && safeText(tx.agentId) !== context.uid) {
    return { ok: false as const, error: 'Agents can only update their own deals', status: 403 }
  }

  const prevStage = normalizeCrmDealStage(tx.stage)
  const nextStage = stage ?? prevStage
  const now = new Date()
  const update: Record<string, any> = {
    updatedAt: now,
    updatedBy: context.uid,
  }

  if (stage !== undefined) update.stage = nextStage
  if (stage !== undefined && nextStage === 'lost') {
    update.lostReason = safeText(lostReason) || null
    update.lostAt = now
  }
  if (stage !== undefined && nextStage === 'archived') {
    update.archivedAt = now
  }
  if (notes !== undefined) update.notes = notes
  if (commissionStatus !== undefined) update.commissionStatus = commissionStatus

  await txRef.set(update, { merge: true })

  if (nextStage !== prevStage) {
    const canonicalDealId = safeText(tx.dealId) || id
    await emitActivityEvent(db, {
      type: 'deal_stage_changed',
      actorId: context.uid,
      actorRole: context.role,
      entityType: 'transaction',
      entityId: id,
      transactionId: id,
      dealId: canonicalDealId,
      listingId: safeText(tx.propertyId || tx.listingId) || null,
      projectId: safeText(tx.projectId) || null,
      brokerId: safeText(tx.brokerId) || null,
      agentId: safeText(tx.agentId) || null,
      officeId: context.officeId,
      metadata: {
        from: prevStage,
        to: nextStage,
        clientName: safeText(tx.clientName) || null,
        salePrice: toNumber(tx.salePrice),
        eventVersion: 1,
      },
    })

    const linkedLeadId = safeText(tx.leadId)
    if (linkedLeadId) {
      const syncedLeadStage = mapCrmDealStageToLeadStage(nextStage)
      await db.collection('leads').doc(linkedLeadId).set(
        {
          leadStage: syncedLeadStage,
          status: stageToLegacyStatus(syncedLeadStage),
          legacyStatus: stageToLegacyStatus(syncedLeadStage),
          stageChangedAt: now,
          stageChangedBy: context.uid,
          stageChangeReason: 'crm_deal_stage_sync',
          linkedDealId: canonicalDealId,
          linkedTransactionId: id,
          updatedAt: now,
        },
        { merge: true }
      )
    }
  }

  if (commissionStatus === 'paid') {
    await emitActivityEvent(db, {
      type: 'commission_paid',
      actorId: context.uid,
      actorRole: context.role,
      entityType: 'commission',
      entityId: id,
      transactionId: id,
      dealId: safeText(tx.dealId) || id,
      listingId: safeText(tx.propertyId || tx.listingId) || null,
      projectId: safeText(tx.projectId) || null,
      brokerId: safeText(tx.brokerId) || null,
      agentId: safeText(tx.agentId) || null,
      officeId: context.officeId,
      metadata: {
        totalCommission: toNumber(tx.totalCommission),
        agentCommission: toNumber(tx.agentCommission),
        brokerCommission: toNumber(tx.brokerCommission),
      },
    })
  }

  const saved = await txRef.get()
  return { ok: true as const, deal: toDealRecord(id, saved.data() as Record<string, any>) }
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const txSnap = await db.collection('transactions').where('officeId', '==', context.officeId).limit(500).get()
    const deals = txSnap.docs
      .map((doc) => toDealRecord(doc.id, doc.data() as Record<string, any>))
      .filter((deal) => (context.role === 'broker' ? true : !deal.agentId || deal.agentId === context.uid))
      .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt) || toMillis(b.createdAt) - toMillis(a.createdAt))

    const summary = deals.reduce(
      (acc, deal) => {
        acc.total += 1
        acc.pipelineValue += deal.salePrice
        if (deal.stage === 'completed') acc.completed += 1
        if (deal.stage === 'completed' || deal.stage === 'lost' || deal.stage === 'archived') acc.closed += 1
        else acc.open += 1
        acc.stages[deal.stage] += 1
        return acc
      },
      {
        total: 0,
        open: 0,
        completed: 0,
        closed: 0,
        pipelineValue: 0,
        stages: {
          lead: 0,
          showing: 0,
          offer: 0,
          reservation: 0,
          contract: 0,
          closing: 0,
          completed: 0,
          lost: 0,
          archived: 0,
        } as Record<CrmDealStage, number>,
      }
    )

    return NextResponse.json({
      ok: true,
      deals,
      summary: {
        ...summary,
        pipelineValue: Number(summary.pipelineValue.toFixed(2)),
        stageLabels: CRM_DEAL_STAGE_LABELS,
      },
    })
  } catch (error: any) {
    console.error('[api/broker/crm/deals] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load CRM deals' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const leadId = safeText(body.leadId)
    const salePrice = toNumber(body.salePrice)
    const commissionPercent = toNumber(body.commissionPercent || 5)
    const agentSplitPercent = toNumber(body.agentSplitPercent || 70)

    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'leadId is required' }, { status: 400 })
    }
    if (salePrice <= 0) {
      return NextResponse.json({ ok: false, error: 'salePrice must be greater than 0' }, { status: 400 })
    }

    const leadRef = db.collection('leads').doc(leadId)
    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    }

    const lead = (leadSnap.data() || {}) as Record<string, any>
    const officeAgentIds = await getOfficeAgentIds(db, context.officeId, context.uid)
    const currentOwner = safeText(lead.ownerAgentId || lead.assignedTo || lead.assignedTo?.uid)
    const leadOffice = safeText(lead.brokerId || lead.brokerageId)
    const leadBelongsToOffice = (leadOffice && leadOffice === context.officeId) || (currentOwner && officeAgentIds.has(currentOwner))
    if (!leadBelongsToOffice) {
      return NextResponse.json({ ok: false, error: 'Lead is not in your office scope' }, { status: 403 })
    }

    if (safeText(lead.linkedTransactionId || lead.transactionId)) {
      return NextResponse.json({ ok: false, error: 'Lead already has an active deal' }, { status: 409 })
    }

    const normalizedLeadStage = normalizeLeadStage(lead.leadStage, lead.status)
    if (normalizedLeadStage === 'lost' || normalizedLeadStage === 'archived' || normalizedLeadStage === 'won') {
      return NextResponse.json({ ok: false, error: 'Lead stage must be active before opening a deal' }, { status: 400 })
    }

    const agentId = context.role === 'agent'
      ? context.uid
      : safeText(body.agentId || currentOwner || context.uid)

    if (!officeAgentIds.has(agentId)) {
      return NextResponse.json({ ok: false, error: 'agentId is not in your office' }, { status: 400 })
    }

    const stage = normalizeCrmDealStage(body.stage || mapLeadStageToDealStage(normalizedLeadStage))
    const currency = safeText(body.currency).toUpperCase() === 'DOP' ? 'DOP' : 'USD'
    const totalCommission = Number(((salePrice * commissionPercent) / 100).toFixed(2))
    const normalizedAgentSplit = Math.min(Math.max(agentSplitPercent, 0), 100)
    const brokerSplitPercent = Number((100 - normalizedAgentSplit).toFixed(2))
    const agentCommission = Number(((totalCommission * normalizedAgentSplit) / 100).toFixed(2))
    const brokerCommission = Number((totalCommission - agentCommission).toFixed(2))
    const txRef = db.collection('transactions').doc()
    const dealId = txRef.id
    const now = new Date()

    await txRef.set({
      dealId,
      officeId: context.officeId,
      leadId,
      propertyId: safeText(body.propertyId || (lead.source === 'property' ? lead.sourceId : '')) || null,
      projectId: safeText(body.projectId || (lead.source === 'project' ? lead.sourceId : '')) || null,
      unitId: safeText(body.unitId) || null,
      clientName: safeText(body.clientName || lead.buyerName || lead.name || lead.fullName) || 'Lead',
      clientEmail: safeText(body.clientEmail || lead.buyerEmail || lead.email) || null,
      clientPhone: safeText(body.clientPhone || lead.buyerPhone || lead.phone) || null,
      agentId,
      brokerId: context.role === 'broker' ? context.uid : null,
      stage,
      salePrice,
      currency,
      commissionPercent,
      totalCommission,
      agentSplitPercent: normalizedAgentSplit,
      brokerSplitPercent,
      agentCommission,
      brokerCommission,
      commissionStatus: 'pending',
      notes: safeText(body.notes || 'Creado desde CRM') || null,
      createdAt: now,
      updatedAt: now,
      createdBy: context.uid,
      updatedBy: context.uid,
    })

    const syncedLeadStage = mapCrmDealStageToLeadStage(stage)

    await leadRef.set(
      {
        leadStage: syncedLeadStage,
        status: stageToLegacyStatus(syncedLeadStage),
        legacyStatus: stageToLegacyStatus(syncedLeadStage),
        linkedDealId: dealId,
        linkedTransactionId: txRef.id,
        convertedToDealAt: now,
        convertedToDealBy: context.uid,
        stageChangedAt: now,
        stageChangedBy: context.uid,
        stageChangeReason: 'deal_opened_from_crm',
        updatedAt: now,
      },
      { merge: true }
    )

    await Promise.allSettled([
      emitActivityEvent(db, {
        type: 'deal_opened',
        actorId: context.uid,
        actorRole: context.role,
        entityType: 'deal',
        entityId: dealId,
        dealId,
        transactionId: txRef.id,
        listingId: safeText(body.propertyId || (lead.source === 'property' ? lead.sourceId : '')) || null,
        projectId: safeText(body.projectId || (lead.source === 'project' ? lead.sourceId : '')) || null,
        brokerId: context.role === 'broker' ? context.uid : null,
        agentId,
        officeId: context.officeId,
        metadata: {
          fromLeadId: leadId,
          stage,
          salePrice,
        },
      }),
      emitActivityEvent(db, {
        type: 'transaction_created',
        actorId: context.uid,
        actorRole: context.role,
        entityType: 'transaction',
        entityId: txRef.id,
        transactionId: txRef.id,
        dealId,
        listingId: safeText(body.propertyId || (lead.source === 'property' ? lead.sourceId : '')) || null,
        projectId: safeText(body.projectId || (lead.source === 'project' ? lead.sourceId : '')) || null,
        brokerId: context.role === 'broker' ? context.uid : null,
        agentId,
        officeId: context.officeId,
        metadata: {
          stage,
          salePrice,
          totalCommission,
          fromLeadId: leadId,
        },
      }),
    ])

    const saved = await txRef.get()
    return NextResponse.json({ ok: true, deal: toDealRecord(txRef.id, saved.data() as Record<string, any>) }, { status: 201 })
  } catch (error: any) {
    console.error('[api/broker/crm/deals] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to convert lead into deal' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.map((value: unknown) => safeText(value)).filter(Boolean)
      : []
    const id = safeText(body.id)
    const targetIds: string[] = ids.length ? Array.from(new Set(ids)) : (id ? [id] : [])
    if (!targetIds.length) {
      return NextResponse.json({ ok: false, error: 'id or ids is required' }, { status: 400 })
    }

    let nextCommissionStatus: 'pending' | 'paid' | undefined
    if (body.commissionStatus !== undefined) {
      const status = safeText(body.commissionStatus).toLowerCase()
      if (!['pending', 'paid', 'pagada'].includes(status)) {
        return NextResponse.json({ ok: false, error: 'Invalid commissionStatus' }, { status: 400 })
      }
      nextCommissionStatus = status === 'pagada' ? 'paid' : 'pending'
      if (status === 'paid') nextCommissionStatus = 'paid'
    }

    const nextStage = body.stage !== undefined ? normalizeCrmDealStage(body.stage) : undefined
    const nextLostReason = body.lostReason !== undefined ? (safeText(body.lostReason) || null) : undefined
    if (nextStage === 'lost' && !nextLostReason) {
      return NextResponse.json({ ok: false, error: 'lostReason is required when stage is lost' }, { status: 400 })
    }
    const nextNotes = body.notes !== undefined ? (safeText(body.notes) || null) : undefined

    const results = await Promise.all(
      targetIds.map((targetId) => updateSingleDeal({
        db,
        context,
        id: targetId,
        stage: nextStage,
        lostReason: nextLostReason,
        notes: nextNotes,
        commissionStatus: nextCommissionStatus,
      }))
    )

    const failed = results.find((result) => !result.ok)
    if (failed && !failed.ok) {
      return NextResponse.json({ ok: false, error: failed.error }, { status: failed.status })
    }

    const deals = results.filter((result): result is { ok: true; deal: CrmDealRecord } => result.ok).map((result) => result.deal)
    if (deals.length === 1) {
      return NextResponse.json({ ok: true, deal: deals[0] })
    }
    return NextResponse.json({ ok: true, deals, updatedCount: deals.length })
  } catch (error: any) {
    console.error('[api/broker/crm/deals] PATCH error', error)
    return NextResponse.json({ ok: false, error: 'Failed to update CRM deal' }, { status: 500 })
  }
}