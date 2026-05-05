'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiTarget, FiClock, FiActivity, FiZap, FiCheckCircle } from 'react-icons/fi'

type RoutingMode = 'manual_only' | 'auto_brokerage' | 'auto_top_agent' | 'rotation_mode'

type Suggestion = {
  agentId: string
  agentName: string
  brokerage?: string
  activeLoad: number
  conversionRate: number
  hoursSinceActive: number
  fitScore: number
}

type ControlLead = {
  id: string
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
  type?: string
  source?: string
  sourceId?: string
  status?: string
  ageHours: number
  urgencyScore: number
  city?: string
  sector?: string
  propertyType?: string
  sla: { label: string; color: 'green' | 'yellow' | 'red' }
  escalated?: boolean
  escalationLevel?: 'none' | 'warning' | 'critical'
  suggestions: Suggestion[]
}

type ReassignmentPolicy = {
  manualReassignEnabled: boolean
  suggestNewAssigneeEnabled: boolean
  brokerFallbackEnabled: boolean
  escalationLogEnabled: boolean
}

type AutomationRun = {
  id: string
  job: 'scheduledLeadAutoAssign' | 'scheduledLeadSlaEscalation'
  status: string
  scanned: number
  assigned: number
  escalated: number
  durationMs: number
  timestamp: string | null
}

function formatRelative(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return '—'

  const diffMs = Date.now() - parsed.getTime()
  if (diffMs < 0) return 'ahora mismo'
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'ahora mismo'
  if (minutes < 60) return `hace ${minutes}m`
  if (hours < 24) return `hace ${hours}h`
  return `hace ${days}d`
}

function formatRunMetrics(run: AutomationRun) {
  if (run.job === 'scheduledLeadAutoAssign') return `escaneado ${run.scanned} · asignado ${run.assigned}`
  return `escaneado ${run.scanned} · escalado ${run.escalated}`
}

function formatRunDuration(durationMs: number) {
  if (!durationMs || durationMs < 0) return 'n/d'
  if (durationMs < 1000) return `${durationMs}ms`
  return `${(durationMs / 1000).toFixed(1)}s`
}

function formatJobLabel(job: AutomationRun['job']) {
  if (job === 'scheduledLeadAutoAssign') return 'Auto-Asignar'
  return 'Escalada SLA'
}

function getRunStatusChip(status: string) {
  if (status === 'ok' || status === 'success') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'running' || status === 'queued') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-red-200 bg-red-50 text-red-700'
}

function calculateSLATimer(ageHours: number, escalationHours: number): {timeRemaining: number; percentage: number; isRed: boolean} {
  const timeRemaining = Math.max(0, escalationHours - ageHours)
  const percentage = Math.max(0, Math.min(100, (timeRemaining / escalationHours) * 100))
  const isRed = timeRemaining <= 0.5 // Less than 30 minutes
  return { timeRemaining, percentage, isRed }
}

function formatSLATimer(timeRemaining: number): string {
  if (timeRemaining <= 0) return 'INCUMPLIDO'
  if (timeRemaining < 1) return `${Math.round(timeRemaining * 60)}m`
  if (timeRemaining < 24) return `${Math.round(timeRemaining * 10) / 10}h`
  return `${Math.round(timeRemaining / 24)}d`
}

export default function ControlCenterClient() {
  const [loading, setLoading] = useState(true)
  const [savingMode, setSavingMode] = useState(false)
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null)
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [bulkAssignMode, setBulkAssignMode] = useState(false)
  const [bulkAssignAgent, setBulkAssignAgent] = useState<Suggestion | null>(null)
  const [previewEscalation, setPreviewEscalation] = useState(false)
  const [stream, setStream] = useState<ControlLead[]>([])
  const [queueStats, setQueueStats] = useState({ total: 0, red: 0, yellow: 0, green: 0, escalated: 0, avgUrgency: 0 })
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([])
  const [orphanedConversations, setOrphanedConversations] = useState(0)
  const [routingMode, setRoutingMode] = useState<RoutingMode>('manual_only')
  const [escalationHours, setEscalationHours] = useState(2)
  const [reassignmentPolicy, setReassignmentPolicy] = useState<ReassignmentPolicy>({
    manualReassignEnabled: true,
    suggestNewAssigneeEnabled: true,
    brokerFallbackEnabled: true,
    escalationLogEnabled: true,
  })

  const loadControlCenter = useCallback(async () => {
    try {
      setLoading(true)
      const [streamRes, settingsRes, leadsRes] = await Promise.all([
        fetch('/api/admin/control/stream?status=unassigned&limit=80'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/leads/queue?limit=20'),
      ])

      const streamJson = await streamRes.json().catch(() => ({}))
      const settingsJson = await settingsRes.json().catch(() => ({}))
      const leadsJson = await leadsRes.json().catch(() => ({}))

      if (!streamRes.ok || !streamJson?.ok) {
        throw new Error(streamJson?.error || 'No se pudo cargar el flujo de leads')
      }

      setStream(Array.isArray(streamJson?.data?.stream) ? streamJson.data.stream : [])
      setQueueStats(streamJson?.data?.queueStats || { total: 0, red: 0, yellow: 0, green: 0, escalated: 0, avgUrgency: 0 })
      setOrphanedConversations(Number(streamJson?.data?.orphanedConversations || 0))
      setEscalationHours(Number(streamJson?.data?.escalationHours || 2))
      setReassignmentPolicy(streamJson?.data?.reassignmentPolicy || {
        manualReassignEnabled: true,
        suggestNewAssigneeEnabled: true,
        brokerFallbackEnabled: true,
        escalationLogEnabled: true,
      })
      setAutomationRuns(Array.isArray(leadsJson?.data?.automationRuns) ? leadsJson.data.automationRuns : [])

      const mode = settingsJson?.data?.controlRoutingMode as RoutingMode | undefined
      if (mode) setRoutingMode(mode)
    } catch (error: any) {
      console.error('control center load error', error)
      toast.error(error?.message || 'No se pudo cargar el Centro de control')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadControlCenter()
  }, [loadControlCenter])

  const saveRoutingMode = useCallback(async (nextMode: RoutingMode) => {
    try {
      setSavingMode(true)
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlRoutingMode: nextMode,
          controlEscalationHours: escalationHours,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo guardar el modo de enrutamiento')
      }

      setRoutingMode(nextMode)
      toast.success('Modo de enrutamiento actualizado')
    } catch (error: any) {
      console.error('save routing mode error', error)
      toast.error(error?.message || 'No se pudo guardar el modo')
    } finally {
      setSavingMode(false)
    }
  }, [])

  const assignToSuggestion = useCallback(async (lead: ControlLead, suggestion: Suggestion) => {
    try {
      setAssigningLeadId(lead.id)
      const note = `Asignado desde Centro de control (${routingMode}). Ajuste=${suggestion.fitScore}, Carga=${suggestion.activeLoad}, Conv=${suggestion.conversionRate}%`

      const res = await fetch('/api/admin/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          agentId: suggestion.agentId,
          note,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo asignar el lead')
      }

      toast.success(`Lead asignado a ${suggestion.agentName}`)
      await loadControlCenter()
    } catch (error: any) {
      console.error('assign lead error', error)
      toast.error(error?.message || 'No se pudo asignar el lead')
    } finally {
      setAssigningLeadId(null)
    }
  }, [loadControlCenter, routingMode])

  const saveEscalationHours = useCallback(async (nextHours: number) => {
    try {
      setSavingMode(true)
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controlRoutingMode: routingMode,
          controlEscalationHours: nextHours,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo guardar el umbral de SLA')
      }

      setEscalationHours(nextHours)
      toast.success(`Escalada global de SLA actualizada a ${nextHours}h`)
      await loadControlCenter()
    } catch (error: any) {
      console.error('save escalation hours error', error)
      toast.error(error?.message || 'No se pudo guardar el SLA global')
    } finally {
      setSavingMode(false)
    }
  }, [loadControlCenter, routingMode])

  const toggleLeadSelection = useCallback((leadId: string) => {
    const newSelected = new Set(selectedLeadIds)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeadIds(newSelected)
  }, [selectedLeadIds])

  const selectAllVisibleLeads = useCallback(() => {
    if (selectedLeadIds.size === stream.length && stream.length > 0) {
      setSelectedLeadIds(new Set())
    } else {
      setSelectedLeadIds(new Set(stream.map(l => l.id)))
    }
  }, [selectedLeadIds, stream])

  const bulkAssignmentLeads = useMemo(() => {
    return stream.filter(l => selectedLeadIds.has(l.id))
  }, [stream, selectedLeadIds])

  const bulkAssignToAgent = useCallback(async (agent: Suggestion) => {
    if (selectedLeadIds.size === 0) {
      toast.error('No hay leads seleccionados')
      return
    }

    try {
      setSavingMode(true)
      const leadIds = Array.from(selectedLeadIds)
      const note = `Asignación masiva desde Centro de control (${routingMode}). Ajuste=${agent.fitScore}, Carga=${agent.activeLoad}, Conv=${agent.conversionRate}%`

      const res = await fetch('/api/admin/leads/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds,
          agentId: agent.agentId,
          note,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudieron asignar leads en lote')
      }

      toast.success(`${leadIds.length} leads asignados a ${agent.agentName}`)
      setSelectedLeadIds(new Set())
      setBulkAssignMode(false)
      setBulkAssignAgent(null)
      await loadControlCenter()
    } catch (error: any) {
      console.error('bulk assign error', error)
      toast.error(error?.message || 'No se pudieron asignar leads en lote')
    } finally {
      setSavingMode(false)
    }
  }, [selectedLeadIds, routingMode, loadControlCenter])

  const escalationPreviewStats = useMemo(() => {
    if (!previewEscalation) return null
    const willEscalate = stream.filter(l => {
      const timer = calculateSLATimer(l.ageHours, escalationHours)
      return timer.timeRemaining <= 0
    })
    const atRisk = stream.filter(l => {
      const timer = calculateSLATimer(l.ageHours, escalationHours)
      return timer.timeRemaining > 0 && timer.timeRemaining < 0.5
    })
    return {
      willEscalate: willEscalate.length,
      atRisk: atRisk.length,
      total: stream.length,
    }
  }, [previewEscalation, stream, escalationHours])

  const topThree = useMemo(() => stream.slice(0, 3), [stream])

  const modeOptions = [
    { value: 'manual_only', label: 'Solo manual', hint: 'El administrador maestro decide cada asignación.' },
    { value: 'auto_brokerage', label: 'Auto-asignar a brokerage', hint: 'Listo para enrutamiento por brokerage.' },
    { value: 'auto_top_agent', label: 'Auto-asignar al mejor agente', hint: 'Usa la puntuación más alta del sistema.' },
    { value: 'rotation_mode', label: 'Modo rotación', hint: 'Distribución rotativa operacional.' },
  ] as const

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545]">Centro de control</h1>
            <p className="text-sm text-gray-600 mt-1">Superficie de comando en tiempo real para decisiones de enrutamiento de leads.</p>
          </div>
          <button
            onClick={loadControlCenter}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-100 disabled:opacity-60"
            title="Recargar flujo de leads y configuración"
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">Entrantes</div>
            <div className="text-3xl font-bold text-[#0B2545] mt-1">{queueStats.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-green-700">SLA Verde</div>
            <div className="text-3xl font-bold text-green-800 mt-1">{queueStats.green}</div>
          </div>
          <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-yellow-700">SLA Amarillo</div>
            <div className="text-3xl font-bold text-yellow-800 mt-1">{queueStats.yellow}</div>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-red-700">SLA Rojo</div>
            <div className="text-3xl font-bold text-red-800 mt-1">{queueStats.red}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#0B2545]/20 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-[#0B2545]">Urgencia Prom.</div>
            <div className="text-3xl font-bold text-[#0B2545] mt-1">{queueStats.avgUrgency}</div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">Leads escalados</div>
            <div className="text-2xl font-bold text-red-700 mt-1">{queueStats.escalated}</div>
            <div className="text-xs text-gray-500 mt-1">Incumplieron el SLA de {escalationHours}h y fueron escalados</div>
          </div>
          <div className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-orange-700">Conversaciones huérfanas</div>
            <div className="text-2xl font-bold text-orange-800 mt-1">{orphanedConversations}</div>
            <div className="text-xs text-gray-500 mt-1">Conversaciones bloqueadas por política de ciclo de vida, requieren reasignación</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">Umbral de escalada SLA global</div>
            <div className="mt-2 flex items-center gap-2">
              {[2, 4, 6].map((hours) => (
                <button
                  key={hours}
                  onClick={() => saveEscalationHours(hours)}
                  disabled={savingMode}
                  className={`px-3 py-1.5 rounded-md text-sm border font-medium ${escalationHours === hours ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} disabled:opacity-60`}
                  title={escalationHours === hours ? 'Umbral de escalada actual' : 'Establecer umbral de escalada'}
                >
                  {hours}h{escalationHours === hours ? ' (actual)' : ''}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="font-semibold text-[#0B2545] mb-2 uppercase tracking-wide">Ejecuciones de automatización recientes</div>
          <div className="space-y-2">
            {automationRuns.length === 0 ? (
              <div className="text-xs text-gray-500">Sin ejecuciones de scheduler disponibles.</div>
            ) : (
              automationRuns.slice(0, 4).map((run) => (
                <div key={run.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-2 py-1.5">
                  <div className="text-xs text-gray-800 inline-flex items-center gap-2">
                    <span className="font-semibold">{formatJobLabel(run.job)}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getRunStatusChip(run.status)}`}>
                      {run.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600">{formatRunMetrics(run)} · duración {formatRunDuration(run.durationMs)} · {formatRelative(run.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#0B2545] font-semibold mb-3">
            <FiTarget /> Política de enrutamiento
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {modeOptions.map((option) => {
              const active = routingMode === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => saveRoutingMode(option.value)}
                  disabled={savingMode}
                  className={`text-left rounded-lg border p-3 transition ${active ? 'border-[#00A676] bg-[#00A676]/5' : 'border-gray-200 hover:border-gray-300'} disabled:opacity-60`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#0B2545]">{option.label}</div>
                    {active && <FiCheckCircle className="text-[#00A676]" />}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{option.hint}</div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#0B2545] font-semibold mb-3">
            <FiActivity /> Cola de prioridad inmediata (Top 3)
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {topThree.length === 0 ? (
              <div className="text-sm text-gray-500">Sin leads de alta prioridad en cola.</div>
            ) : (
              topThree.map((lead) => (
                <div key={lead.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[#0B2545]">{lead.buyerName || 'Lead sin nombre'}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${lead.sla.color === 'green' ? 'bg-green-100 text-green-700' : lead.sla.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {lead.sla.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{lead.city || 'n/d'} {lead.sector ? `• ${lead.sector}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">{lead.type} • urgencia {lead.urgencyScore}</div>
                  <div className="text-xs text-gray-500">{lead.propertyType || 'propiedad'} • {lead.ageHours}h</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="font-semibold text-[#0B2545] mb-2">Reglas de reasignación</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className={`rounded-lg border p-3 ${reassignmentPolicy.manualReassignEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              Reasignación manual: <strong>{reassignmentPolicy.manualReassignEnabled ? 'ACTIVO' : 'INACTIVO'}</strong>
            </div>
            <div className={`rounded-lg border p-3 ${reassignmentPolicy.suggestNewAssigneeEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              Sugerir nuevo asignado: <strong>{reassignmentPolicy.suggestNewAssigneeEnabled ? 'ACTIVO' : 'INACTIVO'}</strong>
            </div>
            <div className={`rounded-lg border p-3 ${reassignmentPolicy.brokerFallbackEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              Respaldo de broker: <strong>{reassignmentPolicy.brokerFallbackEnabled ? 'ACTIVO' : 'INACTIVO'}</strong>
            </div>
            <div className={`rounded-lg border p-3 ${reassignmentPolicy.escalationLogEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              Entrada de log de escalada: <strong>{reassignmentPolicy.escalationLogEnabled ? 'ACTIVO' : 'INACTIVO'}</strong>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0B2545] font-semibold mb-3">
              <FiZap /> Vista previa de escalada
            </div>
            <button
              onClick={() => setPreviewEscalation(!previewEscalation)}
              className="text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
            >
              {previewEscalation ? 'Ocultar' : 'Vista previa'}
            </button>
          </div>
          
          {previewEscalation && escalationPreviewStats && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="text-xs uppercase tracking-wide text-red-700 font-semibold">Escalarán ahora</div>
                <div className="text-2xl font-bold text-red-900 mt-1">{escalationPreviewStats.willEscalate}</div>
                <div className="text-xs text-red-600 mt-1">Ya incumplieron la ventana SLA</div>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="text-xs uppercase tracking-wide text-orange-700 font-semibold">En riesgo</div>
                <div className="text-2xl font-bold text-orange-900 mt-1">{escalationPreviewStats.atRisk}</div>
                <div className="text-xs text-orange-600 mt-1">Menos de 30 minutos restantes</div>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="text-xs uppercase tracking-wide text-green-700 font-semibold">En tiempo</div>
                <div className="text-2xl font-bold text-green-900 mt-1">{escalationPreviewStats.total - escalationPreviewStats.willEscalate - escalationPreviewStats.atRisk}</div>
                <div className="text-xs text-green-600 mt-1">Aún dentro del SLA</div>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="font-semibold text-[#0B2545] flex items-center gap-2"><FiClock /> Cola de leads entrantes (Sin asignar)</div>
            <div className="text-xs text-gray-500">Decisión manual con sugerencias clasificadas</div>
          </div>

          {selectedLeadIds.size > 0 && (
            <div className="px-5 py-3 border-b border-amber-200 bg-amber-50 flex items-center justify-between">
              <div className="text-sm font-semibold text-amber-800">{selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? 's' : ''} seleccionado{selectedLeadIds.size !== 1 ? 's' : ''}</div>
              <button
                onClick={() => {
                  if (bulkAssignmentLeads.length > 0) {
                    setBulkAssignMode(true)
                  }
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              >
                Asignación masiva
              </button>
            </div>
          )}

          {bulkAssignMode && bulkAssignmentLeads.length > 0 && (
            <div className="px-5 py-4 border-b border-green-200 bg-green-50">
              <div className="text-sm font-semibold text-green-900 mb-3">
                Asignar {bulkAssignmentLeads.length} lead{bulkAssignmentLeads.length !== 1 ? 's' : ''} a:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Array.from(new Map(
                  bulkAssignmentLeads.flatMap(l => l.suggestions).map(s => [s.agentId, s])
                ).values()).slice(0, 6).map((agent) => (
                  <button
                    key={agent.agentId}
                    onClick={() => bulkAssignToAgent(agent)}
                    disabled={savingMode}
                    className="text-left px-3 py-2 rounded-lg border border-green-300 bg-white hover:bg-green-50 text-sm"
                  >
                    <div className="font-semibold text-[#0B2545]">{agent.agentName}</div>
                    <div className="text-xs text-gray-600">Ajuste {agent.fitScore} • Carga {agent.activeLoad} • Conv {agent.conversionRate}%</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setBulkAssignMode(false)
                  setBulkAssignAgent(null)
                }}
                className="mt-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.size === stream.length && stream.length > 0}
                      onChange={selectAllVisibleLeads}
                      className="rounded border-gray-300"
                      aria-label="Seleccionar todos los leads visibles"
                      title="Seleccionar todos los leads visibles para acción masiva"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Lead</th>
                  <th className="px-4 py-3 text-left">Contexto</th>
                  <th className="px-4 py-3 text-left">SLA</th>
                  <th className="px-4 py-3 text-left">Urgencia</th>
                  <th className="px-4 py-3 text-left">Sugerencias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Cargando cola de leads...</td>
                  </tr>
                ) : stream.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Sin leads pendientes de asignación.</td>
                  </tr>
                ) : (
                  stream.map((lead) => {
                    const slaTimer = calculateSLATimer(lead.ageHours, escalationHours)
                    return (
                      <tr key={lead.id} className={selectedLeadIds.has(lead.id) ? 'bg-amber-50' : ''}>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            className="rounded border-gray-300"
                            aria-label={`Seleccionar lead ${lead.buyerName || 'sin nombre'}`}
                            title={`Seleccionar ${lead.buyerName || 'este lead'} para acción masiva`}
                          />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-[#0B2545]">{lead.buyerName || 'Lead sin nombre'}</div>
                          <div className="text-xs text-gray-600">{lead.buyerEmail || 'sin email'}</div>
                          {lead.buyerPhone && <div className="text-xs text-gray-500">{lead.buyerPhone}</div>}
                          <div className="text-xs text-gray-400 mt-1">ID: {lead.id.slice(0, 8)}...</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="text-sm text-gray-700">{lead.type || 'solicitud'} • {lead.source || 'origen'}</div>
                          <div className="text-xs text-gray-500 mt-1">{lead.city || 'n/d'} {lead.sector ? `• ${lead.sector}` : ''}</div>
                          <div className="text-xs text-gray-500">{lead.propertyType || 'propiedad'} • {lead.ageHours}h</div>
                          {lead.escalated && (
                            <span className={`inline-flex mt-1 text-[11px] px-2 py-0.5 rounded-full ${lead.escalationLevel === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                              Escalado ({lead.escalationLevel})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            <div className={`text-sm font-bold ${slaTimer.isRed ? 'text-red-700' : 'text-green-700'}`}>
                              {formatSLATimer(slaTimer.timeRemaining)}
                            </div>
                            <div className={`h-1.5 rounded-full ${slaTimer.isRed ? 'bg-red-500 w-4' : slaTimer.percentage > 75 ? 'bg-green-500 w-16' : slaTimer.percentage > 50 ? 'bg-green-500 w-12' : 'bg-yellow-500 w-8'}`} />
                            <div className="text-xs text-gray-500">ventana de {escalationHours}h</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="text-sm font-semibold text-[#0B2545] inline-flex items-center gap-1">
                            <FiZap className="text-orange-500" /> {lead.urgencyScore}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            {(lead.suggestions || []).map((suggestion, idx) => (
                              <div key={`${lead.id}-${suggestion.agentId}`} className="border border-gray-200 rounded-lg p-2">
                                <div className="text-xs font-semibold text-[#0B2545]">#{idx + 1} {suggestion.agentName}</div>
                                <div className="text-[11px] text-gray-600">
                                  Ajuste {suggestion.fitScore} • Carga {suggestion.activeLoad} • Conv {suggestion.conversionRate}% • Activo {suggestion.hoursSinceActive}h
                                </div>
                                {suggestion.brokerage && (
                                  <div className="text-[11px] text-gray-500">{suggestion.brokerage}</div>
                                )}
                                <button
                                  onClick={() => assignToSuggestion(lead, suggestion)}
                                  disabled={assigningLeadId === lead.id}
                                  className="mt-2 px-2.5 py-1.5 text-xs rounded-md bg-[#0B2545] text-white hover:bg-[#143a66] disabled:opacity-60"
                                >
                                  Asignar a este perfil
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

