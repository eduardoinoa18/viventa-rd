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
    listingType?: 'sale' | 'rent'
    minPrice?: string
    maxPrice?: string
    bedrooms?: string
    bathrooms?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Build filters from URL params
  const filters: ListingFilters = {
    city: searchParams.city,
    sector: searchParams.sector,
    propertyType: searchParams.type as any,
    listingType: searchParams.listingType,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    bedrooms: searchParams.bedrooms ? Number(searchParams.bedrooms) : undefined,
    bathrooms: searchParams.bathrooms ? Number(searchParams.bathrooms) : undefined,
  }

  // Server-side data fetch
  const { listings, total } = await getListings(filters, 100)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545] mb-2">
              Buscar propiedades
            </h1>
            <p className="text-gray-600">
              Encuentra tu propiedad ideal en República Dominicana
            </p>
          </div>

          <Suspense fallback={<div className="text-center py-12">Cargando...</div>}>
            <SearchResults initialListings={listings} initialTotal={total} />
          </Suspense>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
