import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function noStoreJson(body: any, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    // Return 200 (not 401) so browsers don't log an error on every public page load.
    // Callers detect unauthenticated state via ok: false / session: null in the body.
    return noStoreJson({ ok: false, session: null }, { status: 200 })
  }
  return noStoreJson({ ok: true, session })
}
