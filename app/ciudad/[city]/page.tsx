import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import PropertyCard from '@/components/PropertyCard'
import { getListings, getActiveCities } from '@/lib/listingService'
import type { Metadata } from 'next'
import Link from 'next/link'

interface CityPageProps {
  params: {
    city: string
  }
  searchParams: {
    type?: string
  }
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const city = decodeURIComponent(params.city)

  return {
    title: `Propiedades en ${city} | VIVENTA RD`,
    description: `Encuentra apartamentos, casas y propiedades en ${city}. El marketplace inmobiliario #1 en República Dominicana. Compra, vende o alquila con confianza.`,
    keywords: [`propiedades ${city}`, `apartamentos ${city}`, `casas ${city}`, `venta ${city}`, `alquiler ${city}`, 'República Dominicana', 'VIVENTA'],
    openGraph: {
      title: `Propiedades en ${city} | VIVENTA RD`,
      description: `Descubre las mejores propiedades en ${city}, República Dominicana.`,
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  // Pre-render top cities at build time
  const cities = await getActiveCities()
  
  return cities.slice(0, 20).map((city) => ({
    city: encodeURIComponent(city),
  }))
}

export default async function CityPage({ params, searchParams }: CityPageProps) {
  const city = decodeURIComponent(params.city)

  // Fetch listings for this city
  const { listings, total } = await getListings({
    city,
    propertyType: searchParams.type as any,
  }, 100)

  if (total === 0) {
    notFound()
  }

  // Calculate stats
  const forSale = listings.filter((l) => l.listingType === 'sale').length
  const forRent = listings.filter((l) => l.listingType === 'rent').length
  const avgPrice = listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length

  // Get unique sectors
  const sectors = Array.from(new Set(listings.map((l) => l.sector).filter(Boolean)))

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-[#0B2545] to-[#134074] text-white rounded-2xl p-8 mb-8">
            <h1 className="text-4xl font-bold mb-3">
              Propiedades en {city}
            </h1>
            <p className="text-xl opacity-90 mb-6">
              {total} {total === 1 ? 'propiedad disponible' : 'propiedades disponibles'}
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-2xl">
              <div>
                <div className="text-3xl font-bold">{forSale}</div>
                <div className="text-sm opacity-80">En venta</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{forRent}</div>
                <div className="text-sm opacity-80">En alquiler</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  ${(avgPrice / 1000).toFixed(0)}K
                </div>
                <div className="text-sm opacity-80">Precio promedio</div>
              </div>
            </div>
          </div>

          {/* Sectors Navigation */}
          {sectors.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#0B2545] mb-4">
                Sectores en {city}
              </h2>
              <div className="flex flex-wrap gap-2">
                {sectors.map((sector) => (
                  <Link
                    key={sector}
                    href={`/ciudad/${encodeURIComponent(city)}/${encodeURIComponent(sector!)}`}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                  >
                    {sector}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Property Type Filters */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <Link
              href={`/ciudad/${encodeURIComponent(city)}`}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !searchParams.type
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-white border border-gray-300 hover:border-[#FF6B35]'
              }`}
            >
              Todas
            </Link>
            {['apartment', 'house', 'condo', 'penthouse'].map((type) => (
              <Link
                key={type}
                href={`/ciudad/${encodeURIComponent(city)}?type=${type}`}
                className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                  searchParams.type === type
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-white border border-gray-300 hover:border-[#FF6B35]'
                }`}
              >
                {type === 'apartment' ? 'Apartamentos' : 
                 type === 'house' ? 'Casas' : 
                 type === 'condo' ? 'Condos' : 
                 'Penthouses'}
              </Link>
            ))}
          </div>

          {/* Results Grid */}
          <Suspense fallback={<div className="text-center py-12">Cargando...</div>}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <PropertyCard key={listing.id} property={listing} />
              ))}
            </div>
          </Suspense>

          {/* SEO Content */}
          <div className="mt-12 prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-[#0B2545] mb-4">
              ¿Por qué comprar en {city}?
            </h2>
            <p className="text-gray-600">
              {city} es una de las ubicaciones más demandadas en República Dominicana. 
              Con {total} propiedades disponibles, VIVENTA te conecta con las mejores 
              oportunidades inmobiliarias en la zona. Desde apartamentos modernos hasta 
              casas espaciosas, encuentra la propiedad perfecta para ti.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
