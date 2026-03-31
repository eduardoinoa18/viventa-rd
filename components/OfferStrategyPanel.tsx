'use client'

type OfferStrategyPanelProps = {
  price: number
  currency: 'USD' | 'DOP'
  area?: number
  listingType?: string
  propertyType?: string
  city?: string
  createdAt?: unknown
  maintenanceFee?: number
}

function formatMoney(amount: number, currency: 'USD' | 'DOP') {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function getDate(value: unknown) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof (value as any)?.toDate === 'function') {
    const converted = (value as any).toDate()
    return converted instanceof Date ? converted : null
  }
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getDaysOnMarket(value: unknown) {
  const createdAt = getDate(value)
  if (!createdAt) return 0
  return Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)))
}

function getZoneHeat(city: string) {
  const normalized = city.toLowerCase()
  if (normalized.includes('punta cana') || normalized.includes('bavaro')) return 'high'
  if (normalized.includes('santo domingo') || normalized.includes('santiago')) return 'solid'
  return 'balanced'
}

function getOfferBand(price: number, daysOnMarket: number, heat: string) {
  let low = 0.94
  let high = 0.99

  if (daysOnMarket > 45) {
    low = 0.9
    high = 0.96
  } else if (daysOnMarket > 21) {
    low = 0.93
    high = 0.98
  }

  if (heat === 'high') {
    low += 0.02
    high += 0.01
  }

  return {
    low: Math.round(price * low),
    high: Math.round(price * high),
  }
}

export default function OfferStrategyPanel({
  price,
  currency,
  area,
  listingType,
  propertyType,
  city,
  createdAt,
  maintenanceFee,
}: OfferStrategyPanelProps) {
  const safePrice = Number(price || 0)
  const daysOnMarket = getDaysOnMarket(createdAt)
  const pricePerM2 = area && area > 0 ? safePrice / area : 0
  const heat = getZoneHeat(String(city || ''))
  const band = getOfferBand(safePrice, daysOnMarket, heat)
  const monthlyCarry = Number(maintenanceFee || 0)

  const leverageLabel =
    daysOnMarket > 45 ? 'Tienes mas espacio para negociar con estructura.' :
    daysOnMarket > 21 ? 'Hay margen para anclar con datos de mercado.' :
    'La propiedad sigue fresca; conviene negociar con disciplina pero sin sobreretrasar.'

  return (
    <section className="rounded-2xl border border-[#0B2545]/10 bg-gradient-to-br from-[#F7F9FF] via-white to-[#FFF8F3] p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0B2545] sm:text-2xl">Estrategia de oferta</h2>
          <p className="text-sm text-gray-600">Una guia inicial para comparar contra mercado y estructurar tu siguiente movimiento.</p>
        </div>
        <div className="inline-flex rounded-full bg-[#FF6B35] px-3 py-1 text-xs font-semibold text-white">
          {daysOnMarket > 0 ? `${daysOnMarket} dias en mercado` : 'Lectura inicial'}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Rango de anclaje</p>
          <p className="mt-2 text-lg font-bold text-[#0B2545]">{formatMoney(band.low, currency)} - {formatMoney(band.high, currency)}</p>
          <p className="mt-1 text-xs text-gray-500">Referencia orientativa segun frescura del activo y pulso de zona.</p>
        </article>
        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Precio por m2</p>
          <p className="mt-2 text-lg font-bold text-[#0B2545]">{pricePerM2 > 0 ? `${formatMoney(pricePerM2, currency)}/m2` : 'Pendiente'}</p>
          <p className="mt-1 text-xs text-gray-500">Clave para comparar contra inventario similar del sector.</p>
        </article>
        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Poder de negociacion</p>
          <p className="mt-2 text-lg font-bold text-[#0B2545]">{heat === 'high' ? 'Mercado competido' : heat === 'solid' ? 'Mercado estable' : 'Mercado balanceado'}</p>
          <p className="mt-1 text-xs text-gray-500">{leverageLabel}</p>
        </article>
        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Costo de espera</p>
          <p className="mt-2 text-lg font-bold text-[#0B2545]">{monthlyCarry > 0 ? `${formatMoney(monthlyCarry, currency)}/mes` : 'Sin fee visible'}</p>
          <p className="mt-1 text-xs text-gray-500">Incluye mantenimiento como parte del costo total de tenencia.</p>
        </article>
      </div>

      <div className="mt-4 rounded-xl border border-[#0B2545]/10 bg-white p-4">
        <p className="text-sm font-semibold text-[#0B2545]">Playbook rapido</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-[#F6FBFF] p-3 text-sm text-gray-700">
            <span className="font-semibold text-[#0B2545]">1. Compara contra m2.</span> Evita negociar solo por precio total; el valor real aparece cuando contrastas m2, mantenimiento y calidad del inventario.
          </div>
          <div className="rounded-xl bg-[#FFF8F3] p-3 text-sm text-gray-700">
            <span className="font-semibold text-[#0B2545]">2. Negocia estructura.</span> Si el precio esta firme, mueve cierre, mobiliario, mantenimiento o calendario de entrega para mejorar el deal.
          </div>
          <div className="rounded-xl bg-[#F0FBF6] p-3 text-sm text-gray-700">
            <span className="font-semibold text-[#0B2545]">3. Usa contexto.</span> {propertyType || 'Esta propiedad'} para {listingType === 'rent' ? 'alquiler' : 'venta'} en {city || 'su zona'} responde mejor cuando presentas una oferta con logica de mercado, no solo con descuento.
          </div>
        </div>
      </div>
    </section>
  )
}