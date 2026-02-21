import { NextResponse } from 'next/server'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'
export const dynamic = 'force-dynamic'
import { db } from '@/lib/firebaseClient'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

export async function GET() {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN'] })
  if (authResult instanceof Response) return authResult

  try {
    const q = query(collection(db, 'billing_invoices'), orderBy('paidAt', 'desc'))
    const snapshot = await getDocs(q)
    const invoices = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ ok: true, data: invoices })
  } catch (e: any) {
    console.error('Error fetching billing invoices:', e)
    // Return empty array if collection doesn't exist or permission denied
    if (e?.code === 'permission-denied' || e?.message?.includes('index') || e?.message?.includes('not found')) {
      return NextResponse.json({ ok: true, data: [] })
    }
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
