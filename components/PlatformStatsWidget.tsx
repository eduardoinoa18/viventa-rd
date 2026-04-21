// components/PlatformStatsWidget.tsx
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { FiArrowRight, FiBarChart2, FiCheckCircle, FiHome, FiTrendingUp, FiUsers } from 'react-icons/fi'

interface PlatformStats {
  totalProperties: number
  verifiedAgents: number
  verificationRate: number
  recentActivity: number
}

export default function PlatformStatsWidget() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/homepage')
      .then(r => r.json())
      .then(data => {
        setStats({
          totalProperties: data.stats?.totalProperties || 500,
          verifiedAgents: data.stats?.verifiedAgents || 200,
          verificationRate: data.stats?.verificationRate || 95,
          recentActivity: data.stats?.recentViews || 1250,
        })
      })
      .catch(() => {
        setStats({
          totalProperties: 500,
          verifiedAgents: 200,
          verificationRate: 95,
          recentActivity: 1250,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!stats) return null

  return (
    <section className="bg-[linear-gradient(180deg,#f8fbfd_0%,#ffffff_48%,#eef8f8_100%)] py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center rounded-full border border-[#00A6A6]/15 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008C8C] shadow-sm">
            Radar del mercado dominicano
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B2545] mb-3">
            Datos que convierten inventario en decisiones
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            VIVENTA combina verificacion, senales de demanda y operaciones comerciales para elevar el estandar del mercado inmobiliario en RD.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#00A6A6] group">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#00A6A6] to-[#00C8C8] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiHome className="text-white text-2xl sm:text-3xl" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B2545] mb-2">
                {stats.totalProperties.toLocaleString()}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                Inventario Activo
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#FF6B35] group">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FF6B35] to-[#FF8C35] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiUsers className="text-white text-2xl sm:text-3xl" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B2545] mb-2">
                {stats.verifiedAgents.toLocaleString()}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                Profesionales Verificados
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#10B981] group">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#10B981] to-[#34D399] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiCheckCircle className="text-white text-2xl sm:text-3xl" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B2545] mb-2">
                {stats.verificationRate}%
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                Tasa de Verificacion
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#0B2545] group">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#0B2545] to-[#1D4F7A] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiTrendingUp className="text-white text-2xl sm:text-3xl" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B2545] mb-2">
                {stats.recentActivity.toLocaleString()}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                Interacciones Semanales
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#0B2545]/8 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0B2545]">
              <FiBarChart2 className="text-[#00A6A6]" />
              Zonas con mayor lectura del mercado
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">Santo Domingo, Punta Cana y Santiago concentran la mayor mezcla entre demanda patrimonial, preventa y compra internacional.</p>
          </div>
          <div className="rounded-3xl border border-[#0B2545]/8 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0B2545]">
              <FiTrendingUp className="text-[#F97316]" />
              Disenado para inversionistas
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">Comparacion de oportunidades, filtros avanzados y claridad operativa para analizar renta, liquidez y timing de entrada.</p>
          </div>
          <div className="rounded-3xl border border-[#0B2545]/8 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0B2545]">
              <FiUsers className="text-[#0B2545]" />
              Red comercial conectada
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">Agentes, brokers, constructoras y master admin comparten una sola operacion para responder mas rapido y vender mejor.</p>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 text-center px-2">
          <Link href="/confianza" className="inline-flex flex-wrap items-center justify-center gap-2 text-[#00A6A6] hover:text-[#008c8c] font-semibold text-sm sm:text-base transition-colors group text-center">
            <FiCheckCircle className="group-hover:scale-110 transition-transform" />
            <span className="break-words">Ver como funciona la verificacion y la confianza de VIVENTA</span>
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
