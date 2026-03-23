/**
 * VIVENTA Canonical Platform Types
 * Single source of truth for all shared enums, stages, and contracts
 * across user / admin / broker / agent / constructora surfaces.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Listing lifecycle
// ─────────────────────────────────────────────────────────────────────────────

export const LISTING_STATUSES = [
  'draft',
  'pending_review',
  'active',
  'paused',
  'under_contract',
  'sold',
  'archived',
] as const
export type ListingLifecycleStatus = (typeof LISTING_STATUSES)[number]

/** Map from legacy listing status strings used in Firestore to canonical */
export const LEGACY_LISTING_STATUS_MAP: Record<string, ListingLifecycleStatus> = {
  draft: 'draft',
  pending: 'pending_review',
  pending_review: 'pending_review',
  active: 'active',
  paused: 'paused',
  under_contract: 'under_contract',
  sold: 'sold',
  rented: 'sold',      // treat rented as terminal
  rejected: 'archived',
  archived: 'archived',
}

export function toCanonicalListingStatus(raw: string | undefined | null): ListingLifecycleStatus {
  if (!raw) return 'draft'
  return LEGACY_LISTING_STATUS_MAP[raw] ?? 'draft'
}

// ─────────────────────────────────────────────────────────────────────────────
// CRM / Lead pipeline — canonical stage model
// ─────────────────────────────────────────────────────────────────────────────

export const CRM_STAGES = [
  'new',
  'qualified',
  'tour_scheduled',
  'offer_submitted',
  'negotiation',
  'under_contract',
  'closed_won',
  'closed_lost',
] as const
export type CrmStage = (typeof CRM_STAGES)[number]

export const CRM_TERMINAL_STAGES = new Set<CrmStage>(['closed_won', 'closed_lost'])
export const CRM_STAGE_SET = new Set<string>(CRM_STAGES)

/** Human-readable labels (Spanish UI) */
export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  new: 'Nuevo',
  qualified: 'Calificado',
  tour_scheduled: 'Visita Programada',
  offer_submitted: 'Oferta Enviada',
  negotiation: 'Negociación',
  under_contract: 'Bajo Contrato',
  closed_won: 'Cerrado — Ganado',
  closed_lost: 'Cerrado — Perdido',
}

/** Allowed transitions from each stage */
export const CRM_ALLOWED_TRANSITIONS: Record<CrmStage, CrmStage[]> = {
  new: ['qualified', 'closed_lost'],
  qualified: ['tour_scheduled', 'closed_lost'],
  tour_scheduled: ['offer_submitted', 'qualified', 'closed_lost'],
  offer_submitted: ['negotiation', 'under_contract', 'closed_lost'],
  negotiation: ['under_contract', 'closed_lost'],
  under_contract: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: ['qualified'], // reopen only (requires privileged role)
}

export const CLOSED_LOST_REASONS = [
  'price_mismatch',
  'location_mismatch',
  'financing_failed',
  'chose_competitor',
  'not_responsive',
  'timeline_changed',
  'other',
] as const
export type ClosedLostReason = (typeof CLOSED_LOST_REASONS)[number]

/** SLA response window in hours per stage */
export const CRM_SLA_HOURS: Record<CrmStage, number> = {
  new: 1,
  qualified: 24,
  tour_scheduled: 48,
  offer_submitted: 48,
  negotiation: 72,
  under_contract: 72,
  closed_won: 0,
  closed_lost: 0,
}

/** Map from legacy lead stage strings to canonical CRM stages */
export const LEGACY_LEAD_STAGE_MAP: Record<string, CrmStage> = {
  new: 'new',
  unassigned: 'new',
  assigned: 'new',
  contacted: 'qualified',
  qualified: 'qualified',
  negotiating: 'negotiation',
  negotiation: 'negotiation',
  won: 'closed_won',
  lost: 'closed_lost',
  archived: 'closed_lost',
}

export function isCrmStage(value: unknown): value is CrmStage {
  return typeof value === 'string' && CRM_STAGE_SET.has(value)
}

export function toCanonicalCrmStage(raw: string | undefined | null): CrmStage {
  if (!raw) return 'new'
  return LEGACY_LEAD_STAGE_MAP[raw] ?? 'new'
}

export function canTransitionCrmStage(from: CrmStage, to: CrmStage): boolean {
  if (from === to) return true
  return CRM_ALLOWED_TRANSITIONS[from].includes(to)
}

export function validateCrmStageTransition(params: { current: unknown; next: unknown }) {
  const current = toCanonicalCrmStage(typeof params.current === 'string' ? params.current : undefined)
  if (!isCrmStage(params.next)) {
    return { ok: false as const, code: 'INVALID_STAGE', error: 'Invalid CRM stage', current, next: null }
  }
  const next = params.next
  if (!canTransitionCrmStage(current, next)) {
    return { ok: false as const, code: 'INVALID_TRANSITION', error: `Invalid: ${current} → ${next}`, current, next }
  }
  return { ok: true as const, current, next }
}

// ─────────────────────────────────────────────────────────────────────────────
// Saved Search
// ─────────────────────────────────────────────────────────────────────────────

export const RECOMMENDATION_FREQUENCIES = ['instant', 'daily_digest', 'weekly_digest', 'off'] as const
export type RecommendationFrequency = (typeof RECOMMENDATION_FREQUENCIES)[number]

export interface SavedSearchFirestore {
  id: string
  userId: string
  label: string
  status: 'active' | 'paused'
  locale: string
  frequency: RecommendationFrequency
  marketingOptIn: boolean
  unsubscribed: boolean
  unsubscribedAt?: number | null
  criteria: {
    query?: string
    city?: string
    sector?: string
    listingType?: 'sale' | 'rent'
    propertyType?: string
    priceMin?: number
    priceMax?: number
    currency?: 'USD' | 'DOP'
    bedroomsMin?: number
    bathroomsMin?: number
    amenitiesAny?: string[]
  }
  lastTriggeredAt: number
  createdAt: number
  updatedAt: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Events
// ─────────────────────────────────────────────────────────────────────────────

export const ACTIVITY_EVENT_TYPES = [
  'listing.created',
  'listing.updated',
  'listing.status_changed',
  'lead.created',
  'lead.stage_changed',
  'lead.sla_breached',
  'buyer.search_saved',
  'buyer.search_updated',
  'buyer.listing_viewed',
  'recommendation.generated',
  'recommendation.email_sent',
] as const
export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number]

export interface ActivityEvent {
  id?: string
  eventType: ActivityEventType
  actorUserId?: string
  actorRole?: string
  entityType: 'listing' | 'lead' | 'savedSearch' | 'recommendation'
  entityId: string
  tenantId?: string
  context?: Record<string, unknown>
  createdAt: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation job
// ─────────────────────────────────────────────────────────────────────────────

export interface RecommendationJob {
  id?: string
  idempotencyKey: string
  triggerEvent: string
  listingId: string
  savedSearchId: string
  userId: string
  score: number
  status: 'queued' | 'sent' | 'skipped' | 'failed' | 'dead'
  skipReason?: string
  dispatchWindowMs: number
  attempt: number
  createdAt: number
  updatedAt: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Role permission
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformRole = 'user' | 'agent' | 'broker' | 'constructora' | 'admin' | 'master_admin'

/** Which CRM stages each role can transition to as actor */
export const CRM_ROLE_TRANSITION_PERMISSIONS: Record<PlatformRole, { canTransition: boolean; terminalOnly?: boolean }> = {
  user: { canTransition: false },
  agent: { canTransition: true },
  broker: { canTransition: true },
  constructora: { canTransition: true },
  admin: { canTransition: true, terminalOnly: false },
  master_admin: { canTransition: true, terminalOnly: false },
}
