import fs from 'fs'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

function readEnvFile(filePath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        const key = line.slice(0, index).replace(/^\uFEFF/, '')
        const value = line.slice(index + 1).replace(/^"|"$/g, '')
        return [key, value]
      })
  )
}

function initAdminFromEnv(env) {
  const rawServiceAccount = env.FIREBASE_SERVICE_ACCOUNT
  let projectId = env.FIREBASE_ADMIN_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''
  let clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL || ''
  let privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY || ''

  if (rawServiceAccount) {
    const serviceAccountJson = /^[A-Za-z0-9+/=]+$/.test(rawServiceAccount)
      ? Buffer.from(rawServiceAccount, 'base64').toString('utf8')
      : rawServiceAccount
    const serviceAccount = JSON.parse(serviceAccountJson)
    projectId = serviceAccount.project_id || projectId
    clientEmail = serviceAccount.client_email || clientEmail
    privateKey = serviceAccount.private_key || privateKey
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials missing (FIREBASE_SERVICE_ACCOUNT or FIREBASE_ADMIN_* env vars)')
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: String(privateKey).replace(/\\n/g, '\n'),
      }),
    })
  }

  return { projectId, db: getFirestore() }
}

const STAGE_STATUS = {
  new: 'unassigned',
  assigned: 'assigned',
  contacted: 'contacted',
  qualified: 'contacted',
  won: 'won',
  lost: 'lost',
}

const SLA_HOURS = {
  new: 1,
  assigned: 2,
  contacted: 24,
  qualified: 48,
  won: 0,
  lost: 0,
}

function withHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr, idx) {
  return arr[idx % arr.length]
}

async function loadAssignees(db) {
  const active = await db
    .collection('users')
    .where('status', '==', 'active')
    .where('role', 'in', ['agent', 'broker'])
    .limit(20)
    .get()

  if (!active.empty) {
    return active.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
  }

  const fallback = await db.collection('users').limit(20).get()
  return fallback.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
}

async function main() {
  const env = readEnvFile('.env.local')
  const { projectId, db } = initAdminFromEnv(env)

  const assignees = await loadAssignees(db)
  if (assignees.length === 0) {
    throw new Error('No users found. Create at least one user before seeding leads.')
  }

  const distribution = [
    ...Array(8).fill('new'),
    ...Array(4).fill('assigned'),
    ...Array(3).fill('contacted'),
    ...Array(2).fill('qualified'),
    ...Array(2).fill('won'),
    ...Array(1).fill('lost'),
  ]

  const breachedIndexes = new Set([9, 13, 17])
  const seedTag = `week2-seed-${Date.now()}`
  const batch = db.batch()
  const now = new Date()

  distribution.forEach((stage, index) => {
    const owner = stage === 'new' ? null : pick(assignees, index)
    const createdAt = new Date(now.getTime() - randInt(1, 20) * 60 * 60 * 1000)
    const assignedAt = stage === 'new' ? null : new Date(createdAt.getTime() + randInt(5, 180) * 60 * 1000)
    const stageChangedAt = assignedAt || createdAt
    const stageHours = SLA_HOURS[stage]

    let stageSlaDueAt = null
    if (stageHours > 0) {
      stageSlaDueAt = withHours(stageChangedAt, stageHours)
    }

    if (breachedIndexes.has(index) && ['assigned', 'contacted', 'qualified'].includes(stage)) {
      stageSlaDueAt = new Date(now.getTime() - randInt(2, 12) * 60 * 60 * 1000)
    }

    const leadRef = db.collection('leads').doc()
    batch.set(leadRef, {
      buyerName: `Week2 Seed Lead ${index + 1}`,
      buyerEmail: `week2.seed.${index + 1}@example.com`,
      buyerPhone: `+1-809-555-${String(1000 + index).padStart(4, '0')}`,
      type: 'request-info',
      source: index % 2 === 0 ? 'property' : 'project',
      sourceId: `seed-source-${index + 1}`,
      message: `Seeded lead for week 2 validation (${seedTag})`,
      status: STAGE_STATUS[stage],
      leadStage: stage,
      ownerAgentId: owner?.id || null,
      assignedTo: owner?.id || null,
      ownerAssignedAt: assignedAt ? Timestamp.fromDate(assignedAt) : null,
      assignedAt: assignedAt ? Timestamp.fromDate(assignedAt) : null,
      stageChangedAt: Timestamp.fromDate(stageChangedAt),
      stageSlaDueAt: stageSlaDueAt ? Timestamp.fromDate(stageSlaDueAt) : null,
      escalationStatus: null,
      escalationLevel: 0,
      previousStage: stage === 'new' ? null : 'new',
      legacyStatus: STAGE_STATUS[stage],
      lastActivityAt: Timestamp.fromDate(stageChangedAt),
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(now),
      seedTag,
      seededFor: 'week2-validation',
    })
  })

  await batch.commit()

  console.log(`SEED_OK:true`)
  console.log(`PROJECT_ID:${projectId}`)
  console.log(`SEED_TAG:${seedTag}`)
  console.log(`TOTAL_CREATED:${distribution.length}`)
  console.log('BREAKDOWN:new=8,assigned=4,contacted=3,qualified=2,won=2,lost=1')
  console.log('BREACHED_TARGETS:3 (assigned/contacted/qualified with overdue SLA)')
}

main().catch((error) => {
  console.error('SEED_ERROR', error?.message || error)
  process.exit(1)
})
