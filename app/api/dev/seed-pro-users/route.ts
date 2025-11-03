import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  try {
    // Safety: only allow in non-production or with explicit secret
    const isProd = process.env.NODE_ENV === 'production'
    const headerSecret = req.headers.get('x-seed-secret') || ''
    const requiredSecret = process.env.SEED_SECRET || ''
    if (isProd && (!requiredSecret || headerSecret !== requiredSecret)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
    }

    const payload = await req.json().catch(() => ({} as any))
    const {
      agent = { email: 'agent.demo@viventa.com', password: 'AgentDemo#2025', name: 'Agente Demo' },
      broker = { email: 'broker.demo@viventa.com', password: 'BrokerDemo#2025', name: 'Bróker Demo' }
    } = payload || {}

    const upsertUser = async (role: 'agent'|'broker', u: { email: string; password: string; name: string }) => {
      // Try get by email
      let userRecord
      try {
        userRecord = await adminAuth!.getUserByEmail(u.email)
      } catch {}
      if (!userRecord) {
        userRecord = await adminAuth!.createUser({ email: u.email, password: u.password, displayName: u.name, emailVerified: true })
      }
      const uid = userRecord.uid
      // Set custom claims if desired (optional)
      try { await adminAuth!.setCustomUserClaims(uid, { role }) } catch {}
      // Upsert Firestore profile
      await adminDb!.collection('users').doc(uid).set({
        uid,
        email: u.email.toLowerCase(),
        name: u.name,
        role,
        status: 'active',
        profileComplete: true,
        createdAt: (await import('firebase-admin/firestore')).Timestamp.now(),
        updatedAt: (await import('firebase-admin/firestore')).Timestamp.now(),
      }, { merge: true })
      return { uid }
    }

    const agentRes = await upsertUser('agent', agent)
    const brokerRes = await upsertUser('broker', broker)

    return NextResponse.json({ ok: true, agent: { email: agent.email, ...agentRes }, broker: { email: broker.email, ...brokerRes } })
  } catch (e) {
    console.error('Seed mock pro users failed', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
