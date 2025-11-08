// components/SimilarProperties.tsx
'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebaseClient'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import PropertyCard from './PropertyCard'

type Props = {
  currentPropertyId: string
  propertyType: string
  city: string
  priceRange: { min: number; max: number }
}

export default function SimilarProperties({ currentPropertyId, propertyType, city, priceRange }: Props) {
  const [similar, setSimilar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSimilar()
  }, [currentPropertyId, propertyType, city])

  async function loadSimilar() {
    try {
      setLoading(true)
      
      // Query for similar properties
      const q = query(
        collection(db as any, 'properties'),
        where('status', '==', 'active'),
        where('propertyType', '==', propertyType),
        where('city', '==', city),
        where('price', '>=', priceRange.min),
        where('price', '<=', priceRange.max),
        limit(4)
      )

      const snapshot = await getDocs(q)
      const properties = snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => p.id !== currentPropertyId)
        .slice(0, 3)

      setSimilar(properties)
    } catch (error) {
      console.error('Error loading similar properties:', error)
      setSimilar([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold text-[#0B2545] mb-6">Propiedades Similares</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (similar.length === 0) {
    return null
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-[#0B2545] mb-6">Propiedades Similares</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {similar.map((property: any) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  )
}
