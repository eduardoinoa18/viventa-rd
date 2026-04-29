import { TRANSACTION_STAGES, type CommissionStatus, type CurrencyCode, type TimestampLike, type TransactionStage } from '@/lib/domain/transaction'

export const CRM_DEAL_STAGES = TRANSACTION_STAGES
export type CrmDealStage = TransactionStage

export const CRM_DEAL_STAGE_LABELS: Record<CrmDealStage, string> = {
  lead: 'Lead',
  showing: 'Visita',
  offer: 'Oferta',
  reservation: 'Reserva',
  contract: 'Contrato',
  closing: 'Cierre',
  completed: 'Completado',
  lost: 'Perdido',
  archived: 'Archivado',
}

export interface CrmDealRecord {
  id: string
  dealId: string
  leadId?: string | null
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  stage: CrmDealStage
  salePrice: number
  currency: CurrencyCode
  totalCommission: number
  commissionStatus: CommissionStatus
  agentId?: string | null
  listingId?: string | null
  projectId?: string | null
  unitId?: string | null
  lostReason?: string | null
  lostAt?: TimestampLike
  notes?: string | null
  createdAt: TimestampLike
  updatedAt: TimestampLike
  timelineStage?: string | null
  timelineLabel?: string | null
  healthStatus?: 'healthy' | 'attention' | 'overdue' | 'complete' | null
  healthLabel?: string | null
  stageAgeDays?: number | null
}

function safeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

export function normalizeCrmDealStage(value: unknown): CrmDealStage {
  const stage = safeText(value)
  if ((CRM_DEAL_STAGES as readonly string[]).includes(stage)) return stage as CrmDealStage
  if (stage === 'oferta') return 'offer'
  if (stage === 'contrato_firmado') return 'contract'
  if (stage === 'cierre') return 'closing'
  if (stage === 'cerrado' || stage === 'closed' || stage === 'completado' || stage === 'won') return 'completed'
  if (stage === 'perdido' || stage === 'lost') return 'lost'
  if (stage === 'archivado' || stage === 'archived') return 'archived'
  return 'lead'
}

export function getCrmDealStageLabel(stage: CrmDealStage): string {
  return CRM_DEAL_STAGE_LABELS[stage] || CRM_DEAL_STAGE_LABELS.lead
}

export type LeadLifecycleStageFromDeal = 'assigned' | 'qualified' | 'negotiating' | 'won' | 'lost'

export function mapCrmDealStageToLeadStage(stage: CrmDealStage): LeadLifecycleStageFromDeal {
  if (stage === 'completed') return 'won'
  if (stage === 'lost' || stage === 'archived') return 'lost'
  if (stage === 'offer' || stage === 'reservation' || stage === 'contract' || stage === 'closing') return 'negotiating'
  if (stage === 'showing') return 'qualified'
  return 'assigned'
}