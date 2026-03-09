'use client'

import { useEffect, useMemo, useState } from 'react'

type ReservationItem = {
  id: string
  projectId: string
  projectName: string
  unitId: string
  unitCode: string
  status: string
  clientName: string
  reservationAmount: number
  currency: string
  updatedAt: string | null
}

type ReservationSummary = {
  reservedUnits: number
  totalReservationAmount: number
}

export default function ConstructoraReservationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [summary, setSummary] = useState<ReservationSummary>({
    reservedUnits: 0,
    totalReservationAmount: 0,
  })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (searchInput.trim()) params.set('q', searchInput.trim())
        const url = `/api/constructora/dashboard/reservations${params.toString() ? `?${params.toString()}` : ''}`

        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || 'No se pudieron cargar las reservas')
        }

        setReservations(Array.isArray(json?.reservations) ? json.reservations : [])
        setSummary({
          reservedUnits: Number(json?.summary?.reservedUnits || 0),
          totalReservationAmount: Number(json?.summary?.totalReservationAmount || 0),
        })
      } catch (loadError: any) {
        if (!active) return
        setError(loadError?.message || 'No se pudieron cargar las reservas')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [searchInput])

  const hasSearch = useMemo(() => searchInput.trim().length > 0, [searchInput])

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">Reservas</h2>
      <p className="mt-1 text-sm text-gray-600">Control de unidades reservadas, cliente asociado y monto de reserva.</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Metric label="Unidades reservadas" value={summary.reservedUnits} />
        <Metric label="Monto total reservas" value={`$${Number(summary.totalReservationAmount || 0).toLocaleString()}`} />
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 p-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por proyecto, unidad o cliente"
            className="w-full md:flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            title="Buscar reservas"
          />
          {hasSearch && (
            <button onClick={() => setSearchInput('')} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" title="Limpiar búsqueda">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm text-gray-600">Cargando reservas...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!loading && !error && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[820px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Proyecto</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Unidad</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Monto</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Actualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <tr key={`${reservation.projectId}-${reservation.unitId}-${reservation.id}`}>
                  <td className="px-3 py-2 text-sm text-gray-700">{reservation.projectName}</td>
                  <td className="px-3 py-2 text-sm font-medium text-[#0B2545]">{reservation.unitCode}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{reservation.clientName || 'Por confirmar'}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">
                    {Number(reservation.reservationAmount || 0).toLocaleString()} {reservation.currency || 'USD'}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">{reservation.status}</span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">{reservation.updatedAt ? new Date(reservation.updatedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reservations.length ? <div className="p-4 text-sm text-gray-500">No hay reservas para el criterio aplicado.</div> : null}
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
