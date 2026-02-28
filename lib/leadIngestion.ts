import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'

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

  const leadDoc = {
    type: input.type,
    source: input.source,
    sourceId: input.sourceId || '',
    buyerName: input.buyerName.trim(),
    buyerEmail: String(input.buyerEmail).trim().toLowerCase(),
    buyerPhone: String(input.buyerPhone || '').trim(),
    message: String(input.message || '').trim(),
    status: 'unassigned',
    assignedTo: null,
    inboxConversationId: null,
    escalated: false,
    escalationLevel: 'none',
    ...((input.payload && Object.keys(input.payload).length > 0) ? input.payload : {}),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }

  const ref = await adminDb.collection('leads').add(leadDoc)
  return { id: ref.id, ...leadDoc }
}
