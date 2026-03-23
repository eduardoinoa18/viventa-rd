export const LEAD_STAGES = [
  'new',
  'assigned',
  'contacted',
  'qualified',
  'negotiating',
  'won',
  'lost',
  'archived',
] as const

export type LeadStage = (typeof LEAD_STAGES)[number]
export type LegacyLeadStatus = 'unassigned' | 'assigned' | 'contacted' | 'won' | 'lost'

const STAGE_SET = new Set<string>(LEAD_STAGES)

const ALLOWED_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  new: ['assigned', 'lost', 'archived'],
  assigned: ['contacted', 'lost', 'archived'],
  contacted: ['qualified', 'lost', 'archived'],
  qualified: ['negotiating', 'lost', 'archived'],
  negotiating: ['won', 'lost', 'archived'],
  won: ['archived'],
  lost: ['archived'],
  archived: [],
}

const LEGACY_STATUS_BY_STAGE: Record<LeadStage, LegacyLeadStatus> = {
  new: 'unassigned',
  assigned: 'assigned',
  contacted: 'contacted',
  qualified: 'contacted',
  negotiating: 'contacted',
  won: 'won',
  lost: 'lost',
  archived: 'lost',
}

const STAGE_BY_LEGACY_STATUS: Record<string, LeadStage> = {
  unassigned: 'new',
  assigned: 'assigned',
  contacted: 'contacted',
  won: 'won',
  lost: 'lost',
}

const SLA_HOURS_BY_STAGE: Record<LeadStage, number> = {
  new: 1,
  assigned: 2,
  contacted: 24,
  qualified: 48,
  negotiating: 72,
  won: 0,
  lost: 0,
  archived: 0,
}

export function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === 'string' && STAGE_SET.has(value)
}

export function normalizeLeadStage(value: unknown, fallbackStatus?: unknown): LeadStage {
  if (isLeadStage(value)) return value
  if (typeof fallbackStatus === 'string' && STAGE_BY_LEGACY_STATUS[fallbackStatus]) {
    return STAGE_BY_LEGACY_STATUS[fallbackStatus]
  }
  return 'new'
}

export function canTransitionLeadStage(fromStage: LeadStage, toStage: LeadStage): boolean {
  if (fromStage === toStage) return true
  return ALLOWED_TRANSITIONS[fromStage].includes(toStage)
}

export function validateLeadStageTransition(params: {
  currentStage: unknown
  nextStage: unknown
}) {
  const currentStage = normalizeLeadStage(params.currentStage)

  if (!isLeadStage(params.nextStage)) {
    return {
      ok: false as const,
      code: 'INVALID_STAGE',
      error: 'Invalid lead stage',
      currentStage,
      nextStage: null,
    }
  }

  const nextStage = params.nextStage
  if (!canTransitionLeadStage(currentStage, nextStage)) {
    return {
      ok: false as const,
      code: 'INVALID_STAGE_TRANSITION',
      error: `Invalid transition: ${currentStage} -> ${nextStage}`,
      currentStage,
      nextStage,
    }
  }

  return {
    ok: true as const,
    currentStage,
    nextStage,
  }
}

export function stageToLegacyStatus(stage: LeadStage) {
  return LEGACY_STATUS_BY_STAGE[stage]
}

export function ownerRequiredForStage(stage: LeadStage): boolean {
  return stage === 'assigned' || stage === 'contacted' || stage === 'qualified' || stage === 'negotiating' || stage === 'won'
}

export function stageSlaHours(stage: LeadStage): number {
  return SLA_HOURS_BY_STAGE[stage]
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical CRM stage bridge
// Imports from types/platform allow shared UI and server code to use
// the same canonical stage vocabulary without duplicating logic here.
// ─────────────────────────────────────────────────────────────────────────────
export {
  CRM_STAGES,
  CRM_STAGE_LABELS,
  CRM_ALLOWED_TRANSITIONS,
  CRM_SLA_HOURS,
  CRM_TERMINAL_STAGES,
  LEGACY_LEAD_STAGE_MAP,
  CLOSED_LOST_REASONS,
  isCrmStage,
  toCanonicalCrmStage,
  canTransitionCrmStage,
  validateCrmStageTransition,
} from '@/types/platform'
export type { CrmStage, ClosedLostReason, PlatformRole } from '@/types/platform'

export function stageSlaDueAt(stage: LeadStage, fromDate = new Date()): Date | null {
  const hours = stageSlaHours(stage)
  if (!hours) return null
  return new Date(fromDate.getTime() + hours * 60 * 60 * 1000)
}

export function secondsToSlaDue(stageSlaDueAtValue: Date | string | null | undefined, now = new Date()): number | null {
  if (!stageSlaDueAtValue) return null
  const dueDate = stageSlaDueAtValue instanceof Date ? stageSlaDueAtValue : new Date(stageSlaDueAtValue)
  if (Number.isNaN(dueDate.getTime())) return null
  return Math.floor((dueDate.getTime() - now.getTime()) / 1000)
}

export function isSlaBreached(stage: LeadStage, stageSlaDueAtValue: Date | string | null | undefined, now = new Date()): boolean {
  if (isLeadTerminalStage(stage)) return false
  const seconds = secondsToSlaDue(stageSlaDueAtValue, now)
  if (seconds === null) return false
  return seconds < 0
}

export function isLeadTerminalStage(stage: LeadStage): boolean {
  return stage === 'won' || stage === 'lost' || stage === 'archived'
}
