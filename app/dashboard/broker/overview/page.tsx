'use client'

import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiCheckSquare, FiTrendingUp, FiHome, FiDollarSign, FiCalendar, FiMail, FiUsers } from 'react-icons/fi'
import PageHeader from '@/components/ui/PageHeader'
import { KpiGrid, KpiCard } from '@/components/ui/KpiCard'
import InviteModal from '@/components/InviteModal'
import WorkspaceCommandCenter from '@/components/WorkspaceCommandCenter'
import type { RevenueMetrics, TopBrokerRevenueRow } from '@/lib/domain/transaction'

type SummaryState = {
  myListings: number
  officeListings: number
  marketListings: number
  autoAssignable: number
  overdue: number
  followUpDue: number
  pipeline: number
  projectedValue: number
} & RevenueMetrics

type OfficeProfile = {
  id: string
  name?: string
  officeCode?: string
  brokerageName?: string
  city?: string
  province?: string
  status?: string
  subscription?: {
    plan?: string
    status?: string
    agentsLimit?: number
    listingsLimit?: number
    seatsUsed?: number
    currentPeriodEnd?: string | null
  }
}

type ActivitySummary = {
  unreadNotifications: number
  unreadActivity: number
  todayDealsOpened: number
  todayReservations: number
  todayDocuments: number
  todayTransactions: number
}

type TaskHealth = {
  total: number
  pending: number
  inProgress: number
  overdue: number
  automationOpen: number
}

type TeamSummary = {
  totalMembers: number
  activeMembers: number
  pendingMembers: number
}

export default function BrokerOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [office, setOffice] = useState<OfficeProfile | null>(null)
  const [summary, setSummary] = useState<SummaryState>({
    myListings: 0,
    officeListings: 0,
    marketListings: 0,
    autoAssignable: 0,
    overdue: 0,
    followUpDue: 0,
    pipeline: 0,
    projectedValue: 0,
    officePipelineValue: 0,
    expectedCommission: 0,
    dealsClosingThisMonth: 0,
    activeDeals: 0,
  })
  const [topBrokers, setTopBrokers] = useState<TopBrokerRevenueRow[]>([])
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    unreadNotifications: 0,
    unreadActivity: 0,
    todayDealsOpened: 0,
    todayReservations: 0,
    todayDocuments: 0,
    todayTransactions: 0,
  })
  const [teamSummary, setTeamSummary] = useState<TeamSummary>({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
  })
  const [taskHealth, setTaskHealth] = useState<TaskHealth>({
    total: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    automationOpen: 0,
  })
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const [myRes, officeRes, marketRes, automationRes, txRes, officeProfileRes, revenueRes, activitySummaryRes, teamRes, tasksRes] = await Promise.all([
          fetch('/api/broker/listings/my?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/office?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/market?status=active', { cache: 'no-store' }),
          fetch('/api/broker/leads/automation', { cache: 'no-store' }),
          fetch('/api/broker/transactions', { cache: 'no-store' }),
          fetch('/api/broker/office', { cache: 'no-store' }),
          fetch('/api/broker/analytics/revenue', { cache: 'no-store' }),
          fetch('/api/activity-events/summary', { cache: 'no-store' }),
          fetch('/api/broker/team', { cache: 'no-store' }),
          fetch('/api/broker/crm/tasks?limit=200', { cache: 'no-store' }),
        ])

        const [myJson, officeJson, marketJson, automationJson, txJson, officeProfileJson, revenueJson, activitySummaryJson, teamJson, tasksJson] = await Promise.all([
          myRes.json().catch(() => ({})),
          officeRes.json().catch(() => ({})),
          marketRes.json().catch(() => ({})),
          automationRes.json().catch(() => ({})),
          txRes.json().catch(() => ({})),
          officeProfileRes.json().catch(() => ({})),
          revenueRes.json().catch(() => ({})),
          activitySummaryRes.json().catch(() => ({})),
          teamRes.json().catch(() => ({})),
          tasksRes.json().catch(() => ({})),
        ])

        if (!active) return

        setSummary({
          myListings: Array.isArray(myJson?.listings) ? myJson.listings.length : 0,
          officeListings: Array.isArray(officeJson?.listings) ? officeJson.listings.length : 0,
          marketListings: Array.isArray(marketJson?.listings) ? marketJson.listings.length : 0,
          autoAssignable: Number(automationJson?.data?.autoAssignable || 0),
          overdue: Number(automationJson?.data?.overdue || 0),
          followUpDue: Number(automationJson?.data?.followUpDue || 0),
          pipeline: Number(txJson?.summary?.totalPipeline || 0),
          projectedValue: Number(txJson?.summary?.projectedValue || 0),
          officePipelineValue: Number(revenueJson?.metrics?.officePipelineValue || 0),
          expectedCommission: Number(revenueJson?.metrics?.expectedCommission || 0),
          dealsClosingThisMonth: Number(revenueJson?.metrics?.dealsClosingThisMonth || 0),
          activeDeals: Number(revenueJson?.metrics?.activeDeals || 0),
        })

        setTopBrokers(Array.isArray(revenueJson?.topBrokers) ? revenueJson.topBrokers : [])
        setActivitySummary({
          unreadNotifications: Number(activitySummaryJson?.summary?.unreadNotifications || 0),
          unreadActivity: Number(activitySummaryJson?.summary?.unreadActivity || 0),
          todayDealsOpened: Number(activitySummaryJson?.summary?.todayDealsOpened || 0),
          todayReservations: Number(activitySummaryJson?.summary?.todayReservations || 0),
          todayDocuments: Number(activitySummaryJson?.summary?.todayDocuments || 0),
          todayTransactions: Number(activitySummaryJson?.summary?.todayTransactions || 0),
        })
        setTeamSummary({
          totalMembers: Number(teamJson?.summary?.totalMembers || 0),
          activeMembers: Number(teamJson?.summary?.activeMembers || 0),
          pendingMembers: Number(teamJson?.summary?.pendingMembers || 0),
        })

        // Compute task health from task list
        const allTasks: Array<Record<string, any>> = Array.isArray(tasksJson?.tasks) ? tasksJson.tasks : []
        const nowMs = Date.now()
        setTaskHealth({
          total: allTasks.length,
          pending: allTasks.filter((t) => t.status === 'pending').length,
          inProgress: allTasks.filter((t) => t.status === 'in_progress').length,
          overdue: allTasks.filter((t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt).getTime() < nowMs).length,
          automationOpen: allTasks.filter((t) => t.source === 'deal_automation' && t.status !== 'done').length,
        })

        if (officeProfileRes.ok && officeProfileJson?.ok) {
          setOffice((officeProfileJson?.office || null) as OfficeProfile | null)
        } else {
          setOffice(null)
        }
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudo cargar el overview')
        setOffice(null)
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
        eyebrow="Workspace del Bróker"
        title="Resumen"
        description="Métricas de rendimiento, crecimiento del equipo y pipeline de tu oficina"
        actions={[
          { label: '+ Crear negocio', href: '/dashboard/broker/crm' },
          { label: 'Ver listados', href: '/dashboard/listings', variant: 'secondary' },
          { label: 'Equipo e invitaciones', href: '/dashboard/broker/team', variant: 'secondary' },
          { label: 'Invitar agente', onClick: () => setShowInviteModal(true) },
        ]}
      />

      <WorkspaceCommandCenter
        eyebrow="Command Center Bróker"
        title="Coordina inventario, equipo y pipeline como una oficina premium"
        description="Este resumen prioriza lo que mueve ingresos en una oficina dominicana de alto desempeno: cobertura de inventario, cumplimiento operativo y velocidad para convertir leads en cierres."
        highlightLabel="Comision esperada"
        highlightValue={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(summary.expectedCommission || 0)}
        highlightDetail={`${summary.activeDeals} deals activos y ${summary.dealsClosingThisMonth} cierres esperados este mes`}
        marketNote="La ventaja de un broker no viene solo del volumen; viene de alinear inventario, tareas automaticas, cobertura del equipo y respuesta comercial antes que la competencia."
        priorities={[
          { label: 'Deals activos', value: summary.activeDeals, hint: 'Negocios en pipeline ahora mismo', tone: summary.activeDeals > 0 ? 'good' : 'warn' },
          { label: 'SLA vencido', value: summary.overdue, hint: 'Leads con riesgo de fuga', tone: summary.overdue > 0 ? 'urgent' : 'good' },
          { label: 'Equipo activo', value: teamSummary.activeMembers, hint: `${teamSummary.totalMembers} miembros totales`, tone: teamSummary.activeMembers > 0 ? 'good' : 'warn' },
          { label: 'Tareas vencidas', value: taskHealth.overdue, hint: `${taskHealth.automationOpen} abiertas por automatizacion`, tone: taskHealth.overdue > 0 ? 'urgent' : taskHealth.automationOpen > 0 ? 'warn' : 'good' },
        ]}
        quickActions={[
          { label: 'Crear deal', href: '/dashboard/broker/crm' },
          { label: 'Abrir CRM', href: '/dashboard/broker/crm' },
          { label: 'Gestionar equipo', href: '/dashboard/broker/team' },
          { label: 'Ver tareas', href: '/dashboard/broker/crm' },
        ]}
      />

      {/* KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard label="Negocios activos"         value={summary.activeDeals}          icon={<FiTrendingUp />} accent loading={loading} />
        <KpiCard label="Listados activos"      value={summary.myListings}           icon={<FiHome />}       loading={loading} />
        <KpiCard label="Comisión esperada"  value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(summary.expectedCommission || 0)} icon={<FiDollarSign />} loading={loading} />
        <KpiCard label="Cierres este mes"   value={summary.dealsClosingThisMonth} icon={<FiCalendar />}  loading={loading} />
      </KpiGrid>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {/* Secondary metrics */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#0B2545]">Desglose del pipeline</h3>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Metric label="Listados de oficina"   value={summary.officeListings} />
          <Metric label="Listados de mercado"   value={summary.marketListings} />
          <Metric label="Auto-Asignables"   value={summary.autoAssignable} />
          <Metric label="SLA Vencido"       value={summary.overdue} />
          <Metric label="Seguimientos vencidos"     value={summary.followUpDue} />
          <Metric label="Valor del pipeline"    value={summary.pipeline} />
          <Metric label="Proyección"        value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(summary.projectedValue || 0)} />
          <Metric label="Pipeline de oficina"   value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(summary.officePipelineValue || 0)} />
        </div>
      </section>

      {/* Task Health */}
      <section className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0B2545]">Salud de tareas</h3>
          <a href="/dashboard/broker/tasks" className="text-xs font-medium text-[#00A676] hover:underline">
            Ir a tareas →
          </a>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Metric label="Total"   value={taskHealth.total} />
          <Metric label="Pendientes"       value={taskHealth.pending} />
          <Metric label="En progreso"   value={taskHealth.inProgress} />
          <Metric label="Vencidas"       value={taskHealth.overdue} />
          <Metric label="Automatizadas abiertas" value={taskHealth.automationOpen} />
        </div>
        {(taskHealth.overdue > 0 || taskHealth.automationOpen > 0) && !loading ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {taskHealth.overdue > 0 ? (
              <a
                href="/dashboard/broker/tasks?status=all"
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                <FiAlertTriangle className="h-3 w-3" />
                {taskHealth.overdue} vencidas
              </a>
            ) : null}
            {taskHealth.automationOpen > 0 ? (
              <a
                href="/dashboard/broker/tasks?status=pending"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
              >
                <FiCheckSquare className="h-3 w-3" />
                {taskHealth.automationOpen} automatizadas abiertas
              </a>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mt-4 rounded-xl border border-[#0B2545]/10 bg-gradient-to-r from-[#F6FBFF] to-[#F0FBF6] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00A676]">Crecimiento del equipo</p>
            <h3 className="mt-2 text-lg font-bold text-[#0B2545]">Haz crecer tu oficina desde el overview</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Invita agentes, monitorea onboarding pendiente y mantén la estructura activa sin salir del panel principal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center rounded-lg bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#134074]"
            >
              Invitar agente
            </button>
            <a
              href="/dashboard/broker/team"
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#0B2545] hover:bg-gray-50"
            >
              Ver equipo
            </a>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/80 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-[#0B2545]"><FiUsers className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">Estructura</span></div>
            <div className="mt-2 text-3xl font-bold text-[#0B2545]">{teamSummary.totalMembers}</div>
            <p className="mt-1 text-xs text-gray-600">Miembros vinculados a la oficina</p>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-[#0B2545]"><FiUsers className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">Activos</span></div>
            <div className="mt-2 text-3xl font-bold text-[#0B2545]">{teamSummary.activeMembers}</div>
            <p className="mt-1 text-xs text-gray-600">Agentes listos para publicar y colaborar</p>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-[#0B2545]"><FiMail className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">Pendientes</span></div>
            <div className="mt-2 text-3xl font-bold text-[#0B2545]">{teamSummary.pendingMembers}</div>
            <p className="mt-1 text-xs text-gray-600">Invitaciones enviadas y onboarding abierto</p>
          </div>
        </div>
      </section>

      {/* Activity summary */}
      <section className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#0B2545]">Actividad de hoy</h3>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-6">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">🔔 Notificaciones: <span className="font-semibold text-[#0B2545]">{activitySummary.unreadNotifications}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">⚡ Actividad: <span className="font-semibold text-[#0B2545]">{activitySummary.unreadActivity}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">Negocios: <span className="font-semibold text-[#0B2545]">{activitySummary.todayDealsOpened}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">Reservas: <span className="font-semibold text-[#0B2545]">{activitySummary.todayReservations}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">Documentos: <span className="font-semibold text-[#0B2545]">{activitySummary.todayDocuments}</span></div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">Transacciones: <span className="font-semibold text-[#0B2545]">{activitySummary.todayTransactions}</span></div>
        </div>
      </section>

      {/* Office subscription */}
      {office ? (
        <section className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-[#0B2545]">Suscripción de oficina</h3>
          <div className="text-sm font-semibold text-[#0B2545]">{office.name || 'Office'} ({office.officeCode || 'N/A'})</div>
          <div className="mt-0.5 text-xs text-gray-500">{office.brokerageName || 'Sin brokerage'} • {office.city || '—'}{office.province ? `, ${office.province}` : ''}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <Metric label="Plan"     value={office.subscription?.plan || 'basic'} />
            <Metric label="Estado"   value={office.subscription?.status || 'active'} />
            <Metric label="Agentes"   value={`${Number(office.subscription?.seatsUsed || 0)} / ${Number(office.subscription?.agentsLimit || 0)}`} />
            <Metric label="Listados" value={Number(office.subscription?.listingsLimit || 0)} />
          </div>
        </section>
      ) : null}

      {/* Top brokers */}
      <section className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#0B2545]">Top brokers por comisión</h3>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : topBrokers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-400">No hay brokers con datos todavía.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topBrokers.map((broker) => (
              <div key={broker.userId} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
                <div className="font-semibold text-[#0B2545]">{broker.name}</div>
                <div className="mt-1 text-gray-500">
                  Deals: {broker.deals} · Pipeline: {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(broker.pipelineValue || 0))} · Expected: {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(broker.expectedCommission || 0))} · Closed: {broker.closedDeals}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showInviteModal ? (
        <InviteModal
          inviteType="agent"
          onClose={() => setShowInviteModal(false)}
        />
      ) : null}
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
