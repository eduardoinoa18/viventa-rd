'use client'

type NeighborhoodIntelligencePanelProps = {
  city?: string
  sector?: string
  neighborhood?: string
  propertyType?: string
  listingType?: string
}

function safeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getZoneSignals(city: string, sector: string) {
  const zone = `${normalize(city)} ${normalize(sector)}`

  if (zone.includes('piantini') || zone.includes('naco') || zone.includes('bella vista')) {
    return {
      lifestyle: 'Ritmo ejecutivo con oferta premium, restaurantes y servicios de alto nivel.',
      commute: 'Buena conexion hacia ejes corporativos, aunque en horas pico conviene planificar accesos.',
      fit: 'Encaja con comprador final premium, relocation y renta ejecutiva.',
      angle: 'Zona que sostiene pricing defensivo cuando el inventario compite por calidad.',
    }
  }

  if (zone.includes('punta cana') || zone.includes('bavaro') || zone.includes('cap cana')) {
    return {
      lifestyle: 'Entorno resort y turismo con foco en segunda vivienda y demanda internacional.',
      commute: 'La movilidad se organiza mejor por corredores y acceso vehicular; revisar cercania a playa o aeropuerto cambia mucho la percepcion.',
      fit: 'Ideal para inversionista de renta corta, comprador vacacional o perfil internacional.',
      angle: 'El valor diferencial suele estar en amenidades, administracion y cercania a polos turisticos.',
    }
  }

  if (zone.includes('santiago')) {
    return {
      lifestyle: 'Mercado urbano con fuerte componente familiar y profesional.',
      commute: 'El atractivo mejora si resuelve colegios, clinicas y acceso a vias principales.',
      fit: 'Muy funcional para residencia principal y demanda local consolidada.',
      angle: 'La absorcion depende bastante de precio de entrada y facilidad de acceso.',
    }
  }

  if (zone.includes('samana') || zone.includes('puerto plata')) {
    return {
      lifestyle: 'Ambiente mas relajado con foco en costa, retiro o escapada.',
      commute: 'La conectividad importa mas por proximidad a aeropuerto, playa y servicios base.',
      fit: 'Bueno para comprador lifestyle y renta vacacional selectiva.',
      angle: 'La narrativa de entorno y vistas pesa casi tanto como el metraje.',
    }
  }

  return {
    lifestyle: 'Zona con mezcla de demanda local y oportunidades por microsector.',
    commute: 'La experiencia de llegada, servicios cercanos y accesos siguen siendo los drivers principales.',
    fit: 'Conviene perfilar si el activo responde mejor a residencia, inversion o renta.',
    angle: 'El pricing mejora cuando la publicacion deja clara la propuesta de vida diaria de la zona.',
  }
}

export default function NeighborhoodIntelligencePanel({
  city,
  sector,
  neighborhood,
  propertyType,
  listingType,
}: NeighborhoodIntelligencePanelProps) {
  const cityLabel = safeText(city) || 'la zona'
  const areaLabel = safeText(sector) || safeText(neighborhood) || 'microsector'
  const signals = getZoneSignals(cityLabel, areaLabel)

  return (
    <section className="rounded-2xl border border-[#0B2545]/10 bg-gradient-to-br from-[#FFFDF7] via-white to-[#F6FBFF] p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0B2545] sm:text-2xl">Inteligencia de sector</h2>
          <p className="text-sm text-gray-600">Contexto de estilo de vida, movilidad y demanda para leer mejor {cityLabel}.</p>
        </div>
        <div className="inline-flex rounded-full bg-[#0B2545] px-3 py-1 text-xs font-semibold text-white">
          {areaLabel}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Lifestyle</p>
          <p className="mt-2 text-sm leading-6 text-gray-700">{signals.lifestyle}</p>
        </article>
        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Movilidad</p>
          <p className="mt-2 text-sm leading-6 text-gray-700">{signals.commute}</p>
        </article>
        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Perfil ideal</p>
          <p className="mt-2 text-sm leading-6 text-gray-700">{signals.fit}</p>
        </article>
        <article className="rounded-xl border border-[#0B2545]/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2545]">Lectura comercial</p>
          <p className="mt-2 text-sm leading-6 text-gray-700">{signals.angle}</p>
        </article>
      </div>

      <div className="mt-4 rounded-xl border border-[#00A676]/20 bg-[#F0FBF6] p-4 text-sm text-gray-700">
        <span className="font-semibold text-[#0B2545]">Lectura VIVENTA:</span>{' '}
        {safeText(propertyType) || 'Esta propiedad'} en {cityLabel} para {listingType === 'rent' ? 'alquiler' : 'venta'} gana traccion cuando se comunica con claridad la rutina que resuelve: accesos, servicios y tipo de comprador que mas valora este sector.
      </div>
    </section>
  )
}