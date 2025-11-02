import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export async function GET() {
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
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await setDoc(doc(db, 'settings', 'billing'), body, { merge: true })
    return NextResponse.json({ ok: true, data: body })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 400 })
  }
}
