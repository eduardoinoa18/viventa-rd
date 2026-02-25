// components/HeroSection.tsx
'use client'

import Link from 'next/link';
import { FiSearch, FiCheckCircle } from 'react-icons/fi';

export default function HeroSection() {
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/hero-dr-luxury.jpg')`,
          backgroundPosition: 'center',
        }}
      >
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B2545]/85 via-[#134074]/80 to-[#00A6A6]/70"></div>
      </div>

      {/* Decorative blur elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 sm:left-20 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 sm:right-20 w-48 sm:w-72 h-48 sm:h-72 bg-[#FF6B35] rounded-full blur-3xl"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
          La plataforma inmobiliaria verificada <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-[#00A6A6] to-[#00C8C8] bg-clip-text text-transparent">
            de República Dominicana
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-10 text-gray-100 max-w-3xl mx-auto px-4">
          Compra, vende e invierte con agentes profesionales y propiedades confirmadas
        </p>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8 sm:mb-10 px-4">
          <div className="relative">
            <Link href="/search" className="block">
              <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white/20 hover:border-[#00A6A6] transition-all duration-300 p-4 sm:p-5">
                <FiSearch className="text-gray-400 text-2xl sm:text-3xl mr-3 sm:mr-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por Santo Domingo, Punta Cana, apartamento, casa..."
                  className="flex-1 text-gray-700 placeholder-gray-400 bg-transparent outline-none text-sm sm:text-base pr-2"
                  readOnly
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/search';
                  }}
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Trust Bullets */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 px-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 sm:py-3 rounded-full border border-white/20">
            <FiCheckCircle className="text-[#00A6A6] text-lg sm:text-xl flex-shrink-0" />
            <span className="text-sm sm:text-base font-semibold whitespace-nowrap">Propiedades Verificadas</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 sm:py-3 rounded-full border border-white/20">
            <FiCheckCircle className="text-[#00A6A6] text-lg sm:text-xl flex-shrink-0" />
            <span className="text-sm sm:text-base font-semibold whitespace-nowrap">Agentes Certificados</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 sm:py-3 rounded-full border border-white/20">
            <FiCheckCircle className="text-[#00A6A6] text-lg sm:text-xl flex-shrink-0" />
            <span className="text-sm sm:text-base font-semibold whitespace-nowrap">Transacciones Seguras</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="hidden sm:block animate-bounce mt-8">
          <div className="flex flex-col items-center gap-2 text-white/80">
            <span className="text-sm font-medium">Ver Propiedades Destacadas</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
