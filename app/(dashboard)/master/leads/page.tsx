'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FiClock, FiLayout, FiList, FiX, FiZap } from 'react-icons/fi'

type LeadStage = 'new' | 'assigned' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost' | 'archived'
type PipelineStage = 'new' | 'assigned' | 'contacted' | 'qualified' | 'won' | 'lost'

interface LeadRecord {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  type: 'request-info' | 'request-call' | 'whatsapp' | 'showing'
  source: string
  sourceId?: string
  status: 'unassigned' | 'assigned' | 'contacted' | 'won' | 'lost'
  leadStage: LeadStage
  ownerAgentId?: string | null
  assignedTo?: string | null
  inboxConversationId?: string
  createdAt?: string | null
  updatedAt?: string | null
  assignedAt?: string | null
  stageChangedAt?: string | null
  lastActivityAt?: string | null
  slaBreached?: boolean
  secondsToBreach?: number | null
}

interface LeadMetrics {
  totalLeads: number
  unassigned: number
  slaBreached: number
  conversionRate: number | null
  avgResponseTimeMinutes: number
  escalationsOpen: number
  autoAssignable: number
  topBrokers: BrokerPerformance[]
}

interface BrokerPerformance {
  broker: string
  assigned: number
  won: number
  conversionRate: number
  slaBreachRate: number
}

interface LeadStats {
  total: number
  overdue: number
  unowned: number
  byStage: Record<LeadStage, number>
  metrics: LeadMetrics
}

interface AutomationRun {
  id: string
  job: 'scheduledLeadAutoAssign' | 'scheduledLeadSlaEscalation'
  status: string
  scanned: number
  assigned: number
  escalated: number
  durationMs: number
  timestamp: string | null
}

interface AutomationSafeguard {
  cooldownSeconds: number
  maxPerRun: number
  remainingSeconds: number
  lastRunAt: string | null
  nextAllowedAt: string | null
}

interface AutomationSafeguards {
  autoAssign: AutomationSafeguard
  escalation: AutomationSafeguard
}

interface AgentOption {
  id: string
  name: string
  company?: string
  photoURL?: string
  role?: string
  status?: string
}

const DEFAULT_METRICS: LeadMetrics = {
  totalLeads: 0,
  unassigned: 0,
  slaBreached: 0,
  conversionRate: null,
  avgResponseTimeMinutes: 0,
  escalationsOpen: 0,
  autoAssignable: 0,
  topBrokers: [],
}

const DEFAULT_STATS: LeadStats = {
  total: 0,
  overdue: 0,
  unowned: 0,
  byStage: {
    new: 0,
    assigned: 0,
    contacted: 0,
    qualified: 0,
    negotiating: 0,
    won: 0,
    lost: 0,
    archived: 0,
  },
  metrics: DEFAULT_METRICS,
}

const STAGE_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  new: ['assigned', 'lost', 'archived'],
  assigned: ['contacted', 'lost', 'archived'],
  contacted: ['qualified', 'lost', 'archived'],
  qualified: ['negotiating', 'lost', 'archived'],
  negotiating: ['won', 'lost', 'archived'],
  won: ['archived'],
  lost: ['archived'],
  archived: [],
}

const FILTER_STAGES: LeadStage[] = ['new', 'assigned', 'contacted', 'qualified', 'negotiating', 'won', 'lost', 'archived']
const PIPELINE_COLUMNS: Array<{ key: PipelineStage; label: string }> = [
  { key: 'new', label: 'New' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
]

function formatSla(secondsToBreach: number | null | undefined) {
  if (secondsToBreach === null || secondsToBreach === undefined) return '—'
  const isOverdue = secondsToBreach < 0
  const abs = Math.abs(secondsToBreach)
  const hours = Math.floor(abs / 3600)
  const minutes = Math.floor((abs % 3600) / 60)
  const suffix = isOverdue ? 'overdue' : 'left'
  return `${hours}h ${minutes}m ${suffix}`
}

function formatRelative(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return '—'

  const diffMs = Date.now() - parsed.getTime()
  if (diffMs < 0) return 'just now'
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function formatAvgResponse(minutes: number) {
  if (!minutes) return '—'
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${hours}h ${mins}m`
}

function formatJobLabel(job: AutomationRun['job']) {
  if (job === 'scheduledLeadAutoAssign') return 'Auto-Assign'
  return 'SLA Escalation'
}

function formatRunMetrics(run: AutomationRun) {
  if (run.job === 'scheduledLeadAutoAssign') {
    return `scanned ${run.scanned} · assigned ${run.assigned}`
  }
  return `scanned ${run.scanned} · escalated ${run.escalated}`
}

function formatRunDuration(durationMs: number) {
  if (!durationMs || durationMs < 0) return 'n/a'
  if (durationMs < 1000) return `${durationMs}ms`
  return `${(durationMs / 1000).toFixed(1)}s`
}

function formatCooldown(seconds: number | null | undefined) {
  const value = Number(seconds || 0)
  if (!value || value <= 0) return 'ready'
  const mins = Math.floor(value / 60)
  const secs = value % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

function getRunStatusChip(status: string) {
  if (status === 'ok' || status === 'success') {
    return 'border-green-200 bg-green-50 text-green-700'
  }
  if (status === 'running' || status === 'queued') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  return 'border-red-200 bg-red-50 text-red-700'
}

function mapPipelineStage(stage: LeadStage): PipelineStage {
  if (stage === 'negotiating') return 'qualified'
  if (stage === 'archived') return 'lost'
  return stage as PipelineStage
}

export default function LeadsPage() {
  const router = useRouter()
  const [sessionRole, setSessionRole] = useState<string>('master_admin')
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [stats, setStats] = useState<LeadStats>(DEFAULT_STATS)
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([])
  const [automationSafeguards, setAutomationSafeguards] = useState<AutomationSafeguards | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table')
  const [selectedStages, setSelectedStages] = useState<LeadStage[]>([])
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [slaOnly, setSlaOnly] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [assignNote, setAssignNote] = useState('')
  const [runningAutoAssign, setRunningAutoAssign] = useState(false)
  const [runningEscalation, setRunningEscalation] = useState(false)
  const [showDuplicates, setShowDuplicates] = useState(false)

  const isBrokerScoped = sessionRole === 'broker' || sessionRole === 'agent'

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.ok && json?.session?.role) {
          setSessionRole(String(json.session.role))
        }
      } catch {
        setSessionRole('master_admin')
      }
    }

    loadSession()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput.trim()), 250)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const buildLocalStats = useCallback((items: LeadRecord[]): LeadStats => {
    const byStage: Record<LeadStage, number> = {
      new: 0,
      assigned: 0,
      contacted: 0,
      qualified: 0,
      negotiating: 0,
      won: 0,
      lost: 0,
      archived: 0,
    }

    for (const lead of items) {
      byStage[lead.leadStage] = (byStage[lead.leadStage] || 0) + 1
    }

    const total = items.length
    const won = items.filter((lead) => lead.leadStage === 'won').length
    const unowned = items.filter((lead) => !lead.ownerAgentId).length
    const overdue = items.filter((lead) => Boolean(lead.slaBreached)).length
    const assignedFunnel = items.filter((lead) => ['assigned', 'contacted', 'qualified', 'negotiating', 'won', 'lost'].includes(lead.leadStage)).length

    return {
      total,
      overdue,
      unowned,
      byStage,
      metrics: {
        totalLeads: total,
        unassigned: unowned,
        slaBreached: overdue,
        conversionRate: assignedFunnel ? Number(((won / assignedFunnel) * 100).toFixed(1)) : null,
        avgResponseTimeMinutes: 0,
        escalationsOpen: 0,
        autoAssignable: items.filter((lead) => !lead.ownerAgentId && lead.leadStage === 'new').length,
        topBrokers: [],
      },
    }
  }, [])

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.set('limit', '200')

      if (selectedStages.length > 0) {
        params.set('stages', selectedStages.join(','))
      }

      if (ownerFilter !== 'all') {
        params.set('ownerAgentId', ownerFilter)
      }

      if (sourceFilter !== 'all') {
        params.set('source', sourceFilter)
      }

      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      if (slaOnly) params.set('sla', 'overdue')
      if (debouncedSearch) params.set('q', debouncedSearch)

      const url = isBrokerScoped
        ? `/api/broker/leads?limit=200`
        : `/api/admin/leads/queue?${params.toString()}`

      const res = await fetch(url)
      const data = await res.json()

      if (data.ok) {
        if (isBrokerScoped) {
          let nextLeads: LeadRecord[] = Array.isArray(data.leads) ? data.leads : []

          if (selectedStages.length > 0) {
            const stageSet = new Set(selectedStages)
            nextLeads = nextLeads.filter((lead) => stageSet.has(lead.leadStage))
          }

          if (ownerFilter === 'unassigned') {
            nextLeads = nextLeads.filter((lead) => !lead.ownerAgentId)
          } else if (ownerFilter !== 'all') {
            nextLeads = nextLeads.filter((lead) => String(lead.ownerAgentId || '') === ownerFilter)
          }

          if (sourceFilter !== 'all') {
            nextLeads = nextLeads.filter((lead) => String(lead.source || '') === sourceFilter)
          }

          if (slaOnly) {
            nextLeads = nextLeads.filter((lead) => Boolean(lead.slaBreached))
          }

          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase()
            nextLeads = nextLeads.filter((lead) =>
              [lead.buyerName, lead.buyerEmail, lead.buyerPhone, lead.source]
                .map((value) => String(value || '').toLowerCase())
                .join(' ')
                .includes(q)
            )
          }

          const fallbackStats = buildLocalStats(nextLeads)

          try {
            const automationRes = await fetch('/api/broker/leads/automation', { cache: 'no-store' })
            const automationJson = await automationRes.json().catch(() => ({}))

            if (automationRes.ok && automationJson?.ok && automationJson?.data) {
              const metrics = automationJson.data
              setStats({
                ...fallbackStats,
                total: Number(metrics.totalLeads || fallbackStats.total),
                overdue: Number(metrics.overdue || fallbackStats.overdue),
                metrics: {
                  ...fallbackStats.metrics,
                  totalLeads: Number(metrics.totalLeads || fallbackStats.metrics.totalLeads),
                  autoAssignable: Number(metrics.autoAssignable || fallbackStats.metrics.autoAssignable),
                  slaBreached: Number(metrics.overdue || fallbackStats.metrics.slaBreached),
                  escalationsOpen: Number(metrics.escalationsOpen || 0),
                  topBrokers: Array.isArray(metrics.topBrokers) ? metrics.topBrokers : [],
                },
              })
              setAutomationRuns(Array.isArray(metrics.automationRuns) ? metrics.automationRuns : [])
              setAutomationSafeguards((metrics.safeguards as AutomationSafeguards) || null)
            } else {
              setStats(fallbackStats)
              setAutomationRuns([])
              setAutomationSafeguards(null)
            }
          } catch {
            setStats(fallbackStats)
            setAutomationRuns([])
            setAutomationSafeguards(null)
          }

          setLeads(nextLeads)
        } else {
          setLeads(data.data.leads || [])
          setStats(data.data.stats || DEFAULT_STATS)
          setAutomationRuns(data.data.automationRuns || [])
          setAutomationSafeguards(null)
        }
      } else {
        toast.error(data.error || 'Unable to load leads')
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
      toast.error('Unable to load leads')
    } finally {
      setLoading(false)
    }
  }, [selectedStages, ownerFilter, sourceFilter, fromDate, toDate, slaOnly, debouncedSearch, isBrokerScoped, buildLocalStats])

  const fetchAgents = useCallback(async () => {
    try {
      setAgentsLoading(true)
      const res = await fetch(isBrokerScoped ? '/api/broker/team' : '/api/admin/users?limit=300')
      const data = await res.json()

      if (isBrokerScoped) {
        if (data.ok && Array.isArray(data.members)) {
          setAgents(data.members.filter((user: AgentOption) => user.role === 'agent' || user.role === 'broker'))
        } else {
          setAgents([])
          toast.error('Unable to load team members')
        }
      } else if (data.ok && Array.isArray(data.data)) {
        setAgents(data.data.filter((user: AgentOption) => user.role === 'agent' || user.role === 'broker'))
      } else {
        toast.error('Unable to load agents')
      }
    } catch (err) {
      console.error('Error fetching agents:', err)
      toast.error('Unable to load agents')
    } finally {
      setAgentsLoading(false)
    }
  }, [isBrokerScoped])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleAssign = async (agentId: string) => {
    if (!selectedLeadId) return

    try {
      const res = await fetch(isBrokerScoped ? '/api/broker/leads' : '/api/admin/leads/assign', {
        method: isBrokerScoped ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isBrokerScoped
            ? {
                action: 'assign',
                leadId: selectedLeadId,
                ownerAgentId: agentId,
                reason: assignNote || undefined,
              }
            : {
                leadId: selectedLeadId,
                agentId,
                note: assignNote || undefined,
              }),
        }),
      })

      const data = await res.json()
      if (data.ok) {
        toast.success('Lead assigned successfully')
        setShowAssignModal(false)
        setSelectedLeadId(null)
        setAssignNote('')
        fetchLeads()
      } else {
        toast.error(data.error || 'Unable to assign lead')
      }
    } catch (err) {
      console.error('Error assigning lead:', err)
      toast.error('Unable to assign lead')
    }
  }

  const handleStageChange = async (lead: LeadRecord, nextStage: LeadStage) => {
    try {
      const res = await fetch(isBrokerScoped ? '/api/broker/leads' : '/api/admin/leads/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isBrokerScoped
            ? {
                action: 'stage',
                leadId: lead.id,
                leadStage: nextStage,
              }
            : {
                id: lead.id,
                leadStage: nextStage,
              }),
        }),
      })

      const data = await res.json()
      if (data.ok) {
        toast.success('Lead stage updated')
        fetchLeads()
      } else {
        toast.error(data.error || 'Unable to update stage')
      }
    } catch (err) {
      console.error('Error updating stage:', err)
      toast.error('Unable to update stage')
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (isBrokerScoped) {
      toast.error('Delete is disabled for broker queue')
      return
    }
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      const res = await fetch('/api/admin/leads/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })

      const data = await res.json()
      if (data.ok) {
        toast.success('Lead deleted')
        fetchLeads()
      } else {
        toast.error(data.error || 'Unable to delete lead')
      }
    } catch (err) {
      console.error('Error deleting lead:', err)
      toast.error('Unable to delete lead')
    }
  }

  const handleRunAutoAssign = async () => {
    try {
      setRunningAutoAssign(true)
      if (isBrokerScoped) {
        const remaining = Number(automationSafeguards?.autoAssign?.remainingSeconds || 0)
        if (remaining > 0) {
          toast(`Auto-assign cooldown active: ${formatCooldown(remaining)}`)
          return
        }

        const res = await fetch('/api/broker/leads/automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'auto_assign', limit: Number(automationSafeguards?.autoAssign?.maxPerRun || 30) }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.ok) {
          if (Number(data?.retryAfterSeconds || 0) > 0) {
            toast(`Auto-assign cooldown active: ${formatCooldown(Number(data.retryAfterSeconds))}`)
          } else {
            toast.error(data?.error || 'Unable to run office auto-assign')
          }
          fetchLeads()
          return
        }

        const assigned = Number(data?.data?.assigned || 0)
        const scanned = Number(data?.data?.scanned || 0)
        toast.success(assigned > 0 ? `Office auto-assigned ${assigned} of ${scanned} leads` : 'No eligible leads for office auto-assign')
      } else {
        const candidates = leads
          .filter((lead) => !lead.ownerAgentId && lead.leadStage === 'new')
          .slice(0, 25)

        if (candidates.length === 0) {
          toast('No unassigned new leads available for auto-assign')
          return
        }

        const results = await Promise.all(
          candidates.map(async (lead) => {
            const response = await fetch('/api/admin/leads/auto-assign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ leadId: lead.id }),
            })
            const data = await response.json().catch(() => ({ ok: false }))
            return Boolean(response.ok && data.ok)
          })
        )

        const successCount = results.filter(Boolean).length
        toast.success(`Auto-assigned ${successCount} of ${candidates.length} leads`)
      }

      fetchLeads()
    } catch (err) {
      console.error('Error running auto-assign:', err)
      toast.error('Unable to run auto-assign')
    } finally {
      setRunningAutoAssign(false)
    }
  }

  const handleRunEscalation = async () => {
    try {
      setRunningEscalation(true)
      if (isBrokerScoped) {
        const remaining = Number(automationSafeguards?.escalation?.remainingSeconds || 0)
        if (remaining > 0) {
          toast(`Escalation cooldown active: ${formatCooldown(remaining)}`)
          return
        }

        const res = await fetch('/api/broker/leads/automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'escalate', limit: Number(automationSafeguards?.escalation?.maxPerRun || 150) }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.ok) {
          if (Number(data?.retryAfterSeconds || 0) > 0) {
            toast(`Escalation cooldown active: ${formatCooldown(Number(data.retryAfterSeconds))}`)
          } else {
            toast.error(data?.error || 'Unable to run office SLA escalation')
          }
          fetchLeads()
          return
        }

        const escalated = Number(data?.data?.escalated || 0)
        toast.success(escalated > 0 ? `Office escalation opened on ${escalated} leads` : 'No breached leads required office escalation')
      } else {
        const res = await fetch('/api/admin/leads/escalate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 250 }),
        })

        const data = await res.json()
        if (!res.ok || !data.ok) {
          toast.error(data.error || 'Unable to run SLA escalation')
          return
        }

        const escalated = Number(data?.data?.escalated || 0)
        toast.success(escalated > 0 ? `Escalated ${escalated} breached leads` : 'No leads required escalation')
      }

      fetchLeads()
    } catch (err) {
      console.error('Error running SLA escalation:', err)
      toast.error('Unable to run SLA escalation')
    } finally {
      setRunningEscalation(false)
    }
  }

  const openAssignModal = (leadId: string) => {
    setSelectedLeadId(leadId)
    setShowAssignModal(true)
  }

  const toggleStageFilter = (stage: LeadStage) => {
    setSelectedStages((current) => {
      if (current.includes(stage)) {
        return current.filter((item) => item !== stage)
      }
      return [...current, stage]
    })
  }

  const clearFilters = () => {
    setSelectedStages([])
    setOwnerFilter('all')
    setSourceFilter('all')
    setFromDate('')
    setToDate('')
    setSlaOnly(false)
    setSearchInput('')
    setDebouncedSearch('')
  }

  const ownerMap = useMemo(() => {
    return new Map(agents.map((agent) => [agent.id, agent]))
  }, [agents])

  const sourceOptions = useMemo(() => {
    const values = new Set(['property', 'project', 'agent'])
    leads.forEach((lead) => values.add(String(lead.source || '').trim()))
    return Array.from(values).filter(Boolean)
  }, [leads])

  const pipelineGroups = useMemo(() => {
    const grouped: Record<PipelineStage, LeadRecord[]> = {
      new: [],
      assigned: [],
      contacted: [],
      qualified: [],
      won: [],
      lost: [],
    }

    for (const lead of leads) {
      const bucket = mapPipelineStage(lead.leadStage)
      grouped[bucket].push(lead)
    }

    return grouped
  }, [leads])

  const detectedDuplicates = useMemo(() => {
    const emailMap = new Map<string, LeadRecord[]>()
    const phoneMap = new Map<string, LeadRecord[]>()

    for (const lead of leads) {
      const email = lead.buyerEmail?.toLowerCase().trim()
      const phone = lead.buyerPhone?.replace(/\D/g, '').trim()

      if (email) {
        if (!emailMap.has(email)) emailMap.set(email, [])
        emailMap.get(email)!.push(lead)
      }

      if (phone && phone.length >= 7) {
        if (!phoneMap.has(phone)) phoneMap.set(phone, [])
        phoneMap.get(phone)!.push(lead)
      }
    }

    const duplicates: Array<{type: 'email' | 'phone'; key: string; leads: LeadRecord[]}> = []

    emailMap.forEach((leads, email) => {
      if (leads.length > 1) {
        duplicates.push({ type: 'email', key: email, leads })
      }
    })

    phoneMap.forEach((leads, phone) => {
      if (leads.length > 1) {
        duplicates.push({ type: 'phone', key: phone, leads })
      }
    })

    return duplicates.sort((a, b) => b.leads.length - a.leads.length)
  }, [leads])

  const hasActiveFilters =
    selectedStages.length > 0 ||
    ownerFilter !== 'all' ||
    sourceFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '' ||
    slaOnly ||
    debouncedSearch.length > 0

  const emptyStateMessage = useMemo(() => {
    if (!hasActiveFilters) {
      return {
        title: 'No leads yet',
        body: 'New inquiries appear here as soon as they enter the system.',
      }
    }

    if (ownerFilter === 'unassigned') {
      return {
        title: 'No unassigned leads',
        body: 'All leads currently have an owner assigned.',
      }
    }

    if (slaOnly) {
      return {
        title: 'No SLA breaches',
        body: 'No breached leads match the current filters.',
      }
    }

    return {
      title: 'No matching leads',
      body: 'No results for current filters. Adjust criteria to expand the view.',
    }
  }, [hasActiveFilters, ownerFilter, slaOnly])

  const stageColor: Record<LeadStage, string> = {
    new: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    qualified: 'bg-indigo-100 text-indigo-800',
    negotiating: 'bg-cyan-100 text-cyan-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-700',
  }

  const kpiCards = [
    { label: 'Total Leads', value: stats.metrics.totalLeads, tone: 'text-gray-900', hint: 'Current filtered queue size' },
    { label: 'Unassigned', value: stats.metrics.unassigned, tone: 'text-amber-600', hint: 'Needs ownership now' },
    { label: 'SLA Breached', value: stats.metrics.slaBreached, tone: 'text-red-600', hint: 'Past stage SLA due time' },
    { label: 'Escalations Open', value: stats.metrics.escalationsOpen, tone: 'text-red-700', hint: 'Open escalation status' },
    {
      label: 'Conversion Rate',
      value: stats.metrics.conversionRate === null ? '—' : `${stats.metrics.conversionRate}%`,
      tone: 'text-green-700',
      hint: 'Won / assigned funnel',
    },
    { label: 'Avg Response Time', value: formatAvgResponse(stats.metrics.avgResponseTimeMinutes), tone: 'text-[#0B2545]', hint: 'Assigned latency windowed 30d' },
  ]

  const brokerAutoAssignCooldown = Number(automationSafeguards?.autoAssign?.remainingSeconds || 0)
  const brokerEscalationCooldown = Number(automationSafeguards?.escalation?.remainingSeconds || 0)
  const autoAssignDisabled = runningAutoAssign || (isBrokerScoped && brokerAutoAssignCooldown > 0)
  const escalationDisabled = runningEscalation || (isBrokerScoped && brokerEscalationCooldown > 0)

  const handleViewLead = (lead: LeadRecord) => {
    if (lead.source === 'property' && lead.sourceId) {
      router.push(`/listing/${lead.sourceId}`)
      return
    }

    if (lead.source === 'agent' && lead.sourceId) {
      router.push(`/agent/${lead.sourceId}`)
      return
    }

    if (lead.inboxConversationId) {
      router.push(`/master/inbox?conv=${lead.inboxConversationId}`)
      return
    }

    toast('No detailed view is available for this lead yet')
  }

  const renderOwner = (lead: LeadRecord) => {
    const ownerId = lead.ownerAgentId || lead.assignedTo || ''
    if (!ownerId) {
      return <span className="text-xs font-medium text-amber-700">Unassigned</span>
    }

    const owner = ownerMap.get(ownerId)
    const ownerName = owner?.name || ownerId
    const initials = ownerName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()

    return (
      <div className="inline-flex items-center gap-2">
        {owner?.photoURL ? (
          <img src={owner.photoURL} alt={ownerName} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <span className="w-6 h-6 rounded-full bg-[#0B2545]/10 text-[#0B2545] text-[10px] font-semibold flex items-center justify-center">
            {initials || 'AG'}
          </span>
        )}
        <span className="text-xs text-gray-700">{ownerName}</span>
      </div>
    )
  }

  const renderMoveStage = (lead: LeadRecord) => {
    const options = [lead.leadStage, ...STAGE_TRANSITIONS[lead.leadStage]]
    return (
      <select
        value={lead.leadStage}
        onChange={(e) => handleStageChange(lead, e.target.value as LeadStage)}
        className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white"
        aria-label={`Move lead ${lead.buyerName} to another stage`}
      >
        {options.map((stage) => (
          <option key={stage} value={stage}>
            Move: {stage}
          </option>
        ))}
      </select>
    )
  }

  const renderSlaBadge = (lead: LeadRecord) => {
    const tone = lead.slaBreached
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${tone}`}>
        <FiClock /> {formatSla(lead.secondsToBreach)}
      </span>
    )
  }

  const buildLeadTimeline = (lead: LeadRecord) => {
    const events: string[] = []
    if (lead.createdAt) events.push(`Creado ${formatRelative(lead.createdAt)}`)
    if (lead.assignedAt) events.push(`Asignado ${formatRelative(lead.assignedAt)}`)
    if (lead.stageChangedAt) events.push(`Etapa ${lead.leadStage} ${formatRelative(lead.stageChangedAt)}`)
    if (events.length === 0 && lead.updatedAt) events.push(`Actualizado ${formatRelative(lead.updatedAt)}`)
    return events.slice(0, 2)
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Lead Queue Management</h1>
        <button
          onClick={() => fetchLeads()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/master/listings" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Listings</Link>
        <Link href="/master/applications" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Applications</Link>
        <Link href="/master/users" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">People</Link>
        <Link href="/master/inbox" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Inbox</Link>
        <Link href="/master/settings" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Settings</Link>
      </div>

      {isBrokerScoped && (
        <div className="rounded-lg border border-[#0B2545]/20 bg-[#0B2545]/5 px-4 py-3">
          <div className="text-sm font-semibold text-[#0B2545]">Broker Admin Management · Phase 5</div>
          <div className="text-xs text-gray-600 mt-1">Automatización por oficina activada con analítica local, SLA badges y timeline operativo.</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</div>
            <div className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value}</div>
            <div className="mt-1 text-[11px] text-gray-500">{card.hint}</div>
          </div>
        ))}
      </div>

      {stats.metrics.totalLeads > 0 && stats.metrics.totalLeads < 10 && (
        <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Low dataset — metrics stabilizing
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Automation Controls</h2>
              <p className="text-xs text-gray-500 mt-1">Run assignment and escalation routines without leaving the queue.</p>
            </div>
            <div className="text-xs text-gray-600">Auto-assignable: <span className="font-semibold">{stats.metrics.autoAssignable}</span></div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleRunAutoAssign}
              disabled={autoAssignDisabled}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#0B2545] rounded-lg hover:bg-[#12355f] disabled:opacity-50"
            >
              <FiZap /> {runningAutoAssign ? 'Running...' : isBrokerScoped && brokerAutoAssignCooldown > 0 ? `Cooldown ${formatCooldown(brokerAutoAssignCooldown)}` : 'Run auto-assign'}
            </button>
            <button
              onClick={handleRunEscalation}
              disabled={escalationDisabled}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              {runningEscalation ? 'Running...' : isBrokerScoped && brokerEscalationCooldown > 0 ? `Cooldown ${formatCooldown(brokerEscalationCooldown)}` : 'Run SLA escalation'}
            </button>
          </div>

          {isBrokerScoped && automationSafeguards && (
            <div className="mt-3 text-[11px] text-gray-600">
              Auto-assign: max {automationSafeguards.autoAssign.maxPerRun}/run · cooldown {Math.floor(automationSafeguards.autoAssign.cooldownSeconds / 60)}m.
              {' '}Escalation: max {automationSafeguards.escalation.maxPerRun}/run · cooldown {Math.floor(automationSafeguards.escalation.cooldownSeconds / 60)}m.
            </div>
          )}

          <div className="mt-4 border-t border-gray-100 pt-3">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recent automation activity</div>
            <div className="mt-2 space-y-2">
              {automationRuns.length === 0 ? (
                <div className="text-xs text-gray-500">No scheduled jobs have run yet.</div>
              ) : (
                automationRuns.map((run) => (
                  <div key={run.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-2 py-1.5">
                    <div className="text-xs text-gray-800 inline-flex items-center gap-2">
                      <span className="font-semibold">{formatJobLabel(run.job)}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getRunStatusChip(run.status)}`}>
                        {run.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {formatRunMetrics(run)} · duration {formatRunDuration(run.durationMs)} · {formatRelative(run.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{isBrokerScoped ? 'Top performing team' : 'Top performing brokers'}</h2>
          <p className="text-xs text-gray-500 mt-1">Ranked by conversion rate and deal volume</p>

          <div className="mt-3 space-y-2">
            {stats.metrics.topBrokers.length === 0 ? (
              <div className="text-xs text-gray-500">No broker performance data yet.</div>
            ) : (
              stats.metrics.topBrokers.map((broker, index) => (
                <div key={`${broker.broker}-${index}`} className="flex items-center justify-between rounded-md border border-gray-200 p-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-900 truncate max-w-[180px]">#{index + 1} {broker.broker}</div>
                    <div className="text-[11px] text-gray-500">{broker.won}/{broker.assigned} won</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-green-700">{broker.conversionRate}%</div>
                    <div className="text-[11px] text-red-600">SLA {broker.slaBreachRate}%</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone, or agent"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A676]/30"
            />
          </div>

          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            aria-label="Filter by owner"
          >
            <option value="all">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            aria-label="Filter by source"
          >
            <option value="all">All sources</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            aria-label="Start date (created after)"
            title="Filter leads created on or after this date"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            aria-label="End date (created before)"
            title="Filter leads created on or before this date"
          />

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 px-3 py-2 border border-gray-300 rounded-lg" title="Show only leads that have exceeded their SLA">
            <input
              type="checkbox"
              checked={slaOnly}
              onChange={(e) => setSlaOnly(e.target.checked)}
              className="rounded border-gray-300"
              aria-label="Filter by SLA breached status"
            />
            Show SLA breaches only
          </label>

          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Clear all active filters"
          >
            Clear filters
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTER_STAGES.map((stage) => {
              const active = selectedStages.includes(stage)
              return (
                <button
                  key={stage}
                  onClick={() => toggleStageFilter(stage)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium capitalize transition ${active ? 'border-[#00A676] bg-[#00A676]/10 text-[#0B2545]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                >
                  {stage} ({stats.byStage[stage] || 0})
                </button>
              )
            })}
          </div>

          <div className="inline-flex items-center gap-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md ${viewMode === 'table' ? 'bg-[#0B2545] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiList /> Table
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md ${viewMode === 'pipeline' ? 'bg-[#0B2545] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiLayout /> Pipeline
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500">Loading lead queue...</div>
      ) : (
        <>
          {detectedDuplicates.length > 0 && showDuplicates && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">Potential Duplicates Detected</h3>
                  <p className="text-xs text-amber-700 mt-1">{detectedDuplicates.length} duplicate lead group{detectedDuplicates.length !== 1 ? 's' : ''} found by email or phone</p>
                </div>
                <button
                  onClick={() => setShowDuplicates(false)}
                  className="text-amber-600 hover:text-amber-900"
                  title="Hide duplicate groups"
                  aria-label="Hide duplicate groups"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {detectedDuplicates.slice(0, 10).map((dup, idx) => (
                  <div key={`${dup.type}-${idx}`} className="bg-white rounded-lg border border-amber-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-gray-900">
                        {dup.type === 'email' ? '✉️' : '📱'} {dup.key}
                      </div>
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{dup.leads.length} leads</span>
                    </div>
                    <div className="space-y-1">
                      {dup.leads.map((lead) => (
                        <div key={lead.id} className="text-xs text-gray-700 flex items-center justify-between">
                          <span>{lead.buyerName} ({lead.leadStage})</span>
                          <span className="text-gray-500">{formatRelative(lead.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {detectedDuplicates.length > 10 && (
                <div className="mt-2 text-xs text-amber-600">
                  +{detectedDuplicates.length - 10} more duplicate groups
                </div>
              )}
            </div>
          )}

          {detectedDuplicates.length > 0 && !showDuplicates && (
            <button
              onClick={() => setShowDuplicates(true)}
              className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100 mb-6 w-full text-left"
            >
              Show {detectedDuplicates.length} potential duplicate lead group{detectedDuplicates.length !== 1 ? 's' : ''} detected by email/phone
            </button>
          )}

          {leads.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <div className="text-lg font-semibold text-gray-900">{emptyStateMessage.title}</div>
          <p className="mt-2 text-sm text-gray-600">{emptyStateMessage.body}</p>
        </div>
      ) : viewMode === 'pipeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PIPELINE_COLUMNS.map((column) => (
            <div key={column.key} className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{column.label}</h3>
                <span className="text-xs font-medium text-gray-600">{pipelineGroups[column.key].length}</span>
              </div>
              <div className="p-3 space-y-3 max-h-[520px] overflow-y-auto">
                {pipelineGroups[column.key].length === 0 ? (
                  <div className="text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg p-3">
                    No leads in this column
                  </div>
                ) : (
                  pipelineGroups[column.key].map((lead) => {
                    const ownerId = lead.ownerAgentId || lead.assignedTo || ''
                    return (
                      <div key={lead.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{lead.buyerName}</div>
                          <div className="text-xs text-gray-500">{lead.buyerEmail}</div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold capitalize ${stageColor[lead.leadStage]}`}>
                            {lead.leadStage}
                          </span>
                          {renderSlaBadge(lead)}
                        </div>

                        <div className="text-xs text-gray-600">
                          <div className="font-medium mb-1">Owner</div>
                          {renderOwner(lead)}
                        </div>

                        <div className="text-[11px] text-gray-500">Last activity: {formatRelative(lead.lastActivityAt || lead.updatedAt)}</div>
                        <div className="space-y-0.5">
                          {buildLeadTimeline(lead).map((event) => (
                            <div key={`${lead.id}-${event}`} className="text-[11px] text-gray-500">• {event}</div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!ownerId && (
                            <button
                              onClick={() => openAssignModal(lead.id)}
                              className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                            >
                              Assign
                            </button>
                          )}
                          <button
                            onClick={() => handleViewLead(lead)}
                            className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium text-[#0B2545] bg-[#0B2545]/10 rounded-md hover:bg-[#0B2545]/20"
                          >
                            View
                          </button>
                          {renderMoveStage(lead)}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contact Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">SLA Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const ownerId = lead.ownerAgentId || lead.assignedTo || ''

                  return (
                    <tr key={lead.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.buyerName}</div>
                        <div className="text-xs text-gray-500">Source: {lead.source}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          <div>{lead.buyerEmail}</div>
                          {lead.buyerPhone && <div>{lead.buyerPhone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold capitalize ${stageColor[lead.leadStage]}`}>
                          {lead.leadStage}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{renderOwner(lead)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {renderSlaBadge(lead)}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        <div>{formatRelative(lead.lastActivityAt || lead.updatedAt)}</div>
                        <div className="mt-1 space-y-0.5">
                          {buildLeadTimeline(lead).map((event) => (
                            <div key={`table-${lead.id}-${event}`} className="text-[11px] text-gray-500">• {event}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          {!ownerId && (
                            <button
                              onClick={() => openAssignModal(lead.id)}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                            >
                              Assign
                            </button>
                          )}
                          <button
                            onClick={() => handleViewLead(lead)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#0B2545] bg-[#0B2545]/10 rounded-md hover:bg-[#0B2545]/20"
                          >
                            View
                          </button>
                          {renderMoveStage(lead)}
                          {!isBrokerScoped && (
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Assign lead to agent</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedLeadId(null)
                  setAssignNote('')
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close assign modal"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select an agent</label>
                {agentsLoading ? (
                  <div className="text-sm text-gray-500">Loading available agents...</div>
                ) : agents.length === 0 ? (
                  <div className="text-sm text-red-600">No agents available</div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => handleAssign(agent.id)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{agent.name}</div>
                        {agent.company && <div className="text-xs text-gray-600">{agent.company}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment reason (optional)</label>
                <textarea
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="Explain why this is the best assignment..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
