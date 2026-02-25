// components/PlatformStatsWidget.tsx
'use client'

import { useState, useEffect } from 'react';
import { FiHome, FiUsers, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';

interface PlatformStats {
  totalProperties: number;
  verifiedAgents: number;
  verificationRate: number;
  recentActivity: number;
}

export default function PlatformStatsWidget() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from API
    fetch('/api/stats/homepage')
      .then(r => r.json())
      .then(data => {
        setStats({
          totalProperties: data.stats?.totalProperties || 500,
          verifiedAgents: data.stats?.verifiedAgents || 200,
          verificationRate: data.stats?.verificationRate || 95,
          recentActivity: data.stats?.recentViews || 1250,
        });
      })
      .catch(() => {
        // Fallback to placeholder stats
        setStats({
          totalProperties: 500,
          verifiedAgents: 200,
          verificationRate: 95,
          recentActivity: 1250,
        });
      })
      .finally(() => setLoading(false));
  }, []);

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
    );
  }

  if (!stats) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B2545] mb-3">
            La plataforma más grande de RD
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Miles de propiedades verificadas y profesionales certificados
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Stat 1: Total Properties */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#00A6A6] group">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#00A6A6] to-[#00C8C8] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiHome className="text-white text-2xl sm:text-3xl" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B2545] mb-2">
                {stats.totalProperties.toLocaleString()}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                Propiedades Activas
              </div>
            </div>
          </div>

          {/* Stat 2: Verified Agents */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#FF6B35] group">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FF6B35] to-[#FF8C35] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiUsers className="text-white text-2xl sm:text-3xl" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B2545] mb-2">
                {stats.verifiedAgents.toLocaleString()}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                Agentes Certificados
              </div>
            </div>
          </div>

          {/* Stat 3: Verification Rate */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#10B981] group">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#10B981] to-[#34D399] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiCheckCircle className="text-white text-2xl sm:text-3xl" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B2545] mb-2">
                {stats.verificationRate}%
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                Propiedades Verificadas
              </div>
            </div>
          </div>

          {/* Stat 4: Recent Activity */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#8B5CF6] group">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiTrendingUp className="text-white text-2xl sm:text-3xl" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B2545] mb-2">
                {stats.recentActivity.toLocaleString()}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                Visitas Esta Semana
              </div>
            </div>
          </div>
        </div>

        {/* Trust CTA Below Stats */}
        <div className="mt-8 sm:mt-10 text-center">
          <a
            href="/confianza"
            className="inline-flex items-center gap-2 text-[#00A6A6] hover:text-[#008c8c] font-semibold text-sm sm:text-base transition-colors group"
          >
            <FiCheckCircle className="group-hover:scale-110 transition-transform" />
            <span>Aprende más sobre nuestro proceso de verificación</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
