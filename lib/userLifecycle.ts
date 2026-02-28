export const USER_LIFECYCLE_STATUSES = ['invited', 'active', 'suspended', 'archived'] as const

export type UserLifecycleStatus = (typeof USER_LIFECYCLE_STATUSES)[number]

const ALLOWED_TRANSITIONS: Record<UserLifecycleStatus, UserLifecycleStatus[]> = {
  invited: ['active', 'suspended', 'archived'],
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: [],
}

const LIFECYCLE_STATUS_SET = new Set<string>(USER_LIFECYCLE_STATUSES)

export function isLifecycleStatus(value: unknown): value is UserLifecycleStatus {
  return typeof value === 'string' && LIFECYCLE_STATUS_SET.has(value)
}

export function normalizeLifecycleStatus(value: unknown): UserLifecycleStatus {
  if (isLifecycleStatus(value)) return value
  return 'active'
}

export function canTransitionLifecycle(
  fromStatus: UserLifecycleStatus,
  toStatus: UserLifecycleStatus
): boolean {
  if (fromStatus === toStatus) return true
  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus)
}

export function validateLifecycleTransition(params: {
  currentStatus: unknown
  nextStatus: unknown
  role?: unknown
}) {
  const currentStatus = normalizeLifecycleStatus(params.currentStatus)

  if (!isLifecycleStatus(params.nextStatus)) {
    return {
      ok: false as const,
      error: 'Invalid lifecycle status',
      code: 'INVALID_STATUS',
      currentStatus,
      nextStatus: null,
    }
  }

  const nextStatus = params.nextStatus
  const role = typeof params.role === 'string' ? params.role : ''

  if (role === 'master_admin' && (nextStatus === 'suspended' || nextStatus === 'archived')) {
    return {
      ok: false as const,
      error: 'Master admin lifecycle cannot be suspended or archived',
      code: 'MASTER_PROTECTED',
      currentStatus,
      nextStatus,
    }
  }

  if (!canTransitionLifecycle(currentStatus, nextStatus)) {
    return {
      ok: false as const,
      error: `Invalid transition: ${currentStatus} -> ${nextStatus}`,
      code: 'INVALID_TRANSITION',
      currentStatus,
      nextStatus,
    }
  }

  return {
    ok: true as const,
    currentStatus,
    nextStatus,
  }
}
