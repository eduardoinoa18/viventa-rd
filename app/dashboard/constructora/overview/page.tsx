'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">Dashboard de constructora</h2>
      <p className="mt-1 text-sm text-gray-600">Vista ejecutiva de proyectos, inventario y reservas para la operación diaria.</p>
      {loading ? <p className="mt-2 text-sm text-gray-600">Cargando métricas...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric label="Total proyectos" value={summary.totalProjects} />
        <Metric label="Proyectos activos" value={summary.activeProjects} />
        <Metric label="Total unidades" value={summary.totalUnits} />
        <Metric label="Disponibles" value={summary.availableUnits} />
        <Metric label="Reservadas" value={summary.reservedUnits} />
        <Metric label="Vendidas" value={summary.soldUnits} />
        <Metric label="En proceso" value={summary.inProcessUnits} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/dashboard/constructora/projects" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Proyectos</Link>
        <Link href="/dashboard/constructora/units" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Unidades</Link>
        <Link href="/dashboard/constructora/reservations" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Ir a Reservas</Link>
      </div>
    </section>
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
