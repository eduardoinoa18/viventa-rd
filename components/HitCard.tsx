'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '../lib/firebaseClient'
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { t } from '../lib/i18n'
import Link from 'next/link'
import { FaHeart, FaRegHeart, FaBed, FaBath, FaRulerCombined } from 'react-icons/fa'
import WhatsAppButton from './WhatsAppButton'
import { formatCurrency, convertCurrency, getUserCurrency, type Currency } from '../lib/currency'

export default function HitCard({ hit }: any){
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState<Currency>('USD')
  
  useEffect(()=> {
    const uid = auth.currentUser?.uid
    if(!uid) return
    const ref = doc(db, 'users', uid, 'favorites', hit.objectID)
    getDoc(ref).then((snap: any)=> setSaved(snap.exists()))
  },[hit])

  // Sync with global currency switcher
  useEffect(() => {
    // initialize
    setCurrency(getUserCurrency())
    const onCurrency = (e: Event) => {
      const detail = (e as CustomEvent).detail as { currency: Currency }
      if (detail?.currency) setCurrency(detail.currency)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('currencyChanged', onCurrency as EventListener)
      return () => window.removeEventListener('currencyChanged', onCurrency as EventListener)
    }
  }, [])

  async function toggleSave(){
    const user = auth.currentUser
    if(!user) return alert('Por favor inicia sesión')
    setLoading(true)
    try {
      const ref = doc(db, 'users', user.uid, 'favorites', hit.objectID)
      if(saved){ 
        await deleteDoc(ref)
        setSaved(false) 
      } else { 
        await setDoc(ref, { listingId: hit.objectID, savedAt: new Date() })
        setSaved(true) 
      }
    } catch (error) {
      console.error('Error saving favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  const priceUSD = Number(hit.price_usd || 0)
  const displayAmount = currency === 'USD' ? priceUSD : convertCurrency(priceUSD, 'USD', 'DOP')
  const priceLabel = formatCurrency(displayAmount, { currency, compact: true })

  const listingHref = `/listing/${encodeURIComponent(String(hit.objectID))}`

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
      <Link href={listingHref} className="block relative">
        <div className="relative h-56 bg-gray-100 overflow-hidden">
          <img 
            src={hit.main_photo_url || '/placeholder.png'} 
            alt={hit.title || 'Propiedad'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            sizes="(min-width: 1280px) 380px, (min-width: 768px) 50vw, 100vw"
          />
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleSave()
            }}
            disabled={loading}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200 z-10"
            aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
          >
            {saved ? (
              <FaHeart className="text-red-500 text-xl" />
            ) : (
              <FaRegHeart className="text-gray-600 text-xl" />
            )}
          </button>
          {hit.listing_type && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-[#0B2545] text-white text-xs font-semibold rounded-full">
              {hit.listing_type}
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={listingHref}>
          <h3 className="font-semibold text-lg text-[#0B2545] line-clamp-1 group-hover:text-[#00A6A6] transition-colors">
            {hit.title || 'Propiedad sin título'}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mt-1 flex items-center">
          📍 {hit.city || 'N/A'} {hit.neighborhood && `• ${hit.neighborhood}`}
        </p>
        
        <div className="text-2xl font-bold text-[#FF6B35] mt-3">{priceLabel}</div>
        
        {(hit.bedrooms || hit.bathrooms || hit.area_sqm) && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            {hit.bedrooms && (
              <div className="flex items-center gap-1">
                <FaBed className="text-[#00A6A6]" />
                <span>{hit.bedrooms}</span>
              </div>
            )}
            {hit.bathrooms && (
              <div className="flex items-center gap-1">
                <FaBath className="text-[#00A6A6]" />
                <span>{hit.bathrooms}</span>
              </div>
            )}
            {hit.area_sqm && (
              <div className="flex items-center gap-1">
                <FaRulerCombined className="text-[#00A6A6]" />
                <span>{hit.area_sqm}m²</span>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
          <Link 
            href={listingHref}
            className="flex-1 px-4 py-2 bg-[#00A6A6] hover:bg-[#008c8c] text-white text-center rounded-lg font-medium transition-colors duration-200"
          >
            Ver detalles
          </Link>
          <div className="w-36">
            <WhatsAppButton
              phoneNumber={hit.agent?.phone || hit.agent_phone || '+18095551234'}
              propertyTitle={hit.title}
              propertyId={hit.objectID}
              propertyPrice={String(hit.price_usd || '')}
              className="w-full"
              agentName={hit.agent?.name}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
