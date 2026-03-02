import * as dotenv from 'dotenv'
import * as path from 'path'
import { getAdminDb } from '../../lib/firebaseAdmin'
import { normalizeLeadStage, stageSlaDueAt, stageToLegacyStatus } from '../../lib/leadLifecycle'

dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') })

function extractOwnerAgentId(lead: any): string {
  const ownerFromCanonical = String(lead?.ownerAgentId || '').trim()
  if (ownerFromCanonical) return ownerFromCanonical

  if (typeof lead?.assignedTo === 'string') {
    const ownerFromLegacy = String(lead.assignedTo || '').trim()
    if (ownerFromLegacy) return ownerFromLegacy
  }

  const ownerFromLegacyObject = String(lead?.assignedTo?.uid || '').trim()
  if (ownerFromLegacyObject) return ownerFromLegacyObject

  return ''
}

async function main() {
  const db = getAdminDb()
  if (!db) {
    console.error('Failed to initialize Firebase Admin')
    process.exit(1)
  }

  const snap = await db.collection('leads').get()
  console.log(`Found ${snap.size} leads to evaluate`)

  let updated = 0
  let skipped = 0

  for (const doc of snap.docs) {
    const data = doc.data() || {}
    const currentStage = normalizeLeadStage(data.leadStage, data.status)
    const legacyStatus = stageToLegacyStatus(currentStage)
    const ownerAgentId = extractOwnerAgentId(data)

    const hasCanonicalStage = typeof data.leadStage === 'string'
    const hasCanonicalOwner = data.ownerAgentId !== undefined

    if (hasCanonicalStage && hasCanonicalOwner && data.legacyStatus === legacyStatus) {
      skipped += 1
      continue
    }

    const now = new Date()
    const updateData: any = {
      leadStage: currentStage,
      status: legacyStatus,
      legacyStatus,
      ownerAgentId: ownerAgentId || null,
      assignedTo: ownerAgentId || null,
      stageChangedAt: data.stageChangedAt || now,
      stageChangeReason: data.stageChangeReason || 'backfill_normalization',
      stageSlaDueAt: data.stageSlaDueAt || stageSlaDueAt(currentStage, now),
      updatedAt: now,
    }

    if (ownerAgentId) {
      updateData.ownerAssignedAt = data.ownerAssignedAt || data.assignedAt || now
    }

    await doc.ref.set(updateData, { merge: true })
    updated += 1
  }

  console.log(`Backfill complete. Updated=${updated}, Skipped=${skipped}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
