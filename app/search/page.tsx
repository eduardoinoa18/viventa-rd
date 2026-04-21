import { Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import SearchResults from './SearchResults'
import { getListings, type ListingFilters } from '@/lib/listingService'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar Propiedades | VIVENTA RD',
  description: 'Encuentra apartamentos, casas y propiedades en venta o alquiler en República Dominicana. El marketplace inmobiliario #1.',
}

interface SearchPageProps {
  searchParams: {
    city?: string
    sector?: string
    type?: string
    agent?: string
    broker?: string
    featured?: string
    listingType?: 'sale' | 'rent'
    minPrice?: string
    maxPrice?: string
    bedrooms?: string
    bathrooms?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const filters: ListingFilters = {
    city: searchParams.city,
    sector: searchParams.sector,
    propertyType: searchParams.type as any,
    agent: searchParams.agent,
    broker: searchParams.broker,
    featured: searchParams.featured === '1' || searchParams.featured === 'true',
    listingType: searchParams.listingType,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    bedrooms: searchParams.bedrooms ? Number(searchParams.bedrooms) : undefined,
    bathrooms: searchParams.bathrooms ? Number(searchParams.bathrooms) : undefined,
  }

  const { listings, total } = await getListings(filters, 100)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F7F8FA] pb-24 md:pb-0">
        {/* Page header */}
        <div className="bg-gradient-to-r from-[#0B2545] to-[#134074] px-4 py-8 md:py-10">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl font-extrabold text-white md:text-4xl">
              {searchParams.city
                ? `Propiedades en ${searchParams.city}`
                : 'Oportunidades Inmobiliarias en RD'}
            </h1>
            <p className="mt-1 text-sm text-white/70 md:text-base">
              {total > 0
                ? `${total} propiedades verificadas en los mejores mercados`
                : 'Inventario verificado en los mercados de mayor crecimiento de la República Dominicana'}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4">
          <Suspense fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-gray-200 h-72" />
              ))}
            </div>
          }>
            <SearchResults initialListings={listings} initialTotal={total} />
          </Suspense>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
