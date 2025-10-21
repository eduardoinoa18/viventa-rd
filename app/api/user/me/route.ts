import { NextResponse } from 'next/server'

export async function GET(){
  return NextResponse.json({ ok:true, uid: 'demo', name: 'Eduardo', role: 'agent' })
}
