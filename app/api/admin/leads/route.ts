import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'
export const dynamic = 'force-dynamic'

// GET /api/admin/leads - fetch all leads from multiple sources
export async function GET(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const limitParam = Number(searchParams.get('limit') || '50')
    const safeLimit = Math.min(Math.max(limitParam, 1), 200)

    // Fetch from all lead sources in parallel
    const [inquiriesSnap, contactsSnap, waitlistSnap] = await Promise.all([
      (adminDb as any).collection('property_inquiries').orderBy('createdAt', 'desc').limit(safeLimit).get(),
      (adminDb as any).collection('contact_submissions').orderBy('createdAt', 'desc').limit(safeLimit).get(),
      (adminDb as any).collection('waitlist_social').orderBy('createdAt', 'desc').limit(safeLimit).get()
    ])

    // Map each source with proper typing
    const inquiries = inquiriesSnap.docs.map((d: any) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        source: 'property_inquiry',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    })

    const contacts = contactsSnap.docs.map((d: any) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        source: 'contact_form',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    })

    const waitlist = waitlistSnap.docs.map((d: any) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        source: 'social_waitlist',
        name: 'Waitlist Signup',
        email: data.email,
        phone: data.phone || '-',
        message: 'User interested in social network features',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    })

    // Combine and sort
    const allLeads = [...inquiries, ...contacts, ...waitlist].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({ ok: true, leads: allLeads })
  } catch (e: any) {
    console.error('leads GET error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch leads' }, { status: 500 })
  }
}

// PATCH /api/admin/leads - update lead assignment or status
export async function PATCH(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const { leadId, source, assignedTo, status } = await req.json()

    if (!leadId || !source) {
      return NextResponse.json({ ok: false, error: 'Missing leadId or source' }, { status: 400 })
    }

    // Map source to collection name
    const collectionMap: Record<string, string> = {
      property_inquiry: 'property_inquiries',
      contact_form: 'contact_submissions',
      social_waitlist: 'waitlist_social'
    }

    const collectionName = collectionMap[source]
    if (!collectionName) {
      return NextResponse.json({ ok: false, error: 'Invalid source' }, { status: 400 })
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    }

    // Update assignment if provided
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo || null
      updateData.assignedAt = assignedTo ? new Date() : null
    }

    // Update status if provided
    if (status !== undefined) {
      updateData.status = status
      if (status === 'converted') {
        updateData.convertedAt = new Date()
      }
    }

    // Update the lead
    await (adminDb as any).collection(collectionName).doc(leadId).set(updateData, { merge: true })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('leads PATCH error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to update lead' }, { status: 500 })
  }
}
