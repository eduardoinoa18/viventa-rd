import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'
import { logAdminAction } from '@/lib/admin/auditLog'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
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
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 500 })
    }

    const body = await req.json()
    await db.collection('settings').doc('admin').set(body, { merge: true })
    try {
      await logAdminAction({
        actorUid: authResult.uid,
        actorRole: authResult.role,
        action: 'SETTINGS_UPDATED',
        targetType: 'settings',
        targetId: 'admin',
        metadata: { keys: Object.keys(body || {}) },
      })
    } catch {}
    return NextResponse.json({ ok: true, data: body })
  } catch (e: any) {
    console.error('Error updating admin settings:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to update settings' }, { status: 500 })
  }
}
