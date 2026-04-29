import type { DealStatus } from '@/lib/domain/deal'
import type { CrmDealStage } from '@/lib/domain/crmDeal'

export const UNIFIED_DEAL_TIMELINE_STAGES = ['lead', 'showing', 'offer', 'reservation', 'contract', 'closing', 'completed', 'cancelled'] as const
export type UnifiedDealTimelineStage = (typeof UNIFIED_DEAL_TIMELINE_STAGES)[number]

export type UnifiedDealHealth = 'healthy' | 'attention' | 'overdue' | 'complete'

export const UNIFIED_DEAL_TIMELINE_LABELS: Record<UnifiedDealTimelineStage, string> = {
  lead: 'Lead',
  showing: 'Visita',
  offer: 'Oferta',
  reservation: 'Reserva',
  contract: 'Contrato',
  closing: 'Cierre',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export const UNIFIED_DEAL_HEALTH_LABELS: Record<UnifiedDealHealth, string> = {
  healthy: 'En tiempo',
  attention: 'Atención',
  overdue: 'Atrasado',
  complete: 'Completo',
}

const SLA_HOURS_BY_TIMELINE_STAGE: Record<UnifiedDealTimelineStage, number> = {
  lead: 24,
  showing: 72,
  offer: 96,
  reservation: 120,
  contract: 168,
  closing: 240,
  completed: 0,
  cancelled: 0,
}

function safeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

function toMillis(value: Date | string | number | { toDate?: () => Date } | null | undefined): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    const date = (value as { toDate?: () => Date }).toDate?.()
    return date instanceof Date ? date.getTime() : 0
  }
  const parsed = new Date(value as string | number)
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
}

export function normalizeBrokerDealTimelineStage(value: unknown): UnifiedDealTimelineStage {
  const stage = safeText(value)
  if (stage === 'showing') return 'showing'
  if (stage === 'offer') return 'offer'
  if (stage === 'reservation') return 'reservation'
  if (stage === 'contract') return 'contract'
  if (stage === 'closing') return 'closing'
  if (stage === 'completed' || stage === 'won' || stage === 'closed') return 'completed'
  if (stage === 'lost' || stage === 'archived' || stage === 'cancelled' || stage === 'canceled') return 'cancelled'
  return 'lead'
}

export function normalizeConstructoraDealTimelineStage(value: unknown): UnifiedDealTimelineStage {
  const status = safeText(value)
  if (status === 'negotiating') return 'offer'
  if (status === 'reserved') return 'reservation'
  if (status === 'contract_signed' || status === 'contract') return 'contract'
  if (status === 'financing' || status === 'closing') return 'closing'
  if (status === 'closed' || status === 'completed' || status === 'won') return 'completed'
  if (status === 'cancelled' || status === 'canceled') return 'cancelled'
  return 'reservation'
}

export function getUnifiedDealTimelineLabel(stage: UnifiedDealTimelineStage): string {
  return UNIFIED_DEAL_TIMELINE_LABELS[stage]
}

export function getUnifiedDealHealth(stage: UnifiedDealTimelineStage, updatedAt: Date | string | number | { toDate?: () => Date } | null | undefined, now = new Date()): UnifiedDealHealth {
  if (stage === 'completed' || stage === 'cancelled') return 'complete'
  const updatedMillis = toMillis(updatedAt)
  if (!updatedMillis) return 'attention'
  const ageHours = (now.getTime() - updatedMillis) / (1000 * 60 * 60)
  const slaHours = SLA_HOURS_BY_TIMELINE_STAGE[stage]
  if (!slaHours) return 'complete'
  if (ageHours >= slaHours) return 'overdue'
  if (ageHours >= slaHours * 0.7) return 'attention'
  return 'healthy'
}

export function getUnifiedDealHealthLabel(health: UnifiedDealHealth): string {
  return UNIFIED_DEAL_HEALTH_LABELS[health]
}

export function getUnifiedDealAgeDays(updatedAt: Date | string | number | { toDate?: () => Date } | null | undefined, now = new Date()): number {
  const updatedMillis = toMillis(updatedAt)
  if (!updatedMillis) return 0
  return Math.max(0, Math.floor((now.getTime() - updatedMillis) / (1000 * 60 * 60 * 24)))
}

export type BrokerOrConstructoraDealStage = CrmDealStage | DealStatus