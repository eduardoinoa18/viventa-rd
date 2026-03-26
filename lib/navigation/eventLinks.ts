import type { ActivityEntityType } from '@/lib/domain/activity'

export type EventLinkInput = {
  entityType: ActivityEntityType
  entityId?: string | null
  dealId?: string | null
  listingId?: string | null
  reservationId?: string | null
  transactionId?: string | null
}

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

export function resolveEventUrl(input: EventLinkInput): string | null {
  const dealId = safeText(input.dealId || input.entityId)
  const listingId = safeText(input.listingId || input.entityId)
  const reservationId = safeText(input.reservationId || input.entityId)
  const transactionId = safeText(input.transactionId || input.entityId)

  switch (input.entityType) {
    case 'deal':
      return dealId ? `/dashboard/constructora/deals/${dealId}` : '/dashboard/constructora/deals'
    case 'reservation':
      if (dealId) return `/dashboard/constructora/deals/${dealId}`
      return reservationId ? `/dashboard/constructora/reservations` : '/dashboard/constructora/reservations'
    case 'document':
      return dealId ? `/dashboard/constructora/deals/${dealId}` : '/dashboard/constructora/deals'
    case 'transaction':
    case 'commission':
      return transactionId ? '/dashboard/broker/transactions' : '/dashboard/broker/transactions'
    case 'lead':
      return '/master/leads'
    case 'listing':
      return listingId ? `/listing/${listingId}` : '/dashboard/listings'
    case 'saved_search':
      return '/notifications'
    default:
      return '/dashboard'
  }
}