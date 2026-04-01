'use client'

import { useMemo } from 'react'
import { FiCheck, FiAlertCircle } from 'react-icons/fi'

type ListingQualityProps = {
  title?: string
  description?: string
  images?: string[]
  price?: number
  bedrooms?: number
  bathrooms?: number
  area?: number
  features?: string[]
  city?: string
  sector?: string
  mainImage?: string
  compact?: boolean
}

type QualityCheck = {
  id: string
  label: string
  description: string
  passed: boolean
  weight: number
}

export default function ListingQualityScore(props: ListingQualityProps) {
  const checks: QualityCheck[] = useMemo(() => {
    return [
      {
        id: 'title',
        label: 'Título descriptivo',
        description: 'El título debe tener 20-100 caracteres',
        passed: (props.title?.length || 0) >= 20 && (props.title?.length || 0) <= 100,
        weight: 10,
      },
      {
        id: 'description',
        label: 'Descripción completa',
        description: 'Descripción de 100+ caracteres',
        passed: (props.description?.length || 0) >= 100,
        weight: 15,
      },
      {
        id: 'images',
        label: 'Fotos de calidad (4+)',
        description: 'Al menos 4 fotos del listado',
        passed: (props.images?.length || 0) >= 4,
        weight: 20,
      },
      {
        id: 'price',
        label: 'Precio especificado',
        description: 'Precio debe estar completo',
        passed: (props.price || 0) > 0,
        weight: 10,
      },
      {
        id: 'bedrooms',
        label: 'Habitaciones especificadas',
        description: 'Número de habitaciones requerido',
        passed: (props.bedrooms || 0) > 0,
        weight: 10,
      },
      {
        id: 'bathrooms',
        label: 'Baños especificados',
        description: 'Número de baños requerido',
        passed: (props.bathrooms || 0) > 0,
        weight: 10,
      },
      {
        id: 'area',
        label: 'Metraje especificado',
        description: 'Área en m² debe estar completa',
        passed: (props.area || 0) > 0,
        weight: 10,
      },
      {
        id: 'features',
        label: 'Amenidades añadidas (3+)',
        description: 'Al menos 3 características/amenidades',
        passed: (props.features?.length || 0) >= 3,
        weight: 10,
      },
      {
        id: 'location',
        label: 'Ubicación completa',
        description: 'Ciudad y sector/barrio especificados',
        passed: Boolean(props.city && props.sector),
        weight: 5,
      },
    ]
  }, [props.title?.length, props.description?.length, props.images?.length, props.price, props.bedrooms, props.bathrooms, props.area, props.features?.length, props.city, props.sector])

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0)
  const score = Math.round(
    (checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0) / totalWeight) * 100
  )

  const getQualityLevel = (score: number): { label: string; color: string; bg: string } => {
    if (score >= 90) return { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-50' }
    if (score >= 75) return { label: 'Bueno', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (score >= 60) return { label: 'Aceptable', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { label: 'Necesita mejora', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const level = getQualityLevel(score)
  const missingChecks = checks.filter((c) => !c.passed)

  if (props.compact) {
    return (
      <div className={`${level.bg} rounded-lg p-4 border border-gray-200`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">Calidad del Listado</p>
            <p className={`text-3xl font-bold ${level.color}`}>{score}%</p>
          </div>
          <div className="w-24 h-24 rounded-full border-4 border-gray-300 flex items-center justify-center relative">
            <div
              className={`absolute inset-0 rounded-full border-4 ${
                score >= 90 ? 'border-green-600' : score >= 75 ? 'border-blue-600' : score >= 60 ? 'border-yellow-600' : 'border-red-600'
              }`}
              style={{
                borderTopColor: score >= 90 ? '#16a34a' : score >= 75 ? '#2563eb' : score >= 60 ? '#ca8a04' : '#dc2626',
                borderRightColor: 'transparent',
                borderBottomColor: 'transparent',
                borderLeftColor: 'transparent',
                transform: `rotate(${Math.round((score / 100) * 360)}deg)`,
                transition: 'transform 0.5s ease-in-out',
              }}
            ></div>
            <span className={`relative z-10 font-bold ${level.color}`}>{score}%</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${level.bg} rounded-lg border border-gray-200 p-6 space-y-6`}>
      {/* Score Card */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Calidad del Listado</h3>
        <div className="flex items-center justify-center gap-8">
          <div>
            <p className="text-5xl font-bold text-[#FF6B35]">{score}%</p>
            <p className={`text-lg font-semibold ${level.color} mt-2`}>{level.label}</p>
          </div>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="56" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="56"
                fill="none"
                stroke={score >= 90 ? '#16a34a' : score >= 75 ? '#2563eb' : score >= 60 ? '#ca8a04' : '#dc2626'}
                strokeWidth="8"
                strokeDasharray={`${(score / 100) * 352} 352`}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-900">
              {score}%
            </span>
          </div>
        </div>
      </div>

      {/* Checks List */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Verificación de Completitud</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                check.passed ? 'bg-white/50 border border-green-200' : 'bg-white/50 border border-yellow-200'
              }`}
            >
              {check.passed ? (
                <FiCheck className="text-green-600 flex-shrink-0 mt-0.5 text-lg" />
              ) : (
                <FiAlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5 text-lg" />
              )}
              <div className="min-w-0">
                <p className={`font-medium text-sm ${check.passed ? 'text-green-900' : 'text-yellow-900'}`}>
                  {check.label}
                </p>
                <p className={`text-xs ${check.passed ? 'text-green-700' : 'text-yellow-700'}`}>{check.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {missingChecks.length > 0 && (
        <div className="bg-white/75 rounded-lg p-4 border-l-4 border-yellow-500">
          <h4 className="font-semibold text-gray-900 mb-2">Sugerencias de Mejora</h4>
          <ul className="space-y-2">
            {missingChecks.slice(0, 3).map((check) => (
              <li key={check.id} className="text-sm text-gray-700">
                • <strong>{check.label}:</strong> {check.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
