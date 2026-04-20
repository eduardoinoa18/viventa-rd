"use client"
/* eslint-disable react/no-unescaped-entities */

import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import AgentCard from '../components/AgentCard';
import StructuredData from '../components/StructuredData';
import RegistrationPrompt from '../components/RegistrationPrompt';
import HeroSection from '../components/HeroSection';
import PlatformStatsWidget from '../components/PlatformStatsWidget';
import FeaturedProperties from '../components/FeaturedProperties';
import FeaturedProjects from '../components/FeaturedProjects';
import { useState, useEffect } from 'react';
import { FiCheckCircle, FiUsers, FiShield, FiStar, FiArrowRight, FiSearch } from 'react-icons/fi'

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
  const [topAgents, setTopAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Load top agents
  useEffect(() => {
    fetch('/api/agents?limit=8')
      .then(r => r.json())
      .then(data => {
        const all: any[] = data?.data || []
        const active = all
          .filter((u: any) => u.status === 'active' && u.approved === true)
          .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 8)
        const agents: Agent[] = active.map((u: any) => ({
          id: u.id,
          name: u.name || u.displayName || 'Agente',
          photo: u.photoURL || u.photo || u.profileImage,
          area: u.city || u.area,
          email: u.email,
          phone: u.phone,
          agentCode: u.professionalCode || u.agentCode,
          rating: u.rating || 4.8,
        }))
        setTopAgents(agents)
      })
      .catch(() => {})
      .finally(() => setLoadingAgents(false))
  }, [])

  // Structured data for organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "VIVENTA",
    "description": "Plataforma inmobiliaria líder en República Dominicana",
    "url": "https://viventa-rd.com",
    "logo": "https://viventa-rd.com/logo.svg",
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

        {/* Featured Projects Section */}
        <FeaturedProjects />

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

        {/* Brokerages CTA */}
        <section className="bg-gradient-to-br from-viventa-navy to-viventa-ocean py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Red de Brokerages Certificados</h2>
                <p className="text-viventa-sand/90 mb-6 max-w-lg">
                  Trabajamos con brokerages verificados en toda República Dominicana. Desde Santo Domingo hasta Punta Cana, nuestros socios están listos para ayudarte.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="/brokers" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-viventa-ocean font-bold rounded-xl shadow-lg hover:scale-105 transition-all">
                    Ver brokerages <FiArrowRight />
                  </a>
                  <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/15 transition-all">
                    Hablar con VIVENTA
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 border border-white/10 rounded-2xl p-5 text-white">
                  <FiUsers className="text-2xl mb-2 text-cyan-200" />
                  <div className="font-bold text-lg">Agentes verificados</div>
                  <div className="text-sm text-slate-300 mt-1">Profesionales aprobados con historial comprobado</div>
                </div>
                <div className="bg-white/10 border border-white/10 rounded-2xl p-5 text-white">
                  <FiStar className="text-2xl mb-2 text-amber-300" />
                  <div className="font-bold text-lg">Calidad garantizada</div>
                  <div className="text-sm text-slate-300 mt-1">Evaluamos cada brokerage antes de listarlo</div>
                </div>
                <div className="bg-white/10 border border-white/10 rounded-2xl p-5 text-white">
                  <FiCheckCircle className="text-2xl mb-2 text-green-300" />
                  <div className="font-bold text-lg">Inventario activo</div>
                  <div className="text-sm text-slate-300 mt-1">Propiedades reales y actualizadas en todo momento</div>
                </div>
                <div className="bg-white/10 border border-white/10 rounded-2xl p-5 text-white">
                  <FiShield className="text-2xl mb-2 text-blue-300" />
                  <div className="font-bold text-lg">Proceso seguro</div>
                  <div className="text-sm text-slate-300 mt-1">Transacciones protegidas y transparentes</div>
                </div>
              </div>
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
