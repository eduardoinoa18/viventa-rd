"use client"
import { useHits, useInstantSearch } from 'react-instantsearch'
import { formatCurrency } from '@/lib/currency'

export default function AlgoliaStatsBar() {
  const { hits } = useHits<any>()
  const { status } = useInstantSearch()
  const isLoading = status === 'loading' || status === 'stalled'

  if (isLoading) return null

  const total = hits.length
  const uniqueAgents = new Set(hits.map((h) => h.agentId || h.agent?.id || h.agentName || h.agent?.name).filter(Boolean)).size
  const forSale = hits.filter((h) => (h.listingType || '').toLowerCase() === 'sale').length

  const prices = hits
    .map((h) => Number(h.price_usd ?? h.price ?? 0))
    .filter((n) => n > 0)

  const avgUsd = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0

  const card = (label: string, value: string, sub?: string) => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-bold text-[#0B2545]">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {card('Propiedades', total.toLocaleString(), 'Resultados de tu búsqueda')}
      {card('Agentes', uniqueAgents.toString())}
      {card('En venta', forSale.toString())}
      {card('Precio promedio', formatCurrency(avgUsd, { currency: 'USD' }))}
    </div>
  )
}
