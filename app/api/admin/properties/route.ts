// app/api/admin/properties/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const listings = [
    { id: 'L-001', title: 'Casa Punta Cana', city: 'Punta Cana', price: 240000, status: 'pending' },
    { id: 'L-002', title: 'Condo Samaná', city: 'Samaná', price: 380000, status: 'active' }
  ]
  return NextResponse.json({ ok: true, listings })
}

export async function POST(request: Request) {
  const body = await request.json()
  // Save listing to DB
  return NextResponse.json({ ok: true, listing: body })
}
