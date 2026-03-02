import type { LeadStage, LegacyLeadStatus } from '@/lib/leadLifecycle'

export interface Lead {
  id: string
  type: 'request-info' | 'request-call' | 'whatsapp' | 'showing'
  source: 'property' | 'project' | 'agent' | 'direct'
  sourceId?: string

  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  message?: string

  leadStage: LeadStage
  status: LegacyLeadStatus

  ownerAgentId: string | null
  ownerAssignedAt?: Date | null
  ownerAssignedBy?: string | null
  ownerAssignmentReason?: string | null

  collaboratorAgentIds?: string[]

  stageChangedAt?: Date | null
  stageChangedBy?: string | null
  stageChangeReason?: string | null
  stageSlaDueAt?: Date | null
  slaBreached?: boolean
  slaBreachedAt?: Date | null

  inboxConversationId?: string | null

  createdAt: Date
  updatedAt: Date
}

export interface LeadStageEvent {
  leadId: string
  previousStage: LeadStage
  newStage: LeadStage
  actorUserId?: string
  actorEmail?: string
  reason?: string
  requestId?: string
  createdAt: Date
}

export interface LeadAssignmentLog {
  leadId: string
  previousOwnerAgentId: string | null
  newOwnerAgentId: string | null
  eventType: 'assigned' | 'reassigned' | 'unassigned'
  reason?: string
  actorUserId?: string
  actorEmail?: string
  requestId?: string
  createdAt: Date
}
