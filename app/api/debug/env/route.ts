/**
 * Diagnostic endpoint to verify environment configuration
 * DO NOT expose in production - remove after debugging
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  // Only allow in preview/dev
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
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
