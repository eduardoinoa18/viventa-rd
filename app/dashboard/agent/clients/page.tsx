'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiMail, FiPhone, FiUser } from 'react-icons/fi'

type ClientItem = {
  id: string
  name: string
  email?: string
  phone?: string
  city?: string
  stage?: string
  preferencesCount?: number
  activeDeals?: number
  createdAt?: string
}

type ClientsSummary = {
  total: number
  active: number
  new: number
}

export default function AgentClientsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<ClientItem[]>([])
  const [summary, setSummary] = useState<ClientsSummary>({
    total: 0,
    active: 0,
    new: 0,
  })
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (searchInput.trim()) params.set('q', searchInput.trim())

        const url = `/api/agent/clients${params.toString() ? `?${params.toString()}` : ''}`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        if (!active) return

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || 'No se pudieron cargar los clientes')
        }

        const nextClients = Array.isArray(json?.clients) ? json.clients : []
        setClients(nextClients)
        setSummary({
          total: Number(json?.summary?.total || 0),
          active: Number(json?.summary?.active || 0),
          new: Number(json?.summary?.new || 0),
        })
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudieron cargar los clientes')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [searchInput])

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[#0B2545]">Mis Clientes</h2>
          <p className="mt-1 text-sm text-gray-600">Gestiona tus contactos, preferencias y deals activos.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total" value={summary.total} color="bg-blue-50 text-blue-700" />
        <SummaryCard label="Activos" value={summary.active} color="bg-emerald-50 text-emerald-700" />
        <SummaryCard label="Nuevos" value={summary.new} color="bg-amber-50 text-amber-700" />
      </div>

      {/* Search */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          aria-label="Buscar clientes"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">Cargando clientes...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <FiUser className="mx-auto mb-3 text-3xl text-gray-400" />
          <p className="text-sm text-gray-600">No hay clientes para mostrar</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/agent/clients/${client.id}`}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-[#00A676] hover:bg-white hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[#0B2545]">{client.name}</h3>
                  {client.city && <p className="mt-0.5 text-xs text-gray-600">{client.city}</p>}
                </div>
                <FiArrowRight className="text-gray-400" />
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5 border-t border-gray-200 pt-3">
                {client.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiMail className="shrink-0 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FiPhone className="shrink-0 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-3 flex gap-2 border-t border-gray-200 pt-3 text-xs">
                {client.preferencesCount ? (
                  <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                    {client.preferencesCount} preferencias
                  </span>
                ) : null}
                {client.activeDeals ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    {client.activeDeals} deals
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg ${color} p-3`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}
