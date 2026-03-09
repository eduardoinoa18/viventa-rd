import { safeText } from '@/lib/officeSubscriptionQuota'

type BrokerUserRecord = {
  id: string
  email?: string
  name?: string
  company?: string
  brokerage?: string
  officeId?: string
  brokerId?: string
  brokerageId?: string
  brokerage_id?: string
}

function normalizeOfficeKey(value: unknown): string {
  return safeText(value).toLowerCase()
}

function extractBrokerOfficeKeys(user: Partial<BrokerUserRecord>): Set<string> {
  const keys = new Set<string>()
  const candidates = [
    user.company,
    user.brokerage,
    user.officeId,
    user.brokerId,
    user.brokerageId,
    user.brokerage_id,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeOfficeKey(candidate)
    if (normalized) keys.add(normalized)
  }

  return keys
}

export function resolveBrokerOfficeReference(input: {
  company?: unknown
  brokerage?: unknown
  officeId?: unknown
}): string {
  return (
    safeText(input.company) ||
    safeText(input.brokerage) ||
    safeText(input.officeId) ||
    ''
  )
}

export async function findExistingBrokerAdminForOffice(
  adminDb: any,
  officeReference: unknown,
  excludeUserId?: string
): Promise<BrokerUserRecord | null> {
  const officeKey = normalizeOfficeKey(officeReference)
  if (!officeKey) return null

  const brokerSnap = await adminDb
    .collection('users')
    .where('role', '==', 'broker')
    .limit(1000)
    .get()

  for (const doc of brokerSnap.docs) {
    if (excludeUserId && doc.id === excludeUserId) continue
    const data = (doc.data() || {}) as Partial<BrokerUserRecord>
    const officeKeys = extractBrokerOfficeKeys(data)
    if (!officeKeys.has(officeKey)) continue

    return {
      id: doc.id,
      email: safeText(data.email),
      name: safeText(data.name),
      company: safeText(data.company),
      brokerage: safeText(data.brokerage),
      officeId: safeText(data.officeId),
      brokerId: safeText(data.brokerId),
      brokerageId: safeText(data.brokerageId),
      brokerage_id: safeText(data.brokerage_id),
    }
  }

  return null
}
