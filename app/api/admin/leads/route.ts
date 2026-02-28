import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterAdmin } from '@/lib/requireMasterAdmin'
import {
  normalizeLeadStage,
  stageSlaDueAt,
  stageToLegacyStatus,
  validateLeadStageTransition,
} from '@/lib/leadLifecycle'
export const dynamic = 'force-dynamic'

// GET /api/admin/leads - compatibility endpoint backed by centralized leads collection
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

    const snap = await (adminDb as any)
      .collection('leads')
      .orderBy('createdAt', 'desc')
      .limit(safeLimit)
      .get()

    const leads = snap.docs.map((d: any) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      }
    })

    return NextResponse.json({ ok: true, leads })
  } catch (e: any) {
    console.error('leads GET error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch leads' }, { status: 500 })
  }
}

// PATCH /api/admin/leads - compatibility patch against centralized leads collection
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const { leadId, assignedTo, status, leadStage, reason } = await req.json()

    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'Missing leadId' }, { status: 400 })
    }

    const leadRef = (adminDb as any).collection('leads').doc(leadId)
    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    }

    const lead = leadSnap.data() || {}
    const currentStage = normalizeLeadStage(lead.leadStage, lead.status)
    const previousAssignedTo = String(lead.assignedTo || '')
    const nextAssignedTo = assignedTo !== undefined ? String(assignedTo || '') : previousAssignedTo

    if (assignedTo !== undefined && previousAssignedTo && nextAssignedTo && previousAssignedTo !== nextAssignedTo && !String(reason || '').trim()) {
      return NextResponse.json({ ok: false, error: 'Reassignment reason is required' }, { status: 400 })
    }

    const requestedStage =
      typeof leadStage === 'string'
        ? leadStage
        : typeof status === 'string'
        ? normalizeLeadStage(undefined, status)
        : (assignedTo !== undefined && currentStage === 'new' ? 'assigned' : currentStage)

    const transition = validateLeadStageTransition({
      currentStage,
      nextStage: requestedStage,
    })

    if (!transition.ok) {
      return NextResponse.json({ ok: false, error: transition.error, code: transition.code }, { status: 400 })
    }

    const now = new Date()
    const updateData: any = {
      updatedAt: now,
      leadStage: transition.nextStage,
      status: stageToLegacyStatus(transition.nextStage),
      previousStage: transition.currentStage,
      stageChangedAt: now,
      stageChangedBy: admin.uid,
      stageChangeReason: String(reason || '').trim() || 'manual_patch',
      stageSlaDueAt: stageSlaDueAt(transition.nextStage, now),
    }

    if (assignedTo !== undefined) {
      updateData.assignedTo = nextAssignedTo || null
      updateData.assignedAt = nextAssignedTo ? now : null
      if (previousAssignedTo && nextAssignedTo && previousAssignedTo !== nextAssignedTo) {
        updateData.slaResetAt = now
        updateData.reassignmentReason = String(reason || '').trim()
      }
    }

    if (transition.nextStage === 'won') {
      updateData.convertedAt = now
    }

    await leadRef.set(updateData, { merge: true })

    await (adminDb as any).collection('lead_stage_events').add({
      leadId,
      previousStage: transition.currentStage,
      newStage: transition.nextStage,
      actorUserId: admin.uid,
      actorEmail: admin.email,
      reason: String(reason || '').trim() || 'manual_patch',
      assignment: {
        previousAssignedTo: previousAssignedTo || null,
        newAssignedTo: nextAssignedTo || null,
      },
      createdAt: now,
    })

    if (assignedTo !== undefined && previousAssignedTo !== nextAssignedTo) {
      await (adminDb as any).collection('lead_assignment_logs').add({
        leadId,
        previousAssignedTo: previousAssignedTo || null,
        newAssignedTo: nextAssignedTo || null,
        eventType: previousAssignedTo ? 'reassigned' : 'assigned',
        note: String(reason || '').trim(),
        actorUserId: admin.uid,
        actorEmail: admin.email,
        createdAt: now,
      })
    }

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
