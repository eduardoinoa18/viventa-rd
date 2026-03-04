import type { Firestore } from 'firebase-admin/firestore'

export type ManagedListingUserRole =
  | 'master_admin'
  | 'admin'
  | 'broker'
  | 'agent'
  | 'constructora'
  | 'buyer'

export interface ListingAccessUserContext {
  uid: string
  role: ManagedListingUserRole
  officeId: string
  name: string
  email: string
  professionalCode: string
  agentCode: string
  brokerCode: string
  constructoraCode: string
}

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

export function resolveOfficeIdFromUser(user: Record<string, unknown> | null | undefined): string {
  if (!user) return ''
  return (
    safeText(user.brokerId) ||
    safeText(user.brokerageId) ||
    safeText(user.brokerage_id) ||
    ''
  )
}

export function resolveOfficeIdFromListing(listing: Record<string, unknown> | null | undefined): string {
  if (!listing) return ''
  return (
    safeText(listing.brokerId) ||
    safeText(listing.createdByBrokerId) ||
    safeText(listing.brokerageId) ||
    safeText(listing.brokerage_id) ||
    ''
  )
}

export function getListingCreatorId(listing: Record<string, unknown> | null | undefined): string {
  if (!listing) return ''
  return safeText(listing.createdByUserId) || safeText(listing.agentId) || safeText(listing.ownerId)
}

export async function getListingAccessUserContext(
  db: Firestore,
  uid: string,
  fallbackRole: ManagedListingUserRole
): Promise<ListingAccessUserContext> {
  let role = fallbackRole
  let officeId = ''
  let name = ''
  let email = ''
  let professionalCode = ''
  let agentCode = ''
  let brokerCode = ''
  let constructoraCode = ''

  const userSnap = await db.collection('users').doc(uid).get()
  if (userSnap.exists) {
    const user = (userSnap.data() || {}) as Record<string, unknown>
    role = (safeText(user.role) || fallbackRole) as ManagedListingUserRole
    officeId = resolveOfficeIdFromUser(user)
    name = safeText(user.name) || safeText(user.displayName)
    email = safeText(user.email)
    professionalCode =
      safeText(user.professionalCode) ||
      safeText(user.agentCode) ||
      safeText(user.brokerCode) ||
      safeText(user.constructoraCode)
    agentCode = safeText(user.agentCode)
    brokerCode = safeText(user.brokerCode)
    constructoraCode = safeText(user.constructoraCode)

    if (!officeId && role === 'broker') {
      officeId = uid
    }
  } else if (role === 'broker') {
    officeId = uid
  }

  return {
    uid,
    role,
    officeId,
    name,
    email,
    professionalCode,
    agentCode,
    brokerCode,
    constructoraCode,
  }
}

export function canMutateListing(params: {
  isAdmin: boolean
  userContext: ListingAccessUserContext
  listing: Record<string, unknown>
}): boolean {
  const { isAdmin, userContext, listing } = params
  if (isAdmin) return true

  const creatorId = getListingCreatorId(listing)
  if (creatorId && creatorId === userContext.uid) return true

  if (userContext.role === 'broker' && userContext.officeId) {
    const listingOfficeId = resolveOfficeIdFromListing(listing)
    if (listingOfficeId && listingOfficeId === userContext.officeId) return true
  }

  return false
}