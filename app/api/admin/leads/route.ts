import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterAdmin } from '@/lib/requireMasterAdmin'
import {
  normalizeLeadStage,
  ownerRequiredForStage,
  stageSlaDueAt,
  stageToLegacyStatus,
  validateLeadStageTransition,
} from '@/lib/leadLifecycle'

export const dynamic = 'force-dynamic'

function extractOwnerAgentId(lead: any): string {
  const ownerFromCanonical = String(lead?.ownerAgentId || '').trim()
  if (ownerFromCanonical) return ownerFromCanonical

  if (typeof lead?.assignedTo === 'string') {
    const ownerFromLegacy = String(lead.assignedTo || '').trim()
    if (ownerFromLegacy) return ownerFromLegacy
  }

  const ownerFromLegacyObject = String(lead?.assignedTo?.uid || '').trim()
  if (ownerFromLegacyObject) return ownerFromLegacyObject

  return ''
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const limitParam = Number(searchParams.get('limit') || '50')
    const safeLimit = Math.min(Math.max(limitParam, 1), 200)

    const snap = await adminDb.collection('leads').orderBy('createdAt', 'desc').limit(safeLimit).get()

    const leads = snap.docs.map((d: any) => {
      const data = d.data() || {}
      const leadStage = normalizeLeadStage(data.leadStage, data.status)
      const ownerAgentId = extractOwnerAgentId(data)
      return {
        id: d.id,
        ...data,
        leadStage,
        status: stageToLegacyStatus(leadStage),
        ownerAgentId: ownerAgentId || null,
        assignedTo: ownerAgentId || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      }
    })

    return NextResponse.json({ ok: true, leads })
  } catch (e: any) {
    console.error('leads GET error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const { leadId, ownerAgentId, assignedTo, status, leadStage, reason } = await req.json()
    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'Missing leadId' }, { status: 400 })
    }

    const leadRef = adminDb.collection('leads').doc(leadId)
    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    }

    const lead = leadSnap.data() || {}
    const currentStage = normalizeLeadStage(lead.leadStage, lead.status)
    const previousOwner = extractOwnerAgentId(lead)
    const incomingOwnerRaw = ownerAgentId !== undefined ? ownerAgentId : assignedTo
    const nextOwner = incomingOwnerRaw !== undefined ? String(incomingOwnerRaw || '').trim() : previousOwner

    const requestedStage =
      typeof leadStage === 'string'
        ? leadStage
        : typeof status === 'string'
          ? normalizeLeadStage(undefined, status)
          : (incomingOwnerRaw !== undefined && currentStage === 'new' ? 'assigned' : currentStage)

    const transition = validateLeadStageTransition({ currentStage, nextStage: requestedStage })
    if (!transition.ok) {
      return NextResponse.json({ ok: false, error: transition.error, code: transition.code }, { status: 400 })
    }

    if (ownerRequiredForStage(transition.nextStage) && !nextOwner) {
      return NextResponse.json({ ok: false, error: 'ownerAgentId is required for this stage', code: 'OWNER_REQUIRED' }, { status: 400 })
    }

    if (incomingOwnerRaw !== undefined && previousOwner && nextOwner && previousOwner !== nextOwner && !String(reason || '').trim()) {
      return NextResponse.json({ ok: false, error: 'Reassignment reason is required' }, { status: 400 })
    }

    const now = new Date()
    const nextStatus = stageToLegacyStatus(transition.nextStage)
    const updateData: any = {
      updatedAt: now,
      leadStage: transition.nextStage,
      status: nextStatus,
      legacyStatus: nextStatus,
      previousStage: transition.currentStage,
      stageChangedAt: now,
      stageChangedBy: admin.uid,
      stageChangeReason: String(reason || '').trim() || 'manual_patch',
      stageSlaDueAt: stageSlaDueAt(transition.nextStage, now),
      slaBreached: false,
      slaBreachedAt: null,
      ownerAgentId: nextOwner || null,
      assignedTo: nextOwner || null,
      assignedAt: nextOwner ? now : null,
      ownerAssignedAt: nextOwner ? now : null,
      ownerAssignedBy: nextOwner ? admin.uid : null,
      ownerAssignmentReason: String(reason || '').trim() || null,
    }

    await leadRef.set(updateData, { merge: true })

    return NextResponse.json({
      ok: true,
      data: {
        leadId,
        previousStage: transition.currentStage,
        newStage: transition.nextStage,
      },
    })
  } catch (e: any) {
    console.error('leads PATCH error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to update lead' }, { status: 500 })
  }
}
