'use client'

interface BuyerClarityPanelProps {
  price: number
  currency: 'USD' | 'DOP'
  area?: number
  bedrooms?: number
  bathrooms?: number
  city?: string
  features?: string[]
  maintenanceFee?: number
  propertyType?: string
}

function formatMoney(amount: number, currency: 'USD' | 'DOP') {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function estimateMortgage(price: number, annualRate = 8.5, years = 20, downPaymentPct = 20) {
  const principal = Math.max(price * (1 - downPaymentPct / 100), 0)
  const monthlyRate = annualRate / 100 / 12
  const months = years * 12
  if (monthlyRate <= 0 || months <= 0) return principal / Math.max(months, 1)
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
}

function zoneMomentum(city: string) {
  const c = city.toLowerCase()
  if (c.includes('punta cana') || c.includes('bavaro') || c.includes('bávaro')) return { label: 'Alta traccion turistica', mood: 'hot' as const }
  if (c.includes('santo domingo') || c.includes('santiago')) return { label: 'Demanda urbana estable', mood: 'solid' as const }
  if (c.includes('puerto plata') || c.includes('samana') || c.includes('samaná')) return { label: 'Zona con potencial de crecimiento', mood: 'up' as const }
  return { label: 'Mercado local en seguimiento', mood: 'neutral' as const }
}

export default function BuyerClarityPanel({
  price,
  currency,
  area,
  bedrooms,
  bathrooms,
  city,
  features,
  maintenanceFee,
  propertyType,
}: BuyerClarityPanelProps) {
  const safePrice = Number(price || 0)
  const monthlyMortgage = estimateMortgage(safePrice)
  const initialReference = safePrice * 0.2
  const pricePerMt2 = area && area > 0 ? safePrice / area : 0
  const momentum = zoneMomentum(String(city || ''))

  const clarityChecks = [
    { label: 'Precio claro', ok: safePrice > 0 },
    { label: 'Ubicacion declarada', ok: Boolean(city) },
    { label: 'Datos de espacio', ok: Boolean(area && area > 0) },
    { label: 'Amenidades visibles', ok: Boolean(features && features.length > 0) },
    { label: 'Costo mantenimiento', ok: Boolean(maintenanceFee && maintenanceFee > 0) },
  ]
  const clarityScore = Math.round((clarityChecks.filter((x) => x.ok).length / clarityChecks.length) * 100)

  return (
    <section className="rounded-2xl border border-[#0B2545]/10 bg-gradient-to-br from-[#F6FBFF] via-[#FFFFFF] to-[#ECFDF5] p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Radar del Comprador</h2>
          <p className="text-sm text-gray-600">Mas claridad para decidir rapido, con contexto real para RD.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#0B2545] px-3 py-1 text-xs font-semibold text-white">
          Score claridad: {clarityScore}%
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Pago estimado</p>
          <p className="mt-1 text-lg font-bold text-[#0B2545]">{formatMoney(monthlyMortgage, currency)}/mes</p>
          <p className="mt-1 text-xs text-gray-500">Hipoteca referencial: 20 anos, 20% inicial, tasa 8.5%</p>
        </article>

        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Inicial referencial</p>
          <p className="mt-1 text-lg font-bold text-[#0B2545]">{formatMoney(initialReference, currency)}</p>
          <p className="mt-1 text-xs text-gray-500">Guia base para comenzar la conversacion financiera.</p>
        </article>

        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Precio por m2</p>
          <p className="mt-1 text-lg font-bold text-[#0B2545]">{pricePerMt2 > 0 ? `${formatMoney(pricePerMt2, currency)}/m2` : 'Pendiente'}</p>
          <p className="mt-1 text-xs text-gray-500">Comparalo con propiedades similares de la zona</p>
        </article>

        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Pulso de zona</p>
          <p className="mt-1 text-lg font-bold text-[#0B2545]">{momentum.label}</p>
          <p className="mt-1 text-xs text-gray-500">Lectura orientativa para iniciar tu analisis</p>
        </article>
      </div>

      <div className="mt-4 rounded-xl border border-[#00A676]/20 bg-[#F0FBF6] p-3">
        <p className="text-sm font-semibold text-[#0B2545]">Resumen express de esta propiedad</p>
        <p className="mt-1 text-sm text-gray-700">
          {propertyType ? `${propertyType} ` : 'Propiedad '}
          {bedrooms ? `de ${bedrooms} hab` : ''}
          {bathrooms ? `, ${bathrooms} banos` : ''}
          {area ? `, ${area} m2` : ''}
          {city ? ` en ${city}` : ''}. Ideal para quienes quieren comparar rapido antes de agendar visita.
        </p>
      </div>
    </section>
  )
}
