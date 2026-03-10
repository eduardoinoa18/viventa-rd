export const DEAL_RESERVATION_STATUSES = ['reserved', 'cancelled', 'expired', 'converted_to_deal'] as const
export type DealReservationStatus = (typeof DEAL_RESERVATION_STATUSES)[number]

export type TimestampLike = Date | string | number | { toDate?: () => Date } | null

export interface ReservationRecord {
  id: string
  reservationId: string
  dealId?: string | null
  listingId?: string | null
  projectId: string
  unitId: string
  unitCode?: string
  buyerId?: string | null
  buyerName: string
  brokerId?: string | null
  agentId?: string | null
  reservedByUid: string
  officeId?: string | null
  amount: number
  currency: 'USD' | 'DOP'
  status: DealReservationStatus
  expiresAt?: TimestampLike
  convertedAt?: TimestampLike
  notes?: string | null
  createdAt: TimestampLike
  updatedAt: TimestampLike
}
