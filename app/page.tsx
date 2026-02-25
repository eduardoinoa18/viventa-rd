"use client"
/* eslint-disable react/no-unescaped-entities */

import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import PropertyCard from '../components/PropertyCard';
import AgentCard from '../components/AgentCard';
import StructuredData from '../components/StructuredData';
import RegistrationPrompt from '../components/RegistrationPrompt';
import HeroSection from '../components/HeroSection';
import PlatformStatsWidget from '../components/PlatformStatsWidget';
import FeaturedProperties from '../components/FeaturedProperties';
import { useState, useEffect } from 'react';
import { FiSearch, FiUsers, FiCheckCircle, FiShield, FiLock, FiTrendingUp, FiStar, FiMail } from 'react-icons/fi'

type Property = {
  id: string;
  listingId?: string;
  title: string;
  price: number;
  currency?: string;
  propertyType?: string;
  city?: string;
  sector?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images?: string[];
  agentId?: string;
};

type Agent = {
  id: string;
  name: string;
  photo?: string;
  area?: string;
  email?: string;
  phone?: string;
  agentCode?: string;
  rating?: number;
};

export default function HomePage() {
  const [filters, setFilters] = useState({ location: "", type: "", minPrice: "", maxPrice: "" });
  const [stats, setStats] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [topAgents, setTopAgents] = useState<Agent[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    fetch('/api/stats/homepage')
      .then(r => r.json())
      .then(data => setStats(data.stats))
      .catch(() => {})
  }, [])

  // Load active properties (ensure always showing at least some)
  useEffect(() => {
    setLoadingProps(true)
    fetch('/api/properties?limit=12')
      .then(r => r.json())
      .then(data => {
        const list: Property[] = (data.properties || []).map((p: any) => ({
          id: p.id,
          listingId: p.listingId,
          title: p.title || p.name || 'Propiedad',
          price: p.price || 0,
          currency: p.currency || 'USD',
          propertyType: p.propertyType || p.type,
          city: p.city,
          sector: p.sector,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          area: p.area,
          images: p.images || [],
          agentId: p.agentId,
        }))
        setProperties(list)
      })
      .catch(() => {})
      .finally(() => setLoadingProps(false))
  }, [])

  // Load agents (prefer verified, but fallback to active; prefer agents with active listings; must be approved)
  useEffect(() => {
    setLoadingAgents(true)
    fetch('/api/agents?limit=200')
      .then(r => r.json())
      .then(data => {
        const all: any[] = data?.data || []
        // Filter for active, approved agents (with email verification preference)
        const verifiedActive = all.filter((u: any) => u.status === 'active' && u.approved === true && (u.verified || u.emailVerified))
        const activeApproved = all.filter((u: any) => u.status === 'active' && u.approved === true)
        const preferred = verifiedActive.length ? verifiedActive : activeApproved

        // Prefer agents who currently have active listings on the site (derived from loaded properties)
        const activeAgentIds = new Set((properties || []).map((p) => p.agentId).filter(Boolean) as string[])
        let filtered = preferred
        if (activeAgentIds.size > 0) {
          const byActiveListings = preferred.filter((u: any) => activeAgentIds.has(u.id))
          // If filtering removes everyone (e.g., agents not linked yet), keep the preferred list
          if (byActiveListings.length) filtered = byActiveListings
        }

        const agents: Agent[] = filtered.map((u: any) => ({
          id: u.id,
          name: u.name || u.displayName || 'Agente',
          photo: u.photoURL || u.photo || u.profileImage,
          area: u.city || u.area,
          email: u.email,
          phone: u.phone,
          agentCode: u.professionalCode || u.agentCode,
          rating: 4.8,
        }))
        setTopAgents(agents)
      })
      .catch(() => {})
      .finally(() => setLoadingAgents(false))
  }, [])

  const filtered = properties.filter((p) => {
    const matchesType = filters.type ? (p.propertyType === filters.type) : true;
    const matchesMin = filters.minPrice ? p.price >= parseInt(filters.minPrice) : true;
    const matchesMax = filters.maxPrice ? p.price <= parseInt(filters.maxPrice) : true;
    const matchesLocation = filters.location
      ? (
          (p.city || '').toLowerCase().includes(filters.location.toLowerCase()) ||
          (p.sector || '').toLowerCase().includes(filters.location.toLowerCase())
        )
      : true;
    return matchesType && matchesMin && matchesMax && matchesLocation;
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
        {/* New Authority Hero Section */}
        <HeroSection />

        {/* Platform Stats Widget */}
        <PlatformStatsWidget />

        {/* Featured Properties Section */}
        <FeaturedProperties />

        {/* Search CTA Section (simplified) */}
        <section className="max-w-7xl mx-auto py-12 px-4">
          <div className="bg-gradient-to-br from-[#0B2545] to-[#00A6A6] rounded-3xl p-8 md:p-12 text-white shadow-2xl">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para encontrar tu propiedad ideal?</h2>
              <p className="text-lg mb-6 text-gray-100">Explora miles de opciones verificadas en toda República Dominicana</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/search" 
                  className="px-8 py-4 bg-white text-[#0B2545] hover:bg-gray-100 font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-2"
                >
                  <FiSearch className="text-xl" /> 
                  <span>Buscar Propiedades</span>
                </a>
                <a 
                  href="/agents" 
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white/30 font-bold rounded-xl transition-all duration-300 inline-flex items-center justify-center gap-2"
                >
                  <FiUsers className="text-xl" /> 
                  <span>Hablar con un Agente</span>
                </a>
              </div>
            </div>
          </div>
        </section>

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
                  &quot;Encontré mi apartamento soñado en Piantini gracias a VIVENTA. El proceso fue rápido, transparente y mi agente me acompañó en cada paso. ¡Altamente recomendado!&quot;
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
                  &quot;Invertir en una villa en Bávaro fue la mejor decisión. VIVENTA me conectó con expertos que conocían perfectamente la zona y el mercado turístico.&quot;
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
                  &quot;Como compradora primeriza, tenía muchas dudas. Los agentes de VIVENTA me educaron sobre todo el proceso y me ayudaron a conseguir excelentes condiciones de financiamiento.&quot;
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
              <div className="bg-white rounded-xl p-6 flex items-center justify-center h-24 hover:scale-105 transition-transform shadow-lg"><span className="font-bold text-xl text-gray-700">Santo Domingo Sotheby&apos;s</span></div>
            </div>
            
            <div className="text-center mt-10">
              <h3 className="text-xl font-semibold text-white mb-2">¿Eres agente, bróker o desarrollador?</h3>
              <p className="text-viventa-sand/90 mb-4">Hablemos sobre tu proyecto y la mejor forma de colaborar.</p>
              <a href="/contact" className="inline-block px-8 py-3 bg-white text-viventa-ocean font-bold rounded-xl shadow-lg hover:scale-105 transition-all">Contactar al equipo</a>
            </div>
          </div>
        </section>
      </main>
      <RegistrationPrompt />
      <Footer />
      <BottomNav />
    </div>
  );
}
