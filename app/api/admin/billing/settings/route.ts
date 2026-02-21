import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'
import { logAdminAction } from '@/lib/admin/auditLog'

export async function GET() {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const docSnap = await getDoc(doc(db, 'settings', 'billing'))
    if (docSnap.exists()) {
      return NextResponse.json({ ok: true, data: docSnap.data() })
    }
    // Default settings
    const defaults = {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      priceIds: { agent: '', broker: '' },
      wallets: { applePay: false, googlePay: false },
    }
    return NextResponse.json({ ok: true, data: defaults })
  } catch (e: any) {
    console.error('Error fetching billing settings:', e)
    // Return defaults if permission denied or not found
    if (e?.code === 'permission-denied' || e?.message?.includes('not found')) {
      const defaults = {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        priceIds: { agent: '', broker: '' },
        wallets: { applePay: false, googlePay: false },
      }
      return NextResponse.json({ ok: true, data: defaults })
    }
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const body = await req.json()
    await setDoc(doc(db, 'settings', 'billing'), body, { merge: true })
    try {
      await logAdminAction({
        actorUid: authResult.uid,
        actorRole: authResult.role,
        action: 'BILLING_SETTINGS_UPDATED',
        targetType: 'settings',
        targetId: 'billing',
        metadata: { keys: Object.keys(body || {}) },
      })
    } catch {}
    return NextResponse.json({ ok: true, data: body })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 400 })
  }
}
