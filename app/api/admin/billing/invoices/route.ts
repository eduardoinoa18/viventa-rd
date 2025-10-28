import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseClient'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

export async function GET() {
  try {
    const q = query(collection(db, 'billing_invoices'), orderBy('paidAt', 'desc'))
    const snapshot = await getDocs(q)
    const invoices = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ ok: true, data: invoices })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
