"use client"

import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import PropertyCard from '../components/PropertyCard';
import AgentCard from '../components/AgentCard';
import StructuredData from '../components/StructuredData';
import FeaturedProperties from '../components/FeaturedProperties';
import { useState, useEffect } from 'react';
import { FiSearch, FiUsers, FiCheckCircle, FiShield, FiLock, FiTrendingUp, FiStar } from 'react-icons/fi'

const properties = [
  { id: 1, title: "Luxury Villa in Santo Domingo", price: 350000, type: "Villa", lat: 18.4861, lng: -69.9312, img: "/demo1.jpg", city: "Santo Domingo", neighborhood: "Piantini", beds: 3, baths: 2, sqft: 180 },
  { id: 2, title: "Modern Apartment in Punta Cana", price: 220000, type: "Apartment", lat: 18.5818, lng: -68.4043, img: "/demo2.jpg", city: "Punta Cana", neighborhood: "Bávaro", beds: 2, baths: 2, sqft: 120 },
  { id: 3, title: "Cozy Beach House", price: 450000, type: "House", lat: 19.757, lng: -70.517, img: "/demo3.jpg", city: "Santiago", neighborhood: "Los Jardines", beds: 4, baths: 3, sqft: 220 },
];

const topAgents = [
  { id: 'a1', photo: '/agent1.jpg', name: 'María López', area: 'Santo Domingo', rating: 4.9 },
  { id: 'a2', photo: '/agent2.jpg', name: 'Carlos Pérez', area: 'Punta Cana', rating: 5.0 },
  { id: 'a3', photo: '/agent3.jpg', name: 'Ana García', area: 'Santiago', rating: 4.8 },
  { id: 'a4', photo: '/agent4.jpg', name: 'Luis Rodríguez', area: 'La Romana', rating: 4.7 },
];

export default function HomePage() {
  const user = undefined as any;
  const [filters, setFilters] = useState({ location: "", type: "", minPrice: "", maxPrice: "" });
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/stats/homepage')
      .then(r => r.json())
      .then(data => setStats(data.stats))
      .catch(() => {})
  }, [])

  const filtered = properties.filter((p) => {
    const matchesType = filters.type ? p.type === filters.type : true;
    const matchesMin = filters.minPrice ? p.price >= parseInt(filters.minPrice) : true;
    const matchesMax = filters.maxPrice ? p.price <= parseInt(filters.maxPrice) : true;
    return matchesType && matchesMin && matchesMax;
  });

  // Structured data for organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "VIVENTA",
    "description": "Plataforma inmobiliaria líder en República Dominicana",
    "url": "https://viventa-rd.com",
    "logo": "https://viventa-rd.com/logo.png",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "DO",
      "addressLocality": "Santo Domingo"
    },
    "areaServed": {
      "@type": "Country",
      "name": "República Dominicana"
    },
    "sameAs": [
      "https://www.facebook.com/viventa",
      "https://www.instagram.com/viventa",
      "https://twitter.com/viventa"
    ]
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://viventa-rd.com"
      }
    ]
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <StructuredData data={organizationSchema} />
      <StructuredData data={breadcrumbSchema} />
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#00A6A6] h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Encuentra tu próximo hogar <br/>con <span className="text-[#00A6A6]">VIVENTA</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">Tu espacio, tu futuro en República Dominicana</p>
            
            {/* Waitlist CTA Banner */}
            <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20 max-w-2xl mx-auto">
              <p className="text-lg font-semibold mb-3">🚀 Platform in Development - Join the Waitlist!</p>
              <p className="text-sm text-gray-100 mb-4">Be first to access beta features, get exclusive updates, and enjoy special launch perks.</p>
              <button 
                onClick={() => {
                  if ((window as any).openWaitlistPopup) {
                    (window as any).openWaitlistPopup()
                  }
                }}
                className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Reserve My Spot →
              </button>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <a 
                href="/search" 
                className="px-8 py-4 bg-[#00A6A6] hover:bg-[#008c8c] text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
              >
                <FiSearch className="text-xl" /> Buscar Propiedades
              </a>
              <a 
                href="/agents" 
                className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold rounded-lg border-2 border-white/30 transition-all duration-300 inline-flex items-center gap-2"
              >
                <FiUsers className="text-xl" /> Conoce a nuestros Agentes
              </a>
              <a 
                href="/social" 
                className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold rounded-lg border-2 border-white/30 transition-all duration-300 inline-flex items-center gap-2"
                aria-label="Social (Próximamente)"
              >
                <span className="relative">
                  <span className="absolute -top-2 -right-3 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Soon</span>
                  {/* Using the same search icon for consistency; could swap for a social icon */}
                  <FiTrendingUp className="text-xl" />
                </span>
                Social
              </a>
            </div>
          </div>
        </section>

        {/* Map Search & Filters */}
        <section className="max-w-7xl mx-auto py-12 px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#0B2545] mb-2">Explora Propiedades</h2>
            <p className="text-gray-600">Usa los filtros para encontrar tu propiedad ideal</p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT — Filters */}
            <div className="lg:w-1/3">
              <div className="bg-white shadow-lg rounded-xl p-6 sticky top-20">
                <h3 className="text-xl font-bold text-[#0B2545] mb-4 inline-flex items-center gap-2"><FiSearch /> Buscar propiedades</h3>
                <input
                  type="text"
                  placeholder="Ubicación..."
                  className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />

                <select
                  className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">Tipo de propiedad</option>
                  <option value="Villa">Villa</option>
                  <option value="Apartment">Apartamento</option>
                  <option value="House">Casa</option>
                </select>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input
                    type="number"
                    placeholder="Precio mín"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Precio máx"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-[#00A6A6] focus:border-transparent"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  />
                </div>

                <a 
                  href="/search"
                  className="w-full block text-center px-6 py-3 bg-[#00A6A6] hover:bg-[#008c8c] text-white font-bold rounded-lg transition-colors duration-200"
                >
                  Ver todas las propiedades
                </a>

                {/* Trending Searches */}
                {stats?.trendingSearches && stats.trendingSearches.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FiTrendingUp className="text-[#00A6A6]" /> Búsquedas Populares
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {stats.trendingSearches.slice(0, 5).map((term: string, i: number) => (
                        <a
                          key={i}
                          href={`/search?q=${encodeURIComponent(term)}`}
                          className="px-3 py-1 bg-gradient-to-r from-[#00A6A6]/10 to-[#0B2545]/10 hover:from-[#00A6A6]/20 hover:to-[#0B2545]/20 text-[#0B2545] text-sm rounded-full transition-colors"
                        >
                          {term}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Properties */}
            <div className="lg:w-2/3">
              {/* Quick Stats — removed per request to simplify the homepage */}
              {!user && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-800">
                  <FiLock className="text-lg" />
                  <p className="text-sm">
                    <strong>Inicia sesión</strong> para guardar favoritos y ver más detalles
                  </p>
                </div>
              )}

              {/* Properties Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {filtered.map((p) => (
                  <PropertyCard 
                    key={p.id} 
                    property={{
                      ...p,
                      price_usd: p.price,
                      image: p.img
                    }} 
                  />
                ))}
              </div>
              
              {filtered.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm mt-6">
                  <p className="text-gray-600 mb-4">No se encontraron propiedades con esos filtros</p>
                  <button 
                    onClick={() => setFilters({ location: "", type: "", minPrice: "", maxPrice: "" })}
                    className="px-6 py-2 bg-[#00A6A6] text-white rounded-lg hover:bg-[#008c8c] transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Featured Properties Section */}
        <FeaturedProperties />

        {/* Top Agents */}
        <section className="bg-gradient-to-br from-viventa-sand/30 to-white py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-viventa-navy">Agentes Destacados</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Conoce a nuestros mejores agentes con años de experiencia ayudando a familias a encontrar su hogar ideal
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {topAgents.map(a => <AgentCard key={a.id} agent={a} />)}
            </div>
            <div className="text-center mt-8">
              <a 
                href="/agents" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-viventa-turquoise to-viventa-ocean text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Ver Todos los Agentes →
              </a>
            </div>
          </div>
        </section>

        {/* Why Choose VIVENTA */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-[#0B2545]">¿Por qué elegir VIVENTA?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <FiCheckCircle className="text-4xl text-[#00A6A6] mb-2" />
                <div className="font-bold mb-1">Listados Verificados</div>
                <div className="text-sm text-gray-600 text-center">Solo propiedades revisadas y aprobadas por nuestro equipo.</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <FiUsers className="text-4xl text-[#0B2545] mb-2" />
                <div className="font-bold mb-1">Agentes de Confianza</div>
                <div className="text-sm text-gray-600 text-center">Trabaja con los mejores profesionales del sector inmobiliario.</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <FiShield className="text-4xl text-[#3BAFDA] mb-2" />
                <div className="font-bold mb-1">Transacciones Seguras</div>
                <div className="text-sm text-gray-600 text-center">Tu información y tu inversión están protegidas.</div>
              </div>
            </div>
        </section>

        {/* Success Stories */}
        <section className="bg-white py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-viventa-navy">Historias de Éxito</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Conoce las experiencias de quienes encontraron su hogar perfecto con VIVENTA
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Success Story 1 */}
              <div className="bg-gradient-to-br from-viventa-sand/50 to-white rounded-2xl p-6 shadow-lg border-2 border-viventa-turquoise/20 hover:border-viventa-turquoise/40 transition-all">
                <div className="mb-3">
                  <h4 className="font-bold text-viventa-navy">María Torres</h4>
                  <p className="text-sm text-gray-600">Santo Domingo</p>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 text-viventa-sunset fill-viventa-sunset" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "Encontré mi apartamento soñado en Piantini gracias a VIVENTA. El proceso fue rápido, transparente y mi agente me acompañó en cada paso. ¡Altamente recomendado!"
                </p>
              </div>

              {/* Success Story 2 */}
              <div className="bg-gradient-to-br from-viventa-sand/50 to-white rounded-2xl p-6 shadow-lg border-2 border-viventa-ocean/20 hover:border-viventa-ocean/40 transition-all">
                <div className="mb-3">
                  <h4 className="font-bold text-viventa-navy">Carlos Méndez</h4>
                  <p className="text-sm text-gray-600">Punta Cana</p>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 text-viventa-sunset fill-viventa-sunset" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "Invertir en una villa en Bávaro fue la mejor decisión. VIVENTA me conectó con expertos que conocían perfectamente la zona y el mercado turístico."
                </p>
              </div>

              {/* Success Story 3 */}
              <div className="bg-gradient-to-br from-viventa-sand/50 to-white rounded-2xl p-6 shadow-lg border-2 border-viventa-palm/20 hover:border-viventa-palm/40 transition-all">
                <div className="mb-3">
                  <h4 className="font-bold text-viventa-navy">Ana Rodríguez</h4>
                  <p className="text-sm text-gray-600">Santiago</p>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 text-viventa-sunset fill-viventa-sunset" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  "Como compradora primeriza, tenía muchas dudas. Los agentes de VIVENTA me educaron sobre todo el proceso y me ayudaron a conseguir excelentes condiciones de financiamiento."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Affiliated Companies + CTA */}
        <section className="bg-gradient-to-br from-viventa-navy to-viventa-ocean py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Empresas Afiliadas</h2>
              <p className="text-viventa-sand/90 max-w-2xl mx-auto">
                Trabajamos con brókers líderes en República Dominicana
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg"><span className="font-bold text-xl text-gray-700">RE/MAX RD</span></div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg"><span className="font-bold text-xl text-gray-700">Century 21 Dominicana</span></div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg"><span className="font-bold text-xl text-gray-700">Keller Williams RD</span></div>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg"><span className="font-bold text-xl text-gray-700">Santo Domingo Sotheby's</span></div>
            </div>
            
            <div className="text-center mt-10">
              <h3 className="text-xl font-semibold text-white mb-2">¿Eres agente, bróker o desarrollador?</h3>
              <p className="text-viventa-sand/90 mb-4">Únete a VIVENTA Pro y potencia tu negocio inmobiliario.</p>
              <a href="/profesionales" className="inline-block px-8 py-3 bg-white text-viventa-ocean font-bold rounded-xl shadow-lg hover:scale-105 transition-all">Descubre VIVENTA para Profesionales</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
