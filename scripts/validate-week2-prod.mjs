import fs from 'fs'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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

async function main() {
  const env = readEnvFile('.env.local')

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

  const db = getFirestore()

  const leadsSnap = await db.collection('leads').get()
  const leads = leadsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))

  const totalLeads = leads.length
  const nowMs = Date.now()
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
  const RESPONSE_CLAMP_MINUTES = 7 * 24 * 60
  const responseStages = new Set(['assigned', 'contacted', 'qualified', 'won'])
  const terminalStages = new Set(['won', 'lost', 'archived'])

  function toDate(value) {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value?.toDate === 'function') return value.toDate()
    if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000)
    const parsed = new Date(value)
    return Number.isFinite(parsed.getTime()) ? parsed : null
  }

  const unassigned = leads.filter((lead) => {
    const ownerAgentId = String(lead.ownerAgentId || '').trim()
    const assignedToString = typeof lead.assignedTo === 'string' ? String(lead.assignedTo || '').trim() : ''
    const assignedToUid = String(lead.assignedTo?.uid || '').trim()
    const stage = String(lead.leadStage || '').toLowerCase()
    return !ownerAgentId && !assignedToString && !assignedToUid && stage === 'new'
  }).length

  const assignedOrBeyond = leads.filter((lead) => {
    const stage = String(lead.leadStage || '').toLowerCase()
    return ['assigned', 'contacted', 'qualified', 'negotiating', 'won', 'lost'].includes(stage)
  }).length

  const wonCount = leads.filter((lead) => String(lead.leadStage || '').toLowerCase() === 'won').length
  const conversionRate = assignedOrBeyond > 0 ? Number(((wonCount / assignedOrBeyond) * 100).toFixed(1)) : 0

  const slaBreached = leads.filter((lead) => {
    const stage = String(lead.leadStage || '').toLowerCase()
    if (terminalStages.has(stage)) return false
    const dueAt = toDate(lead.stageSlaDueAt)
    if (!dueAt) return false
    return dueAt.getTime() < nowMs
  }).length

  const responseMinutes = leads
    .map((lead) => {
      const stage = String(lead.leadStage || '').toLowerCase()
      if (!responseStages.has(stage)) return null

      const created = toDate(lead.createdAt)
      const assigned = toDate(lead.assignedAt)
      if (!created || !assigned) return null
      if (nowMs - created.getTime() > THIRTY_DAYS_MS) return null
      const latency = (assigned.getTime() - created.getTime()) / 60000
      if (latency <= 0) return null
      return Math.min(latency, RESPONSE_CLAMP_MINUTES)
    })
    .filter((value) => typeof value === 'number')

  const avgResponseTimeMinutes =
    responseMinutes.length > 0
      ? Number((responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length).toFixed(1))
      : 0

  const jobsSnap = await db.collection('operational_jobs').orderBy('createdAt', 'desc').limit(10).get()
  const jobs = jobsSnap.docs.map((doc) => {
    const data = doc.data() || {}
    return {
      id: doc.id,
      job: data.job || null,
      status: data.status || null,
      scanned: data.scanned || 0,
      assigned: data.assigned || 0,
      escalated: data.escalated || 0,
      durationMs: data.durationMs || 0,
      timestamp: data.createdAt?.toDate?.()?.toISOString?.() || data.timestamp?.toDate?.()?.toISOString?.() || null,
    }
  })

  console.log('ADMIN_ACCESS_OK:true')
  console.log(`PROJECT_ID:${projectId}`)
  console.log(`LEADS_TOTAL:${totalLeads}`)
  console.log(`UNASSIGNED_NEW_NO_OWNER:${unassigned}`)
  console.log(`SLA_BREACHED_OR_ESCALATED:${slaBreached}`)
  console.log(`CONVERSION_RATE_WON_OVER_ASSIGNED_PLUS:${conversionRate}`)
  console.log(`AVG_RESPONSE_MINUTES:${avgResponseTimeMinutes}`)
  console.log(`RECENT_OP_JOBS:${jobs.length}`)
  console.log(JSON.stringify(jobs, null, 2))
}

main().catch((error) => {
  console.error('VALIDATION_ERROR', error?.message || error)
  process.exit(1)
})
