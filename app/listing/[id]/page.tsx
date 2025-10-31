'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../lib/firebaseClient'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { useParams } from 'next/navigation'
import Head from 'next/head'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import WhatsAppButton from '../../../components/WhatsAppButton'
import FavoriteButton from '../../../components/FavoriteButton'
import PropertyInquiryForm from '../../../components/PropertyInquiryForm'
import StructuredData from '../../../components/StructuredData'
import { formatCurrency, convertCurrency, getUserCurrency, type Currency } from '../../../lib/currency'
import { generatePropertySchema } from '../../../lib/seoUtils'
import { FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaParking, FaBuilding, FaCalendar } from 'react-icons/fa'

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
        if(snap.exists()) {
          setListing({...snap.data(), id: snap.id})
          // Increment view count
          updateDoc(doc(db,'properties',id as string), {
            views: increment(1)
          }).catch((err: any) => console.error('Error updating views:', err))
        }
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

  // Restrict visibility for non-active listings
  if (listing && listing.status && listing.status !== 'active') {
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
  
  // Generate meta description
  const metaDescription = listing.description 
    ? listing.description.substring(0, 155) + '...'
    : `${listing.title} en ${listing.location?.city || listing.city}. ${listing.bedrooms} hab, ${listing.bathrooms} baños, ${listing.area}m². ${formatCurrency(listing.price || 0, { currency: listing.currency || 'USD' })}`;
  
  const metaTitle = `${listing.title} - VIVENTA RD`;
  const propertyUrl = `https://viventa-rd.com/listing/${listing.id}`;
  const mainImage = listing.images?.[0] || listing.mainImage || '/logo.png';

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{metaTitle}</title>
        <meta name="title" content={metaTitle} />
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={`${listing.propertyType}, ${listing.listingType}, ${listing.location?.city}, ${listing.location?.neighborhood}, propiedad, inmueble, República Dominicana, VIVENTA`} />
        
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
                    <p>• Listado ID: <span className="font-mono text-gray-900">{listing.id}</span></p>
                    <p>• Tipo: <span className="text-gray-900 capitalize">{listing.propertyType}</span></p>
                    <p>• Transacción: <span className="text-gray-900 capitalize">{listing.listingType === 'sale' ? 'Venta' : 'Alquiler'}</span></p>
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
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>Nota:</strong> La información de este listado es proporcionada por el agente y debe ser verificada. 
                VIVENTA actúa como plataforma intermediaria entre compradores y vendedores. Las transacciones inmobiliarias 
                están sujetas a disponibilidad y pueden cambiar sin previo aviso. Se recomienda realizar inspecciones 
                independientes antes de cualquier transacción.
              </p>
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
