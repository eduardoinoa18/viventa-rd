import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { LeadStage, isLeadTerminalStage, normalizeLeadStage, stageSlaDueAt, stageToLegacyStatus } from '@/lib/leadLifecycle'

export type IngestLeadInput = {
  type: 'request-info' | 'request-call' | 'whatsapp' | 'showing'
  source: 'property' | 'project' | 'agent' | string
  sourceId?: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  message?: string
  payload?: Record<string, unknown>
}

export async function ingestLead(input: IngestLeadInput) {
  const adminDb = getAdminDb()
  if (!adminDb) {
    throw new Error('Admin SDK not configured')
  }

  if (!input.buyerName || !input.buyerEmail || !input.type || !input.source) {
    throw new Error('buyerName, buyerEmail, type, and source are required')
  }

  const now = Timestamp.now()
  const nowDate = now.toDate()
  const normalizedEmail = String(input.buyerEmail).trim().toLowerCase()
  const normalizedPhone = String(input.buyerPhone || '').replace(/\D/g, '')

  const openStatuses = ['unassigned', 'assigned', 'contacted']
  const duplicateCandidates: Array<{ id: string; data: any }> = []

  if (normalizedEmail) {
    const emailDupSnap = await adminDb
      .collection('leads')
      .where('buyerEmail', '==', normalizedEmail)
      .where('status', 'in', openStatuses)
      .limit(10)
      .get()

    emailDupSnap.docs.forEach((doc) => duplicateCandidates.push({ id: doc.id, data: doc.data() || {} }))
  }

  if (normalizedPhone) {
    const phoneDupSnap = await adminDb
      .collection('leads')
      .where('buyerPhoneNormalized', '==', normalizedPhone)
      .where('status', 'in', openStatuses)
      .limit(10)
      .get()

    phoneDupSnap.docs.forEach((doc) => duplicateCandidates.push({ id: doc.id, data: doc.data() || {} }))
  }

  const uniqueById = new Map<string, any>()
  for (const candidate of duplicateCandidates) {
    if (!uniqueById.has(candidate.id)) uniqueById.set(candidate.id, candidate.data)
  }

  const filteredDuplicates = Array.from(uniqueById.entries())
    .filter(([, data]) => {
      const stage = normalizeLeadStage(data?.leadStage, data?.status)
      return !isLeadTerminalStage(stage)
    })
    .sort((a, b) => {
      const aTime = a[1]?.updatedAt?.toMillis?.() || a[1]?.createdAt?.toMillis?.() || 0
      const bTime = b[1]?.updatedAt?.toMillis?.() || b[1]?.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })

  if (filteredDuplicates.length > 0) {
    const [duplicateId] = filteredDuplicates[0]
    await adminDb.collection('leads').doc(duplicateId).set(
      {
        duplicateCount: (filteredDuplicates[0][1]?.duplicateCount || 0) + 1,
        lastDuplicateAt: now,
        updatedAt: now,
      },
      { merge: true }
    )

    return {
      id: duplicateId,
      duplicate: true,
      mergedIntoLeadId: duplicateId,
      buyerEmail: normalizedEmail,
      buyerPhoneNormalized: normalizedPhone,
    }
  }

  const initialStage: LeadStage = 'new'
  const leadDoc = {
    type: input.type,
    source: input.source,
    sourceId: input.sourceId || '',
    buyerName: input.buyerName.trim(),
    buyerEmail: normalizedEmail,
    buyerPhone: String(input.buyerPhone || '').trim(),
    buyerPhoneNormalized: normalizedPhone,
    message: String(input.message || '').trim(),
    leadStage: initialStage,
    status: stageToLegacyStatus(initialStage),
    stageChangedAt: now,
    stageChangeReason: 'lead_created',
    assignedTo: null,
    assignedAt: null,
    inboxConversationId: null,
    escalated: false,
    escalationLevel: 'none',
    stageSlaDueAt: stageSlaDueAt(initialStage, nowDate),
    stageSlaHours: 1,
    ...((input.payload && Object.keys(input.payload).length > 0) ? input.payload : {}),
    createdAt: now,
    updatedAt: now,
  }

  const ref = await adminDb.collection('leads').add(leadDoc)
  return { id: ref.id, ...leadDoc }
}
