import { NextResponse } from 'next/server'

type Invoice = { id: string; customerId: string; amount: number; currency: string; status: 'paid'|'open'|'void'|'uncollectible'; createdAt: string }

let invoices: Invoice[] = []

export async function GET() {
  return NextResponse.json({ ok: true, data: invoices })
}
