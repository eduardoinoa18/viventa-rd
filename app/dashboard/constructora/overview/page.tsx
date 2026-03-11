'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiLayers, FiPackage, FiCalendar, FiCheckCircle } from 'react-icons/fi'
import PageHeader from '@/components/ui/PageHeader'
import { KpiGrid, KpiCard } from '@/components/ui/KpiCard'

type OverviewState = {
  totalProjects: number
  activeProjects: number
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  soldUnits: number
  inProcessUnits: number
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
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard/constructora/projects" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Proyectos</Link>
        <Link href="/dashboard/constructora/units" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Unidades</Link>
        <Link href="/dashboard/constructora/reservations" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Reservas</Link>
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
