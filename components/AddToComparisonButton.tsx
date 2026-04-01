'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiCheck, FiAlertCircle } from 'react-icons/fi'

type AddToComparisonButtonProps = {
  propertyId: string
  maxComparisonItems?: number
  size?: 'sm' | 'md' | 'lg'
}

export default function AddToComparisonButton({
  propertyId,
  maxComparisonItems = 4,
  size = 'md',
}: AddToComparisonButtonProps) {
  const [isAdded, setIsAdded] = useState(false)
  const [isAtLimit, setIsAtLimit] = useState(false)
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    checkComparisonStatus()
  }, [])

  const checkComparisonStatus = () => {
    const saved = localStorage.getItem('comparison_properties')
    const ids = saved ? JSON.parse(saved) : []

    setIsAdded(ids.includes(propertyId))
    setIsAtLimit(ids.length >= maxComparisonItems)
  }

  const handleToggle = () => {
    const saved = localStorage.getItem('comparison_properties')
    let ids = saved ? JSON.parse(saved) : []

    if (isAdded) {
      // Remove property
      ids = ids.filter((id: string) => id !== propertyId)
      setIsAdded(false)
    } else {
      // Add property if not at limit
      if (ids.length >= maxComparisonItems) {
        setShowMessage(true)
        setTimeout(() => setShowMessage(false), 3000)
        return
      }
      ids.push(propertyId)
      setIsAdded(true)
    }

    localStorage.setItem('comparison_properties', JSON.stringify(ids))
    setIsAtLimit(ids.length >= maxComparisonItems)
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'lg':
        return 'text-base px-4 py-3'
      default:
        return 'text-sm px-3 py-2'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={isAtLimit && !isAdded}
        className={`flex items-center gap-2 rounded-lg font-medium transition-all duration-200 ${getSizeClasses()} ${
          isAdded
            ? 'bg-[#00A676] text-white hover:bg-[#009364]'
            : 'bg-white border border-gray-300 text-gray-700 hover:border-[#FF6B35] hover:text-[#FF6B35]'
        } ${isAtLimit && !isAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isAtLimit && !isAdded ? `Máximo ${maxComparisonItems} propiedades` : ''}
      >
        {isAdded ? (
          <>
            <FiCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Comparando</span>
          </>
        ) : (
          <>
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Comparar</span>
          </>
        )}
      </button>

      {showMessage && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2 z-10 whitespace-nowrap">
          <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
          Máximo {maxComparisonItems} propiedades
        </div>
      )}
    </div>
  )
}
