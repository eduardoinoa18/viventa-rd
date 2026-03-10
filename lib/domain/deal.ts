export const DEAL_STATUSES = ['reserved', 'negotiating', 'contract_signed', 'financing', 'closing', 'closed', 'cancelled'] as const
export type DealStatus = (typeof DEAL_STATUSES)[number]

export const DEAL_EVENT_TYPES = [
  'reservation_created',
  'price_changed',
  'document_uploaded',
  'contract_signed',
  'payment_received',
  'commission_calculated',
  'deal_closed',
  'status_changed',
] as const
export type DealEventType = (typeof DEAL_EVENT_TYPES)[number]

export const DEAL_DOCUMENT_TYPES = [
  'reservation_form',
  'contract',
  'deposit_receipt',
  'buyer_id',
  'closing_document',
  'other',
] as const
export type DealDocumentType = (typeof DEAL_DOCUMENT_TYPES)[number]

export type TimestampLike = Date | string | number | { toDate?: () => Date } | null

export interface DealRecord {
  id: string
  dealId: string
  listingId?: string | null
  unitId: string
  projectId: string
  reservationId?: string | null
  transactionId?: string | null
  buyerId?: string | null
  buyerName: string
  brokerId?: string | null
  brokerName?: string | null
  agentId?: string | null
  price: number
  currency: 'USD' | 'DOP'
  status: DealStatus
  constructoraCode: string
  createdBy: string
  updatedBy: string
  createdAt: TimestampLike
  updatedAt: TimestampLike
}

export interface DealEventRecord {
  id: string
  dealId: string
  type: DealEventType
  actorId: string
  metadata?: Record<string, unknown>
  createdAt: TimestampLike
}

export interface DealDocumentRecord {
  id: string
  dealId: string
  type: DealDocumentType
  fileUrl: string
  fileName: string
  uploadedBy: string
  size?: number
  mimeType?: string
  createdAt: TimestampLike
}

export interface DealPaymentRecord {
  id: string
  dealId: string
  amount: number
  currency: 'USD' | 'DOP'
  method?: string
  reference?: string
  receivedBy?: string
  receivedAt: TimestampLike
  createdAt: TimestampLike
}
