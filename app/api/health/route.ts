// app/api/health/route.ts
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { isFirebaseConfigured } from '@/lib/firebaseClient'

export async function GET() {
  try {
    const hasSendgrid = !!process.env.SENDGRID_API_KEY
    const hasSmtp = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS
    const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL || process.env.MASTER_ADMIN_EMAILS || ''
    const hasAdminPassword = !!process.env.MASTER_ADMIN_PASSWORD

    const env = {
      vercelEnv: process.env.VERCEL_ENV || 'local',
      nodeEnv: process.env.NODE_ENV || 'development',
      hasFirebase: !!isFirebaseConfigured,
      hasEmailProvider: hasSendgrid || hasSmtp,
      emailProvider: hasSendgrid ? 'sendgrid' : (hasSmtp ? 'smtp' : 'none'),
      hasMasterAdminEmail: !!masterAdminEmail,
      hasAdminPassword,
      authMode: hasAdminPassword ? 'password' : ((hasSendgrid || hasSmtp) ? '2fa' : 'unknown'),
      socialEnabled: process.env.FEATURE_SOCIAL_ENABLED === 'true',
    }

    return NextResponse.json({ ok: true, env })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'health_error', details: String(e) }, { status: 500 })
  }
}
