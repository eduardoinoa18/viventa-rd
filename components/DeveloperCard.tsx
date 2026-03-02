/**
 * Developer Card Components
 * 3 UI variants for displaying developer info on listing pages
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FiExternalLink, FiAward, FiTrendingUp } from 'react-icons/fi'
import type { Developer } from '@/types/developer'

interface DeveloperCardProps {
  developer: Developer
  variant?: 'compact' | 'featured' | 'panel'
  className?: string
}

function getDeveloperPath(developer: Developer) {
  return `/constructoras/${developer.slug || developer.id}`
}

/**
 * Variant A: Trust Badge Compact
 * Minimal, trust-focused display
 */
export function DeveloperCardCompact({ developer, className = '' }: DeveloperCardProps) {
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏗️</div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Desarrollado por</p>
            <div className="flex items-center gap-2">
              {developer.logoUrl && (
                <Image
                  src={developer.logoUrl}
                  alt={developer.companyName}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              )}
              <h3 className="font-bold text-[#0B2545]">{developer.companyName}</h3>
              {developer.verified && (
                <FiAward className="text-[#00A676]" title="Verificado" />
              )}
            </div>
            {developer.completedProjects && (
              <p className="text-xs text-gray-600 mt-1">
                ⭐ {developer.completedProjects} proyectos entregados
              </p>
            )}
          </div>
        </div>
        <Link
          href={getDeveloperPath(developer)}
          className="text-[#00A676] hover:text-[#00A676]/80 text-sm font-medium flex items-center gap-1 whitespace-nowrap"
        >
          Ver portafolio <FiExternalLink size={14} />
        </Link>
      </div>
    </div>
  )
}

/**
 * Variant B: Featured Card with Preview
 * Rich information with project preview
 */
export function DeveloperCardFeatured({ developer, className = '' }: DeveloperCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sobre el Desarrollador</h3>
      
      <div className="flex items-start gap-4 mb-4">
        {developer.logoUrl ? (
          <Image
            src={developer.logoUrl}
            alt={developer.companyName}
            width={80}
            height={80}
            className="object-contain rounded-lg"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-lg flex items-center justify-center text-white text-2xl font-bold">
            {developer.companyName?.charAt(0)}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-xl text-[#0B2545]">{developer.companyName}</h4>
            {developer.verified && (
              <FiAward className="text-[#00A676]" size={20} title="Verificado" />
            )}
          </div>
          {developer.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{developer.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {developer.yearEstablished && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">📅</span>
            <span className="text-gray-700">
              {new Date().getFullYear() - developer.yearEstablished} años en el mercado
            </span>
          </div>
        )}
        {developer.completedProjects && (
          <div className="flex items-center gap-2 text-sm">
            <FiTrendingUp className="text-[#00A676]" />
            <span className="text-gray-700">
              {developer.completedProjects} proyectos completados
            </span>
          </div>
        )}
      </div>

      <Link
        href={getDeveloperPath(developer)}
        className="block w-full text-center bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white py-3 rounded-lg hover:opacity-90 transition font-medium"
      >
        Ver todos los proyectos →
      </Link>
    </div>
  )
}

/**
 * Variant C: Side Panel
 * Sticky sidebar variant for desktop
 */
export function DeveloperCardPanel({ developer, className = '' }: DeveloperCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 sticky top-24 ${className}`}>
      <div className="text-center mb-4">
        {developer.logoUrl ? (
          <Image
            src={developer.logoUrl}
            alt={developer.companyName}
            width={120}
            height={120}
            className="object-contain mx-auto rounded-lg"
          />
        ) : (
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-lg flex items-center justify-center text-white text-3xl font-bold">
            {developer.companyName?.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        <h4 className="font-bold text-lg text-[#0B2545]">{developer.companyName}</h4>
        {developer.verified && (
          <FiAward className="text-[#00A676]" size={18} title="Verificado" />
        )}
      </div>

      {developer.description && (
        <p className="text-sm text-gray-600 text-center mb-4 line-clamp-3">
          {developer.description}
        </p>
      )}

      <div className="space-y-2 mb-4 text-sm">
        {developer.yearEstablished && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Fundada</span>
            <span className="font-medium text-gray-900">{developer.yearEstablished}</span>
          </div>
        )}
        {developer.completedProjects && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Proyectos</span>
            <span className="font-medium text-gray-900">{developer.completedProjects} completados</span>
          </div>
        )}
        {developer.activeProjects && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Activos</span>
            <span className="font-medium text-[#00A676]">{developer.activeProjects} proyectos</span>
          </div>
        )}
      </div>

      <Link
        href={getDeveloperPath(developer)}
        className="block w-full text-center bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white py-3 rounded-lg hover:opacity-90 transition font-medium mb-2"
      >
        Ver Portafolio Completo
      </Link>

      {developer.website && (
        <a
          href={developer.website}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          <FiExternalLink className="inline mr-1" size={14} />
          Sitio Web
        </a>
      )}
    </div>
  )
}

// Main export with variant selector
export default function DeveloperCard({ developer, variant = 'compact', className }: DeveloperCardProps) {
  if (variant === 'featured') {
    return <DeveloperCardFeatured developer={developer} className={className} />
  }
  if (variant === 'panel') {
    return <DeveloperCardPanel developer={developer} className={className} />
  }
  return <DeveloperCardCompact developer={developer} className={className} />
}
