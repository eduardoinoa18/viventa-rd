'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiDollarSign, FiTrendingUp } from 'react-icons/fi'

type Tx = {
  id: string
  title?: string
  amount?: number
  commissionAmount?: number
  commissionStatus?: 'pending' | 'paid'
  updatedAt?: string
}

type Summary = {
  pendingCommissions: number
  paidCommissions: number
  monthlyProjection: number
  totalTransactions: number
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatDate(value?: string) {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })
}

export default function BrokerCommissionsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<Tx[]>([])
  const [summary, setSummary] = useState<Summary>({
    pendingCommissions: 0,
    paidCommissions: 0,
    monthlyProjection: 0,
    totalTransactions: 0,
  })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const res = await fetch('/api/broker/transactions?limit=200', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        if (!active) return

        if (!res.ok || !json?.ok) {
          setRows([])
          setError(String(json?.error || 'No se pudieron cargar las comisiones'))
          return
        }

        const tx = Array.isArray(json?.transactions) ? json.transactions : []
        setRows(tx)
        setSummary({
          pendingCommissions: Number(json?.summary?.pendingCommissions || 0),
          paidCommissions: Number(json?.summary?.paidCommissions || 0),
          monthlyProjection: Number(json?.summary?.monthlyProjection || 0),
          totalTransactions: Number(json?.summary?.totalTransactions || tx.length),
        })
      } catch {
        if (!active) return
        setRows([])
        setError('No se pudieron cargar las comisiones')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  const commissionRows = useMemo(() => {
    return rows
      .filter((tx) => Number(tx.commissionAmount || 0) > 0)
      .sort((a, b) => Number(b.commissionAmount || 0) - Number(a.commissionAmount || 0))
      .slice(0, 12)
  }, [rows])

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00A676]">Finanzas del broker</p>
          <h1 className="mt-1 text-2xl font-bold text-[#0B2545]">Comisiones</h1>
          <p className="mt-1 text-sm text-gray-600">Seguimiento de comisiones pagadas, pendientes y proyectadas de tu oficina.</p>
        </div>
        <Link href="/dashboard/broker/overview" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#0B2545] hover:bg-gray-50">
          <FiArrowLeft /> Volver al resumen
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pendiente</p>
          <p className="mt-2 text-2xl font-bold text-[#0B2545]">{money(summary.pendingCommissions)}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Pagado</p>
          <p className="mt-2 text-2xl font-bold text-[#0B2545]">{money(summary.paidCommissions)}</p>
        </article>
        <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Proyección</p>
          <p className="mt-2 text-2xl font-bold text-[#0B2545]">{money(summary.monthlyProjection)}</p>
        </article>
      </div>

      <div className="mt-5 rounded-xl border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#0B2545]">Top comisiones</h2>
          <span className="text-xs text-gray-500">{summary.totalTransactions} deals en total</span>
        </div>

        {loading ? <p className="px-4 py-4 text-sm text-gray-500">Cargando comisiones...</p> : null}
        {!loading && error ? <p className="px-4 py-4 text-sm text-red-600">{error}</p> : null}
        {!loading && !error && commissionRows.length === 0 ? (
          <p className="px-4 py-4 text-sm text-gray-500">No hay comisiones disponibles aún.</p>
        ) : null}

        {!loading && !error && commissionRows.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {commissionRows.map((tx) => (
              <div key={tx.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0B2545]">{tx.title || tx.id}</p>
                  <p className="text-xs text-gray-500">Actualizado {formatDate(tx.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tx.commissionStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {tx.commissionStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                  <span className="text-sm font-semibold text-[#0B2545]">{money(Number(tx.commissionAmount || 0))}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/dashboard/broker/transactions" className="inline-flex items-center gap-2 rounded-lg bg-[#0B2545] px-3 py-2 font-semibold text-white hover:bg-[#134074]">
          <FiTrendingUp /> Ver tablero de deals
        </Link>
        <Link href="/dashboard/billing" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-medium text-[#0B2545] hover:bg-gray-50">
          <FiDollarSign /> Facturación
        </Link>
      </div>
    </section>
  )
}
