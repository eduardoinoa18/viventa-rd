import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const role = req.cookies.get('viventa_role')?.value
    if (role !== 'admin' && role !== 'master_admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 500 })
    }

    const docSnap = await db.collection('settings').doc('admin').get()
    if (docSnap.exists) {
      return NextResponse.json({ ok: true, data: docSnap.data() })
    }
    
    // Return default settings
    const defaults = {
      siteName: 'VIVENTA',
      supportEmail: 'support@viventa.com',
      maintenanceMode: false,
      allowRegistration: true,
      allowAgentApplications: true,
      allowBrokerApplications: true,
      maxPropertiesPerAgent: 100,
      featuredPropertiesLimit: 10,
    }
    return NextResponse.json({ ok: true, data: defaults })
  } catch (e: any) {
    console.error('Error fetching admin settings:', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.cookies.get('viventa_role')?.value
    if (role !== 'admin' && role !== 'master_admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 500 })
    }

    const body = await req.json()
    await db.collection('settings').doc('admin').set(body, { merge: true })
    return NextResponse.json({ ok: true, data: body })
  } catch (e: any) {
    console.error('Error updating admin settings:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to update settings' }, { status: 500 })
  }
}
