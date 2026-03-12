/**
 * Diagnostic endpoint to verify environment configuration
 * DO NOT expose in production - remove after debugging
 */

import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { requireMasterAdmin } from '@/lib/adminApiAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const authError = await requireMasterAdmin(request)
  if (authError) {
    return authError
  }

  const checks = {
    env: process.env.VERCEL_ENV || 'local',
    firebaseApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    firebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    
    // Admin SDK
    serviceAccountPresent: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    serviceAccountLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
    
    // Legacy admin env
    adminProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
    adminClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    adminPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    
    // Session
    sessionSecretPresent: !!process.env.SESSION_SECRET,
    
    // Email
    sendgridKey: !!process.env.SENDGRID_API_KEY,
    smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
  }

  return NextResponse.json(checks)
}
