'use client'
import { useEffect, useState } from 'react'
import { db, auth } from '../../../lib/firebaseClient'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { useParams, useRouter } from 'next/navigation'
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

type ListingMapHotspot = {
  id: string
  unitNumber: string
  label?: string
  xPercent: number
  yPercent: number
}

const PERCENT_POSITION_CLASS: Record<number, string> = {
  0: '0',
  5: '[5%]',
  10: '[10%]',
  15: '[15%]',
  20: '[20%]',
  25: '[25%]',
  30: '[30%]',
  35: '[35%]',
  40: '[40%]',
  45: '[45%]',
  50: '[50%]',
  55: '[55%]',
  60: '[60%]',
  65: '[65%]',
  70: '[70%]',
  75: '[75%]',
  80: '[80%]',
  85: '[85%]',
  90: '[90%]',
  95: '[95%]',
  100: 'full',
}

function percentToPositionClass(axis: 'left' | 'top', value: number) {
  const clamped = Math.max(0, Math.min(100, Math.round(value / 5) * 5))
  const token = PERCENT_POSITION_CLASS[clamped] || '0'
  return token === 'full' ? `${axis}-full` : `${axis}-${token}`
}

export default function ListingDetail(){
  usePageViewTracking()
  const params = useParams()
  const router = useRouter()
  const id = params?.id
  const [listing,setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<string>('')

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
    setSelectedUnitNumber('')
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
  const isAuthenticated = Boolean(currentSession?.uid)
  
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
  const selectedUnit = units.find((unit) => unit.unitNumber === selectedUnitNumber)

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
  const selectedUnitPrice = Number(selectedUnit?.price || 0)
  const selectedUnitPriceUsd = listingCurrency === 'USD'
    ? selectedUnitPrice
    : convertCurrency(selectedUnitPrice, 'DOP', 'USD')
  const selectedUnitPriceDop = listingCurrency === 'DOP'
    ? selectedUnitPrice
    : convertCurrency(selectedUnitPrice, 'USD', 'DOP')
  const selectedUnitPrimaryText = formatCurrency(primaryCurrency === 'USD' ? selectedUnitPriceUsd : selectedUnitPriceDop, { currency: primaryCurrency })
  const selectedUnitSecondaryText = formatCurrency(secondaryCurrency === 'USD' ? selectedUnitPriceUsd : selectedUnitPriceDop, { currency: secondaryCurrency })

  const ctaPriceSource = selectedUnitPrice > 0
    ? selectedUnitPrice
    : listing.inventoryMode === 'project'
      ? (selectedModel === 'all' ? rangePriceSource : modelRangePrice)
      : listingPrice

  const computedAvailableUnits = hasUnits ? availableUnits.length : Number(listing.availableUnits || 0)
  const computedSoldUnits = hasUnits ? units.filter((unit) => unit.status === 'sold').length : Number(listing.soldUnits || 0)
  const computedReservedUnits = hasUnits ? units.filter((unit) => unit.status === 'reserved').length : 0
  const computedTotalUnits = hasUnits ? units.length : Number(listing.totalUnits || 0)

  const modelInsights = unitModels.map((model) => {
    const modelUnits = units.filter((unit) => unit.modelType === model)
    const modelAvailable = modelUnits.filter((unit) => unit.status === 'available')
    const source = modelAvailable.length > 0 ? modelAvailable : modelUnits
    const prices = source.map((unit) => unit.price).filter((value) => value > 0)
    const sizes = source.map((unit) => unit.sizeMt2).filter((value) => value > 0)

    return {
      model,
      available: modelAvailable.length,
      total: modelUnits.length,
      fromPrice: prices.length > 0 ? Math.min(...prices) : 0,
      fromMt2: sizes.length > 0 ? Math.min(...sizes) : 0,
    }
  })

  const mapHotspots: ListingMapHotspot[] = Array.isArray(listing.projectMapHotspots)
    ? listing.projectMapHotspots
      .filter((point: any) => point && point.unitNumber)
      .map((point: any) => ({
        id: String(point.id || point.unitNumber),
        unitNumber: String(point.unitNumber || ''),
        label: point.label ? String(point.label) : '',
        xPercent: Number(point.xPercent ?? 0),
        yPercent: Number(point.yPercent ?? 0),
      }))
      .filter((point: ListingMapHotspot) => point.unitNumber && point.xPercent >= 0 && point.xPercent <= 100 && point.yPercent >= 0 && point.yPercent <= 100)
    : []

  function getUnitStatus(unitNumber: string): ListingUnit['status'] | null {
    const unit = units.find((row) => row.unitNumber === unitNumber)
    return unit?.status || null
  }

  function getHotspotBadgeClass(status: ListingUnit['status'] | null) {
    if (status === 'available') return 'bg-green-500 border-green-600'
    if (status === 'reserved') return 'bg-yellow-400 border-yellow-500'
    if (status === 'sold') return 'bg-red-500 border-red-600'
    return 'bg-gray-500 border-gray-600'
  }

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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com').replace(/\/$/, '')
  const mainImageRaw = listing.coverImage || listing.images?.[0] || listing.mainImage || listing.image || listing.main_photo_url || '/logo.png'
  const mainImage = mainImageRaw?.startsWith('http') ? mainImageRaw : `${siteUrl}${mainImageRaw.startsWith('/') ? '' : '/'}${mainImageRaw}`
  const promoVideoEmbedUrl = normalizeVideoUrl(listing.promoVideoUrl);
  const hasCoordinates = Number.isFinite(Number(listing.lat)) && Number.isFinite(Number(listing.lng))
  const lat = hasCoordinates ? Number(listing.lat) : null
  const lng = hasCoordinates ? Number(listing.lng) : null
  const locationLabel = [listing.location, listing.neighborhood || listing.sector, listing.city].filter(Boolean).join(', ')
  const mapQuery = hasCoordinates
    ? `${lat},${lng}`
    : encodeURIComponent([listing.location, listing.neighborhood || listing.sector, listing.city, 'República Dominicana'].filter(Boolean).join(', '))
  const publicMapLink = `https://www.google.com/maps?q=${mapQuery}`
  const publicMapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`
  const authRedirectTarget = `/listing/${encodeURIComponent(String(listing.id || ''))}`

  function requireAccountForDetails() {
    router.push(`/signup?next=${encodeURIComponent(authRedirectTarget)}`)
  }

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
      
      {/* Mobile Sticky Price Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-[#FF6B35]">
              {listing.inventoryMode === 'project' && rangePriceSource > 0
                ? `Desde ${formatCurrency(primaryCurrency === 'USD' ? rangePriceUsd : rangePriceDop, { currency: primaryCurrency })}`
                : formatCurrency(primaryPrice, { currency: primaryCurrency })}
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(secondaryPrice, { currency: secondaryCurrency })}
            </div>
          </div>
          <button
            onClick={() => (isAuthenticated ? setShowInquiryForm(true) : requireAccountForDetails())}
            className="px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold text-sm whitespace-nowrap"
          >
            {isAuthenticated ? 'Contactar' : 'Crear cuenta'}
          </button>
        </div>
      </div>

      <main className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
        <div className="container mx-auto px-0 sm:px-4 py-0 sm:py-4 lg:py-8 max-w-7xl">
          
          {/* Image Gallery - Full Width on Mobile */}
          <div className="bg-white sm:rounded-xl shadow-sm overflow-hidden mb-4 sm:mb-6">
            <ImageGalleryCarousel 
              images={listing.images || []} 
              title={listing.title} 
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6 px-4 sm:px-0">
              
              {/* Property Title & Address - Mobile Optimized */}
              <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B2545] mb-2">{listing.title}</h1>
                <div className="flex items-center text-gray-600 text-sm sm:text-base mb-4">
                  <FaMapMarkerAlt className="mr-2 text-[#FF6B35] flex-shrink-0" />
                  <span>{locationLabel || `${listing.city || 'N/A'} • ${listing.neighborhood || listing.sector || 'N/A'}`}</span>
                </div>
                
                {/* Price - Desktop Only (mobile has sticky bar) */}
                <div className="hidden lg:block">
                  <div className="text-3xl xl:text-4xl font-bold text-[#FF6B35] mb-1">
                    {listing.inventoryMode === 'project' && selectedUnitPrice > 0
                      ? selectedUnitPrimaryText
                      : listing.inventoryMode === 'project' && rangePriceSource > 0
                      ? `Desde ${selectedModel === 'all' ? fromPriceText : modelFromPriceText}`
                      : formatCurrency(primaryPrice, { currency: primaryCurrency })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {listing.inventoryMode === 'project' && selectedUnitPrice > 0
                      ? selectedUnitSecondaryText
                      : listing.inventoryMode === 'project' && rangePriceSource > 0
                      ? (selectedModel === 'all' ? fromPriceSecondaryText : modelFromPriceSecondaryText)
                      : formatCurrency(secondaryPrice, { currency: secondaryCurrency })}
                  </div>
                </div>
              </div>

              {/* Key Features - Zillow Style - Above the fold */}
              <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {listing.propertyType !== 'land' && listing.bedrooms > 0 && (
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <FaBed className="text-[#00A6A6] text-xl" />
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.bedrooms}</div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Habitaciones</div>
                    </div>
                  )}
                  {listing.propertyType !== 'land' && listing.bathrooms > 0 && (
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <FaBath className="text-[#00A6A6] text-xl" />
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.bathrooms}</div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Baños</div>
                    </div>
                  )}
                  {listing.area > 0 && (
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <FaRulerCombined className="text-[#00A6A6] text-xl" />
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.area}</div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">{listing.propertyType === 'land' ? 'm² terreno' : 'm²'}</div>
                    </div>
                  )}
                  {listing.parkingSpaces > 0 && (
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <FaParking className="text-[#00A6A6] text-xl" />
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.parkingSpaces}</div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">Parqueos</div>
                    </div>
                  )}
                </div>

                {/* Additional Quick Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3 text-sm">
                  {listing.lotSize > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <FaBuilding className="text-[#00A6A6]" />
                      <span><strong>{listing.lotSize}m²</strong> terreno</span>
                    </div>
                  )}
                  {listing.yearBuilt && (
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <FaCalendar className="text-[#00A6A6]" />
                      <span>Año <strong>{listing.yearBuilt}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description - Early, easily scannable */}
              <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545] mb-3">Descripción</h2>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {listing.description || 'Sin descripción disponible'}
                </p>
              </div>

              {/* Amenities - Compact on Mobile */}
              {listing.features && listing.features.length > 0 && (
                <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545] mb-3">Amenidades</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {listing.features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-700 text-sm">
                        <div className="w-1.5 h-1.5 bg-[#00A676] rounded-full flex-shrink-0"></div>
                        <span className="capitalize">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isAuthenticated && (
                <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6 border border-[#00A676]/20">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545] mb-2">Desbloquea todos los detalles</h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Crea tu cuenta gratis para ver ubicación completa, inventario, contacto directo, mapa, video y herramientas financieras.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={requireAccountForDetails}
                      className="w-full sm:w-auto px-5 py-3 rounded-lg bg-[#00A676] text-white font-semibold hover:bg-[#008f64]"
                    >
                      Crear cuenta gratis
                    </button>
                    <a
                      href={`/login?next=${encodeURIComponent(authRedirectTarget)}`}
                      className="w-full sm:w-auto px-5 py-3 rounded-lg border border-[#0B2545] text-[#0B2545] font-semibold text-center hover:bg-[#0B2545] hover:text-white"
                    >
                      Ya tengo cuenta
                    </a>
                  </div>
                </div>
              )}

              {isAuthenticated && (
                <>
                  {/* Investment Insight Panel */}
                  <InvestmentInsightPanel listing={listing} />

                  {/* Share Buttons - Compact */}
                  <div className="bg-white sm:rounded-xl shadow-sm p-4">
                    <ShareButtons 
                      url={propertyUrl}
                      title={listing.title}
                      description={metaDescription}
                    />
                  </div>

              {listing.inventoryMode === 'project' && listing.projectMapImage && (
                <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Mapa del Proyecto</h2>
                    {mapHotspots.length > 0 && (
                      <div className="text-xs text-gray-600 hidden sm:block">Toca un punto para ver unidad y precio</div>
                    )}
                  </div>
                  {mapHotspots.length > 0 && (
                    <div className="text-xs text-gray-600 mb-3 sm:hidden">Toca un punto para ver detalles</div>
                  )}
                  <div className="relative rounded-lg border border-gray-200 overflow-hidden">
                    <img
                      src={listing.projectMapImage}
                      alt={`Mapa del proyecto ${listing.title}`}
                      className="w-full"
                      loading="lazy"
                    />
                    {mapHotspots.map((point) => {
                      const status = getUnitStatus(point.unitNumber)
                      const isActive = selectedUnitNumber === point.unitNumber
                      const xClass = percentToPositionClass('left', point.xPercent)
                      const yClass = percentToPositionClass('top', point.yPercent)
                      return (
                        <button
                          key={point.id}
                          type="button"
                          title={point.label || point.unitNumber}
                          onClick={() => {
                            const targetUnit = units.find((unit) => unit.unitNumber === point.unitNumber)
                            if (targetUnit?.modelType) setSelectedModel(targetUnit.modelType)
                            setSelectedUnitNumber(point.unitNumber)
                          }}
                          className={`absolute ${xClass} ${yClass} -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 shadow ${getHotspotBadgeClass(status)} ${isActive ? 'scale-125 ring-4 ring-white/70' : 'hover:scale-110'}`}
                          aria-label={`Unidad ${point.unitNumber}`}
                        />
                      )
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Disponible</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Separada</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Vendida</span>
                  </div>
                </div>
              )}

              {hasUnits && (
                <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between mb-3 sm:mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Inventario de Unidades</h2>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {computedAvailableUnits} disponibles · {computedReservedUnits} separadas · {computedSoldUnits} vendidas
                    </div>
                  </div>

                  {unitModels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                      <button
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm border ${selectedModel === 'all' ? 'bg-[#0B2545] text-white border-[#0B2545]' : 'border-gray-300 text-gray-700 hover:border-[#0B2545]'}`}
                        onClick={() => setSelectedModel('all')}
                      >
                        Todos
                      </button>
                      {unitModels.map((model) => (
                        <button
                          key={model}
                          className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm border ${selectedModel === model ? 'bg-[#00A676] text-white border-[#00A676]' : 'border-gray-300 text-gray-700 hover:border-[#00A676]'}`}
                          onClick={() => setSelectedModel(model)}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  )}

                  {modelInsights.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      {modelInsights.map((item) => (
                        <button
                          key={item.model}
                          type="button"
                          onClick={() => setSelectedModel(item.model)}
                          className={`text-left p-3 rounded-lg border transition ${selectedModel === item.model ? 'border-[#00A676] bg-[#00A676]/5' : 'border-gray-200 hover:border-[#0B2545]/30'}`}
                        >
                          <div className="text-sm font-semibold text-[#0B2545]">{item.model}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Desde {item.fromPrice > 0 ? formatCurrency(item.fromPrice, { currency: listing.currency || 'USD' }) : 'Consultar'}
                            {item.fromMt2 > 0 ? ` · ${item.fromMt2}m²` : ''}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{item.available} disponibles de {item.total}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="overflow-x-auto -mx-4 sm:mx-0 sm:border sm:border-gray-200 sm:rounded-lg">
                    <table className="w-full min-w-[640px] text-xs sm:text-sm">
                      <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">Unidad</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">Modelo</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">m²</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">Precio</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">Estado</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUnits.map((unit, idx) => (
                          <tr key={`${unit.unitNumber}-${idx}`} className={`border-t border-gray-100 ${selectedUnitNumber === unit.unitNumber ? 'bg-[#00A676]/5' : ''}`}>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-[#0B2545]">{unit.unitNumber}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">{unit.modelType || 'N/A'}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">{unit.sizeMt2 || 0}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-[#0B2545]">{formatCurrency(unit.price || 0, { currency: listing.currency || 'USD' })}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                                unit.status === 'available'
                                  ? 'bg-green-100 text-green-700'
                                  : unit.status === 'reserved'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {unit.status === 'available' ? 'Disponible' : unit.status === 'reserved' ? 'Separada' : 'Vendida'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                              {unit.status === 'available' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUnitNumber(unit.unitNumber)
                                    setShowInquiryForm(true)
                                  }}
                                  className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg bg-[#0B2545] text-white hover:bg-[#143a66] whitespace-nowrap"
                                >
                                  Consultar
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">No disponible</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {promoVideoEmbedUrl && (
                <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545] mb-3 sm:mb-4">Video Promocional</h2>
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
              
              {/* Location */}
              <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Ubicación</h2>
                  <a
                    href={publicMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-semibold text-[#0B2545] underline"
                  >
                    Ver en Maps
                  </a>
                </div>
                <p className="text-sm sm:text-base text-gray-700 mb-3">{locationLabel || 'Ubicación no especificada'}</p>
                {hasCoordinates ? (
                  <p className="text-xs text-gray-500 mb-3">Coordenadas: {lat}, {lng}</p>
                ) : null}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <iframe
                    src={publicMapEmbed}
                    title={`Mapa de ${listing.title}`}
                    className="w-full h-60 sm:h-72"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              {/* Terrain Development Potential */}
              {listing.propertyType === 'land' && (terrain.zoningType || terrain.maxBuildHeight || terrain.buildPotential || terrainUtilities.length > 0) && (
                <div className="bg-white sm:rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545] mb-3 sm:mb-4">Potencial de Desarrollo</h2>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
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
                      <h3 className="font-semibold text-[#0B2545] mb-2 text-sm sm:text-base">Servicios disponibles</h3>
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
                      <h3 className="font-semibold text-[#0B2545] mb-1 text-sm sm:text-base">Sugerencia de uso</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{terrain.buildPotential}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mortgage Calculator */}
              <div className="bg-white sm:rounded-xl shadow-sm overflow-hidden">
                <MortgageCalculator 
                  defaultPrice={Number(ctaPriceSource || listing.price || 0)}
                  currency={listing.currency || 'USD'}
                />
              </div>
                </>
              )}
            </div>
            
            {/* Sidebar - Hidden on Mobile (sticky price bar replaces it) */}
            <div className={`hidden lg:block space-y-4 ${!isAuthenticated ? 'opacity-50 pointer-events-none select-none' : ''}`}>
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
                  price: Number(ctaPriceSource || listing.price || 0),
                  currency: listing.currency || 'USD'
                }}
              />

              {/* Price Card - Desktop Only */}
              <div className="bg-white rounded-xl shadow-sm p-5 lg:p-6 sticky top-24">
                <div className="mb-6">
                  <div className="text-4xl font-bold text-[#FF6B35]">
                    {listing.inventoryMode === 'project' && selectedUnitPrice > 0
                      ? selectedUnitPrimaryText
                      : listing.inventoryMode === 'project' && rangePriceSource > 0
                      ? `Desde ${selectedModel === 'all' ? fromPriceText : modelFromPriceText}`
                      : formatCurrency(primaryPrice, { currency: primaryCurrency })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {listing.inventoryMode === 'project' && selectedUnitPrice > 0
                      ? selectedUnitSecondaryText
                      : listing.inventoryMode === 'project' && rangePriceSource > 0
                      ? (selectedModel === 'all' ? fromPriceSecondaryText : modelFromPriceSecondaryText)
                      : formatCurrency(secondaryPrice, { currency: secondaryCurrency })}
                  </div>
                  {listing.inventoryMode === 'project' && selectedModel !== 'all' && (
                    <div className="text-xs text-[#0B2545] mt-1">Tipo seleccionado: {selectedModel}</div>
                  )}
                  {listing.inventoryMode === 'project' && selectedUnit?.unitNumber && (
                    <div className="text-xs text-[#0B2545] mt-1">Unidad seleccionada: {selectedUnit.unitNumber}</div>
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
                    propertyPrice={String(ctaPriceSource || listing.price || 0)}
                    agentName={listing.agentName}
                  />
                  
                  <button
                    onClick={() => (isAuthenticated ? setShowInquiryForm(true) : requireAccountForDetails())}
                    className="w-full px-6 py-3 bg-[#0B2545] hover:bg-[#0B2545]/90 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    {isAuthenticated ? '📧 Enviar mensaje' : '🔒 Crear cuenta para contactar'}
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

          {/* Agent/Company Attribution - Mobile Optimized */}
          <div className="mt-8 sm:mt-12 bg-white sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#00A676] to-[#00A6A6] rounded-full flex items-center justify-center text-white text-lg sm:text-xl lg:text-2xl font-bold flex-shrink-0">
                  {listing.agentName ? listing.agentName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0B2545]">{listing.agentName || 'Agente VIVENTA'}</h3>
                  <p className="text-sm sm:text-base text-gray-600">Agente Inmobiliario</p>
                  {listing.agentEmail && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{listing.agentEmail}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowInquiryForm(true)}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-[#00A676] hover:bg-[#008c5c] text-white rounded-lg font-semibold text-sm sm:text-base transition-colors"
                >
                  Contactar Agente
                </button>
                <a
                  href="/agents"
                  className="text-xs sm:text-sm text-center text-[#00A6A6] hover:underline"
                >
                  Ver perfil completo →
                </a>
              </div>
            </div>

            <div className="pt-4 sm:pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">Sobre esta propiedad</h4>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                    <p>• Listado ID: <span className="font-mono text-gray-900 break-all">{listing.listingId || listing.id}</span></p>
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
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">Listado por</h4>
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <img 
                      src="/logo.png" 
                      alt="VIVENTA" 
                      className="h-6 sm:h-8 w-auto"
                      onError={(e) => { e.currentTarget.src = '/logo.png' }}
                    />
                    <div>
                      <p className="font-bold text-sm sm:text-base text-gray-900">VIVENTA</p>
                      <p className="text-xs text-gray-500">Plataforma Inmobiliaria #1 en RD</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Todos los contactos y consultas pasan a través de VIVENTA para tu seguridad y protección.
                  </p>
                </div>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              {/* Documents (visible based on permissions) */}
              {Array.isArray(listing.documents) && listing.documents.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">Documentos</h4>
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
                          className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"
                        >
                          <div>
                            <p className="font-medium text-xs sm:text-sm text-gray-800">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.type} • {doc.visibility}</p>
                          </div>
                          <span className="text-[#00A676] text-xs sm:text-sm font-semibold whitespace-nowrap">Descargar →</span>
                        </a>
                      ))}
                  </div>
                </div>
              )}
              <p className="text-xs leading-relaxed text-gray-500">
                <strong>Nota:</strong> La información de este listado es proporcionada por el agente y debe ser verificada. 
                VIVENTA actúa como plataforma intermediaria entre compradores y vendedores. Las transacciones inmobiliarias 
                están sujetas a disponibilidad y pueden cambiar sin previo aviso. Se recomienda realizar inspecciones 
                independientes antes de cualquier transacción.
              </p>
            </div>
          </div>
        </div>

        {/* Similar Properties - Mobile Optimized */}
        {listing.propertyType && listing.city && listing.price && (
          <div className="container mx-auto px-4 max-w-7xl mt-6 sm:mt-8 lg:mt-12">
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

      {/* Mobile Sticky Bottom CTA - Zillow Style (only on mobile, hidden on desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-inset-bottom">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                requireAccountForDetails()
                return
              }
              const whatsappUrl = `https://wa.me/${(listing.agentPhone || '+18095551234').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, estoy interesado en ${listing.title} (${listing.id})`)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="flex-1 px-4 py-3 bg-[#25D366] hover:bg-[#20BA59] text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            {isAuthenticated ? 'WhatsApp' : 'Crear cuenta'}
          </button>
          <button
            onClick={() => (isAuthenticated ? setShowInquiryForm(true) : requireAccountForDetails())}
            className="flex-1 px-4 py-3 bg-[#0B2545] hover:bg-[#143a66] text-white rounded-lg font-semibold transition-colors"
          >
            {isAuthenticated ? 'Contactar' : 'Iniciar / Crear cuenta'}
          </button>
        </div>
      </div>

      {showInquiryForm && (
        <PropertyInquiryForm
          propertyId={listing.id}
          propertyTitle={listing.title}
          agentName={listing.agentName}
          agentEmail={listing.agentEmail}
          selectedUnitNumber={selectedUnit?.unitNumber || ''}
          selectedUnitModel={selectedUnit?.modelType || ''}
          selectedUnitPrice={selectedUnit?.price || 0}
          selectedUnitSizeMt2={selectedUnit?.sizeMt2 || 0}
          onClose={() => setShowInquiryForm(false)}
        />
      )}
      <RegistrationPrompt />
      <Footer />
    </>
  )
}
