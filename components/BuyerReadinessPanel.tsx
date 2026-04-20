'use client'

interface BuyerReadinessPanelProps {
  price: number
  currency: 'USD' | 'DOP'
  listingType?: 'sale' | 'rent' | string
  maintenanceFee?: number
  createdAt?: { seconds?: number } | string | null
  deslindadoStatus?: string
  city?: string
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

function getPublishedDate(createdAt?: { seconds?: number } | string | null) {
  if (!createdAt) return null
  if (typeof createdAt === 'string') {
    const parsed = new Date(createdAt)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof createdAt === 'object' && typeof createdAt.seconds === 'number') {
    return new Date(createdAt.seconds * 1000)
  }
  return null
}

function getDaysOnMarket(createdAt?: { seconds?: number } | string | null) {
  const publishedAt = getPublishedDate(createdAt)
  if (!publishedAt) return null
  const diffMs = Date.now() - publishedAt.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getNegotiationSignal(daysOnMarket: number | null, listingType: string) {
  if (daysOnMarket === null) {
    return {
      label: 'Sin historial suficiente',
      hint: listingType === 'rent' ? 'Pregunta por terminos y mantenimiento incluido.' : 'Pregunta por margen de negociacion y documentos necesarios para cerrar.',
      tone: 'neutral' as const,
    }
  }

  if (daysOnMarket >= 120) {
    return {
      label: 'Alta probabilidad de negociar',
      hint: 'Tiene tiempo publicado. Buen momento para pedir ajuste de precio, mantenimiento o mobiliario.',
      tone: 'good' as const,
    }
  }

  if (daysOnMarket >= 60) {
    return {
      label: 'Espacio moderado para negociar',
      hint: 'Puedes probar con oferta bien sustentada y condiciones claras.',
      tone: 'mid' as const,
    }
  }

  return {
    label: 'Listado reciente',
    hint: 'Si te interesa mucho, prioriza velocidad y preaprobacion antes que una oferta agresiva.',
    tone: 'fresh' as const,
  }
}

function getDocChecklist(deslindadoStatus?: string) {
  return [
    { label: 'Cedula o pasaporte vigente', ready: true },
    { label: 'Preaprobacion bancaria o prueba de fondos', ready: true },
    { label: 'Reserva y hoja de terminos', ready: true },
    { label: deslindadoStatus === 'deslindado' ? 'Deslinde verificado' : 'Validar deslinde y titulo', ready: deslindadoStatus === 'deslindado' },
  ]
}

function getCityAngle(city?: string) {
  const value = String(city || '').toLowerCase()
  if (value.includes('punta cana') || value.includes('bavaro')) {
    return 'Zona de alta rotacion turistica: confirma reglas de renta corta y gastos operativos.'
  }
  if (value.includes('santo domingo') || value.includes('santiago')) {
    return 'Zona urbana: compara parqueos, mantenimiento y tiempo de traslado en horas pico.'
  }
  return 'Revisa servicios, acceso y plusvalia del sector antes de separar.'
}

export default function BuyerReadinessPanel({
  price,
  currency,
  listingType,
  maintenanceFee,
  createdAt,
  deslindadoStatus,
  city,
}: BuyerReadinessPanelProps) {
  const safePrice = Number(price || 0)
  const estimatedMortgage = estimateMortgage(safePrice)
  const estimatedMonthly = listingType === 'rent'
    ? safePrice + Number(maintenanceFee || 0)
    : estimatedMortgage + Number(maintenanceFee || 0)
  const upfrontCash = listingType === 'rent'
    ? safePrice * 2
    : safePrice * 0.2
  const daysOnMarket = getDaysOnMarket(createdAt)
  const negotiation = getNegotiationSignal(daysOnMarket, String(listingType || 'sale'))
  const docs = getDocChecklist(deslindadoStatus)
  const readyScore = Math.round((docs.filter((item) => item.ready).length / docs.length) * 100)

  return (
    <section className="rounded-2xl border border-[#0B2545]/10 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Plan de Compra RD</h2>
          <p className="text-sm text-gray-600">Lo que debes tener listo antes de separar o negociar esta propiedad.</p>
        </div>
        <div className="inline-flex items-center rounded-full bg-[#00A676]/10 px-3 py-1 text-xs font-semibold text-[#0B2545] border border-[#00A676]/20">
          Preparacion estimada: {readyScore}%
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-[#F8FBFF] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Caja inicial sugerida</p>
          <p className="mt-1 text-lg font-bold text-[#0B2545]">{formatMoney(upfrontCash, currency)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {listingType === 'rent' ? 'Referencia de 2 meses para renta y arranque.' : 'Referencia simple: inicial aproximado de 20% para comenzar evaluacion.'}
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-[#F8FBFF] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Compromiso mensual</p>
          <p className="mt-1 text-lg font-bold text-[#0B2545]">{formatMoney(estimatedMonthly, currency)}/mes</p>
          <p className="mt-1 text-xs text-gray-500">Incluye mantenimiento reportado cuando existe.</p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-[#F8FBFF] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Pulso de negociacion</p>
          <p className="mt-1 text-lg font-bold text-[#0B2545]">{negotiation.label}</p>
          <p className="mt-1 text-xs text-gray-500">
            {daysOnMarket !== null ? `${daysOnMarket} dias en mercado` : 'Tiempo publicado no visible'}
          </p>
        </article>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-[#0B2545]">Checklist del comprador</h3>
            <span className="text-[11px] text-gray-500">RD essentials</span>
          </div>
          <div className="space-y-2">
            {docs.map((item) => (
              <div key={item.label} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${item.ready ? 'bg-[#00A676] text-white' : 'bg-amber-100 text-amber-700'}`}>
                  {item.ready ? 'OK' : '!'}
                </span>
                <span className="text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#0B2545]/10 bg-gradient-to-br from-[#F7FAFF] to-[#ECFDF5] p-4">
          <h3 className="text-sm font-bold text-[#0B2545]">Consejo VIVENTA</h3>
          <p className="mt-2 text-sm text-gray-700">{negotiation.hint}</p>
          <div className="mt-3 rounded-lg bg-white/80 p-3 border border-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0B2545]">Contexto de zona</p>
            <p className="mt-1 text-xs text-gray-600">{getCityAngle(city)}</p>
          </div>
          <div className="mt-3 rounded-lg bg-white/80 p-3 border border-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0B2545]">Cierre</p>
            <p className="mt-1 text-xs text-gray-600">
              Los costos pueden variar segun el caso. Coordinamos una estimacion puntual cuando avances con una oferta.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}