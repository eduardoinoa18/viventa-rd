import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ ok: false, session: null }, { status: 401 })
  }
  return NextResponse.json({ ok: true, session })
}
