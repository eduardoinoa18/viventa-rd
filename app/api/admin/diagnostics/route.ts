// app/api/admin/diagnostics/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const firebase = {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    const algolia = {
      appId: !!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
      searchKey: !!process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
      index: !!process.env.NEXT_PUBLIC_ALGOLIA_INDEX,
    }

    const email = {
      sendgrid: !!process.env.SENDGRID_API_KEY,
      smtp: !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS,
      from: !!(process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM),
    }

    const mapbox = {
      token: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    }

    const adminAuth = {
      allowAny: process.env.ALLOW_ANY_MASTER_EMAIL === 'true',
      allowDevResponse: process.env.ALLOW_DEV_2FA_RESPONSE === 'true',
      allowlistConfigured: !!(process.env.MASTER_ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAIL),
    }

    return NextResponse.json({ ok: true, data: { firebase, algolia, email, mapbox, adminAuth } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Diagnostics error' }, { status: 500 })
  }
}
