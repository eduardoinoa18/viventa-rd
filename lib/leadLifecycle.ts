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

const LEGACY_STATUS_BY_STAGE: Record<LeadStage, 'unassigned' | 'assigned' | 'contacted' | 'won' | 'lost'> = {
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

export function stageSlaHours(stage: LeadStage): number {
  return SLA_HOURS_BY_STAGE[stage]
}

export function stageSlaDueAt(stage: LeadStage, fromDate = new Date()): Date | null {
  const hours = stageSlaHours(stage)
  if (!hours) return null
  return new Date(fromDate.getTime() + hours * 60 * 60 * 1000)
}

export function isLeadTerminalStage(stage: LeadStage): boolean {
  return stage === 'won' || stage === 'lost' || stage === 'archived'
}
