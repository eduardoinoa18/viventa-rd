'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  FiUser, FiPhone, FiMail, FiHome, FiActivity, FiCheckSquare,
  FiClock, FiTrendingUp, FiAlertCircle, FiPlusCircle,
  FiDollarSign, FiSearch, FiRefreshCw, FiBriefcase, FiCalendar, FiLayers,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { CRM_DEAL_STAGES, CRM_DEAL_STAGE_LABELS, type CrmDealStage } from '@/lib/domain/crmDeal'
import BusinessCalendar, { type CalendarEvent } from '@/components/BusinessCalendar'

// ─── Types ────────────────────────────────────────────────────────────────────

const LEAD_STAGES = ['new', 'assigned', 'contacted', 'qualified', 'negotiating', 'won', 'lost'] as const
type LeadStage = typeof LEAD_STAGES[number]

const STAGE_META: Record<LeadStage, { label: string; color: string; bg: string; dot: string }> = {
  new:         { label: 'Nuevo',         color: 'text-slate-700',   bg: 'bg-slate-100',     dot: 'bg-slate-500'   },
  assigned:    { label: 'Asignado',      color: 'text-blue-700',    bg: 'bg-blue-50',       dot: 'bg-blue-500'    },
  contacted:   { label: 'Contactado',    color: 'text-cyan-700',    bg: 'bg-cyan-50',       dot: 'bg-cyan-500'    },
  qualified:   { label: 'Calificado',    color: 'text-violet-700',  bg: 'bg-violet-50',     dot: 'bg-violet-500'  },
  negotiating: { label: 'Negociación',   color: 'text-amber-700',   bg: 'bg-amber-50',      dot: 'bg-amber-500'   },
  won:         { label: 'Ganado',        color: 'text-emerald-700', bg: 'bg-emerald-50',    dot: 'bg-emerald-500' },
  lost:        { label: 'Perdido',       color: 'text-rose-700',    bg: 'bg-rose-50',       dot: 'bg-rose-500'    },
}

type Lead = {
  id: string
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
  leadStage?: LeadStage
  priority?: 'low' | 'normal' | 'high'
  budget?: number
  linkedListingId?: string
  linkedListingTitle?: string
  followUpAt?: string | null
  nextActionNote?: string
  ownerAgentId?: string | null
  ownerAgentName?: string
  source?: string
  notes?: string
  createdAt?: string
  linkedDealId?: string | null
  linkedTransactionId?: string | null
}

type Deal = {
  id: string
  dealId: string
  leadId?: string | null
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  stage: CrmDealStage
  salePrice: number
  currency: 'USD' | 'DOP'
  totalCommission: number
  commissionStatus: 'pending' | 'paid'
  updatedAt?: string | null
  createdAt?: string | null
  timelineStage?: string
  timelineLabel?: string
  healthStatus?: 'healthy' | 'attention' | 'overdue' | 'complete'
  healthLabel?: string
  stageAgeDays?: number
  lostReason?: string | null
}

type Task = {
  id: string
  title: string
  dueAt?: string | null
  status: 'pending' | 'done'
  priority: 'low' | 'normal' | 'high'
  linkedLeadId?: string
}

type LeadActivity = {
  id: string
  type?: string
  title?: string
  summary?: string
  notes?: string
  actorName?: string
  actorId?: string
  createdAt?: string
}

const PRIORITY_META = {
  low:    { label: 'Baja',  color: 'text-gray-500',  bg: 'bg-gray-100'  },
  normal: { label: 'Media', color: 'text-blue-600',  bg: 'bg-blue-50'   },
  high:   { label: 'Alta',  color: 'text-red-600',   bg: 'bg-red-50'    },
}

function StageBadge({ stage }: { stage: LeadStage }) {
  const m = STAGE_META[stage] ?? STAGE_META.new
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority as keyof typeof PRIORITY_META] ?? PRIORITY_META.normal
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.bg} ${m.color}`}>{m.label}</span>
  )
}

function fmt(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })
}

function fmtDateTime(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleString('es-DO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtCurrency(value: number, currency: 'USD' | 'DOP' = 'USD') {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0))
}

function toDateTimeLocal(date: string | null | undefined) {
  if (!date) return ''
  const parsed = new Date(date)
  if (!Number.isFinite(parsed.getTime())) return ''
  const adjusted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60 * 1000)
  return adjusted.toISOString().slice(0, 16)
}

function leadToDealStage(leadStage?: LeadStage): CrmDealStage {
  if (leadStage === 'won') return 'completed'
  if (leadStage === 'negotiating') return 'offer'
  if (leadStage === 'qualified') return 'showing'
  return 'lead'
}

function DealStageBadge({ stage }: { stage: CrmDealStage }) {
  const palette: Record<CrmDealStage, string> = {
    lead: 'bg-slate-100 text-slate-700',
    showing: 'bg-violet-50 text-violet-700',
    offer: 'bg-amber-50 text-amber-700',
    reservation: 'bg-orange-50 text-orange-700',
    contract: 'bg-blue-50 text-blue-700',
    closing: 'bg-teal-50 text-teal-700',
    completed: 'bg-emerald-50 text-emerald-700',
    lost: 'bg-rose-50 text-rose-700',
    archived: 'bg-zinc-100 text-zinc-700',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${palette[stage]}`}>{CRM_DEAL_STAGE_LABELS[stage]}</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BrokerCrmPage() {
  const [leads, setLeads]                       = useState<Lead[]>([])
  const [deals, setDeals]                       = useState<Deal[]>([])
  const [dealStageDraftById, setDealStageDraftById] = useState<Record<string, CrmDealStage>>({})
  const [selectedDealIds, setSelectedDealIds]   = useState<string[]>([])
  const [tasks, setTasks]                       = useState<Task[]>([])
  const [loading, setLoading]                   = useState(true)
  const [activeTab, setActiveTab]               = useState<'pipeline' | 'deals' | 'transactions' | 'tasks' | 'calendar'>('pipeline')

  // Transaction state
  const [transactions, setTransactions]         = useState<Array<{ id: string; clientName?: string; stage?: string; salePrice?: number; currency?: string; pendingCommission?: number }>>([])
  const [selectedLead, setSelectedLead]         = useState<Lead | null>(null)
  const [leadActivity, setLeadActivity]         = useState<LeadActivity[]>([])
  const [loadingLeadActivity, setLoadingLeadActivity] = useState(false)

  // Pipeline filters
  const [stageFilter, setStageFilter]           = useState<string>('all')
  const [searchQuery, setSearchQuery]           = useState('')
  const [priorityFilter, setPriorityFilter]     = useState<string>('all')

  // New lead form
  const [addingLead, setAddingLead]             = useState(false)
  const [newLeadName, setNewLeadName]           = useState('')
  const [newLeadPhone, setNewLeadPhone]         = useState('')
  const [newLeadEmail, setNewLeadEmail]         = useState('')
  const [newLeadBudget, setNewLeadBudget]       = useState('')
  const [saving, setSaving]                     = useState(false)

  // Quick update state
  const [quickStage, setQuickStage]             = useState<LeadStage>('new')
  const [quickNote, setQuickNote]               = useState('')
  const [quickFollow, setQuickFollow]           = useState('')
  const [quickPriority, setQuickPriority]       = useState<'low' | 'normal' | 'high'>('normal')
  const [updatingLead, setUpdatingLead]         = useState(false)
  const [convertingLead, setConvertingLead]     = useState(false)
  const [updatingDealId, setUpdatingDealId]     = useState<string | null>(null)
  const [bulkDealStage, setBulkDealStage]       = useState<CrmDealStage>('lead')
  const [dealSalePrice, setDealSalePrice]       = useState('')
  const [dealCommissionPercent, setDealCommissionPercent] = useState('5')
  const [dealAgentSplitPercent, setDealAgentSplitPercent] = useState('70')
  const [dealStage, setDealStage]               = useState<CrmDealStage>('lead')

  // Task form
  const [taskTitle, setTaskTitle]               = useState('')
  const [taskDueAt, setTaskDueAt]               = useState('')
  const [taskPriority, setTaskPriority]         = useState<'low' | 'normal' | 'high'>('normal')
  const [savingTask, setSavingTask]             = useState(false)

  // ─── Load data ──────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsRes, dealsRes, tasksRes, txRes] = await Promise.allSettled([
        fetch('/api/broker/leads').then((r) => r.json()),
        fetch('/api/broker/crm/deals').then((r) => r.json()),
        fetch('/api/broker/crm/tasks').then((r) => r.json()),
        fetch('/api/broker/transactions', { cache: 'no-store' }).then((r) => r.json()),
      ])
      if (leadsRes.status === 'fulfilled') setLeads(leadsRes.value?.leads ?? [])
      if (dealsRes.status === 'fulfilled') {
        const nextDeals: Deal[] = dealsRes.value?.deals ?? []
        setDeals(nextDeals)
        setSelectedDealIds((prev) => prev.filter((dealId) => nextDeals.some((deal) => deal.id === dealId)))
        const drafts: Record<string, CrmDealStage> = {}
        nextDeals.forEach((deal) => {
          drafts[deal.id] = deal.stage
        })
        setDealStageDraftById(drafts)
      }
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value?.tasks ?? [])
      if (txRes.status === 'fulfilled') setTransactions(txRes.value?.transactions ?? [])
    } catch { /* noop */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ─── KPIs ───────────────────────────────────────────────────────────────────

  const kpi = useMemo(() => {
    const active  = leads.filter((l) => !['won', 'lost'].includes(l.leadStage ?? '')).length
    const qualified = leads.filter((l) => l.leadStage === 'qualified').length
    const negotiating  = leads.filter((l) => l.leadStage === 'negotiating').length
    const openDeals = deals.filter((deal) => deal.stage !== 'completed').length
    const atRiskDeals = deals.filter((deal) => deal.healthStatus === 'attention' || deal.healthStatus === 'overdue').length
    const pending = tasks.filter((t) => t.status === 'pending').length
    const overdue = tasks.filter((t) => t.status === 'pending' && t.dueAt && new Date(t.dueAt) < new Date()).length
    return { active, qualified, negotiating, openDeals, atRiskDeals, pending, overdue }
  }, [deals, leads, tasks])

  // ─── Filtered leads ─────────────────────────────────────────────────────────

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (stageFilter !== 'all' && l.leadStage !== stageFilter) return false
      if (priorityFilter !== 'all' && l.priority !== priorityFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const hay = `${l.buyerName ?? ''} ${l.buyerEmail ?? ''} ${l.buyerPhone ?? ''} ${l.linkedListingTitle ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [leads, stageFilter, priorityFilter, searchQuery])

  const pipeline = useMemo(() => {
    const groups: Record<LeadStage, Lead[]> = {} as Record<LeadStage, Lead[]>
    LEAD_STAGES.forEach((s) => { groups[s] = [] })
    filteredLeads.forEach((l) => {
      const s = (l.leadStage ?? 'new') as LeadStage
      if (groups[s]) groups[s].push(l)
    })
    return groups
  }, [filteredLeads])

  const dealSummary = useMemo(() => {
    return CRM_DEAL_STAGES.reduce((acc, stage) => {
      acc[stage] = deals.filter((deal) => deal.stage === stage).length
      return acc
    }, {} as Record<CrmDealStage, number>)
  }, [deals])

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = []
    tasks.forEach((t) => {
      if (t.dueAt) {
        events.push({
          id: `task-${t.id}`,
          title: t.title,
          date: t.dueAt.slice(0, 10),
          type: 'task',
          status: t.status === 'done' ? 'done' : new Date(t.dueAt) < new Date() ? 'overdue' : 'pending',
          priority: t.priority,
        })
      }
    })
    leads.forEach((l) => {
      if (l.followUpAt) {
        events.push({
          id: `lead-${l.id}`,
          title: `Follow-up: ${l.buyerName ?? 'Lead'}`,
          date: l.followUpAt.slice(0, 10),
          type: 'follow_up',
          note: l.nextActionNote ?? undefined,
          status: new Date(l.followUpAt) < new Date() ? 'overdue' : 'pending',
        })
      }
    })
    deals.forEach((d) => {
      if (d.updatedAt) {
        events.push({
          id: `deal-${d.id}`,
          title: `Deal: ${d.clientName}`,
          date: d.updatedAt.slice(0, 10),
          type: d.stage === 'closing' ? 'closing' : 'deal',
          status: d.stage === 'completed' ? 'done' : 'pending',
        })
      }
    })
    return events
  }, [tasks, leads, deals])

  async function addCalendarEvent(date: string, title: string, type: CalendarEvent['type']) {
    const taskTypes: Array<CalendarEvent['type']> = ['task', 'follow_up', 'meeting', 'other']
    if (taskTypes.includes(type)) {
      try {
        const res = await fetch('/api/broker/crm/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, dueAt: date, priority: 'normal' }),
        })
        const json = await res.json()
        if (res.ok && json.ok) {
          toast.success('Tarea agregada al calendario')
          load()
        } else {
          toast.error(json.error ?? 'Error al crear tarea')
        }
      } catch { toast.error('Error de red') }
    } else {
      toast('Tipo de evento registrado en calendario', { icon: '📅' })
    }
  }

  const allDealsSelected = deals.length > 0 && selectedDealIds.length === deals.length

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function addLead() {
    if (!newLeadName.trim()) return toast.error('Nombre requerido')
    setSaving(true)
    try {
      const res = await fetch('/api/broker/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: newLeadName,
          buyerPhone: newLeadPhone,
          buyerEmail: newLeadEmail,
          budget: newLeadBudget ? Number(newLeadBudget) : 0,
          leadStage: 'new',
          priority: 'normal',
        }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        toast.success('Lead agregado')
        setAddingLead(false)
        setNewLeadName(''); setNewLeadPhone(''); setNewLeadEmail(''); setNewLeadBudget('')
        load()
      } else {
        toast.error(json.error ?? 'Error al agregar lead')
      }
    } catch { toast.error('Error de red') }
    setSaving(false)
  }

  async function updateLead() {
    if (!selectedLead) return
    setUpdatingLead(true)
    try {
      const stageRes = await fetch('/api/broker/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stage',
          leadId: selectedLead.id,
          leadStage: quickStage,
          reason: 'crm_pipeline_update',
        }),
      })
      const stageJson = await stageRes.json()
      if (!stageRes.ok || !stageJson.ok) {
        toast.error(stageJson.error ?? 'Error al actualizar etapa')
        setUpdatingLead(false)
        return
      }

      const followRes = await fetch('/api/broker/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'followup',
          leadId: selectedLead.id,
          nextActionNote: quickNote,
          followUpAt: quickFollow || null,
          priority: quickPriority,
        }),
      })
      const followJson = await followRes.json()
      if (followRes.ok && followJson.ok) {
        toast.success('Lead actualizado')
        setSelectedLead(null)
        load()
      } else {
        toast.error(followJson.error ?? 'Error al actualizar seguimiento')
      }
    } catch { toast.error('Error de red') }
    setUpdatingLead(false)
  }

  async function convertLeadToDeal() {
    if (!selectedLead) return
    if (!dealSalePrice.trim()) {
      toast.error('Indica el valor del deal')
      return
    }

    setConvertingLead(true)
    try {
      const res = await fetch('/api/broker/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          salePrice: Number(dealSalePrice),
          commissionPercent: Number(dealCommissionPercent || 5),
          agentSplitPercent: Number(dealAgentSplitPercent || 70),
          stage: dealStage,
        }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        toast.success('Lead convertido en deal')
        setSelectedLead(null)
        await load()
      } else {
        toast.error(json.error ?? 'No se pudo abrir el deal')
      }
    } catch {
      toast.error('Error de red')
    }
    setConvertingLead(false)
  }

  async function updateDealStage(dealId: string) {
    const stage = dealStageDraftById[dealId]
    if (!stage) return

    let lostReason: string | undefined
    if (stage === 'lost') {
      const requested = window.prompt('Motivo de perdida') || ''
      if (!requested.trim()) {
        toast.error('Motivo de perdida requerido')
        return
      }
      lostReason = requested.trim()
    }

    setUpdatingDealId(dealId)
    try {
      const res = await fetch('/api/broker/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dealId, stage, lostReason }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'No se pudo actualizar la etapa del deal')
      } else {
        toast.success('Etapa del deal actualizada')
        await load()
      }
    } catch {
      toast.error('Error de red')
    }
    setUpdatingDealId(null)
  }

  async function applyBulkDealStage() {
    if (!selectedDealIds.length) {
      toast.error('Selecciona al menos un deal')
      return
    }

    let lostReason: string | undefined
    if (bulkDealStage === 'lost') {
      const requested = window.prompt('Motivo de perdida para los deals seleccionados') || ''
      if (!requested.trim()) {
        toast.error('Motivo de perdida requerido')
        return
      }
      lostReason = requested.trim()
    }

    setUpdatingDealId('bulk')
    try {
      const res = await fetch('/api/broker/crm/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedDealIds, stage: bulkDealStage, lostReason }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'No se pudieron actualizar los deals seleccionados')
      } else {
        toast.success(`${json?.updatedCount || selectedDealIds.length} deals actualizados`)
        setSelectedDealIds([])
        await load()
      }
    } catch {
      toast.error('Error de red')
    }
    setUpdatingDealId(null)
  }

  function toggleDealSelection(dealId: string) {
    setSelectedDealIds((prev) => prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId])
  }

  function toggleAllDeals() {
    setSelectedDealIds((prev) => (prev.length === deals.length ? [] : deals.map((deal) => deal.id)))
  }

  async function addTask() {
    if (!taskTitle.trim()) return toast.error('Título requerido')
    setSavingTask(true)
    try {
      const res = await fetch('/api/broker/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, dueAt: taskDueAt || null, priority: taskPriority }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        toast.success('Tarea creada')
        setTaskTitle(''); setTaskDueAt(''); setTaskPriority('normal')
        load()
      } else {
        toast.error(json.error ?? 'Error al crear tarea')
      }
    } catch { toast.error('Error de red') }
    setSavingTask(false)
  }

  async function doneTask(id: string) {
    try {
      await fetch('/api/broker/crm/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: id, status: 'done' }),
      })
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: 'done' } : t))
    } catch { /* noop */ }
  }

  function openLead(l: Lead) {
    setSelectedLead(l)
    setQuickStage((l.leadStage ?? 'new') as LeadStage)
    setQuickNote(l.nextActionNote ?? '')
    setQuickFollow(toDateTimeLocal(l.followUpAt))
    setQuickPriority(l.priority ?? 'normal')
    setDealSalePrice(l.budget ? String(l.budget) : '')
    setDealCommissionPercent('5')
    setDealAgentSplitPercent('70')
    setDealStage(leadToDealStage(l.leadStage))
  }

  useEffect(() => {
    async function loadLeadActivity(leadId: string) {
      setLoadingLeadActivity(true)
      try {
        const res = await fetch(`/api/activity-events?entityType=lead&entityId=${encodeURIComponent(leadId)}&limit=12`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        setLeadActivity(Array.isArray(json?.events) ? json.events : [])
      } catch {
        setLeadActivity([])
      }
      setLoadingLeadActivity(false)
    }

    if (selectedLead?.id) {
      loadLeadActivity(selectedLead.id)
    } else {
      setLeadActivity([])
    }
  }, [selectedLead?.id])

  const leadTimeline = useMemo(() => {
    if (leadActivity.length > 0) {
      return leadActivity.map((item) => ({
        id: item.id,
        title: item.title || item.summary || 'Actualización CRM',
        description: item.notes || item.summary || item.type || 'Sin detalle',
        actor: item.actorName || item.actorId || 'Sistema',
        createdAt: item.createdAt || null,
      }))
    }

    if (!selectedLead) return []
    const fallback = [
      selectedLead.createdAt
        ? {
            id: 'created',
            title: 'Lead creado',
            description: `Origen: ${selectedLead.source || 'property'}`,
            actor: 'Sistema',
            createdAt: selectedLead.createdAt,
          }
        : null,
      selectedLead.followUpAt
        ? {
            id: 'followup',
            title: 'Seguimiento programado',
            description: selectedLead.nextActionNote || 'Sin nota de seguimiento',
            actor: selectedLead.ownerAgentName || 'Agente',
            createdAt: selectedLead.followUpAt,
          }
        : null,
    ].filter(Boolean) as Array<{ id: string; title: string; description: string; actor: string; createdAt: string | null }>

    return fallback
  }, [leadActivity, selectedLead])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CRM &amp; Pipeline</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestión de leads, citas y seguimiento de clientes</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              title="Actualizar CRM"
              aria-label="Actualizar CRM"
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAddingLead(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <FiPlusCircle className="w-4 h-4" /> Nuevo Lead
            </button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 grid grid-cols-3 sm:grid-cols-6 gap-4">
        {[
          { label: 'Leads Activos',  value: kpi.active,  icon: FiUser,        color: 'text-blue-600'    },
          { label: 'Calificados',    value: kpi.qualified, icon: FiHome,        color: 'text-violet-600'  },
          { label: 'Negociación',    value: kpi.negotiating,  icon: FiDollarSign,  color: 'text-amber-600'   },
          { label: 'Deals Abiertos', value: kpi.openDeals,  icon: FiBriefcase,  color: 'text-emerald-600' },
          { label: 'Deals Riesgo',   value: kpi.atRiskDeals, icon: FiAlertCircle, color: kpi.atRiskDeals > 0 ? 'text-rose-600' : 'text-gray-400' },
          {
            label: 'Tareas',
            value: kpi.pending,
            icon: FiCheckSquare,
            color: 'text-gray-600',
          },
        ].map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="text-center">
              <div className={`flex items-center justify-center gap-1 font-bold text-xl ${k.color}`}>
                <Icon className="w-4 h-4" /> {k.value}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-1 overflow-x-auto">
          {([
            { id: 'pipeline',     label: 'CRM Pipeline',    icon: FiUser },
            { id: 'deals',        label: 'Deals',           icon: FiBriefcase },
            { id: 'transactions', label: 'Transacciones',   icon: FiLayers },
            { id: 'tasks',        label: 'Tareas',          icon: FiCheckSquare },
            { id: 'calendar',     label: 'Calendario',      icon: FiCalendar },
          ] as const).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-3 px-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#00A676] text-[#00A676]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <main className="p-6">

        {/* ── Pipeline Tab ────────────────────────────────────────────────── */}
        {activeTab === 'pipeline' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar lead..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                title="Filtrar por etapa"
                aria-label="Filtrar por etapa"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las etapas</option>
                {LEAD_STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_META[s].label}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                title="Filtrar por prioridad"
                aria-label="Filtrar por prioridad"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las prioridades</option>
                <option value="high">Alta</option>
                <option value="normal">Media</option>
                <option value="low">Baja</option>
              </select>
              <span className="ml-auto text-sm text-gray-500 self-center">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-16">Cargando pipeline...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FiUser className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No hay leads con estos filtros.</p>
                <button
                  onClick={() => setAddingLead(true)}
                  className="mt-4 text-blue-600 hover:underline text-sm"
                >
                  + Agregar primer lead
                </button>
              </div>
            ) : stageFilter === 'all' ? (
              /* Kanban view */
              <div className="flex gap-4 overflow-x-auto pb-4">
                {LEAD_STAGES.map((stage) => {
                  const stageLeads = pipeline[stage]
                  const meta = STAGE_META[stage]
                  return (
                    <div key={stage} className="w-64 shrink-0">
                      <div className={`flex items-center justify-between mb-2 px-2 py-1.5 rounded-lg ${meta.bg}`}>
                        <span className={`text-xs font-bold uppercase tracking-wide ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className={`text-xs font-bold ${meta.color}`}>{stageLeads.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stageLeads.map((l) => (
                          <LeadCard key={l.id} lead={l} onClick={() => openLead(l)} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* List view for filtered stage */
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Comprador', 'Etapa', 'Prioridad', 'Presupuesto', 'Seguimiento', 'Agente'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLeads.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => openLead(l)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{l.buyerName ?? '—'}</p>
                          {l.buyerPhone && (
                            <p className="text-xs text-gray-400">{l.buyerPhone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StageBadge stage={(l.leadStage ?? 'new') as LeadStage} />
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={l.priority ?? 'normal'} />
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {l.budget ? `$${l.budget.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{fmt(l.followUpAt)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{l.ownerAgentName ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
              {CRM_DEAL_STAGES.map((stage) => (
                <div key={stage} className="rounded-2xl border border-gray-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{CRM_DEAL_STAGE_LABELS[stage]}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{dealSummary[stage] || 0}</p>
                </div>
              ))}
            </div>

            {deals.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allDealsSelected}
                        onChange={toggleAllDeals}
                        aria-label="Seleccionar todos los deals"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Seleccionar todos
                    </label>
                    <span>{selectedDealIds.length} seleccionados</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={bulkDealStage}
                      onChange={(e) => setBulkDealStage(e.target.value as CrmDealStage)}
                      title="Etapa masiva"
                      aria-label="Etapa masiva"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CRM_DEAL_STAGES.map((stage) => (
                        <option key={stage} value={stage}>{CRM_DEAL_STAGE_LABELS[stage]}</option>
                      ))}
                    </select>
                    <button
                      onClick={applyBulkDealStage}
                      disabled={!selectedDealIds.length || updatingDealId === 'bulk'}
                      className="rounded-lg bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12355f] disabled:opacity-50"
                    >
                      {updatingDealId === 'bulk' ? 'Actualizando...' : 'Aplicar cambio masivo'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="text-center text-gray-400 py-16">Cargando deals...</div>
            ) : deals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-400">
                <FiBriefcase className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p className="font-medium text-gray-600">Todavía no hay deals abiertos desde CRM.</p>
                <p className="mt-1 text-sm">Convierte un lead calificado en deal desde el panel lateral.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {deals.map((deal) => (
                  <div key={deal.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <label className="mt-1 inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDealIds.includes(deal.id)}
                          onChange={() => toggleDealSelection(deal.id)}
                          aria-label={`Seleccionar deal ${deal.clientName}`}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{deal.clientName}</p>
                        <p className="mt-1 text-xs text-gray-500">Actualizado {fmtDateTime(deal.updatedAt || deal.createdAt)}</p>
                      </div>
                      <DealStageBadge stage={deal.stage} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {deal.healthLabel ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${deal.healthStatus === 'overdue' ? 'bg-rose-50 text-rose-700' : deal.healthStatus === 'attention' ? 'bg-amber-50 text-amber-700' : deal.healthStatus === 'complete' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {deal.healthLabel}
                        </span>
                      ) : null}
                      {typeof deal.stageAgeDays === 'number' ? (
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          {deal.stageAgeDays}d en etapa
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Valor</p>
                        <p className="mt-1 font-semibold text-gray-900">{fmtCurrency(deal.salePrice, deal.currency)}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Comisión</p>
                        <p className="mt-1 font-semibold text-gray-900">{fmtCurrency(deal.totalCommission, deal.currency)}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                      <select
                        value={dealStageDraftById[deal.id] || deal.stage}
                        onChange={(e) => setDealStageDraftById((prev) => ({ ...prev, [deal.id]: e.target.value as CrmDealStage }))}
                        title="Etapa del deal"
                        aria-label="Etapa del deal"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CRM_DEAL_STAGES.map((stage) => (
                          <option key={stage} value={stage}>{CRM_DEAL_STAGE_LABELS[stage]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateDealStage(deal.id)}
                        disabled={updatingDealId === deal.id || updatingDealId === 'bulk'}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {updatingDealId === deal.id ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>{deal.commissionStatus === 'paid' ? 'Comisión pagada' : 'Comisión pendiente'}</span>
                      <Link href="/dashboard/broker/transactions" className="font-semibold text-blue-600 hover:text-blue-700">
                        Ver board
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tasks Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div className="max-w-2xl">
            {/* Add task */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Nueva Tarea</h3>
              <div className="flex gap-2 flex-wrap">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Título de la tarea..."
                  className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={taskDueAt}
                  onChange={(e) => setTaskDueAt(e.target.value)}
                  title="Fecha límite de la tarea"
                  aria-label="Fecha límite de la tarea"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as 'low' | 'normal' | 'high')}
                  title="Prioridad de la tarea"
                  aria-label="Prioridad de la tarea"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baja</option>
                  <option value="normal">Media</option>
                  <option value="high">Alta</option>
                </select>
                <button
                  onClick={addTask}
                  disabled={savingTask}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {savingTask ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </div>

            {/* Task list */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <FiCheckSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No hay tareas pendientes.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center gap-3 px-4 py-3 ${t.status === 'done' ? 'opacity-50' : ''}`}
                    >
                      <button
                        onClick={() => t.status !== 'done' && doneTask(t.id)}
                        className="shrink-0"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          t.status === 'done'
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}>
                          {t.status === 'done' && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {t.title}
                        </p>
                        {t.dueAt && (
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${
                            new Date(t.dueAt) < new Date() && t.status !== 'done'
                              ? 'text-red-500'
                              : 'text-gray-400'
                          }`}>
                            <FiClock className="w-3 h-3" /> {fmt(t.dueAt)}
                          </p>
                        )}
                      </div>
                      <PriorityBadge priority={t.priority} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Transactions Tab ──────────────────────────────────────────── */}
        {activeTab === 'transactions' && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Pipeline', value: transactions.length, color: 'text-[#0B2545]' },
                { label: 'Leads', value: transactions.filter(t => t.stage === 'lead').length, color: 'text-slate-600' },
                { label: 'En Contrato', value: transactions.filter(t => t.stage === 'contract').length, color: 'text-blue-600' },
                { label: 'Completados', value: transactions.filter(t => t.stage === 'completed').length, color: 'text-emerald-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Kanban-style stage columns */}
            {loading ? (
              <div className="text-center text-gray-400 py-16">Cargando transacciones...</div>
            ) : transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-400">
                <FiLayers className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p className="font-medium text-gray-600">Sin transacciones activas.</p>
                <Link href="/dashboard/broker/transactions" className="mt-3 inline-block text-sm font-semibold text-[#00A676] hover:underline">
                  Ir al board completo →
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Cliente', 'Etapa', 'Valor', 'Comisión Pend.'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map(tx => {
                        const stageLabel: Record<string, string> = {
                          lead: 'Lead', showing: 'Visita', offer: 'Oferta',
                          reservation: 'Reserva', contract: 'Contrato',
                          closing: 'Cierre', completed: 'Completado',
                        }
                        const stageColor: Record<string, string> = {
                          lead: 'bg-slate-100 text-slate-700',
                          showing: 'bg-violet-50 text-violet-700',
                          offer: 'bg-amber-50 text-amber-700',
                          reservation: 'bg-orange-50 text-orange-700',
                          contract: 'bg-blue-50 text-blue-700',
                          closing: 'bg-teal-50 text-teal-700',
                          completed: 'bg-emerald-50 text-emerald-700',
                        }
                        return (
                          <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{tx.clientName ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stageColor[tx.stage ?? 'lead'] ?? 'bg-gray-100 text-gray-600'}`}>
                                {stageLabel[tx.stage ?? 'lead'] ?? tx.stage}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {tx.salePrice ? `$${Number(tx.salePrice).toLocaleString()}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {tx.pendingCommission ? `$${Number(tx.pendingCommission).toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="text-right">
                  <Link href="/dashboard/broker/transactions" className="inline-flex items-center gap-1 text-sm font-semibold text-[#00A676] hover:underline">
                    Abrir board completo →
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Calendar Tab ──────────────────────────────────────────────── */}
        {activeTab === 'calendar' && (
          <BusinessCalendar
            events={calendarEvents}
            onAddEvent={addCalendarEvent}
            loading={loading}
          />
        )}
      </main>

      {/* ── Lead Detail Drawer ───────────────────────────────────────────── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedLead(null)}
          />
          <div className="relative ml-auto w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{selectedLead.buyerName ?? 'Lead'}</h2>
              <button
                onClick={() => setSelectedLead(null)}
                title="Cerrar panel"
                aria-label="Cerrar panel"
                className="text-gray-400 hover:text-gray-700 text-2xl font-light leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Contact info */}
              <div className="space-y-2">
                {selectedLead.buyerPhone && (
                  <a
                    href={`tel:${selectedLead.buyerPhone}`}
                    className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
                  >
                    <FiPhone className="w-4 h-4" /> {selectedLead.buyerPhone}
                  </a>
                )}
                {selectedLead.buyerEmail && (
                  <a
                    href={`mailto:${selectedLead.buyerEmail}`}
                    className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
                  >
                    <FiMail className="w-4 h-4" /> {selectedLead.buyerEmail}
                  </a>
                )}
                {selectedLead.budget && (
                  <p className="flex items-center gap-2 text-sm text-gray-700">
                    <FiDollarSign className="w-4 h-4 text-gray-400" />
                    Presupuesto:{' '}
                    <span className="font-semibold">${selectedLead.budget.toLocaleString()}</span>
                  </p>
                )}
                {selectedLead.source && (
                  <p className="text-xs text-gray-400">Fuente: {selectedLead.source}</p>
                )}
              </div>

              {/* Communication history */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historial de comunicación</h3>
                  {loadingLeadActivity && <span className="text-[11px] text-gray-400">Cargando…</span>}
                </div>
                {leadTimeline.length === 0 ? (
                  <p className="text-xs text-gray-400">No hay interacciones registradas todavía.</p>
                ) : (
                  <div className="space-y-3">
                    {leadTimeline.map((event) => (
                      <div key={event.id} className="flex gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{event.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{event.description}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{event.actor} · {fmtDateTime(event.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stage update */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actualizar etapa
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {LEAD_STAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuickStage(s)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        quickStage === s
                          ? `${STAGE_META[s].bg} ${STAGE_META[s].color} border-current`
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {STAGE_META[s].label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Próxima acción</label>
                  <input
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Ej: Enviar contrato de arras..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fecha de seguimiento</label>
                  <input
                    type="datetime-local"
                    value={quickFollow}
                    onChange={(e) => setQuickFollow(e.target.value)}
                    title="Fecha de seguimiento"
                    aria-label="Fecha de seguimiento"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Prioridad</label>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as 'low' | 'normal' | 'high')}
                    title="Prioridad del lead"
                    aria-label="Prioridad del lead"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Baja</option>
                    <option value="normal">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <button
                  onClick={updateLead}
                  disabled={updatingLead}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {updatingLead ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Abrir deal</h3>
                    <p className="mt-1 text-sm text-gray-600">Convierte este lead en pipeline transaccional real.</p>
                  </div>
                  {selectedLead.linkedTransactionId ? (
                    <DealStageBadge stage={dealStage} />
                  ) : null}
                </div>

                {selectedLead.linkedTransactionId ? (
                  <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p className="font-semibold">Este lead ya fue convertido en deal.</p>
                    <Link href="/dashboard/broker/transactions" className="mt-2 inline-block font-semibold text-emerald-700 hover:text-emerald-800">
                      Ver transactions board
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={dealSalePrice}
                        onChange={(e) => setDealSalePrice(e.target.value)}
                        placeholder="Valor del deal"
                        inputMode="decimal"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={dealStage}
                        onChange={(e) => setDealStage(e.target.value as CrmDealStage)}
                        title="Etapa inicial del deal"
                        aria-label="Etapa inicial del deal"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CRM_DEAL_STAGES.map((stage) => (
                          <option key={stage} value={stage}>{CRM_DEAL_STAGE_LABELS[stage]}</option>
                        ))}
                      </select>
                      <input
                        value={dealCommissionPercent}
                        onChange={(e) => setDealCommissionPercent(e.target.value)}
                        placeholder="Comisión %"
                        inputMode="decimal"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        value={dealAgentSplitPercent}
                        onChange={(e) => setDealAgentSplitPercent(e.target.value)}
                        placeholder="Split agente %"
                        inputMode="decimal"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={convertLeadToDeal}
                      disabled={convertingLead}
                      className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {convertingLead ? 'Abriendo deal...' : 'Convertir a deal'}
                    </button>
                  </>
                )}
              </div>

              {/* Linked listing */}
              {selectedLead.linkedListingTitle && (
                <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
                  <FiHome className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700">Propiedad ligada</p>
                    <p className="text-sm text-gray-800 mt-0.5">{selectedLead.linkedListingTitle}</p>
                    {selectedLead.linkedListingId && (
                      <Link
                        href={`/listing/${selectedLead.linkedListingId}`}
                        target="_blank"
                        className="text-xs text-blue-600 hover:underline mt-0.5 block"
                      >
                        Ver propiedad →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <Link
                href={`/dashboard/mls?q=${encodeURIComponent(selectedLead.buyerName || selectedLead.buyerEmail || '')}`}
                className="block text-center border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-semibold rounded-lg py-2"
              >
                Vincular propiedad desde MLS
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Lead Modal ─────────────────────────────────────────────────── */}
      {addingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setAddingLead(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Nuevo Lead</h2>
            <div className="space-y-3">
              <input
                value={newLeadName}
                onChange={(e) => setNewLeadName(e.target.value)}
                placeholder="Nombre del comprador *"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={newLeadPhone}
                onChange={(e) => setNewLeadPhone(e.target.value)}
                placeholder="Teléfono"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={newLeadEmail}
                onChange={(e) => setNewLeadEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={newLeadBudget}
                onChange={(e) => setNewLeadBudget(e.target.value)}
                placeholder="Presupuesto (USD)"
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setAddingLead(false)}
                className="flex-1 border border-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={addLead}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Crear Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Lead Card (Kanban) ─────────────────────────────────────────────────────────

function LeadCard({ lead: l, onClick }: { lead: Lead; onClick: () => void }) {
  const isOverdue =
    l.followUpAt &&
    new Date(l.followUpAt) < new Date() &&
    !['closed', 'lost'].includes(l.leadStage ?? '')

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-3 cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-semibold text-gray-900 text-sm line-clamp-1">{l.buyerName ?? '—'}</p>
        <PriorityBadge priority={l.priority ?? 'normal'} />
      </div>
      {l.buyerPhone && (
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <FiPhone className="w-3 h-3" /> {l.buyerPhone}
        </p>
      )}
      {l.budget ? (
        <p className="text-xs text-gray-600 mt-1 font-medium">${l.budget.toLocaleString()}</p>
      ) : null}
      {l.linkedListingTitle && (
        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 truncate">
          <FiHome className="w-3 h-3 shrink-0" /> {l.linkedListingTitle}
        </p>
      )}
      {l.followUpAt && (
        <p className={`text-xs mt-1.5 flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          <FiClock className="w-3 h-3" /> {fmt(l.followUpAt)}{isOverdue ? ' — VENCIDO' : ''}
        </p>
      )}
    </div>
  )
}
