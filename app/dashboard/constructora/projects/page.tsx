'use client'

import { useEffect, useState } from 'react'

type ProjectItem = {
  id: string
  name: string
  city?: string
  status?: string
  availableUnits?: number
  totalUnits?: number
}

export default function ConstructoraProjectsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<ProjectItem[]>([])

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
          throw new Error(json?.error || 'No se pudieron cargar los proyectos')
        }

        setProjects(Array.isArray(json?.recentProjects) ? json.recentProjects : [])
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudieron cargar los proyectos')
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
      <h2 className="text-lg font-semibold text-[#0B2545]">Proyectos recientes</h2>
      {loading ? <p className="mt-2 text-sm text-gray-600">Cargando proyectos...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-3 space-y-2">
        {projects.map((project) => (
          <div key={project.id} className="rounded-lg border border-gray-200 p-3">
            <div className="text-sm font-semibold text-[#0B2545]">{project.name}</div>
            <div className="text-xs text-gray-600 mt-1">
              {(project.city || 'RD')} • {(project.status || 'active')} • {Number(project.availableUnits || 0)} / {Number(project.totalUnits || 0)} disponibles
            </div>
          </div>
        ))}
        {!loading && !projects.length ? <p className="text-sm text-gray-500">No hay proyectos recientes.</p> : null}
      </div>
    </section>
  )
}
