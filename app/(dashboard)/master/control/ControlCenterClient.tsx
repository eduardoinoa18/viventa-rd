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
  suggestions: Suggestion[]
}

export default function ControlCenterClient() {
  const [loading, setLoading] = useState(true)
  const [savingMode, setSavingMode] = useState(false)
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null)
  const [stream, setStream] = useState<ControlLead[]>([])
  const [queueStats, setQueueStats] = useState({ total: 0, red: 0, yellow: 0, green: 0, avgUrgency: 0 })
  const [routingMode, setRoutingMode] = useState<RoutingMode>('manual_only')

  const loadControlCenter = useCallback(async () => {
    try {
      setLoading(true)
      const [streamRes, settingsRes] = await Promise.all([
        fetch('/api/admin/control/stream?status=unassigned&limit=80'),
        fetch('/api/admin/settings'),
      ])

      const streamJson = await streamRes.json().catch(() => ({}))
      const settingsJson = await settingsRes.json().catch(() => ({}))

      if (!streamRes.ok || !streamJson?.ok) {
        throw new Error(streamJson?.error || 'No se pudo cargar el stream de leads')
      }

      setStream(Array.isArray(streamJson?.data?.stream) ? streamJson.data.stream : [])
      setQueueStats(streamJson?.data?.queueStats || { total: 0, red: 0, yellow: 0, green: 0, avgUrgency: 0 })

      const mode = settingsJson?.data?.controlRoutingMode as RoutingMode | undefined
      if (mode) setRoutingMode(mode)
    } catch (error: any) {
      console.error('control center load error', error)
      toast.error(error?.message || 'No se pudo cargar el Control Center')
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
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo guardar el routing mode')
      }

      setRoutingMode(nextMode)
      toast.success('Routing mode actualizado')
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
      const note = `Assigned from Control Center (${routingMode}). Fit=${suggestion.fitScore}, Load=${suggestion.activeLoad}, Conv=${suggestion.conversionRate}%`

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
      toast.error(error?.message || 'Error asignando lead')
    } finally {
      setAssigningLeadId(null)
    }
  }, [loadControlCenter, routingMode])

  const topThree = useMemo(() => stream.slice(0, 3), [stream])

  const modeOptions: Array<{ value: RoutingMode; label: string; hint: string }> = [
    { value: 'manual_only', label: 'Manual only', hint: 'Master decide cada asignación.' },
    { value: 'auto_brokerage', label: 'Auto-assign to brokerage', hint: 'Preparado para enrutar por brokerage.' },
    { value: 'auto_top_agent', label: 'Auto-assign to top agent', hint: 'Preparado para usar top score del sistema.' },
    { value: 'rotation_mode', label: 'Rotation mode', hint: 'Preparado para round-robin operativo.' },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545]">Control Center</h1>
            <p className="text-sm text-gray-600 mt-1">Centro de decisión operacional para lead routing en tiempo real.</p>
          </div>
          <button
            onClick={loadControlCenter}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-100 disabled:opacity-60"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">Incoming</div>
            <div className="text-3xl font-bold text-[#0B2545] mt-1">{queueStats.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-green-700">SLA Green</div>
            <div className="text-3xl font-bold text-green-800 mt-1">{queueStats.green}</div>
          </div>
          <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-yellow-700">SLA Yellow</div>
            <div className="text-3xl font-bold text-yellow-800 mt-1">{queueStats.yellow}</div>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-red-700">SLA Red</div>
            <div className="text-3xl font-bold text-red-800 mt-1">{queueStats.red}</div>
          </div>
          <div className="bg-white rounded-xl border border-[#0B2545]/20 p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-[#0B2545]">Avg Urgency</div>
            <div className="text-3xl font-bold text-[#0B2545] mt-1">{queueStats.avgUrgency}</div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#0B2545] font-semibold mb-3">
            <FiTarget /> Broker Routing Mode
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
            <FiActivity /> Prioridad inmediata (Top 3)
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {topThree.length === 0 ? (
              <div className="text-sm text-gray-500">No hay leads en cola.</div>
            ) : (
              topThree.map((lead) => (
                <div key={lead.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[#0B2545]">{lead.buyerName || 'Lead sin nombre'}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${lead.sla.color === 'green' ? 'bg-green-100 text-green-700' : lead.sla.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {lead.sla.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{lead.city || 'N/A'} {lead.sector ? `• ${lead.sector}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">{lead.type} • urgencia {lead.urgencyScore}</div>
                  <div className="text-xs text-gray-500">{lead.propertyType || 'property'} • {lead.ageHours}h</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="font-semibold text-[#0B2545] flex items-center gap-2"><FiClock /> Incoming Lead Stream (unassigned)</div>
            <div className="text-xs text-gray-500">Master decide • sistema sugiere</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
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
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Cargando stream de leads...</td>
                  </tr>
                ) : stream.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No hay leads pendientes de asignación.</td>
                  </tr>
                ) : (
                  stream.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-4 py-4 align-top">
                        <div className="font-medium text-[#0B2545]">{lead.buyerName || 'Lead sin nombre'}</div>
                        <div className="text-xs text-gray-600">{lead.buyerEmail || 'sin email'}</div>
                        {lead.buyerPhone && <div className="text-xs text-gray-500">{lead.buyerPhone}</div>}
                        <div className="text-xs text-gray-400 mt-1">ID: {lead.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="text-sm text-gray-700">{lead.type || 'request'} • {lead.source || 'source'}</div>
                        <div className="text-xs text-gray-500 mt-1">{lead.city || 'N/A'} {lead.sector ? `• ${lead.sector}` : ''}</div>
                        <div className="text-xs text-gray-500">{lead.propertyType || 'property'} • {lead.ageHours}h</div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`text-xs px-2 py-1 rounded-full ${lead.sla.color === 'green' ? 'bg-green-100 text-green-700' : lead.sla.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {lead.sla.label}
                        </span>
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
                                Fit {suggestion.fitScore} • Load {suggestion.activeLoad} • Conv {suggestion.conversionRate}% • Active {suggestion.hoursSinceActive}h
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
