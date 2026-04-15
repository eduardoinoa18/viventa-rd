'use client'

import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiCheckSquare, FiTarget, FiHome, FiClock, FiTrendingUp } from 'react-icons/fi'
import PageHeader from '@/components/ui/PageHeader'
import { KpiGrid, KpiCard } from '@/components/ui/KpiCard'
import WorkspaceCommandCenter from '@/components/WorkspaceCommandCenter'

type SummaryState = {
  myListings: number
  officeListings: number
  marketListings: number
  leadsAssigned: number
  leadsWon: number
  avgResponseMinutes: number
  newLeadsLast30Days: number
}

export default function AgentOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<SummaryState>({
    myListings: 0,
    officeListings: 0,
    marketListings: 0,
    leadsAssigned: 0,
    leadsWon: 0,
    avgResponseMinutes: 0,
    newLeadsLast30Days: 0,
  })
  const [taskHealth, setTaskHealth] = useState({ total: 0, pending: 0, inProgress: 0, overdue: 0, automationOpen: 0 })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const [myRes, officeRes, marketRes, agentOverviewRes, tasksRes] = await Promise.all([
          fetch('/api/broker/listings/my?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/office?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/market?status=active', { cache: 'no-store' }),
          fetch('/api/agent/dashboard/overview', { cache: 'no-store' }),
          fetch('/api/agent/tasks?limit=100', { cache: 'no-store' }),
        ])

        const [myJson, officeJson, marketJson, overviewJson, tasksJson] = await Promise.all([
          myRes.json().catch(() => ({})),
          officeRes.json().catch(() => ({})),
          marketRes.json().catch(() => ({})),
          agentOverviewRes.json().catch(() => ({})),
          tasksRes.json().catch(() => ({})),
        ])

        if (!active) return

        const profileSummary = overviewJson?.summary || {}
        setSummary({
          myListings: Array.isArray(myJson?.listings) ? myJson.listings.length : 0,
          officeListings: Array.isArray(officeJson?.listings) ? officeJson.listings.length : 0,
          marketListings: Array.isArray(marketJson?.listings) ? marketJson.listings.length : 0,
          leadsAssigned: Number(profileSummary.leadsAssigned || 0),
          leadsWon: Number(profileSummary.leadsWon || 0),
          avgResponseMinutes: Number(profileSummary.avgResponseMinutes || 0),
          newLeadsLast30Days: Number(profileSummary.newLeadsLast30Days || 0),
        })

        // Task health
        const allTasks: Array<Record<string, any>> = Array.isArray(tasksJson?.tasks) ? tasksJson.tasks : []
        const nowMs = Date.now()
        setTaskHealth({
          total: allTasks.length,
          pending: allTasks.filter((t) => t.status === 'pending').length,
          inProgress: allTasks.filter((t) => t.status === 'in_progress').length,
          overdue: allTasks.filter((t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt).getTime() < nowMs).length,
          automationOpen: allTasks.filter((t) => t.source === 'deal_automation' && t.status !== 'done').length,
        })
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudo cargar el overview del agente')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        eyebrow="Agent Workspace"
        title="Overview"
        description="Tu pipeline de leads, listados y comisiones"
        actions={[
          { label: '+ Create Listing', href: '/dashboard/listings/create' },
          { label: 'View CRM', href: '/dashboard/agent/crm', variant: 'secondary' },
        ]}
      />

      <WorkspaceCommandCenter
        eyebrow="Agent Command Center"
        title="Enfoca tu dia en velocidad comercial y seguimiento impecable"
        description="Tu ventaja en RD depende de responder rapido, mover leads con criterio y mantener claridad entre inventario, tareas y cierres activos."
        highlightLabel="Leads activos"
        highlightValue={summary.leadsAssigned}
        highlightDetail={`${summary.newLeadsLast30Days} nuevos en los ultimos 30 dias`}
        marketNote="Cuando la demanda se acelera, el agente que convierte no es el que recibe mas leads: es el que responde antes, hace mejor follow-up y presenta inventario con contexto local."
        priorities={[
          { label: 'Respuesta promedio', value: `${summary.avgResponseMinutes} min`, hint: 'Tiempo medio de reaccion', tone: summary.avgResponseMinutes <= 15 ? 'good' : summary.avgResponseMinutes <= 45 ? 'warn' : 'urgent' },
          { label: 'Leads ganados', value: summary.leadsWon, hint: 'Negocios ya convertidos', tone: summary.leadsWon > 0 ? 'good' : 'neutral' },
          { label: 'Inventario propio', value: summary.myListings, hint: 'Propiedades activas en tu cartera', tone: summary.myListings > 0 ? 'good' : 'warn' },
          { label: 'Tareas vencidas', value: taskHealth.overdue, hint: 'Seguimientos que requieren atencion', tone: taskHealth.overdue > 0 ? 'urgent' : 'good' },
        ]}
        quickActions={[
          { label: 'Crear propiedad', href: '/dashboard/listings/create' },
          { label: 'Abrir CRM', href: '/dashboard/agent/crm' },
          { label: 'Ver tareas', href: '/dashboard/agent/tasks' },
          { label: 'Ver negocios', href: '/dashboard/agent/deals' },
        ]}
      />

      <KpiGrid cols={4}>
        <KpiCard label="Leads Assigned"      value={summary.leadsAssigned}     icon={<FiTarget />}    accent loading={loading} />
        <KpiCard label="New Leads (30d)"     value={summary.newLeadsLast30Days} icon={<FiTrendingUp />} loading={loading} />
        <KpiCard label="Active Listings"     value={summary.myListings}         icon={<FiHome />}       loading={loading} />
        <KpiCard label="Avg Response"        value={`${summary.avgResponseMinutes} min`} icon={<FiClock />}  loading={loading} />
      </KpiGrid>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#0B2545]">Detalles</h3>
        {loading ? (
          <div className="space-y-2">
            {[1,2].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Metric label="Office Listings"  value={summary.officeListings} />
            <Metric label="Market Listings"  value={summary.marketListings} />
            <Metric label="Leads Ganados"    value={summary.leadsWon} />
            <Metric label="Resp. Promedio"   value={`${summary.avgResponseMinutes} min`} />
          </div>
        )}
        {!loading && summary.leadsAssigned === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm font-medium text-gray-500">No tienes leads asignados todavía</p>
            <p className="mt-1 text-xs text-gray-400">Cuando se te asignen leads apareceran aquí.</p>
          </div>
        )}
      </section>

      {/* Task Health */}
      <section className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0B2545]">My Tasks</h3>
          <a href="/dashboard/agent/tasks" className="text-xs font-medium text-[#00A676] hover:underline">
            Ir a Tasks →
          </a>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Metric label="Total Tasks"     value={taskHealth.total} />
          <Metric label="Pending"         value={taskHealth.pending} />
          <Metric label="In Progress"     value={taskHealth.inProgress} />
          <Metric label="Overdue"         value={taskHealth.overdue} />
          <Metric label="Automation Open" value={taskHealth.automationOpen} />
        </div>
        {(taskHealth.overdue > 0 || taskHealth.automationOpen > 0) && !loading ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {taskHealth.overdue > 0 ? (
              <a
                href="/dashboard/agent/tasks?status=all"
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                <FiAlertTriangle className="h-3 w-3" />
                {taskHealth.overdue} vencidas
              </a>
            ) : null}
            {taskHealth.automationOpen > 0 ? (
              <a
                href="/dashboard/agent/tasks?status=pending"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
              >
                <FiCheckSquare className="h-3 w-3" />
                {taskHealth.automationOpen} automatizadas abiertas
              </a>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-[#0B2545]">{value}</div>
    </div>
  )
}
