import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { ActivityLogger } from '@/lib/activityLogger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { leadId, assigneeId } = await req.json()
    if (!leadId || !assigneeId) {
      return NextResponse.json({ ok: false, error: 'leadId and assigneeId are required' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin not configured' }, { status: 500 })

    // Load assignee profile
    const assigneeDoc = await adminDb.collection('users').doc(assigneeId).get()
    if (!assigneeDoc.exists) {
      return NextResponse.json({ ok: false, error: 'Assignee not found' }, { status: 404 })
    }
    const assignee = assigneeDoc.data() as any

    // Try all lead sources
    const sources = ['property_inquiries', 'contact_submissions', 'waitlist_social']
    let leadRef: any = null
    let leadSnap: any = null
    let foundSource = ''

    for (const src of sources) {
      const ref = adminDb.collection(src).doc(leadId)
      const snap = await ref.get()
      if (snap.exists) {
        leadRef = ref
        leadSnap = snap
        foundSource = src
        break
      }
    }

    if (!leadRef || !leadSnap?.exists) {
      return NextResponse.json({ ok: false, error: 'Lead not found in any source' }, { status: 404 })
    }

    const update: any = {
      status: 'assigned',
      assignedTo: {
        uid: assigneeId,
        name: assignee.name || assignee.company || 'Sin nombre',
        role: assignee.role || 'agent',
        email: assignee.email || '',
      },
      assignedAt: new Date(),
      updatedAt: new Date(),
    }

    await leadRef.set(update, { merge: true })

    // Log activity
    try {
      const leadData = leadSnap.data() as any
      await ActivityLogger.log({
        type: 'lead',
        action: 'Lead Assigned',
        metadata: {
          leadId,
          source: foundSource,
          propertyId: leadData?.propertyId,
          propertyTitle: leadData?.propertyTitle,
          assigneeId,
          assigneeName: update.assignedTo.name,
          assigneeRole: update.assignedTo.role,
        },
      })
    } catch (e) {}

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('assign lead error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Internal error' }, { status: 500 })
  }
}
