'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiMail, FiPhone, FiUser } from 'react-icons/fi'

type ClientItem = {
  id: string
  name: string
  email: string
  phone: string
  source: 'deal' | 'reservation'
  projectName: string
  unitId: string
  dealStatus: string
  createdAt: string | null
}

type Summary = { total: number; active: number; new: number }

const STATUS_LABELS: Record<string, string> = {
  reserved: 'Reservado',
  contract_signed: 'Contrato',
  closed: 'Cerrado',
  cancelled: 'Cancelado',
  rejected: 'Rechazado',
}

export default function ConstructoraClientsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<ClientItem[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, new: 0 })
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')
        const params = new URLSearchParams()
        if (searchInput.trim()) params.set('q', searchInput.trim())
        const url = `/api/constructora/dashboard/clients${params.toString() ? `?${params.toString()}` : ''}`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudieron cargar los clientes')
        setClients(Array.isArray(json?.clients) ? json.clients : [])
        setSummary({ total: Number(json?.summary?.total || 0), active: Number(json?.summary?.active || 0), new: Number(json?.summary?.new || 0) })
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Error al cargar clientes')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [searchInput])

  const statCards = [
    { label: 'Total Clientes', value: summary.total, color: 'text-[#0B2545]' },
    { label: 'Activos', value: summary.active, color: 'text-emerald-600' },
    { label: 'Nuevos (30d)', value: summary.new, color: 'text-blue-600' },
  ]

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#0B2545]">Clientes</h1>
          <p className="text-sm text-gray-500">Compradores vinculados a tus proyectos y deals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="Buscar por nombre, email, teléfono o proyecto..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#00A676] focus:outline-none focus:ring-1 focus:ring-[#00A676]"
          title="Buscar clientes"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
          <FiUser className="mx-auto mb-2 text-3xl text-gray-300" />
          <p className="text-sm text-gray-500">No se encontraron clientes</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/dashboard/constructora/deals" className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100">
              Ver Deals
            </Link>
            <Link href="/dashboard/constructora/reservations" className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100">
              Ver Reservas
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {clients.map((client) => (
            <div key={client.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B2545]/10 text-sm font-bold text-[#0B2545]">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{client.name}</p>
                    {client.projectName && (
                      <p className="text-xs text-gray-500">{client.projectName}{client.unitId ? ` · Unidad ${client.unitId}` : ''}</p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {STATUS_LABELS[client.dealStatus] || client.dealStatus}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                {client.email && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FiMail className="shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FiPhone className="shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href="/dashboard/constructora/deals"
                  className="flex items-center gap-1 text-xs font-medium text-[#00A676] hover:underline"
                >
                  Ver Deal <FiArrowRight className="text-[10px]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}