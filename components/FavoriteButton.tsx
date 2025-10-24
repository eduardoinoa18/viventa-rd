'use client'
import { useState, useEffect } from 'react'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { saveFavoriteOffline, removeFavoriteOffline, isFavorite, isOffline } from '@/lib/offlineFavorites'
import toast from 'react-hot-toast'

interface FavoriteButtonProps {
  property: {
    id: string
    title: string
    price: number
    currency: string
    location: string
    bedrooms?: number
    bathrooms?: number
    area?: number
    images: string[]
    agentName?: string
    agentPhone?: string
  }
  className?: string
}

export default function FavoriteButton({ property, className = '' }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkFavoriteStatus()
  }, [property.id])

  async function checkFavoriteStatus() {
    const status = await isFavorite(property.id)
    setFavorited(status)
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    
    setLoading(true)
    
    try {
      if (favorited) {
        await removeFavoriteOffline(property.id)
        setFavorited(false)
        toast.success('Eliminado de favoritos')
      } else {
        await saveFavoriteOffline({
          ...property,
          savedAt: Date.now(),
          lastFetchedAt: Date.now()
        })
        setFavorited(true)
        
        if (isOffline()) {
          toast.success('Guardado (se sincronizará cuando estés en línea)', {
            icon: '📴'
          })
        } else {
          toast.success('Guardado en favoritos')
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      title={favorited ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
    >
      {favorited ? (
        <FaHeart className="text-red-500 text-xl" />
      ) : (
        <FaRegHeart className="text-gray-700 text-xl" />
      )}
    </button>
  )
}
