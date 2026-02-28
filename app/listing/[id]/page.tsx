'use client'
import { useEffect, useState } from 'react'
import { db, auth } from '../../../lib/firebaseClient'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { useParams } from 'next/navigation'
import Head from 'next/head'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import WhatsAppButton from '../../../components/WhatsAppButton'
import PropertyInquiryForm from '../../../components/PropertyInquiryForm'
import StructuredData from '../../../components/StructuredData'
import RegistrationPrompt from '../../../components/RegistrationPrompt'
import ImageGalleryCarousel from '../../../components/ImageGalleryCarousel'
import ShareButtons from '../../../components/ShareButtons'
import SimilarProperties from '../../../components/SimilarProperties'
import InvestmentInsightPanel from '../../../components/InvestmentInsightPanel'
import MortgageCalculator from '../../../components/MortgageCalculator'
import WhatsAppFloatingCTA from '../../../components/WhatsAppFloatingCTA'
import { formatCurrency, convertCurrency, getUserCurrency, type Currency } from '../../../lib/currency'
import { generatePropertySchema } from '../../../lib/seoUtils'
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaParking, FaBuilding, FaCalendar } from 'react-icons/fa'
import { usePageViewTracking } from '@/hooks/useAnalytics'
import { trackListingView } from '@/lib/analyticsService'

type ListingUnit = {
  unitNumber: string
  modelType: string
  sizeMt2: number
  price: number
  status: 'available' | 'sold' | 'reserved'
}

export default function ListingDetail(){
  usePageViewTracking()
  const params = useParams()
  const id = params?.id
  const [listing,setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>('all')

  const normalizeImages = (data: any): string[] => {
    const images = Array.isArray(data?.images) ? data.images.filter(Boolean) : []
    if (images.length > 0) return images
    return [data?.mainImage, data?.image, data?.main_photo_url].filter(Boolean)
  }

  const normalizeVideoUrl = (url?: string): string | null => {
    if (!url) return null
    try {
      const parsed = new URL(url)
      if (parsed.hostname.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v')
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }
      if (parsed.hostname.includes('youtu.be')) {
        const videoId = parsed.pathname.replace('/', '')
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }
      if (parsed.hostname.includes('vimeo.com')) {
        const videoId = parsed.pathname.split('/').filter(Boolean)[0]
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null
      }
      return null
    } catch {
      return null
    }
  }

  // Check session for agent-to-agent features
  useEffect(() => {
    let cancelled = false
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (cancelled) return
        setCurrentSession(res.ok ? json.session : null)
      } catch {
        if (!cancelled) setCurrentSession(null)
      } finally {
        if (!cancelled) setSessionLoading(false)
      }
    }
    loadSession()
    return () => {
      cancelled = true
    }
  }, [])
  
  useEffect(() => {
    if (!id) return
    let isMounted = true
    setLoading(true)

    fetch(`/api/properties/${id}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!isMounted) return

        if (res.ok && json.ok && json.data) {
          const data = json.data
          const normalized = { ...data, id: data.id, images: normalizeImages(data) }
          setListing(normalized)

          if (db && data.id) {
            updateDoc(doc(db, 'properties', data.id), { views: increment(1) })
              .catch((err: any) => console.error('Error updating views:', err))
          }

          const user = auth.currentUser
          trackListingView(
            data.id,
            { title: data.title, price: data.price, city: data.city },
            user?.uid,
            user?.uid ? 'user' : null
          )
          return
        }

        setListing(null)
      })
      .catch((err) => {
        console.error('Listing fetch error:', err)
        if (isMounted) setListing(null)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  // Currency listener
  useEffect(() => {
    setCurrency(getUserCurrency())
    const onCurrency = (e: Event) => {
      const detail = (e as CustomEvent).detail as { currency: Currency }
      if (detail?.currency) setCurrency(detail.currency)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('currencyChanged', onCurrency as EventListener)
      return () => window.removeEventListener('currencyChanged', onCurrency as EventListener)
    }
  }, [])

  useEffect(() => {
    setSelectedModel('all')
  }, [listing?.id])
  
  // Show loading while either listing or session is still loading
  if(loading || sessionLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A6A6] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando propiedad...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }
  
  if(!listing) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Propiedad no encontrada</h1>
            <p className="mt-2 text-gray-600">La propiedad que buscas no existe o ha sido eliminada.</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // Restrict visibility for non-active listings (allow admins and owners)
  const isOwnerOrAdmin = currentSession && (
    currentSession.role === 'master_admin' ||
    currentSession.uid === listing.agentId ||
    currentSession.uid === listing.ownerId
  )
  
  // Allow viewing if: listing is active OR user is owner/admin
  const canView = !listing.status || listing.status === 'active' || isOwnerOrAdmin
  
  if (!canView) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg text-center bg-white rounded-xl shadow p-8">
            <h1 className="text-2xl font-bold text-[#0B2545]">Listado en revisión</h1>
            <p className="mt-2 text-gray-600">Esta propiedad está pendiente de aprobación y aún no es pública.</p>
            <a href="/search" className="inline-block mt-6 px-5 py-3 bg-[#00A676] text-white rounded-lg font-medium hover:bg-[#008c5c]">Ver más propiedades</a>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const listingCurrency = (listing.currency || 'USD') as Currency
  const listingPrice = Number(listing.price || 0)
  const priceUsd = listingCurrency === 'USD'
    ? listingPrice
    : convertCurrency(listingPrice, 'DOP', 'USD')
  const priceDop = listingCurrency === 'DOP'
    ? listingPrice
    : convertCurrency(listingPrice, 'USD', 'DOP')
  const primaryCurrency: Currency = currency
  const secondaryCurrency: Currency = currency === 'USD' ? 'DOP' : 'USD'
  const primaryPrice = primaryCurrency === 'USD' ? priceUsd : priceDop
  const secondaryPrice = secondaryCurrency === 'USD' ? priceUsd : priceDop

  const units: ListingUnit[] = Array.isArray(listing.units)
    ? listing.units
      .filter((unit: any) => unit && (unit.unitNumber || unit.modelType || unit.model))
      .map((unit: any) => {
        const rawStatus = String(unit.status || 'available') as ListingUnit['status']
        const status: ListingUnit['status'] = rawStatus === 'reserved' || rawStatus === 'sold' ? rawStatus : 'available'
        return {
          unitNumber: String(unit.unitNumber || '').trim(),
          modelType: String(unit.modelType || unit.model || 'General').trim(),
          sizeMt2: Number(unit.sizeMt2 ?? unit.area ?? 0),
          price: Number(unit.price || 0),
          status,
        }
      })
    : []
  const hasUnits = units.length > 0
  const availableUnits = units.filter((unit) => unit.status === 'available')
  const unitPoolForRange = availableUnits.length > 0 ? availableUnits : units
  const unitModels = Array.from(new Set(units.map((unit) => (unit.modelType || '').trim()).filter(Boolean)))
  const filteredUnits = units.filter((unit) => selectedModel === 'all' || unit.modelType === selectedModel)

  const unitPriceValues = unitPoolForRange.map((unit) => Number(unit.price || 0)).filter((value) => value > 0)
  const unitAreaValues = unitPoolForRange.map((unit) => Number(unit.sizeMt2 || 0)).filter((value) => value > 0)

  const minUnitPrice = unitPriceValues.length > 0 ? Math.min(...unitPriceValues) : 0
  const maxUnitPrice = unitPriceValues.length > 0 ? Math.max(...unitPriceValues) : 0
  const minUnitArea = unitAreaValues.length > 0 ? Math.min(...unitAreaValues) : 0
  const maxUnitArea = unitAreaValues.length > 0 ? Math.max(...unitAreaValues) : 0

  const rangePriceSource = minUnitPrice > 0 ? minUnitPrice : listingPrice
  const rangePriceUsd = listingCurrency === 'USD'
    ? rangePriceSource
    : convertCurrency(rangePriceSource, 'DOP', 'USD')
  const rangePriceDop = listingCurrency === 'DOP'
    ? rangePriceSource
    : convertCurrency(rangePriceSource, 'USD', 'DOP')
  const fromPriceText = formatCurrency(primaryCurrency === 'USD' ? rangePriceUsd : rangePriceDop, { currency: primaryCurrency })
  const fromPriceSecondaryText = formatCurrency(secondaryCurrency === 'USD' ? rangePriceUsd : rangePriceDop, { currency: secondaryCurrency })

  const modelUnitPoolForRange = selectedModel === 'all'
    ? unitPoolForRange
    : unitPoolForRange.filter((unit) => unit.modelType === selectedModel)
  const modelUnitPriceValues = modelUnitPoolForRange.map((unit) => Number(unit.price || 0)).filter((value) => value > 0)
  const modelRangePrice = modelUnitPriceValues.length > 0 ? Math.min(...modelUnitPriceValues) : rangePriceSource
  const modelRangePriceUsd = listingCurrency === 'USD'
    ? modelRangePrice
    : convertCurrency(modelRangePrice, 'DOP', 'USD')
  const modelRangePriceDop = listingCurrency === 'DOP'
    ? modelRangePrice
    : convertCurrency(modelRangePrice, 'USD', 'DOP')
  const modelFromPriceText = formatCurrency(primaryCurrency === 'USD' ? modelRangePriceUsd : modelRangePriceDop, { currency: primaryCurrency })
  const modelFromPriceSecondaryText = formatCurrency(secondaryCurrency === 'USD' ? modelRangePriceUsd : modelRangePriceDop, { currency: secondaryCurrency })

  const computedAvailableUnits = hasUnits ? availableUnits.length : Number(listing.availableUnits || 0)
  const computedSoldUnits = hasUnits ? units.filter((unit) => unit.status === 'sold').length : Number(listing.soldUnits || 0)
  const computedReservedUnits = hasUnits ? units.filter((unit) => unit.status === 'reserved').length : 0
  const computedTotalUnits = hasUnits ? units.length : Number(listing.totalUnits || 0)

  const terrain = listing.terrainDetails || {}
  const terrainUtilities = Array.isArray(terrain.utilitiesAvailable)
    ? terrain.utilitiesAvailable.filter(Boolean)
    : []
  
  // Generate structured data for SEO
  const propertySchema = listing ? generatePropertySchema({
    id: listing.id,
    title: listing.title,
    description: listing.description || `${listing.title} en ${listing.city}`,
    price: listing.price || 0,
    currency: listing.currency || 'USD',
    location: `${listing.city || ''}${listing.sector ? ', ' + listing.sector : ''}`,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    area: listing.area,
    images: [listing.coverImage, ...(listing.images || [])].filter(Boolean),
    agentName: listing.agentName
  }) : null

  // Breadcrumb schema
  const breadcrumbSchema = listing ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://viventa-rd.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Propiedades",
        "item": "https://viventa-rd.com/search"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": listing.title,
        "item": `https://viventa-rd.com/listing/${listing.id}`
      }
    ]
  } : null
  
  // Generate meta description
  const metaDescription = listing.description
    ? listing.description.substring(0, 155) + '...'
    : `${listing.title} en ${listing.city}. Desde ${formatCurrency(rangePriceSource || listing.price || 0, { currency: listing.currency || 'USD' })}${maxUnitPrice > minUnitPrice ? ` hasta ${formatCurrency(maxUnitPrice, { currency: listing.currency || 'USD' })}` : ''}.${minUnitArea > 0 ? ` Metrajes desde ${minUnitArea}m².` : ''}`;
  
  const metaTitle = `${listing.title} - VIVENTA RD`;
  const propertyUrl = `https://viventa-rd.com/listing/${listing.id}`;
  const mainImage = listing.coverImage || listing.images?.[0] || listing.mainImage || listing.image || listing.main_photo_url || '/logo.png';
  const promoVideoEmbedUrl = normalizeVideoUrl(listing.promoVideoUrl);

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{metaTitle}</title>
        <meta name="title" content={metaTitle} />
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={`${listing.propertyType}, ${listing.listingType}, ${listing.city}, ${listing.sector}, propiedad, inmueble, República Dominicana, VIVENTA`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={propertyUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={mainImage} />
        <meta property="og:site_name" content="VIVENTA RD" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={propertyUrl} />
        <meta property="twitter:title" content={metaTitle} />
        <meta property="twitter:description" content={metaDescription} />
        <meta property="twitter:image" content={mainImage} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="Spanish" />
        <meta name="author" content="VIVENTA RD" />
        <link rel="canonical" href={propertyUrl} />
      </Head>
      {propertySchema && <StructuredData data={propertySchema} />}
      {breadcrumbSchema && <StructuredData data={breadcrumbSchema} />}
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-[#0B2545] mb-2">{listing.title}</h1>
                <div className="flex items-center text-gray-600">
                  <FaMapMarkerAlt className="mr-2 text-[#FF6B35]" />
                  <span>{listing.city || 'N/A'} • {listing.sector || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3" />
            </div>
          </div>

          {/* Investment Insight Panel - Above the fold */}
          <InvestmentInsightPanel listing={listing} className="mb-6" />
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enhanced Image Gallery Carousel */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden p-4">
                <ImageGalleryCarousel 
                  images={listing.images || []} 
                  title={listing.title} 
                />
              </div>

              {/* Share Buttons */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <ShareButtons 
                  url={propertyUrl}
                  title={listing.title}
                  description={metaDescription}
                />
              </div>

              {listing.inventoryMode === 'project' && listing.projectMapImage && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Mapa del Proyecto</h2>
                  <img
                    src={listing.projectMapImage}
                    alt={`Mapa del proyecto ${listing.title}`}
                    className="w-full rounded-lg border border-gray-200"
                    loading="lazy"
                  />
                </div>
              )}

              {hasUnits && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                    <h2 className="text-2xl font-bold text-[#0B2545]">Inventario de Unidades</h2>
                    <div className="text-sm text-gray-600">
                      {computedAvailableUnits} disponibles · {computedReservedUnits} separadas · {computedSoldUnits} vendidas
                    </div>
                  </div>

                  {unitModels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        className={`px-3 py-1 rounded-full text-sm border ${selectedModel === 'all' ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'border-gray-300 text-gray-700 hover:border-[#0B2545]'}`}
                        onClick={() => setSelectedModel('all')}
                      >
                        Todos
                      </button>
                      {unitModels.map((model) => (
                        <button
                          key={model}
                          className={`px-3 py-1 rounded-full text-sm border ${selectedModel === model ? 'bg-[#00A676] text-white border-[#00A676]' : 'border-gray-300 text-gray-700 hover:border-[#00A676]'}`}
                          onClick={() => setSelectedModel(model)}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Unidad</th>
                          <th className="px-4 py-3 font-medium">Modelo</th>
                          <th className="px-4 py-3 font-medium">m²</th>
                          <th className="px-4 py-3 font-medium">Precio</th>
                          <th className="px-4 py-3 font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUnits.map((unit, idx) => (
                          <tr key={`${unit.unitNumber}-${idx}`} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-medium text-[#0B2545]">{unit.unitNumber}</td>
                            <td className="px-4 py-3">{unit.modelType || 'N/A'}</td>
                            <td className="px-4 py-3">{unit.sizeMt2 || 0}</td>
                            <td className="px-4 py-3 font-semibold text-[#0B2545]">{formatCurrency(unit.price || 0, { currency: listing.currency || 'USD' })}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                unit.status === 'available'
                                  ? 'bg-green-100 text-green-700'
                                  : unit.status === 'reserved'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {unit.status === 'available' ? 'Disponible' : unit.status === 'reserved' ? 'Separada' : 'Vendida'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {promoVideoEmbedUrl && (
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Video Promocional</h2>
                  <div className="relative w-full overflow-hidden rounded-lg pt-[56.25%]">
                    <iframe
                      src={promoVideoEmbedUrl}
                      title={`Video promocional de ${listing.title}`}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              
              {/* Property Features */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Características Principales</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {listing.bedrooms > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00A6A6]/10 rounded-lg flex items-center justify-center">
                        <FaBed className="text-[#00A6A6] text-xl" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.bedrooms}</div>
                        <div className="text-sm text-gray-600">Habitaciones</div>
                      </div>
                    </div>
                  )}
                  {listing.bathrooms > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00A6A6]/10 rounded-lg flex items-center justify-center">
                        <FaBath className="text-[#00A6A6] text-xl" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.bathrooms}</div>
                        <div className="text-sm text-gray-600">Baños</div>
                      </div>
                    </div>
                  )}
                  {listing.area > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00A6A6]/10 rounded-lg flex items-center justify-center">
                        <FaRulerCombined className="text-[#00A6A6] text-xl" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.area}</div>
                        <div className="text-sm text-gray-600">m² de construcción</div>
                      </div>
                    </div>
                  )}
                  {listing.parkingSpaces > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00A6A6]/10 rounded-lg flex items-center justify-center">
                        <FaParking className="text-[#00A6A6] text-xl" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.parkingSpaces}</div>
                        <div className="text-sm text-gray-600">Parqueos</div>
                      </div>
                    </div>
                  )}
                  {listing.lotSize > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00A6A6]/10 rounded-lg flex items-center justify-center">
                        <FaBuilding className="text-[#00A6A6] text-xl" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.lotSize}</div>
                        <div className="text-sm text-gray-600">m² de terreno</div>
                      </div>
                    </div>
                  )}
                  {listing.yearBuilt && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00A6A6]/10 rounded-lg flex items-center justify-center">
                        <FaCalendar className="text-[#00A6A6] text-xl" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.yearBuilt}</div>
                        <div className="text-sm text-gray-600">Año construcción</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Features/Amenities */}
                {listing.features && listing.features.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-[#0B2545] mb-3">Amenidades</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {listing.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-700">
                          <div className="w-2 h-2 bg-[#00A676] rounded-full"></div>
                          <span className="capitalize">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Descripción</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {listing.description || 'Sin descripción disponible'}
                </p>
              </div>

              {listing.propertyType === 'land' && (terrain.zoningType || terrain.maxBuildHeight || terrain.buildPotential || terrainUtilities.length > 0) && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Potencial de Desarrollo</h2>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {terrain.zoningType && (
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="text-gray-500">Zonificación</div>
                        <div className="font-semibold text-[#0B2545]">{terrain.zoningType}</div>
                      </div>
                    )}
                    {terrain.maxBuildHeight && (
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="text-gray-500">Altura máxima</div>
                        <div className="font-semibold text-[#0B2545]">{terrain.maxBuildHeight}</div>
                      </div>
                    )}
                  </div>
                  {terrainUtilities.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-[#0B2545] mb-2">Servicios disponibles</h3>
                      <div className="flex flex-wrap gap-2">
                        {terrainUtilities.map((service: string, idx: number) => (
                          <span key={`${service}-${idx}`} className="px-3 py-1 text-xs rounded-full bg-[#00A6A6]/10 text-[#0B2545] border border-[#00A6A6]/20">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {terrain.buildPotential && (
                    <div className="mt-4 p-4 rounded-lg bg-[#0B2545]/5 border border-[#0B2545]/10">
                      <h3 className="font-semibold text-[#0B2545] mb-1">Sugerencia de uso</h3>
                      <p className="text-gray-700 whitespace-pre-line">{terrain.buildPotential}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mortgage Calculator */}
              <MortgageCalculator 
                defaultPrice={Number(listing.price || 0)}
                currency={listing.currency || 'USD'}
              />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* WhatsApp Floating CTA - Desktop Sidebar */}
              <WhatsAppFloatingCTA 
                agent={{
                  id: listing.agentId || '',
                  name: listing.agentName || 'Agente VIVENTA',
                  phone: listing.agentPhone || '+18095551234',
                  email: listing.agentEmail || '',
                  photo: listing.agentPhoto || '',
                  verificationTier: listing.agentVerificationTier || undefined,
                  avgResponseTime: listing.agentResponseTime || undefined
                }}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  address: `${listing.city || ''}, ${listing.sector || ''}`,
                  price: Number(listing.price || 0),
                  currency: listing.currency || 'USD'
                }}
              />

              {/* Price Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <div className="mb-6">
                  <div className="text-4xl font-bold text-[#FF6B35]">
                    {listing.inventoryMode === 'project' && rangePriceSource > 0
                      ? `Desde ${selectedModel === 'all' ? fromPriceText : modelFromPriceText}`
                      : formatCurrency(primaryPrice, { currency: primaryCurrency })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {listing.inventoryMode === 'project' && rangePriceSource > 0
                      ? (selectedModel === 'all' ? fromPriceSecondaryText : modelFromPriceSecondaryText)
                      : formatCurrency(secondaryPrice, { currency: secondaryCurrency })}
                  </div>
                  {listing.inventoryMode === 'project' && selectedModel !== 'all' && (
                    <div className="text-xs text-[#0B2545] mt-1">Tipo seleccionado: {selectedModel}</div>
                  )}
                </div>

                {Number(listing.maintenanceFee || 0) > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="text-sm text-gray-500">Mantenimiento</div>
                    <div className="font-semibold text-[#0B2545]">
                      {formatCurrency(Number(listing.maintenanceFee || 0), { currency: listing.maintenanceFeeCurrency || 'USD' })}
                    </div>
                    {listing.maintenanceInfo && (
                      <p className="text-xs text-gray-600 mt-1">{listing.maintenanceInfo}</p>
                    )}
                  </div>
                )}

                {listing.inventoryMode === 'project' && (
                  <div className="mb-4 p-3 rounded-lg bg-[#0B2545]/5 border border-[#0B2545]/10">
                    <div className="text-sm text-gray-500">Disponibilidad del proyecto</div>
                    <div className="font-semibold text-[#0B2545]">
                      {computedAvailableUnits} disponibles de {computedTotalUnits} unidades
                    </div>
                    {maxUnitPrice > minUnitPrice && (
                      <div className="text-xs text-gray-600 mt-1">
                        Rango: {formatCurrency(minUnitPrice, { currency: listing.currency || 'USD' })} - {formatCurrency(maxUnitPrice, { currency: listing.currency || 'USD' })}
                      </div>
                    )}
                    {maxUnitArea > minUnitArea && (
                      <div className="text-xs text-gray-600 mt-1">
                        Metraje: {minUnitArea}m² - {maxUnitArea}m²
                      </div>
                    )}
                  </div>
                )}
                
                {/* Contact Actions */}
                <div className="space-y-3">
                  <WhatsAppButton 
                    phoneNumber={listing.agentPhone || '+18095551234'}
                    propertyTitle={listing.title}
                    propertyId={listing.id}
                    propertyPrice={String(listing.price || 0)}
                    agentName={listing.agentName}
                  />
                  
                  <button
                    onClick={() => setShowInquiryForm(true)}
                    className="w-full px-6 py-3 bg-[#0B2545] hover:bg-[#0B2545]/90 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    📧 Enviar mensaje
                  </button>
                  
                  <button className="w-full px-6 py-3 border-2 border-[#00A6A6] text-[#00A6A6] hover:bg-[#00A6A6] hover:text-white rounded-lg font-medium transition-colors duration-200">
                    📞 Solicitar llamada
                  </button>
                </div>
                
                {/* Agent Info */}
                {(listing.agentName || listing.agentEmail) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-[#0B2545] mb-2">Agente</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                      <div>
                        <div className="font-medium text-[#0B2545]">{listing.agentName || 'Agente VIVENTA'}</div>
                        <div className="text-sm text-gray-600">{listing.agentPhone || listing.agentEmail || 'Contacto disponible'}</div>
                        {listing.representation && (
                          <div className="text-xs text-gray-500 mt-1">
                            {listing.representation === 'broker' && (
                              <>Inmobiliaria: <span className="text-gray-700">{listing.brokerName || 'N/D'}</span></>
                            )}
                            {listing.representation === 'builder' && (
                              <>Constructor: <span className="text-gray-700">{listing.builderName || 'N/D'}</span></>
                            )}
                            {listing.representation === 'independent' && (
                              <span>Agente Independiente</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Agent/Company Attribution - Similar to Zillow */}
          <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#00A676] to-[#00A6A6] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {listing.agentName ? listing.agentName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0B2545]">{listing.agentName || 'Agente VIVENTA'}</h3>
                  <p className="text-gray-600">Agente Inmobiliario</p>
                  {listing.agentEmail && (
                    <p className="text-sm text-gray-500">{listing.agentEmail}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowInquiryForm(true)}
                  className="px-6 py-3 bg-[#00A676] hover:bg-[#008c5c] text-white rounded-lg font-semibold transition-colors"
                >
                  Contactar Agente
                </button>
                <a
                  href="/agents"
                  className="text-sm text-center text-[#00A6A6] hover:underline"
                >
                  Ver perfil completo →
                </a>
              </div>
            </div>

            <div className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Sobre esta propiedad</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Listado ID: <span className="font-mono text-gray-900">{listing.listingId || listing.id}</span></p>
                    <p>• Tipo: <span className="text-gray-900 capitalize">{listing.propertyType}</span></p>
                    <p>• Transacción: <span className="text-gray-900 capitalize">{listing.listingType === 'sale' ? 'Venta' : 'Alquiler'}</span></p>
                    {listing.inventoryMode === 'project' && (
                      <p>• Inventario: <span className="text-gray-900">{computedAvailableUnits}/{computedTotalUnits} disponibles</span></p>
                    )}
                    {listing.views > 0 && <p>• Vistas: <span className="text-gray-900">{listing.views.toLocaleString()}</span></p>}
                    {listing.createdAt && (
                      <p>• Publicado: <span className="text-gray-900">{new Date(listing.createdAt.seconds * 1000).toLocaleDateString('es-DO')}</span></p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Listado por</h4>
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src="/logo.png" 
                      alt="VIVENTA" 
                      className="h-8 w-auto"
                      onError={(e) => { e.currentTarget.src = '/logo.png' }}
                    />
                    <div>
                      <p className="font-bold text-gray-900">VIVENTA</p>
                      <p className="text-xs text-gray-500">Plataforma Inmobiliaria #1 en RD</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Todos los contactos y consultas pasan a través de VIVENTA para tu seguridad y protección.
                  </p>
                </div>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* Documents (visible based on permissions) */}
              {Array.isArray(listing.documents) && listing.documents.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Documentos</h4>
                  <div className="space-y-2">
                    {listing.documents
                      .filter((doc: any) => {
                        if (doc.visibility === 'public') return true
                        if (currentSession?.role === 'agent' && (doc.visibility === 'agents-only' || doc.visibility === 'public')) return true
                        if (currentSession?.uid && currentSession.uid === listing.agentId) return true
                        return false
                      })
                      .map((doc: any, idx: number) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"
                        >
                          <div>
                            <p className="font-medium text-sm text-gray-800">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.type} • {doc.visibility}</p>
                          </div>
                          <span className="text-[#00A676] text-sm font-semibold">Descargar →</span>
                        </a>
                      ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>Nota:</strong> La información de este listado es proporcionada por el agente y debe ser verificada. 
                VIVENTA actúa como plataforma intermediaria entre compradores y vendedores. Las transacciones inmobiliarias 
                están sujetas a disponibilidad y pueden cambiar sin previo aviso. Se recomienda realizar inspecciones 
                independientes antes de cualquier transacción.
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Floating CTA - Mobile */}
        <div className="lg:hidden">
          <WhatsAppFloatingCTA 
            agent={{
              id: listing.agentId || '',
              name: listing.agentName || 'Agente VIVENTA',
              phone: listing.agentPhone || '+18095551234',
              email: listing.agentEmail || '',
              photo: listing.agentPhoto || '',
              verificationTier: listing.agentVerificationTier || undefined,
              avgResponseTime: listing.agentResponseTime || undefined
            }}
            listing={{
              id: listing.id,
              title: listing.title,
              address: `${listing.city || ''}, ${listing.sector || ''}`,
              price: Number(listing.price || 0),
              currency: listing.currency || 'USD'
            }}
          />
        </div>

        {/* Similar Properties */}
        {listing.propertyType && listing.city && listing.price && (
          <div className="container mx-auto px-4 max-w-7xl">
            <SimilarProperties 
              currentPropertyId={listing.id}
              propertyType={listing.propertyType}
              city={listing.city}
              priceRange={{
                min: listing.price * 0.7,
                max: listing.price * 1.3
              }}
            />
          </div>
        )}
      </main>
      {showInquiryForm && (
        <PropertyInquiryForm
          propertyId={listing.id}
          propertyTitle={listing.title}
          agentName={listing.agentName}
          agentEmail={listing.agentEmail}
          onClose={() => setShowInquiryForm(false)}
        />
      )}
      <RegistrationPrompt />
      <Footer />
    </>
  )
}
