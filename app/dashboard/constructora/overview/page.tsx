'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiLayers, FiPackage, FiCalendar, FiCheckCircle, FiAlertTriangle, FiCheckSquare } from 'react-icons/fi'
import PageHeader from '@/components/ui/PageHeader'
import { KpiGrid, KpiCard } from '@/components/ui/KpiCard'
import WorkspaceCommandCenter from '@/components/WorkspaceCommandCenter'

type OverviewState = {
  totalProjects: number
  activeProjects: number
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  soldUnits: number
  inProcessUnits: number
  totalTasks: number
  pendingTasks: number
  inProgressTasks: number
  doneTasks: number
  overdueTasks: number
  automationOpenTasks: number
}

export default function ConstructoraOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<OverviewState>({
    totalProjects: 0,
    activeProjects: 0,
    totalUnits: 0,
    availableUnits: 0,
    reservedUnits: 0,
    soldUnits: 0,
    inProcessUnits: 0,
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    doneTasks: 0,
    overdueTasks: 0,
    automationOpenTasks: 0,
  })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const res = await fetch('/api/constructora/dashboard/overview', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || 'No se pudo cargar el overview')
        }

        const data = json?.summary || {}
        setSummary({
          totalProjects: Number(data.totalProjects || 0),
          activeProjects: Number(data.activeProjects || 0),
          totalUnits: Number(data.totalUnits || 0),
          availableUnits: Number(data.availableUnits || 0),
          reservedUnits: Number(data.reservedUnits || 0),
          soldUnits: Number(data.soldUnits || 0),
          inProcessUnits: Number(data.inProcessUnits || 0),
          totalTasks: Number(data.totalTasks || 0),
          pendingTasks: Number(data.pendingTasks || 0),
          inProgressTasks: Number(data.inProgressTasks || 0),
          doneTasks: Number(data.doneTasks || 0),
          overdueTasks: Number(data.overdueTasks || 0),
          automationOpenTasks: Number(data.automationOpenTasks || 0),
        })
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudo cargar el overview')
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
        eyebrow="Constructora"
        title="Dashboard"
        description="Vista ejecutiva de proyectos, inventario y reservas"
        actions={[
          { label: '+ Nuevo Proyecto', href: '/dashboard/constructora/projects' },
          { label: 'Ver Inventario', href: '/dashboard/constructora/units', variant: 'secondary' },
        ]}
      />

      <WorkspaceCommandCenter
        eyebrow="Constructora Command Center"
        title="Opera inventario, reservas y follow-up comercial con rigor de proyecto"
        description="La constructora necesita una vista clara de absorcion, unidades disponibles y tareas operativas para vender con consistencia y proteger velocidad de cierre."
        highlightLabel="Inventario disponible"
        highlightValue={summary.availableUnits}
        highlightDetail={`${summary.activeProjects} proyectos activos y ${summary.reservedUnits} unidades reservadas`}
        marketNote="En preventa y desarrollo vertical, el liderazgo no lo define solo el volumen de unidades, sino la disciplina para convertir reservas en cierres y sostener respuesta comercial."
        priorities={[
          { label: 'Unidades vendidas', value: summary.soldUnits, hint: 'Cierres consolidados', tone: summary.soldUnits > 0 ? 'good' : 'neutral' },
          { label: 'En proceso', value: summary.inProcessUnits, hint: 'Inventario moviendose a siguiente etapa', tone: summary.inProcessUnits > 0 ? 'good' : 'warn' },
          { label: 'Tasks vencidas', value: summary.overdueTasks, hint: 'Pendientes operativos urgentes', tone: summary.overdueTasks > 0 ? 'urgent' : 'good' },
          { label: 'Automatizadas abiertas', value: summary.automationOpenTasks, hint: 'Seguimientos creados por el sistema', tone: summary.automationOpenTasks > 0 ? 'warn' : 'good' },
        ]}
        quickActions={[
          { label: 'Ver proyectos', href: '/dashboard/constructora/projects' },
          { label: 'Abrir inventario', href: '/dashboard/constructora/units' },
          { label: 'Ver reservas', href: '/dashboard/constructora/reservations' },
          { label: 'Ver tareas', href: '/dashboard/constructora/tasks' },
        ]}
      />

      <KpiGrid cols={4}>
        <KpiCard label="Proyectos Activos"  value={summary.activeProjects}  icon={<FiLayers />}      accent loading={loading} />
        <KpiCard label="Unidades Disponibles" value={summary.availableUnits} icon={<FiPackage />}     loading={loading} />
        <KpiCard label="Reservadas"         value={summary.reservedUnits}   icon={<FiCalendar />}    loading={loading} />
        <KpiCard label="Vendidas"           value={summary.soldUnits}       icon={<FiCheckCircle />} loading={loading} />
      </KpiGrid>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[#0B2545]">Detalles de Inventario</h3>
        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Metric label="Total Proyectos"  value={summary.totalProjects} />
            <Metric label="Total Unidades"   value={summary.totalUnits} />
            <Metric label="En Proceso"       value={summary.inProcessUnits} />
            <Metric label="Ocupación"        value={summary.totalUnits > 0 ? `${Math.round((summary.soldUnits + summary.reservedUnits) / summary.totalUnits * 100)}%` : '0%'} />
          </div>
        )}
        {!loading && summary.totalProjects === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm font-medium text-gray-500">No hay proyectos todavía</p>
            <p className="mt-1 text-xs text-gray-400">Crea tu primer proyecto para empezar a rastrear el inventario.</p>
            <Link href="/dashboard/constructora/projects" className="mt-3 inline-flex items-center rounded-lg bg-gradient-to-r from-[#00A676] to-[#008F64] px-4 py-2 text-xs font-semibold text-white">
              + Nuevo Proyecto
            </Link>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[#0B2545]">Health de Tasks</h3>
          <Link href="/dashboard/constructora/tasks" className="text-xs font-semibold text-blue-700 hover:underline">Abrir Tasks</Link>
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Metric label="Total Tasks" value={summary.totalTasks} />
            <Metric label="Pendientes" value={summary.pendingTasks} />
            <Metric label="En Progreso" value={summary.inProgressTasks} />
            <Metric label="Completadas" value={summary.doneTasks} />
          </div>
        )}
        {!loading && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Link href="/dashboard/constructora/tasks?status=all" className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100">
              <span className="inline-flex items-center gap-2"><FiAlertTriangle /> Overdue Tasks</span>
              <span>{summary.overdueTasks}</span>
            </Link>
            <Link href="/dashboard/constructora/tasks?status=pending" className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800 hover:bg-blue-100">
              <span className="inline-flex items-center gap-2"><FiCheckSquare /> Automatizadas Abiertas</span>
              <span>{summary.automationOpenTasks}</span>
            </Link>
          </div>
        )}
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard/constructora/projects" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Proyectos</Link>
        <Link href="/dashboard/constructora/units" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Unidades</Link>
        <Link href="/dashboard/constructora/reservations" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Reservas</Link>
        <Link href="/dashboard/constructora/tasks" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Tasks</Link>
      </div>
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
