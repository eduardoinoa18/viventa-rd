'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../lib/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import { useParams } from 'next/navigation'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import WhatsAppButton from '../../../components/WhatsAppButton'
import FavoriteButton from '../../../components/FavoriteButton'
import PropertyInquiryForm from '../../../components/PropertyInquiryForm'
import StructuredData from '../../../components/StructuredData'
import { formatCurrency, convertCurrency, getUserCurrency, type Currency } from '../../../lib/currency'
import { generatePropertySchema } from '../../../lib/seoUtils'
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt } from 'react-icons/fa'

export default function ListingDetail(){
  const router = useRouter()
  const params = useParams()
  const id = params?.id
  const [listing,setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  
  useEffect(()=> {
    if(!id) return
    setLoading(true)
    getDoc(doc(db,'properties',id as string))
      .then((snap: any)=> { 
        if(snap.exists()) setListing({...snap.data(), id: snap.id})
      })
      .finally(() => setLoading(false))
  },[id])

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
  
  if(loading) {
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
  
  // Prepare property data for components
  const favoriteData = {
    id: listing.id,
    title: listing.title,
    price: listing.price || 0,
    currency: listing.currency || 'USD',
    location: `${listing.location?.city || listing.city || ''}, ${listing.location?.neighborhood || listing.neighborhood || ''}`,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    area: listing.area,
    images: listing.images || [],
    agentName: listing.agentName,
    agentPhone: listing.agentPhone
  }

  // Generate structured data for SEO
  const propertySchema = listing ? generatePropertySchema({
    id: listing.id,
    title: listing.title,
    description: listing.description || `${listing.title} en ${listing.location?.city || listing.city}`,
    price: listing.price || 0,
    currency: listing.currency || 'USD',
    location: `${listing.location?.city || listing.city || ''}${listing.location?.neighborhood || listing.neighborhood ? ', ' + (listing.location?.neighborhood || listing.neighborhood) : ''}`,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    area: listing.area,
    images: listing.images || [],
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
  
  return (
    <>
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
                  <span>{listing.location?.city || listing.city || 'N/A'} • {listing.location?.neighborhood || listing.neighborhood || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FavoriteButton property={favoriteData} />
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-96 bg-gray-100">
                  {listing.images && listing.images[0] ? (
                    <img 
                      src={listing.images[0]} 
                      alt={listing.title}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span>Sin imagen</span>
                    </div>
                  )}
                </div>
                {listing.images && listing.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {listing.images.slice(1, 5).map((img: string, idx: number) => (
                      <div key={idx} className="h-24 bg-gray-100 rounded overflow-hidden">
                        <img src={img} alt={`Vista ${idx + 2}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Property Features */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Características</h2>
                <div className="grid grid-cols-3 gap-6">
                  {listing.bedrooms && (
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
                  {listing.bathrooms && (
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
                  {listing.area && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00A6A6]/10 rounded-lg flex items-center justify-center">
                        <FaRulerCombined className="text-[#00A6A6] text-xl" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#0B2545]">{listing.area}</div>
                        <div className="text-sm text-gray-600">m²</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Descripción</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {listing.description || 'Sin descripción disponible'}
                </p>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Price Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <div className="text-4xl font-bold text-[#FF6B35] mb-6">
                  {formatCurrency(
                    currency === listing.currency 
                      ? Number(listing.price || 0) 
                      : convertCurrency(Number(listing.price || 0), listing.currency || 'USD', currency),
                    { currency }
                  )}
                </div>
                
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
      <Footer />
    </>
  )
}
