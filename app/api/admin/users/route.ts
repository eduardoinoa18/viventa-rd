// app/api/admin/users/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  // In production: query DB / Firestore to fetch users
  const users = [
    { uid: 'u1', name: 'María Pérez', email: 'maria@demo.com', role: 'agent', status: 'approved' },
    { uid: 'u2', name: 'Carlos Gómez', email: 'carlos@demo.com', role: 'broker', status: 'approved' },
    { uid: 'u3', name: 'Admin Test', email: 'admin@viventa.com', role: 'master_admin', status: 'active' }
  ]
  return NextResponse.json({ ok: true, users })
}

export async function POST(request: Request) {
  const body = await request.json()
  // Create user logic here (validation + DB)
  return NextResponse.json({ ok: true, created: body })
}
