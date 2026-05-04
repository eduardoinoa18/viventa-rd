'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiUsers, FiHome, FiDollarSign, FiClock, FiUserPlus, FiActivity, FiCheckCircle, FiXCircle, FiMail } from 'react-icons/fi'
import WorkspaceCommandCenter from '@/components/WorkspaceCommandCenter'

export default function MasterOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('month')
  const [stats, setStats] = useState({
    // Property Management KPIs
    totalProperties: 0,
    approvedProperties: 0,
    pendingApprovals: 0,
    rejectedProperties: 0,
    publishedProperties: 0,
    draftProperties: 0,
    thisWeekProperties: 0,
    // User & Engagement Metrics
    totalUsers: 0,
    activeListings: 0,
    monthlyRevenueUSD: 0,
    leads: 0,
    pendingApplications: 0,
    totalAgents: 0,
    totalBrokers: 0,
    newUsers: 0,
    listingsCreated: 0,
    newLeads: 0,
    conversionMetrics: {
      totalViews: 0,
      totalContacts: 0,
      totalLeads: 0,
      viewToContactRate: '0.00%',
      contactToLeadRate: '0.00%',
      window: {
        views: 0,
        contacts: 0,
        leads: 0,
        viewToContactRate: '0.00%',
        contactToLeadRate: '0.00%',
      },
    },
    window: 'all' as 'all'|'day'|'week'|'month',
    // Broker performance & velocity
    topBrokers: [] as Array<{id: string; name: string; leadsThis: number; conversionRate: number; revenue: number}>,
    leadVelocity: [] as Array<{day: string; count: number}>,
    registrationVelocity: [] as Array<{day: string; count: number}>,
    growthMetrics: {
      leadsGrowth: 0,
      usersGrowth: 0,
      revenueGrowth: 0,
      isGrowing: true,
    }
  })
  const [timeWindow, setTimeWindow] = useState<'all'|'day'|'week'|'month'>('all')
  const [activitySummary, setActivitySummary] = useState({
    unreadNotifications: 0,
    unreadActivity: 0,
    todayDealsOpened: 0,
    todayReservations: 0,
    todayDocuments: 0,
    todayTransactions: 0,
  })

  const getUiErrorMessage = (status?: number) => {
    if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente para ver el panel maestro.'
    if (status === 403) return 'No tienes permisos para acceder a este módulo del panel maestro.'
    return 'No se pudo cargar el resumen del panel maestro. Intenta nuevamente.'
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    const url = `/api/admin/stats${timeWindow && timeWindow !== 'all' ? `?window=${timeWindow}` : ''}`
    fetch(url)
      .then(async (r) => {
        const payload = await r.json().catch(() => ({}))
        if (!r.ok || !payload?.ok) {
          throw new Error(payload?.error || getUiErrorMessage(r.status))
        }
        return payload
      })
      .then((statsRes) => {
        if (statsRes?.ok && statsRes.data) {
          const d = statsRes.data
          const agents = d.roleCounts?.agents ?? 0
          const brokers = d.roleCounts?.brokers ?? 0
          setStats({
            // Property counts (from admin stats endpoint)
            totalProperties: (d.activeListings || 0) + (d.pendingApprovals || 0) + (d.rejectedProperties || 0),
            approvedProperties: d.activeListings || 0,
            pendingApprovals: d.pendingApprovals || 0,
            rejectedProperties: d.rejectedProperties || 0,
            publishedProperties: d.activeListings || 0,
            draftProperties: d.draftProperties || 0,
            thisWeekProperties: d.listingsCreated || 0,
            // User metrics
            totalUsers: d.totalUsers || 0,
            activeListings: d.activeListings || 0,
            monthlyRevenueUSD: d.monthlyRevenueUSD || 0,
            leads: d.leads || 0,
            pendingApplications: d.pendingApplications || 0,
            totalAgents: agents,
            totalBrokers: brokers,
            newUsers: d.newUsers || 0,
            listingsCreated: d.listingsCreated || 0,
            newLeads: d.newLeads || 0,
            conversionMetrics: d.conversionMetrics || {
              totalViews: 0,
              totalContacts: 0,
              totalLeads: 0,
              viewToContactRate: '0.00%',
              contactToLeadRate: '0.00%',
              window: {
                views: 0,
                contacts: 0,
                leads: 0,
                viewToContactRate: '0.00%',
                contactToLeadRate: '0.00%',
              },
            },
            window: timeWindow,
            topBrokers: d.topBrokers || [],
            leadVelocity: d.leadVelocity || [],
            registrationVelocity: d.registrationVelocity || [],
            growthMetrics: d.growthMetrics || {
              leadsGrowth: 0,
              usersGrowth: 0,
              revenueGrowth: 0,
              isGrowing: true,
            },
          })
        }
      })
      .catch((e: any) => {
        setError(e?.message || getUiErrorMessage())
      })
      .finally(() => setLoading(false))

    fetch('/api/activity-events/summary', { cache: 'no-store' })
      .then(async (r) => {
        const payload = await r.json().catch(() => ({}))
        if (!r.ok || !payload?.ok) return
        setActivitySummary({
          unreadNotifications: Number(payload?.summary?.unreadNotifications || 0),
          unreadActivity: Number(payload?.summary?.unreadActivity || 0),
          todayDealsOpened: Number(payload?.summary?.todayDealsOpened || 0),
          todayReservations: Number(payload?.summary?.todayReservations || 0),
          todayDocuments: Number(payload?.summary?.todayDocuments || 0),
          todayTransactions: Number(payload?.summary?.todayTransactions || 0),
        })
      })
      .catch(() => {})
  }, [timeWindow])

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0B2545] to-[#00A676] bg-clip-text text-transparent mb-2">
          Master Control Overview
        </h1>
        <p className="text-gray-600">Control total de la red inmobiliaria de la República Dominicana</p>
      </div>
      
      {/* Time window selector */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600 mr-2">Ventana de tiempo:</span>
        {([
          { key: 'all', label: 'All' },
          { key: 'day', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            disabled={loading}
            onClick={() => setTimeWindow(key as any)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${timeWindow===key ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Cargando métricas del panel maestro...
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <WorkspaceCommandCenter
        eyebrow="Master Admin"
        title="Controla la red inmobiliaria dominicana desde una sola consola"
        description="Moderacion, crecimiento, actividad y rendimiento comercial deben leerse juntos. Esta capa ejecutiva te ayuda a atacar primero la friccion que mas afecta confianza, velocidad y expansion de la plataforma."
        highlightLabel="Cola de moderacion"
        highlightValue={stats.pendingApprovals}
        highlightDetail={`${stats.pendingApplications} solicitudes en revision y ${activitySummary.unreadActivity} eventos sin leer`}
        marketNote="Para que VIVENTA se sienta como el referente tecnologico de RD, el panel maestro debe anticipar cuellos de botella operativos antes de que lleguen al usuario, al broker o a la constructora."
        priorities={[
          { label: 'Nuevos leads', value: timeWindow === 'all' ? stats.leads : stats.newLeads, hint: 'Presion comercial en la ventana activa', tone: (timeWindow === 'all' ? stats.leads : stats.newLeads) > 0 ? 'good' : 'neutral' },
          { label: 'Actividad sin leer', value: activitySummary.unreadActivity, hint: 'Operaciones que requieren supervision', tone: activitySummary.unreadActivity > 0 ? 'warn' : 'good' },
          { label: 'Usuarios nuevos', value: stats.newUsers, hint: 'Crecimiento del ecosistema', tone: stats.newUsers > 0 ? 'good' : 'neutral' },
          { label: 'Revenue mensual', value: new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.monthlyRevenueUSD || 0), hint: 'Monetizacion actual', tone: stats.monthlyRevenueUSD > 0 ? 'good' : 'warn' },
        ]}
        quickActions={[
          { label: 'Revisar listados', href: '/master/listings' },
          { label: 'Abrir solicitudes', href: '/master/applications' },
          { label: 'Ver actividad', href: '/master/activity' },
          { label: 'Recomendaciones', href: '/master/recommendations' },
        ]}
      />

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiActivity className="text-[#00A676]" />
          Platform hoy
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Notificaciones sin leer</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.unreadNotifications}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Actividad sin leer</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.unreadActivity}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Negocios abiertos</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.todayDealsOpened}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Reservas</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.todayReservations}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Documentos</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.todayDocuments}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500">Transacciones</div>
            <div className="text-2xl font-bold text-[#0B2545] mt-1">{activitySummary.todayTransactions}</div>
          </div>
        </div>
      </section>

      {/* === PROPERTY MODERATION KPIs (MAIN SECTION) === */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiHome className="text-[#00A676]" />
          Inventario de propiedades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Properties */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Total de propiedades</span>
              <FiHome className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.totalProperties}</div>
            <div className="text-white/70 text-xs mt-2">Todo el inventario</div>
          </div>

          {/* Approved/Active */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Publicadas</span>
              <FiCheckCircle className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.approvedProperties}</div>
            <div className="text-white/70 text-xs mt-2">estado = activo</div>
          </div>

          {/* Pending Approval */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Pendiente de revisión</span>
              <FiClock className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.pendingApprovals}</div>
            <div className="text-white/70 text-xs mt-2">Pendiente de moderación</div>
          </div>

          {/* Rejected */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Rechazadas</span>
              <FiXCircle className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.rejectedProperties}</div>
            <div className="text-white/70 text-xs mt-2">estado = rechazado</div>
          </div>
        </div>

        {/* Second Row: Additional Property Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Draft */}
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Borrador</span>
              <FiHome className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.draftProperties}</div>
            <div className="text-white/70 text-xs mt-2">Listados incompletos</div>
          </div>

          {/* This Week */}
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Esta semana</span>
              <FiActivity className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold">{stats.thisWeekProperties}</div>
            <div className="text-white/70 text-xs mt-2">Nuevas publicaciones</div>
          </div>

          {/* Quick Access */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Acción rápida</span>
              <FiActivity className="text-3xl opacity-80" />
            </div>
            <Link
              href="/master/listings"
              className="inline-block mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors text-sm"
            >
              Cola de revisión →
            </Link>
          </div>
        </div>
      </section>

      {/* Leads & Conversion Metrics */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiActivity className="text-[#00A676]" />
          Leads y conversión
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">{timeWindow==='all' ? 'Total de leads' : 'Nuevos leads'}</span>
              <FiUsers className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{timeWindow==='all' ? stats.leads : stats.newLeads}</div>
            <div className="text-white/70 text-xs">{timeWindow==='all' ? 'Todas las fuentes' : 'Dentro de la ventana seleccionada'}</div>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Vistas de propiedades</span>
              <FiHome className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.conversionMetrics.window.views.toLocaleString()}</div>
            <div className="text-white/70 text-xs">{timeWindow==='all' ? 'Historial completo' : 'Dentro de la ventana seleccionada'}</div>
          </div>
          
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Tasa de contacto</span>
              <FiActivity className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.conversionMetrics.window.viewToContactRate}</div>
            <div className="text-white/70 text-xs">Vistas → Contactos</div>
          </div>
          
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Tasa de leads</span>
              <FiClock className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.conversionMetrics.window.contactToLeadRate}</div>
            <div className="text-white/70 text-xs">Contactos → Leads</div>
          </div>
        </div>
      </section>

      {/* Professional Network */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiUserPlus className="text-[#00A676]" />
          Red de profesionales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Agentes activos</span>
              <FiUserPlus className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.totalAgents}</div>
            <div className="text-white/70 text-xs">Con credenciales emitidas</div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Brokers activos</span>
              <FiUsers className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.totalBrokers}</div>
            <div className="text-white/70 text-xs">Gestionando equipos</div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Solicitudes pendientes</span>
              <FiClock className="text-3xl opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-1">{stats.pendingApplications}</div>
            <div className="text-white/70 text-xs">Pendiente de revisión</div>
          </div>
        </div>
      </section>

      {/* Growth & Performance */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">¿Viventa está creciendo?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className={`rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1 ${stats.growthMetrics.isGrowing ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Estado de la plataforma</span>
              <FiActivity className="text-3xl opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.growthMetrics.isGrowing ? '✓ Creciendo' : '✗ Decreciendo'}</div>
            <div className="text-white/70 text-xs">Salud de la red</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Crecimiento de leads</span>
              <FiUsers className="text-3xl opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.growthMetrics.leadsGrowth > 0 ? '+' : ''}{stats.growthMetrics.leadsGrowth}%</div>
            <div className="text-white/70 text-xs">vs. período anterior</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Crecimiento de usuarios</span>
              <FiUserPlus className="text-3xl opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.growthMetrics.usersGrowth > 0 ? '+' : ''}{stats.growthMetrics.usersGrowth}%</div>
            <div className="text-white/70 text-xs">Total de registros</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">Crecimiento de ingresos</span>
              <FiDollarSign className="text-3xl opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats.growthMetrics.revenueGrowth > 0 ? '+' : ''}{stats.growthMetrics.revenueGrowth}%</div>
            <div className="text-white/70 text-xs">Tendencia mensual</div>
          </div>
        </div>
      </section>

      {/* Top Brokers This Month */}
      {stats.topBrokers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Mejores brokers del mes</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Broker</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Leads este mes</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Tasa de conversión</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wide text-gray-500 font-semibold">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topBrokers.slice(0, 5).map((broker) => (
                  <tr key={broker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-[#0B2545]">{broker.name}</td>
                    <td className="px-6 py-4 text-gray-700">{broker.leadsThis}</td>
                    <td className="px-6 py-4 text-gray-700">{broker.conversionRate}%</td>
                    <td className="px-6 py-4 text-gray-700">${broker.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Lead Velocity & Registration Velocity Charts */}
      {(stats.leadVelocity.length > 0 || stats.registrationVelocity.length > 0) && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Velocidad y momentum</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.leadVelocity.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Velocidad de leads (últimos 7 días)</h3>
                <div className="space-y-3">
                  {stats.leadVelocity.map((day, idx) => {
                    const maxCount = Math.max(...stats.leadVelocity.map(d => d.count), 1)
                    const widthClass = day.count === 0 ? 'w-1' : day.count >= maxCount ? 'w-full' : day.count >= maxCount * 0.75 ? 'w-4/5' : day.count >= maxCount * 0.5 ? 'w-3/5' : day.count >= maxCount * 0.25 ? 'w-2/5' : 'w-1/5'
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-12">{day.day}</span>
                        <div className={`h-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 flex-1 mx-3 ${widthClass}`} />
                        <span className="text-sm font-semibold text-gray-800 w-12 text-right">{day.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {stats.registrationVelocity.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Velocidad de registros (últimos 7 días)</h3>
                <div className="space-y-3">
                  {stats.registrationVelocity.map((day, idx) => {
                    const maxCount = Math.max(...stats.registrationVelocity.map(d => d.count), 1)
                    const widthClass = day.count === 0 ? 'w-1' : day.count >= maxCount ? 'w-full' : day.count >= maxCount * 0.75 ? 'w-4/5' : day.count >= maxCount * 0.5 ? 'w-3/5' : day.count >= maxCount * 0.25 ? 'w-2/5' : 'w-1/5'
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-12">{day.day}</span>
                        <div className={`h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex-1 mx-3 ${widthClass}`} />
                        <span className="text-sm font-semibold text-gray-800 w-12 text-right">{day.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Acciones rápidas</h2>
        <div className="flex gap-3 flex-wrap">
          <Link 
            href="/master/listings" 
            className="px-6 py-3 bg-gradient-to-r from-[#00A6A6] to-[#00C896] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiHome /> Revisar listados
          </Link>
          <Link 
            href="/master/applications" 
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiClock /> Revisar solicitudes
          </Link>
          <Link 
            href="/master/users?invite=agent" 
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiUsers /> Invitar agente
          </Link>
          <Link 
            href="/master/users?invite=broker" 
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiUsers /> Invitar broker
          </Link>
          <Link 
            href="/master/recommendations" 
            className="px-6 py-3 bg-gradient-to-r from-[#0B2545] to-[#1d4f7a] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <FiMail /> Pipeline de recomendaciones
          </Link>
        </div>
      </section>
    </div>
  )
}
