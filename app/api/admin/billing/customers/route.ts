import { NextRequest, NextResponse } from 'next/server'

type Customer = { id: string; email: string; name?: string; createdAt: string }

let customers: Customer[] = []

export async function GET() {
  return NextResponse.json({ ok: true, data: customers })
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    if (!email) return NextResponse.json({ ok:false, error:'Email required' }, { status: 400 })
    const exists = customers.find(c=>c.email.toLowerCase()===String(email).toLowerCase())
    if (exists) return NextResponse.json({ ok:true, data: exists })
    const c: Customer = { id: `cus_${Math.random().toString(36).slice(2,10)}`, email, name, createdAt: new Date().toISOString() }
    customers.push(c)
    return NextResponse.json({ ok: true, data: c })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Invalid payload' }, { status: 400 })
  }
}
