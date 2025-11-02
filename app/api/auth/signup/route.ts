import { NextResponse } from 'next/server'

export async function POST(req: Request){
  const body = await req.json()
  return NextResponse.json({ ok:true, uid: 'demo', role: 'agent', token: 'demo-token', profileComplete: false })
}
