export interface QuotaStatus {
  ok: boolean
  code?: string
  message?: string
  used?: number
  limit?: number
}

interface SeatQuotaOptions {
  requireOffice?: boolean
  missingOfficeCode?: string
  missingOfficeMessage?: string
  notFoundCode?: string
  notFoundMessage?: string
  inactiveCode?: string
  inactiveMessage?: string
  limitCode?: string
  limitMessage?: (used: number, limit: number) => string
}

interface ListingQuotaOptions {
  requireOffice?: boolean
  missingOfficeCode?: string
  missingOfficeMessage?: string
  notFoundPassThrough?: boolean
  notFoundCode?: string
  notFoundMessage?: string
  inactiveCode?: string
  inactiveMessage?: string
  limitCode?: string
  limitMessage?: (used: number, limit: number) => string
}

export function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeSubscriptionStatus(value: unknown): string {
  return safeText(value).toLowerCase()
}

function shouldCountSeat(status: unknown): boolean {
  const normalized = safeText(status).toLowerCase()
  return normalized !== 'archived' && normalized !== 'deleted'
}

function resolveOfficeIdFromListing(value: Record<string, any> | null | undefined): string {
  if (!value) return ''
  return (
    safeText(value.brokerId) ||
    safeText(value.createdByBrokerId) ||
    safeText(value.brokerageId) ||
    safeText(value.brokerage_id) ||
    ''
  )
}

function isListingCountedForQuota(value: Record<string, any> | null | undefined): boolean {
  if (!value) return false
  const status = safeText(value.status).toLowerCase()
  return status === 'active' || status === 'pending'
}

export async function resolveOfficeId(adminDb: any, officeRef: unknown): Promise<string> {
  const normalized = safeText(officeRef)
  if (!normalized) return ''

  const byId = await adminDb.collection('broker_offices').doc(normalized).get()
  if (byId.exists) return byId.id

  const byBrokerageId = await adminDb
    .collection('broker_offices')
    .where('brokerageId', '==', normalized)
    .limit(1)
    .get()
  if (!byBrokerageId.empty) return byBrokerageId.docs[0].id

  return ''
}

export async function getOfficeSeatQuotaStatus(
  adminDb: any,
  officeId: string,
  options: SeatQuotaOptions = {}
): Promise<QuotaStatus> {
  const {
    requireOffice = false,
    missingOfficeCode = 'OFFICE_ASSIGNMENT_REQUIRED',
    missingOfficeMessage = 'Broker office assignment is required.',
    notFoundCode = 'OFFICE_NOT_FOUND',
    notFoundMessage = 'The selected office was not found.',
    inactiveCode = 'OFFICE_SUBSCRIPTION_INACTIVE',
    inactiveMessage = 'This office subscription is not active. Reactivate the plan to add new agents.',
    limitCode = 'OFFICE_AGENT_LIMIT_REACHED',
    limitMessage = (used, limit) =>
      `Agent seat limit reached for this office (${used}/${limit}). Upgrade the plan or free up seats to continue.`,
  } = options

  if (!officeId) {
    return requireOffice
      ? { ok: false, code: missingOfficeCode, message: missingOfficeMessage }
      : { ok: true }
  }

  const officeSnap = await adminDb.collection('broker_offices').doc(officeId).get()
  if (!officeSnap.exists) {
    return requireOffice
      ? { ok: false, code: notFoundCode, message: notFoundMessage }
      : { ok: true }
  }

  const officeData = (officeSnap.data() || {}) as Record<string, any>
  const subscription = (officeData.subscription || {}) as Record<string, any>
  const subscriptionStatus = normalizeSubscriptionStatus(subscription.status || officeData.status || 'active')

  if (subscriptionStatus && subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
    return {
      ok: false,
      code: inactiveCode,
      message: inactiveMessage,
    }
  }

  const agentsLimit = Number(subscription.agentsLimit)
  if (!Number.isFinite(agentsLimit) || agentsLimit <= 0) {
    return { ok: true }
  }

  const [byBrokerId, byBrokerageId] = await Promise.all([
    adminDb.collection('users').where('brokerId', '==', officeId).limit(1000).get(),
    adminDb.collection('users').where('brokerageId', '==', officeId).limit(1000).get(),
  ])

  const seatIds = new Set<string>()
  for (const snap of [byBrokerId, byBrokerageId]) {
    for (const doc of snap.docs) {
      const user = (doc.data() || {}) as Record<string, any>
      if (safeText(user.role).toLowerCase() !== 'agent') continue
      if (!shouldCountSeat(user.status)) continue
      seatIds.add(doc.id)
    }
  }

  const used = seatIds.size
  if (used >= agentsLimit) {
    return {
      ok: false,
      code: limitCode,
      message: limitMessage(used, agentsLimit),
      used,
      limit: agentsLimit,
    }
  }

  return { ok: true, used, limit: agentsLimit }
}

export async function syncOfficeSeatUsage(adminDb: any, officeId: string) {
  if (!officeId) return

  const [byBrokerId, byBrokerageId] = await Promise.all([
    adminDb.collection('users').where('brokerId', '==', officeId).limit(1000).get(),
    adminDb.collection('users').where('brokerageId', '==', officeId).limit(1000).get(),
  ])

  const seatIds = new Set<string>()
  for (const snap of [byBrokerId, byBrokerageId]) {
    for (const doc of snap.docs) {
      const user = (doc.data() || {}) as Record<string, any>
      if (safeText(user.role).toLowerCase() !== 'agent') continue
      if (!shouldCountSeat(user.status)) continue
      seatIds.add(doc.id)
    }
  }

  await adminDb.collection('broker_offices').doc(officeId).set(
    {
      subscription: {
        seatsUsed: seatIds.size,
      },
      updatedAt: new Date(),
    },
    { merge: true }
  )
}

export async function getOfficeListingQuotaStatus(
  adminDb: any,
  officeId: string,
  options: ListingQuotaOptions = {}
): Promise<QuotaStatus> {
  const {
    requireOffice = false,
    missingOfficeCode = 'OFFICE_ASSIGNMENT_REQUIRED',
    missingOfficeMessage = 'Broker office assignment is required before publishing listings.',
    notFoundPassThrough = true,
    notFoundCode = 'OFFICE_NOT_FOUND',
    notFoundMessage = 'The selected office was not found.',
    inactiveCode = 'OFFICE_SUBSCRIPTION_INACTIVE',
    inactiveMessage = 'Your office subscription is not active. Reactivate your plan to publish new listings.',
    limitCode = 'OFFICE_LISTINGS_LIMIT_REACHED',
    limitMessage = (used, limit) =>
      `Listing limit reached for this office (${used}/${limit}). Upgrade the plan or archive active listings to continue.`,
  } = options

  if (!officeId) {
    return requireOffice
      ? { ok: false, code: missingOfficeCode, message: missingOfficeMessage }
      : { ok: true }
  }

  const officeSnap = await adminDb.collection('broker_offices').doc(officeId).get()
  if (!officeSnap.exists) {
    if (notFoundPassThrough && !requireOffice) return { ok: true }
    return { ok: false, code: notFoundCode, message: notFoundMessage }
  }

  const officeData = (officeSnap.data() || {}) as Record<string, any>
  const subscription = (officeData.subscription || {}) as Record<string, any>
  const subscriptionStatus = normalizeSubscriptionStatus(subscription.status || officeData.status || 'active')
  if (subscriptionStatus && subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
    return {
      ok: false,
      code: inactiveCode,
      message: inactiveMessage,
    }
  }

  const listingsLimit = Number(subscription.listingsLimit)
  if (!Number.isFinite(listingsLimit) || listingsLimit <= 0) {
    return { ok: true }
  }

  const [byBrokerId, byCreatedBrokerId, byBrokerageId] = await Promise.all([
    adminDb.collection('properties').where('brokerId', '==', officeId).limit(5000).get(),
    adminDb.collection('properties').where('createdByBrokerId', '==', officeId).limit(5000).get(),
    adminDb.collection('properties').where('brokerageId', '==', officeId).limit(5000).get(),
  ])

  const listingIds = new Set<string>()
  for (const snap of [byBrokerId, byCreatedBrokerId, byBrokerageId]) {
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, any>
      if (resolveOfficeIdFromListing(data) !== officeId) continue
      if (!isListingCountedForQuota(data)) continue
      listingIds.add(doc.id)
    }
  }

  const used = listingIds.size
  if (used >= listingsLimit) {
    return {
      ok: false,
      code: limitCode,
      message: limitMessage(used, listingsLimit),
      used,
      limit: listingsLimit,
    }
  }

  return { ok: true, used, limit: listingsLimit }
}
