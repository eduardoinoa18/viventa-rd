import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    // Return 200 (not 401) so browsers don't log an error on every public page load.
    // Callers detect unauthenticated state via ok: false / session: null in the body.
    return NextResponse.json({ ok: false, session: null }, { status: 200 })
  }
  return NextResponse.json({ ok: true, session })
}
