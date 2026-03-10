import type { Firestore } from 'firebase-admin/firestore'
import type { ActivityEventRecord, ActivityEventType, ActivityEntityType } from '@/lib/domain/activity'

export type EmitActivityEventInput = {
  type: ActivityEventType
  actorId?: string | null
  actorRole?: string | null
  entityType: ActivityEntityType
  entityId: string
  dealId?: string | null
  listingId?: string | null
  unitId?: string | null
  reservationId?: string | null
  transactionId?: string | null
  projectId?: string | null
  brokerId?: string | null
  agentId?: string | null
  buyerId?: string | null
  officeId?: string | null
  constructoraCode?: string | null
  metadata?: Record<string, unknown>
}

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

export async function emitActivityEvent(db: Firestore, input: EmitActivityEventInput): Promise<string> {
  const payload = {
    type: input.type,
    actorId: safeText(input.actorId) || null,
    actorRole: safeText(input.actorRole) || null,
    entityType: input.entityType,
    entityId: safeText(input.entityId),
    dealId: safeText(input.dealId) || null,
    listingId: safeText(input.listingId) || null,
    unitId: safeText(input.unitId) || null,
    reservationId: safeText(input.reservationId) || null,
    transactionId: safeText(input.transactionId) || null,
    projectId: safeText(input.projectId) || null,
    brokerId: safeText(input.brokerId) || null,
    agentId: safeText(input.agentId) || null,
    buyerId: safeText(input.buyerId) || null,
    officeId: safeText(input.officeId) || null,
    constructoraCode: safeText(input.constructoraCode) || null,
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    createdAt: new Date(),
  }

  const created = await db.collection('activityEvents').add(payload)
  return created.id
}

export function toActivityEvent(id: string, data: Record<string, any>): ActivityEventRecord {
  return {
    id,
    type: data.type,
    actorId: data.actorId || null,
    actorRole: data.actorRole || null,
    entityType: data.entityType,
    entityId: data.entityId,
    dealId: data.dealId || null,
    listingId: data.listingId || null,
    unitId: data.unitId || null,
    reservationId: data.reservationId || null,
    transactionId: data.transactionId || null,
    projectId: data.projectId || null,
    brokerId: data.brokerId || null,
    agentId: data.agentId || null,
    buyerId: data.buyerId || null,
    officeId: data.officeId || null,
    constructoraCode: data.constructoraCode || null,
    metadata: data.metadata || {},
    createdAt: data.createdAt || null,
  }
}
