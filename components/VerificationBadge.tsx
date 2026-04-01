'use client'

import { FiCheck, FiAward, FiShield, FiStar, FiTrendingUp } from 'react-icons/fi'

type VerificationBadgeProps = {
  verified?: boolean
  professionalCode?: string
  yearsOfExperience?: number
  averageRating?: number
  reviewCount?: number
  transactionCount?: number
  size?: 'sm' | 'md' | 'lg'
  layout?: 'stacked' | 'horizontal'
}

export default function VerificationBadge({
  verified = false,
  professionalCode,
  yearsOfExperience = 0,
  averageRating = 0,
  reviewCount = 0,
  transactionCount = 0,
  size = 'md',
  layout = 'stacked',
}: VerificationBadgeProps) {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return { badge: 'h-8 px-2 text-xs', icon: 'w-4 h-4' }
      case 'lg':
        return { badge: 'h-12 px-4 text-base', icon: 'w-6 h-6' }
      default:
        return { badge: 'h-10 px-3 text-sm', icon: 'w-5 h-5' }
    }
  }

  const classes = getSizeClasses(size)

  const badges = [
    verified && {
      icon: FiCheck,
      label: 'Email Verificado',
      color: 'bg-green-50 border-green-200 text-green-700',
      tooltip: 'Email de contacto verificado',
    },
    professionalCode && {
      icon: FiShield,
      label: 'Código Profesional',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      tooltip: `Código: ${professionalCode}`,
    },
    yearsOfExperience >= 5 && {
      icon: FiAward,
      label: `${yearsOfExperience} años`,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      tooltip: `${yearsOfExperience} años de experiencia`,
    },
    averageRating >= 4.5 && {
      icon: FiStar,
      label: `${averageRating.toFixed(1)}★`,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      tooltip: `${averageRating.toFixed(1)} estrellas (${reviewCount} reseñas)`,
    },
    transactionCount >= 10 && {
      icon: FiTrendingUp,
      label: `${transactionCount} transacciones`,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      tooltip: `${transactionCount} transacciones completadas`,
    },
  ].filter(Boolean) as Array<{
    icon: any
    label: string
    color: string
    tooltip: string
  }>

  if (badges.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        Sin verificaciones aún
      </div>
    )
  }

  if (layout === 'horizontal') {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, idx) => {
          const Icon = badge.icon
          return (
            <div
              key={idx}
              className={`flex items-center gap-1 rounded-full border ${badge.color} ${classes.badge} font-medium whitespace-nowrap group relative`}
              title={badge.tooltip}
            >
              <Icon className={classes.icon} />
              <span>{badge.label}</span>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                {badge.tooltip}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {badges.map((badge, idx) => {
        const Icon = badge.icon
        return (
          <div
            key={idx}
            className={`flex items-center gap-2 p-2 rounded-lg border ${badge.color} group relative cursor-help`}
            title={badge.tooltip}
          >
            <Icon className={classes.icon} />
            <span className={`font-medium ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
              {badge.label}
            </span>
            <div className="hidden group-hover:block absolute left-full top-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
              {badge.tooltip}
            </div>
          </div>
        )
      })}
    </div>
  )
}
