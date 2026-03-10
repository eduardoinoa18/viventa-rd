export type TimestampLike = Date | string | number | { toDate?: () => Date } | null

export type CommissionStatus = 'pending' | 'paid' | 'void'

export interface CommissionRecord {
  id: string
  dealId?: string | null
  transactionId?: string | null
  reservationId?: string | null
  listingId?: string | null
  projectId?: string | null
  unitId?: string | null
  buyerId?: string | null
  brokerId?: string | null
  agentId?: string | null
  officeId?: string | null
  currency: 'USD' | 'DOP'
  commissionPercent: number
  totalCommission: number
  agentCommission: number
  brokerCommission: number
  status: CommissionStatus
  paidAt?: TimestampLike
  createdAt: TimestampLike
  updatedAt: TimestampLike
}
