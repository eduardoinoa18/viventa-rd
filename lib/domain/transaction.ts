export const TRANSACTION_STAGES = ['lead', 'showing', 'offer', 'reservation', 'contract', 'closing', 'completed', 'lost', 'archived'] as const
export type TransactionStage = (typeof TRANSACTION_STAGES)[number]

export type CommissionStatus = 'pending' | 'paid'
export type CurrencyCode = 'USD' | 'DOP'

export type TimestampLike = Date | string | number | { toDate?: () => Date } | null

export interface TransactionRecord {
  id: string
  dealId?: string | null
  officeId: string
  listingId?: string | null
  projectId?: string | null
  unitId?: string | null
  reservationId?: string | null
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  buyerId?: string | null
  brokerId?: string | null
  agentId: string
  stage: TransactionStage
  salePrice: number
  currency: CurrencyCode
  commissionPercent: number
  totalCommission: number
  agentSplitPercent: number
  brokerSplitPercent: number
  agentCommission: number
  brokerCommission: number
  commissionStatus: CommissionStatus
  lostReason?: string | null
  lostAt?: TimestampLike
  archivedAt?: TimestampLike
  notes?: string | null
  createdBy: string
  updatedBy: string
  createdAt: TimestampLike
  updatedAt: TimestampLike
}

export interface RevenueMetrics {
  officePipelineValue: number
  expectedCommission: number
  dealsClosingThisMonth: number
  activeDeals: number
}

export interface TopBrokerRevenueRow {
  userId: string
  name: string
  deals: number
  pipelineValue: number
  expectedCommission: number
  closedDeals: number
  closedCommission: number
}
