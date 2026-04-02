export const DEAL_ALERT_REPEAT_HOURS = 24
export const DEAL_TASK_REPEAT_HOURS = 24

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

export function shouldEmitDealAlert(
  lastStatus: string,
  lastAt: Date | null,
  nextStatus: 'attention' | 'overdue',
  nowMs = Date.now(),
  repeatHours = DEAL_ALERT_REPEAT_HOURS
): boolean {
  if (!lastStatus) return true
  if (lastStatus !== nextStatus) return true
  if (!lastAt) return true
  const nextAllowedAt = lastAt.getTime() + repeatHours * 60 * 60 * 1000
  return nowMs >= nextAllowedAt
}

export function shouldCreateDealTask(
  lastStatus: string,
  lastAt: Date | null,
  nextStatus: 'attention' | 'overdue',
  nowMs = Date.now(),
  repeatHours = DEAL_TASK_REPEAT_HOURS
): boolean {
  if (!lastStatus) return true
  if (lastStatus !== nextStatus) return true
  if (!lastAt) return true
  const nextAllowedAt = lastAt.getTime() + repeatHours * 60 * 60 * 1000
  return nowMs >= nextAllowedAt
}

export function isOpenAutomationTask(status: unknown): boolean {
  const normalized = safeText(status).toLowerCase()
  return normalized !== 'done' && normalized !== 'closed' && normalized !== 'cancelled'
}

export function resolvePreferredBrokerAssigneeIds(tx: Record<string, any>): string[] {
  const result: string[] = []
  const push = (value: unknown) => {
    const uid = safeText(value)
    if (uid && !result.includes(uid)) result.push(uid)
  }

  push(tx.agentId)
  push(tx.ownerAgentId)
  push(tx.assignedTo)
  push(tx.brokerId)
  return result
}

export function resolvePreferredConstructoraAssigneeIds(deal: Record<string, any>): string[] {
  const result: string[] = []
  const push = (value: unknown) => {
    const uid = safeText(value)
    if (uid && !result.includes(uid)) result.push(uid)
  }

  push(deal.updatedBy)
  push(deal.createdBy)
  push(deal.ownerId)
  push(deal.constructoraUserId)
  return result
}

export function chooseLeastLoadedAssignee(params: {
  candidateIds: Set<string> | string[]
  preferredAssigneeIds: string[]
  openTaskCountByAssignee: Map<string, number>
  preferredBuffer?: number
}): string | null {
  const { preferredAssigneeIds, openTaskCountByAssignee, preferredBuffer = 2 } = params
  const candidates = Array.isArray(params.candidateIds) ? params.candidateIds : Array.from(params.candidateIds)
  if (!candidates.length) return null

  let minAssignee = candidates[0]
  let minCount = openTaskCountByAssignee.get(minAssignee) || 0
  for (const candidate of candidates) {
    const count = openTaskCountByAssignee.get(candidate) || 0
    if (count < minCount) {
      minCount = count
      minAssignee = candidate
    }
  }

  const candidateSet = new Set(candidates)
  for (const preferred of preferredAssigneeIds) {
    if (!candidateSet.has(preferred)) continue
    const preferredCount = openTaskCountByAssignee.get(preferred) || 0
    if (preferredCount <= minCount + preferredBuffer) return preferred
  }

  return minAssignee
}