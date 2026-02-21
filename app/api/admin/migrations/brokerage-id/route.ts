// app/api/admin/migrations/brokerage-id/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'

function slugify(name: string) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    // remove diacritics (combining marks)
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function findBrokerageIdByName(adminDb: any, name: string) {
  if (!name) return null
  try {
    const snap = await adminDb.collection('brokerages').where('name', '==', name).limit(1).get()
    if (!snap.empty) return snap.docs[0].id
    // Try by slug field if exists
    const slug = slugify(name)
    const snap2 = await adminDb.collection('brokerages').where('slug', '==', slug).limit(1).get()
    if (!snap2.empty) return snap2.docs[0].id
    return null
  } catch {
    return null
  }
}

async function ensureBrokerage(adminDb: any, { id, name }: { id?: string | null; name?: string | null }) {
  const safeName = (name || 'Brokerage').trim()
  if (id) {
    await adminDb.collection('brokerages').doc(id).set({ id, name: safeName, updatedAt: new Date() }, { merge: true })
    return id
  }
  // Try find by name first
  const existingId = await findBrokerageIdByName(adminDb, safeName)
  if (existingId) return existingId
  const genId = `br-${slugify(safeName)}`.slice(0, 40)
  await adminDb.collection('brokerages').doc(genId).set({ id: genId, name: safeName, slug: slugify(safeName), status: 'active', createdAt: new Date() }, { merge: true })
  return genId
}

// GET: dry-run summary
export async function GET(_req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN'] })
  if (authResult instanceof Response) return authResult

  const adminDb = getAdminDb()
  if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
  const usersSnap = await adminDb.collection('users').get()
  let totalAgents = 0
  let needsId = 0
  let brokers = 0
  usersSnap.forEach((d: any) => {
    const u = d.data() || {}
    if (u.role === 'agent') {
      totalAgents++
      if (!u.brokerage_id && (u.brokerage || u.company)) needsId++
    }
    if (u.role === 'broker') brokers++
  })
  return NextResponse.json({ ok: true, data: { totalUsers: usersSnap.size, totalAgents, agentsMissingBrokerageId: needsId, brokers } })
}

// POST: perform migration to set brokerage_id consistently
export async function POST(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN'] })
  if (authResult instanceof Response) return authResult

  const adminDb = getAdminDb()
  if (!adminDb) return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 500 })
  const { dryRun } = await req.json().catch(() => ({ dryRun: false }))

  const batchSize = 400
  let updated = 0
  let createdBrokerages = 0
  let scanned = 0

  // 1) Ensure brokers have brokerage_id and a brokerage record
  const brokersSnap = await adminDb.collection('users').where('role', '==', 'broker').get()
  for (const doc of brokersSnap.docs) {
    const u = doc.data() || {}
    const currentId = u.brokerage_id || null
    const name = u.brokerage || u.company || null
    if (!currentId && !name) continue
    const ensuredId = currentId || (await ensureBrokerage(adminDb, { name }))
    if (!currentId && ensuredId) {
      if (!dryRun) await doc.ref.update({ brokerage_id: ensuredId, updatedAt: new Date() })
      updated++
    }
  }

  // 2) Backfill agents
  const agentsSnap = await adminDb.collection('users').where('role', '==', 'agent').get()
  for (const doc of agentsSnap.docs) {
    scanned++
    const u = doc.data() || {}
    if (u.brokerage_id) continue
    const name = u.brokerage || u.company || null
    if (!name) continue
    // Attempt to find brokerage by name first
    let ensuredId = await findBrokerageIdByName(adminDb, name)
    if (!ensuredId) {
      // Create one based on name (idempotent-ish by slug)
      ensuredId = `br-${slugify(name)}`.slice(0, 40)
      if (!dryRun) {
        await adminDb.collection('brokerages').doc(ensuredId).set({ id: ensuredId, name, slug: slugify(name), status: 'active', createdAt: new Date() }, { merge: true })
      }
      createdBrokerages++
    }
    if (!dryRun) await doc.ref.update({ brokerage_id: ensuredId, updatedAt: new Date() })
    updated++
  }

  return NextResponse.json({ ok: true, data: { scanned, updated, createdBrokerages, dryRun: !!dryRun } })
}
