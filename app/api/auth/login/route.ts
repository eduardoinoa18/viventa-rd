import { NextResponse } from 'next/server'

export async function POST(req: Request){
  const body = await req.json()
  const { email } = body
  // Demo: return a fake role based on email keywords
  const role = email?.includes('admin') ? 'master_admin' : email?.includes('broker') ? 'broker' : email?.includes('agent') ? 'agent' : 'user'
  return NextResponse.json({ ok:true, uid: 'demo', role, token: 'demo-token' })
}
