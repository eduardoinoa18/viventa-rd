'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FiArrowRight, FiMapPin, FiSearch, FiTrendingUp, FiHome, FiSliders } from 'react-icons/fi'
import { formatArea, formatCurrency, convertCurrency, type Currency } from '@/lib/currency'
import useCurrency from '@/hooks/useCurrency'
import type { Project } from '@/types/project'

type ProjectCard = Project & { hasPromotion?: boolean }

const STATUS_LABELS: Record<string, string> = {
  'pre-venta': 'Pre-venta',
  'en-construccion': 'En construcción',
  'entrega-proxima': 'Entrega próxima',
  entregado: 'Entregado',
  agotado: 'Agotado',
}

function getPercentWidthClass(percent: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(percent / 5) * 5))
  const map: Record<number, string> = {
    0: 'w-0', 5: 'w-[5%]', 10: 'w-[10%]', 15: 'w-[15%]', 20: 'w-[20%]',
    25: 'w-[25%]', 30: 'w-[30%]', 35: 'w-[35%]', 40: 'w-[40%]', 45: 'w-[45%]',
    50: 'w-[50%]', 55: 'w-[55%]', 60: 'w-[60%]', 65: 'w-[65%]', 70: 'w-[70%]',
    75: 'w-[75%]', 80: 'w-[80%]', 85: 'w-[85%]', 90: 'w-[90%]', 95: 'w-[95%]',
    100: 'w-full',
  }
  return map[clamped] || 'w-0'
}

function ProjectCardView({ project, preferredCurrency }: { project: ProjectCard; preferredCurrency: Currency }) {
  const totalUnits = project.totalUnits || 0
  const availableUnits = project.availableUnits || 0
  const soldUnits = Math.max(totalUnits - availableUnits, 0)
  const soldPercent = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0
  const startingPriceUsd = project.smallestUnitPrice?.usd || 0
  const startingPriceDop = convertCurrency(startingPriceUsd, 'USD', 'DOP')
  const primaryPrice = preferredCurrency === 'USD' ? startingPriceUsd : startingPriceDop
  const secondaryCurrency: Currency = preferredCurrency === 'USD' ? 'DOP' : 'USD'
  const secondaryPrice = secondaryCurrency === 'USD' ? startingPriceUsd : startingPriceDop

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative h-56 bg-slate-200">
        {project.featuredImage ? (
          <img src={project.featuredImage} alt={project.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(0,166,118,0.65),_rgba(11,37,69,0.9))]" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0B2545] backdrop-blur">
            {STATUS_LABELS[project.constructionStatus] || project.constructionStatus}
          </span>
          {project.hasPromotion ? (
            <span className="rounded-full bg-[#FF6B35] px-3 py-1 text-xs font-bold text-white shadow-lg">Oferta activa</span>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div>
          <h2 className="text-xl font-bold text-[#0B2545]">{project.name}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <FiMapPin className="shrink-0" />
            <span>{project.location.city} · {project.location.sector}</span>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-slate-600">{project.shortDescription || project.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Desde</div>
            <div className="mt-1 text-lg font-bold text-[#0B2545]">
              {startingPriceUsd > 0 ? formatCurrency(primaryPrice, { currency: preferredCurrency, compact: true }) : 'Consultar'}
            </div>
            {startingPriceUsd > 0 ? <div className="text-xs text-slate-500">{formatCurrency(secondaryPrice, { currency: secondaryCurrency, compact: true })}</div> : null}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Metraje</div>
            <div className="mt-1 text-lg font-bold text-[#0B2545]">{project.smallestUnitMeters ? formatArea(project.smallestUnitMeters) : 'Consultar'}</div>
            <div className="text-xs text-slate-500">unidad inicial</div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Disponibilidad</span>
            <span>{soldPercent}% vendido</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full bg-gradient-to-r from-[#00A676] to-[#0B2545] ${getPercentWidthClass(soldPercent)}`} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{availableUnits} disponibles</span>
            <span>{soldUnits} vendidos</span>
          </div>
        </div>

        <Link href={`/projects/${project.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2545] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#12355f]">
          Ver proyecto
          <FiArrowRight />
        </Link>
      </div>
    </article>
  )
}

export default function ProjectsCatalogPage() {
  const preferredCurrency = useCurrency()
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('all')
  const [constructionStatus, setConstructionStatus] = useState('all')

  useEffect(() => {
    async function loadProjects() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ status: 'active', sortBy: 'views', sortOrder: 'desc', limit: '48' })
        const res = await fetch(`/api/projects/list?${params.toString()}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        setProjects(Array.isArray(data?.projects) ? data.projects : [])
      } catch {
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const cities = useMemo(() => {
    return ['all', ...Array.from(new Set(projects.map((project) => project.location?.city).filter(Boolean))) as string[]]
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (city !== 'all' && project.location?.city !== city) return false
      if (constructionStatus !== 'all' && project.constructionStatus !== constructionStatus) return false
      if (query.trim()) {
        const haystack = `${project.name} ${project.location?.city || ''} ${project.location?.sector || ''} ${project.description || ''}`.toLowerCase()
        if (!haystack.includes(query.trim().toLowerCase())) return false
      }
      return true
    })
  }, [city, constructionStatus, projects, query])

  const marketStats = useMemo(() => {
    const activeCities = new Set(projects.map((project) => project.location?.city).filter(Boolean)).size
    const availableUnits = projects.reduce((sum, project) => sum + Number(project.availableUnits || 0), 0)
    const preSaleCount = projects.filter((project) => project.constructionStatus === 'pre-venta').length
    return { activeCities, availableUnits, preSaleCount }
  }, [projects])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_28%,_#f8fafc_100%)]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#0B2545] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,166,118,0.35),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(59,175,218,0.18),_transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/85">
              <FiTrendingUp /> Proyectos VIVENTA
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Desarrollos con inventario vivo, ubicación clara y contexto comercial real.</h1>
            <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
              Explora preventas, proyectos en construcción y entregas próximas en República Dominicana con disponibilidad, metraje y pricing desde una sola vista.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-sm text-white/70">Ciudades activas</div>
              <div className="mt-2 text-3xl font-black">{marketStats.activeCities}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-sm text-white/70">Unidades disponibles</div>
              <div className="mt-2 text-3xl font-black">{marketStats.availableUnits}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-sm text-white/70">Preventas destacadas</div>
              <div className="mt-2 text-3xl font-black">{marketStats.preSaleCount}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <FiSearch className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, ciudad o sector..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <FiMapPin className="text-slate-400" />
              <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full bg-transparent text-sm outline-none">
                {cities.map((option) => <option key={option} value={option}>{option === 'all' ? 'Todas las ciudades' : option}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <FiSliders className="text-slate-400" />
              <select value={constructionStatus} onChange={(event) => setConstructionStatus(event.target.value)} className="w-full bg-transparent text-sm outline-none">
                <option value="all">Todas las etapas</option>
                <option value="pre-venta">Pre-venta</option>
                <option value="en-construccion">En construcción</option>
                <option value="entrega-proxima">Entrega próxima</option>
                <option value="entregado">Entregado</option>
                <option value="agotado">Agotado</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#0B2545]">Catálogo de proyectos</h2>
            <p className="mt-1 text-sm text-slate-500">{filteredProjects.length} resultados visibles</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 sm:inline-flex">
            <FiHome /> Inventario sincronizado con VIVENTA
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm animate-pulse">
                <div className="h-56 bg-slate-200" />
                <div className="space-y-4 p-6">
                  <div className="h-6 rounded bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 rounded-2xl bg-slate-100" />
                    <div className="h-20 rounded-2xl bg-slate-100" />
                  </div>
                  <div className="h-10 rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => <ProjectCardView key={project.id} project={project} preferredCurrency={preferredCurrency} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FiSearch className="text-2xl" />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-[#0B2545]">No encontramos proyectos con esos filtros</h3>
            <p className="mt-2 text-sm text-slate-500">Prueba otra ciudad, otra etapa o una búsqueda más amplia.</p>
          </div>
        )}
      </section>
    </main>
  )
}
