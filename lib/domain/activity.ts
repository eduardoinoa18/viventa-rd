export const ACTIVITY_EVENT_TYPES = [
  'listing_created',
  'lead_contacted',
  'reservation_created',
  'deal_opened',
  'deal_updated',
  'document_uploaded',
  'document_deleted',
  'transaction_created',
  'commission_paid',
] as const

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number]

export type ActivityEntityType =
  | 'listing'
  | 'lead'
  | 'reservation'
  | 'deal'
  | 'document'
  | 'transaction'
  | 'commission'

export type TimestampLike = Date | string | number | { toDate?: () => Date } | null

export interface ActivityEventRecord {
  id: string
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
  createdAt: TimestampLike
}
