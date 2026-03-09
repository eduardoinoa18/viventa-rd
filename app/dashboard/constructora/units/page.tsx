'use client'

import { useEffect, useMemo, useState } from 'react'

type UnitItem = {
  id: string
  projectId: string
  projectName: string
  unitCode: string
  phase: string
  propertyType: string
  beds: number
  baths: number
  price: number
  reservationId?: string
  status: string
}

type UnitsSummary = {
  total: number
  available: number
  reserved: number
  sold: number
  inProcess: number
  blocked: number
}

type ProjectOption = { id: string; name: string }

const EMPTY_SUMMARY: UnitsSummary = {
  total: 0,
  available: 0,
  reserved: 0,
  sold: 0,
  inProcess: 0,
  blocked: 0,
}

export default function ConstructoraUnitsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [units, setUnits] = useState<UnitItem[]>([])
  const [summary, setSummary] = useState<UnitsSummary>(EMPTY_SUMMARY)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
        if (projectFilter) params.set('projectId', projectFilter)
        if (searchInput.trim()) params.set('q', searchInput.trim())

        const url = `/api/constructora/dashboard/units${params.toString() ? `?${params.toString()}` : ''}`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || 'No se pudieron cargar las unidades')
        }

        setUnits(Array.isArray(json?.units) ? json.units : [])
        setProjects(Array.isArray(json?.projects) ? json.projects : [])
        setSummary({
          total: Number(json?.summary?.total || 0),
          available: Number(json?.summary?.available || 0),
          reserved: Number(json?.summary?.reserved || 0),
          sold: Number(json?.summary?.sold || 0),
          inProcess: Number(json?.summary?.inProcess || 0),
          blocked: Number(json?.summary?.blocked || 0),
        })
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudieron cargar las unidades')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [statusFilter, projectFilter, searchInput])

  const hasFilters = useMemo(() => statusFilter !== 'all' || Boolean(projectFilter) || searchInput.trim().length > 0, [statusFilter, projectFilter, searchInput])

  const clearFilters = () => {
    setStatusFilter('all')
    setProjectFilter('')
    setSearchInput('')
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">Unidades</h2>
      <p className="mt-1 text-sm text-gray-600">Inventario consolidado de unidades con estado comercial por proyecto.</p>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        <Metric label="Total" value={summary.total} />
        <Metric label="Disponibles" value={summary.available} />
        <Metric label="Reservadas" value={summary.reserved} />
        <Metric label="Vendidas" value={summary.sold} />
        <Metric label="En proceso" value={summary.inProcess} />
        <Metric label="Bloqueadas" value={summary.blocked} />
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 p-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por proyecto, fase o unidad"
            className="w-full md:flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            title="Buscar unidades"
          />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            title="Filtrar por proyecto"
          >
            <option value="">Todos los proyectos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            title="Filtrar por estado"
          >
            <option value="all">Todos los estados</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="in_process">In process</option>
            <option value="blocked">Blocked</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" title="Limpiar filtros">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm text-gray-600">Cargando unidades...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!loading && !error && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[860px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Proyecto</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Unidad</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fase</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Beds/Baths</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Precio</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-3 py-2 text-sm text-gray-700">{unit.projectName}</td>
                  <td className="px-3 py-2 text-sm font-medium text-[#0B2545]">{unit.unitCode}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{unit.phase || '—'}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{unit.propertyType || '—'}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{Number(unit.beds || 0)} / {Number(unit.baths || 0)}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{unit.price ? `$${Number(unit.price).toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">{unit.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!units.length ? <div className="p-4 text-sm text-gray-500">No hay unidades para los filtros seleccionados.</div> : null}
        </div>
      )}
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
