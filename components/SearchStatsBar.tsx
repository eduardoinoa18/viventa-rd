"use client"
import { formatCurrency } from '@/lib/currency'
import type { Currency } from '@/lib/currency'

interface Props {
  items: any[]
  currency: Currency
}

export default function SearchStatsBar({ items, currency }: Props) {
  const total = items.length
  const uniqueAgents = new Set(items.map((p) => p.agentId || p.agentName || p.agent?.id || p.agent?.name).filter(Boolean)).size
  const forSale = items.filter((p) => (p.listingType || '').toLowerCase() === 'sale').length

  const prices = items
    .map((p) => {
      const price = Number(p.price || p.price_usd || 0)
      const cur = (p.currency || 'USD') as Currency
      if (currency === cur) return price
      // simple conversion using currency util on the client is ok; import deferred to avoid tree-shake issues
      try {
        const conv = require('@/lib/currency')
        return conv.convertCurrency(price, cur, currency)
      } catch {
        return price
      }
    })
    .filter((n) => n > 0)

  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0

  const card = (label: string, value: string, sub?: string) => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-bold text-[#0B2545]">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {card('Propiedades', total.toLocaleString(), 'Resultados de tu búsqueda')}
      {card('Agentes', uniqueAgents.toString(), 'Que publicaron estas propiedades')}
      {card('En venta', forSale.toString())}
      {card('Precio promedio', formatCurrency(avgPrice || 0, { currency }))}
    </div>
  )
}
