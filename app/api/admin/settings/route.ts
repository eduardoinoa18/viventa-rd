import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterAdmin } from '@/lib/requireMasterAdmin'
import { adminSuccessResponse, adminErrorResponse, handleAdminError } from '@/lib/adminErrors'
import { logAdminAction } from '@/lib/logAdminAction'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)

    const db = getAdminDb()
    if (!db) {
      return adminErrorResponse('SERVICE_UNAVAILABLE', undefined, 'Database unavailable')
    }

    const docSnap = await db.collection('settings').doc('admin').get()
    if (docSnap.exists) {
      return adminSuccessResponse(docSnap.data())
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
    return adminSuccessResponse(defaults)
  } catch (error) {
    return handleAdminError(error, 'settings-get')
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)

    const db = getAdminDb()
    if (!db) {
      return adminErrorResponse('SERVICE_UNAVAILABLE', undefined, 'Database unavailable')
    }

    const body = await req.json()
    await db.collection('settings').doc('admin').set(body, { merge: true })
    
    // Log the settings update
    await logAdminAction({
      actor: admin.email,
      action: 'settings_update',
      target: 'settings',
      metadata: { updates: body }
    })
    
    return adminSuccessResponse(body)
  } catch (error) {
    return handleAdminError(error, 'settings-post')
  }
}
