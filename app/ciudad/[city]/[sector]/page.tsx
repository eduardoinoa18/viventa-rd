import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import PropertyCard from '@/components/PropertyCard'
import { getListings, getSectorsByCity } from '@/lib/listingService'
import type { Metadata } from 'next'
import Link from 'next/link'

interface SectorPageProps {
  params: {
    city: string
    sector: string
  }
}

export async function generateMetadata({ params }: SectorPageProps): Promise<Metadata> {
  const city = decodeURIComponent(params.city)
  const sector = decodeURIComponent(params.sector)

  return {
    title: `Propiedades en ${sector}, ${city} | VIVENTA RD`,
    description: `Encuentra apartamentos y casas en ${sector}, ${city}. El marketplace inmobiliario #1 en República Dominicana. Compra, vende o alquila con confianza.`,
    keywords: [
      `propiedades ${sector}`,
      `apartamentos ${sector}`,
      `casas ${sector}`,
      `${sector} ${city}`,
      'República Dominicana',
      'VIVENTA',
    ],
    openGraph: {
      title: `Propiedades en ${sector}, ${city} | VIVENTA RD`,
      description: `Descubre las mejores propiedades en ${sector}, ${city}.`,
      type: 'website',
    },
  }
}

export default async function SectorPage({ params }: SectorPageProps) {
  const city = decodeURIComponent(params.city)
  const sector = decodeURIComponent(params.sector)

  // Fetch listings for this city and sector
  const { listings, total } = await getListings({
    city,
    sector,
  }, 100)

  if (total === 0) {
    notFound()
  }

  // Calculate stats
  const forSale = listings.filter((l) => l.listingType === 'sale').length
  const forRent = listings.filter((l) => l.listingType === 'rent').length
  const avgPrice = listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length

  // Get property types
  const propertyTypes = Array.from(new Set(listings.map((l) => l.propertyType).filter(Boolean)))

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
            <Link href="/search" className="hover:text-[#FF6B35]">
              Buscar
            </Link>
            <span>/</span>
            <Link
              href={`/ciudad/${encodeURIComponent(city)}`}
              className="hover:text-[#FF6B35]"
            >
              {city}
            </Link>
            <span>/</span>
            <span className="text-[#0B2545] font-medium">{sector}</span>
          </div>

          {/* Hero Section */}
          <div className="bg-gradient-to-r from-[#0B2545] to-[#134074] text-white rounded-2xl p-8 mb-8">
            <h1 className="text-4xl font-bold mb-3">
              Propiedades en {sector}
            </h1>
            <p className="text-lg opacity-90 mb-2">{city}, República Dominicana</p>
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

          {/* Property Type Filters */}
          {propertyTypes.length > 1 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#0B2545] mb-3">
                Tipos de propiedad
              </h2>
              <div className="flex gap-2 flex-wrap">
                {propertyTypes.map((type) => (
                  <div
                    key={type}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg"
                  >
                    {type === 'apartment' ? 'Apartamentos' :
                     type === 'house' ? 'Casas' :
                     type === 'condo' ? 'Condos' :
                     type === 'penthouse' ? 'Penthouses' :
                     type === 'villa' ? 'Villas' :
                     type}
                  </div>
                ))}
              </div>
            </div>
          )}

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
              Vivir en {sector}, {city}
            </h2>
            <p className="text-gray-600">
              {sector} es uno de los sectores más populares de {city}. Con {total} 
              propiedades disponibles, VIVENTA te ayuda a encontrar tu hogar ideal en esta 
              zona privilegiada. Explora apartamentos modernos, casas amplias y más opciones 
              inmobiliarias de calidad.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
