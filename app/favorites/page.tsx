'use client'
import { useEffect, useState } from 'react'
import { getAllFavorites, syncFavorites, isOffline } from '@/lib/offlineFavorites'
import { getSession } from '@/lib/authSession'
import Link from 'next/link'
import { formatCurrency, formatFeatures, formatArea } from '@/lib/currency'
import { FaSync, FaWifi, FaHeart, FaUser } from 'react-icons/fa'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [offline, setOffline] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    checkUserAndLoadFavorites()
    setOffline(isOffline())

    // Listen for online/offline events
    function updateOnlineStatus() {
      setOffline(!navigator.onLine)
      if (navigator.onLine) {
        handleSync()
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  async function checkUserAndLoadFavorites() {
    setLoading(true)
    try {
      const session = await getSession()
      if (session?.uid) {
        setIsLoggedIn(true)
        setUserName(session.name || 'Usuario')
        // Load favorites from server for logged-in users
        await loadFavoritesFromServer()
      } else {
        // Load from local storage for guests
        await loadFavorites()
      }
    } catch (error) {
      console.error('Error checking user:', error)
      await loadFavorites()
    } finally {
      setLoading(false)
    }
  }

  async function loadFavoritesFromServer() {
    try {
      const res = await fetch('/api/favorites')
      const data = await res.json()
      if (data.ok) {
        setFavorites(data.favorites)
      } else {
        // Fallback to local storage
        await loadFavorites()
      }
    } catch (error) {
      console.error('Error loading favorites from server:', error)
      await loadFavorites()
    }
  }

  async function loadFavorites() {
    setLoading(true)
    try {
      const saved = await getAllFavorites()
      setFavorites(saved)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await syncFavorites()
      await loadFavorites()
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545] flex items-center gap-2">
                <FaHeart className="text-red-500" />
                Mis Favoritos
              </h1>
              {isLoggedIn && (
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <FaUser className="text-gray-400" />
                  {userName}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {offline && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  <FaWifi className="text-yellow-600" />
                  Sin conexión
                </div>
              )}
              
              <button
                onClick={handleSync}
                disabled={syncing || offline}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  syncing || offline
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#0B2545] text-white hover:bg-[#00A676]'
                }`}
              >
                <FaSync className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>
          </div>
          
          <p className="text-gray-600">
            {favorites.length} {favorites.length === 1 ? 'propiedad guardada' : 'propiedades guardadas'}
            {offline && ' (disponibles offline)'}
            {!isLoggedIn && ' • Inicia sesión para sincronizar entre dispositivos'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2545] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando favoritos...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaHeart className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No tienes favoritos guardados</h2>
            <p className="text-gray-600 mb-6">
              Explora propiedades y guarda tus favoritas para verlas aquí
            </p>
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-[#0B2545] text-white rounded-lg font-semibold hover:bg-[#00A676] transition-colors"
            >
              Buscar Propiedades
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((property) => (
              <Link
                key={property.id}
                href={`/listing/${property.id}`}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden"
              >
                <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                  {property.images && property.images[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="object-cover w-full h-48"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-gradient-to-br from-[#0B2545] to-[#00A676]">
                      <span className="text-white text-4xl font-bold">V</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-[#0B2545] mb-2 line-clamp-2">
                    {property.title}
                  </h3>
                  
                  <div className="text-2xl font-bold text-[#00A676] mb-2">
                    {formatCurrency(property.price, { currency: property.currency })}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {property.location}
                  </p>
                  
                  {(property.bedrooms || property.bathrooms || property.area) && (
                    <div className="text-xs text-gray-500">
                      {formatFeatures(property.bedrooms, property.bathrooms)}
                      {property.area && ` • ${formatArea(property.area)}`}
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t text-xs text-gray-400">
                    Guardado {new Date(property.savedAt).toLocaleDateString('es-DO')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!offline && favorites.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Tus propiedades favoritas están disponibles sin conexión. 
              Activa el modo avión para probarlo.
            </p>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  )
}
