'use client'

import { useState, useMemo } from 'react'
import { FiTrendingUp, FiDollarSign, FiPercent, FiBarChart2 } from 'react-icons/fi'

type InvestmentAnalysisPanelProps = {
  price: number
  currency: string
  monthlyRent?: number
  annualMaintenance?: number
  propertyTax?: number
  yearBuilt?: number
  bedrooms?: number
  bathrooms?: number
  area?: number
}

type InvestmentMetrics = {
  grossYield: number
  capRate: number
  netYield: number
  cashflow: number
  roi: number
  roiYears: number
  pricePerSqm: number
}

export default function InvestmentAnalysisPanel({
  price,
  currency = 'USD',
  monthlyRent = 0,
  annualMaintenance = 0,
  propertyTax = 0,
  yearBuilt,
  bedrooms = 0,
  bathrooms = 0,
  area = 0,
}: InvestmentAnalysisPanelProps) {
  const [assumedMonthlyRent, setAssumedMonthlyRent] = useState(monthlyRent)

  const metrics: InvestmentMetrics = useMemo(() => {
    const annualRent = assumedMonthlyRent * 12
    const grossYield = price > 0 ? (annualRent / price) * 100 : 0
    const expenses = annualMaintenance + (propertyTax || 0)
    const netIncome = annualRent - expenses
    const capRate = price > 0 ? (netIncome / price) * 100 : 0
    const cashflow = assumedMonthlyRent - (annualMaintenance + (propertyTax || 0)) / 12
    const roi = capRate
    const roiYears = roi > 0 ? 100 / roi : 0
    const pricePerSqm = area > 0 ? price / area : 0

    return {
      grossYield,
      capRate,
      netYield: grossYield - (expenses / annualRent) * 100,
      cashflow,
      roi,
      roiYears,
      pricePerSqm,
    }
  }, [price, assumedMonthlyRent, annualMaintenance, propertyTax, area])

  const getMetricColor = (metric: number, type: 'yield' | 'cashflow') => {
    if (type === 'yield') {
      if (metric >= 8) return 'text-green-600'
      if (metric >= 5) return 'text-blue-600'
      if (metric >= 3) return 'text-yellow-600'
      return 'text-orange-600'
    }
    // cashflow
    if (metric > 0) return 'text-green-600'
    if (metric < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const isGoodInvestment = metrics.capRate >= 5 && metrics.cashflow > 0

  const age = yearBuilt ? new Date().getFullYear() - yearBuilt : null

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-600 rounded-lg">
          <FiTrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Análisis de Inversión</h3>
          <p className="text-sm text-gray-600">Métricas de retorno para este inmueble</p>
        </div>
      </div>

      {/* Input for assumed monthly rent */}
      {!monthlyRent && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alquiler mensual estimado
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">
                {currency === 'USD' ? '$' : 'RD$'}
              </span>
              <input
                type="number"
                value={assumedMonthlyRent}
                onChange={(e) => setAssumedMonthlyRent(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Gross Yield */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1 font-medium">Rendimiento Bruto</p>
          <p className={`text-2xl font-bold ${getMetricColor(metrics.grossYield, 'yield')}`}>
            {metrics.grossYield.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(assumedMonthlyRent * 12).toLocaleString()} / año
          </p>
        </div>

        {/* Cap Rate */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1 font-medium">Cap Rate</p>
          <p className={`text-2xl font-bold ${getMetricColor(metrics.capRate, 'yield')}`}>
            {metrics.capRate.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.capRate >= 5 ? '✓ Bueno' : '↓ Bajo'}
          </p>
        </div>

        {/* Monthly Cashflow */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1 font-medium">Flujo Mensual</p>
          <p className={`text-2xl font-bold ${getMetricColor(metrics.cashflow, 'cashflow')}`}>
            {currency === 'USD' ? '$' : 'RD$'}
            {Math.round(metrics.cashflow).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.cashflow > 0
              ? 'Ganancia neta'
              : metrics.cashflow < 0
                ? 'Déficit mensual'
                : 'Break-even'}
          </p>
        </div>

        {/* ROI Payback */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1 font-medium">Recupero (años)</p>
          <p className="text-2xl font-bold text-purple-600">
            {metrics.roiYears > 100 ? '∞' : metrics.roiYears.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.roiYears < 20 ? '✓ Rápido' : 'Largo plazo'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {/* Price per sqm */}
        {area > 0 && (
          <div className="flex items-center gap-2 text-sm p-3 bg-white rounded-lg border border-gray-200">
            <FiBarChart2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600">Precio/m²</p>
              <p className="font-bold text-gray-900">
                {currency === 'USD' ? '$' : 'RD$'}
                {Math.round(metrics.pricePerSqm).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Bedrooms & Bathrooms */}
        {bedrooms > 0 && (
          <div className="flex items-center gap-2 text-sm p-3 bg-white rounded-lg border border-gray-200">
            <FiDollarSign className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600">
                {bedrooms}h/{bathrooms}b
              </p>
              <p className="font-bold text-gray-900">
                {assumedMonthlyRent > 0
                  ? `$${Math.round(assumedMonthlyRent / bedrooms)} por hab.`
                  : 'Configurar alquiler'}
              </p>
            </div>
          </div>
        )}

        {/* Building Age */}
        {age !== null && (
          <div className="flex items-center gap-2 text-sm p-3 bg-white rounded-lg border border-gray-200">
            <FiPercent className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600">Antigüedad</p>
              <p className="font-bold text-gray-900">{age} años</p>
            </div>
          </div>
        )}
      </div>

      {/* Investment Summary */}
      <div
        className={`rounded-lg p-4 border-l-4 ${
          isGoodInvestment
            ? 'bg-green-50 border-green-500 text-green-900'
            : 'bg-yellow-50 border-yellow-500 text-yellow-900'
        }`}
      >
        <p className="font-semibold mb-2">
          {isGoodInvestment
            ? '✓ Oportunidad de inversión atractiva'
            : '⚠ Revisar métricas de retorno'}
        </p>
        <ul className="text-sm space-y-1">
          {assumedMonthlyRent > 0 && (
            <li>
              • Alquiler mensual estimado:{' '}
              <span className="font-bold">
                {currency === 'USD' ? '$' : 'RD$'}
                {assumedMonthlyRent.toLocaleString()}
              </span>
            </li>
          )}
          <li>
            • Retorno anual esperado:{' '}
            <span className="font-bold">{metrics.grossYield.toFixed(2)}%</span>
          </li>
          {metrics.cashflow !== 0 && (
            <li>
              • Flujo de efectivo mensual:{' '}
              <span className="font-bold">
                {metrics.cashflow > 0 ? '+' : ''}
                {currency === 'USD' ? '$' : 'RD$'}
                {Math.round(metrics.cashflow).toLocaleString()}
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-gray-300 italic">
        Esta es una estimación basada en datos proporcionados. Consulte con un asesor financiero
        para decisiones de inversión.
      </p>
    </div>
  )
}
