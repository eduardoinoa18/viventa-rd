import {
  PROJECT_PUBLISH_MODES,
  PROJECT_STATUSES,
  PROJECT_UNIT_STATUSES,
  RESERVATION_STATUSES,
  type ProjectLifecycleStatus,
  type ProjectPublishMode,
  type ProjectUnitStatus,
  type ReservationStatus,
} from '@/types/project-inventory'
import { ProjectInventoryError } from '@/lib/projectInventory/errors'

const PROJECT_STATUS_SET = new Set<string>(PROJECT_STATUSES)
const PROJECT_PUBLISH_MODE_SET = new Set<string>(PROJECT_PUBLISH_MODES)
const UNIT_STATUS_SET = new Set<string>(PROJECT_UNIT_STATUSES)
const RESERVATION_STATUS_SET = new Set<string>(RESERVATION_STATUSES)

const PROJECT_STATUS_TRANSITIONS: Record<ProjectLifecycleStatus, ProjectLifecycleStatus[]> = {
  draft: ['active', 'archived'],
  active: ['paused', 'sold_out', 'archived'],
  paused: ['active', 'archived'],
  sold_out: ['archived', 'active'],
  archived: [],
}

const UNIT_STATUS_TRANSITIONS: Record<ProjectUnitStatus, ProjectUnitStatus[]> = {
  available: ['reserved', 'blocked'],
  reserved: ['available', 'sold'],
  sold: [],
  blocked: ['available'],
}

const RESERVATION_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  reserved: ['cancelled', 'expired', 'converted_to_contract'],
  cancelled: [],
  expired: [],
  converted_to_contract: [],
}

export function isProjectStatus(value: unknown): value is ProjectLifecycleStatus {
  return typeof value === 'string' && PROJECT_STATUS_SET.has(value)
}

export function isProjectPublishMode(value: unknown): value is ProjectPublishMode {
  return typeof value === 'string' && PROJECT_PUBLISH_MODE_SET.has(value)
}

export function isProjectUnitStatus(value: unknown): value is ProjectUnitStatus {
  return typeof value === 'string' && UNIT_STATUS_SET.has(value)
}

export function isReservationStatus(value: unknown): value is ReservationStatus {
  return typeof value === 'string' && RESERVATION_STATUS_SET.has(value)
}

export function normalizeProjectStatus(value: unknown): ProjectLifecycleStatus {
  if (isProjectStatus(value)) return value
  return 'draft'
}

export function normalizeProjectUnitStatus(value: unknown): ProjectUnitStatus {
  if (isProjectUnitStatus(value)) return value
  return 'available'
}

export function normalizeReservationStatus(value: unknown): ReservationStatus {
  if (isReservationStatus(value)) return value
  return 'reserved'
}

export function canTransitionProjectStatus(from: ProjectLifecycleStatus, to: ProjectLifecycleStatus): boolean {
  if (from === to) return true
  return PROJECT_STATUS_TRANSITIONS[from].includes(to)
}

export function canTransitionProjectUnitStatus(from: ProjectUnitStatus, to: ProjectUnitStatus): boolean {
  if (from === to) return true
  return UNIT_STATUS_TRANSITIONS[from].includes(to)
}

export function canTransitionReservationStatus(from: ReservationStatus, to: ReservationStatus): boolean {
  if (from === to) return true
  return RESERVATION_STATUS_TRANSITIONS[from].includes(to)
}

export function validateProjectStatusTransition(params: {
  currentStatus: unknown
  nextStatus: unknown
}) {
  const currentStatus = normalizeProjectStatus(params.currentStatus)
  if (!isProjectStatus(params.nextStatus)) {
    return {
      ok: false as const,
      code: 'INVALID_PROJECT_STATUS',
      error: 'Invalid project status value',
      currentStatus,
      nextStatus: null,
    }
  }

  const nextStatus = params.nextStatus
  if (!canTransitionProjectStatus(currentStatus, nextStatus)) {
    return {
      ok: false as const,
      code: 'INVALID_PROJECT_STATUS_TRANSITION',
      error: `Invalid project status transition: ${currentStatus} -> ${nextStatus}`,
      currentStatus,
      nextStatus,
    }
  }

  return { ok: true as const, currentStatus, nextStatus }
}

export function validateProjectUnitStatusTransition(params: {
  currentStatus: unknown
  nextStatus: unknown
}) {
  const currentStatus = normalizeProjectUnitStatus(params.currentStatus)
  if (!isProjectUnitStatus(params.nextStatus)) {
    return {
      ok: false as const,
      code: 'INVALID_UNIT_STATUS',
      error: 'Invalid project unit status value',
      currentStatus,
      nextStatus: null,
    }
  }

  const nextStatus = params.nextStatus
  if (!canTransitionProjectUnitStatus(currentStatus, nextStatus)) {
    return {
      ok: false as const,
      code: 'INVALID_UNIT_STATUS_TRANSITION',
      error: `Invalid project unit status transition: ${currentStatus} -> ${nextStatus}`,
      currentStatus,
      nextStatus,
    }
  }

  return { ok: true as const, currentStatus, nextStatus }
}

export function validateReservationStatusTransition(params: {
  currentStatus: unknown
  nextStatus: unknown
}) {
  const currentStatus = normalizeReservationStatus(params.currentStatus)
  if (!isReservationStatus(params.nextStatus)) {
    return {
      ok: false as const,
      code: 'INVALID_RESERVATION_STATUS',
      error: 'Invalid reservation status value',
      currentStatus,
      nextStatus: null,
    }
  }

  const nextStatus = params.nextStatus
  if (!canTransitionReservationStatus(currentStatus, nextStatus)) {
    return {
      ok: false as const,
      code: 'INVALID_RESERVATION_STATUS_TRANSITION',
      error: `Invalid reservation status transition: ${currentStatus} -> ${nextStatus}`,
      currentStatus,
      nextStatus,
    }
  }

  return { ok: true as const, currentStatus, nextStatus }
}

export function assertProjectStatusTransition(currentStatus: unknown, nextStatus: unknown): ProjectLifecycleStatus {
  const result = validateProjectStatusTransition({ currentStatus, nextStatus })
  if (!result.ok) {
    throw new ProjectInventoryError({
      code: result.code,
      message: result.error,
      metadata: {
        currentStatus: result.currentStatus,
        nextStatus: result.nextStatus,
      },
    })
  }

  return result.nextStatus
}

export function assertProjectUnitStatusTransition(currentStatus: unknown, nextStatus: unknown): ProjectUnitStatus {
  const result = validateProjectUnitStatusTransition({ currentStatus, nextStatus })
  if (!result.ok) {
    throw new ProjectInventoryError({
      code: result.code,
      message: result.error,
      metadata: {
        currentStatus: result.currentStatus,
        nextStatus: result.nextStatus,
      },
    })
  }

  return result.nextStatus
}

export function assertReservationStatusTransition(currentStatus: unknown, nextStatus: unknown): ReservationStatus {
  const result = validateReservationStatusTransition({ currentStatus, nextStatus })
  if (!result.ok) {
    throw new ProjectInventoryError({
      code: result.code,
      message: result.error,
      metadata: {
        currentStatus: result.currentStatus,
        nextStatus: result.nextStatus,
      },
    })
  }

  return result.nextStatus
}
