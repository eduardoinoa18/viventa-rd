"use client"
import { useEffect, useState } from 'react'
import { getSession, saveSession, type UserSession } from '../../../lib/authSession'
import { useRouter } from 'next/navigation'
import { FiPhone, FiUser, FiGlobe, FiSettings, FiBell, FiArrowLeft, FiEye, FiShield, FiTrash2, FiMail } from 'react-icons/fi'

export default function SettingsPage() {
  const router = useRouter()
  const [session, setSession] = useState<UserSession | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [newsletter, setNewsletter] = useState(false)
  
  // Notification preferences
  const [notifyNewListings, setNotifyNewListings] = useState(true)
  const [notifyPriceChanges, setNotifyPriceChanges] = useState(true)
  const [notifyMessages, setNotifyMessages] = useState(true)
  const [notifySavedSearches, setNotifySavedSearches] = useState(false)
  
  // Privacy preferences
  const [profileVisible, setProfileVisible] = useState(true)
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  
  // Display preferences
  const [currency, setCurrency] = useState<'USD' | 'DOP'>('USD')
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  
  const [saved, setSaved] = useState<null | string>(null)

  useEffect(() => {
    const s = getSession()
    setSession(s)
    setName(s?.name || s?.displayName || '')
    setPhone(s?.phone || '')
    
    // Load all preferences from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('viventa_lang') as 'es' | 'en' | null
      setLang(stored || 'es')
      
      setNewsletter(localStorage.getItem('viventa_news_optin') === '1')
      setNotifyNewListings(localStorage.getItem('viventa_notify_listings') !== '0')
      setNotifyPriceChanges(localStorage.getItem('viventa_notify_prices') !== '0')
      setNotifyMessages(localStorage.getItem('viventa_notify_messages') !== '0')
      setNotifySavedSearches(localStorage.getItem('viventa_notify_searches') === '1')
      
      setProfileVisible(localStorage.getItem('viventa_profile_visible') !== '0')
      setShowEmail(localStorage.getItem('viventa_show_email') === '1')
      setShowPhone(localStorage.getItem('viventa_show_phone') === '1')
      
      setCurrency((localStorage.getItem('viventa_currency') as 'USD' | 'DOP') || 'USD')
      setTheme((localStorage.getItem('viventa_theme') as 'light' | 'dark' | 'auto') || 'light')
      setDensity((localStorage.getItem('viventa_density') as 'comfortable' | 'compact') || 'comfortable')
    }
  }, [])

  function saveChanges() {
    if (!session) return
    const updated: UserSession = { ...session, name: name || session.name, phone }
    saveSession(updated)
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('viventa_lang', lang)
        localStorage.setItem('viventa_news_optin', newsletter ? '1' : '0')
        localStorage.setItem('viventa_notify_listings', notifyNewListings ? '1' : '0')
        localStorage.setItem('viventa_notify_prices', notifyPriceChanges ? '1' : '0')
        localStorage.setItem('viventa_notify_messages', notifyMessages ? '1' : '0')
        localStorage.setItem('viventa_notify_searches', notifySavedSearches ? '1' : '0')
        localStorage.setItem('viventa_profile_visible', profileVisible ? '1' : '0')
        localStorage.setItem('viventa_show_email', showEmail ? '1' : '0')
        localStorage.setItem('viventa_show_phone', showPhone ? '1' : '0')
        localStorage.setItem('viventa_currency', currency)
        localStorage.setItem('viventa_theme', theme)
        localStorage.setItem('viventa_density', density)
      }
    } catch {}
    
    setSaved('Cambios guardados')
    setTimeout(() => setSaved(null), 2000)
    
    // Reload to apply language/theme changes
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }
  
  async function requestDataExport() {
    if (!session?.uid) return
    setSaved('Solicitando exportación...')
    try {
      const res = await fetch('/api/user/export-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: session.uid })
      })
      const json = await res.json()
      if (json.ok) {
        setSaved('Exportación iniciada. Recibirás un email.')
      } else {
        setSaved('Error al exportar datos')
      }
    } catch {
      setSaved('Error de red')
    }
    setTimeout(() => setSaved(null), 3000)
  }
  
  async function deleteAccount() {
    if (!session?.uid) return
    if (!confirm('¿Estás seguro? Esta acción es permanente y eliminará todos tus datos.')) return
    setSaved('Eliminando cuenta...')
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: session.uid })
      })
      const json = await res.json()
      if (json.ok) {
        setSaved('Cuenta eliminada')
        setTimeout(() => {
          localStorage.clear()
          sessionStorage.clear()
          router.push('/')
        }, 1500)
      } else {
        setSaved('Error al eliminar cuenta')
      }
    } catch {
      setSaved('Error de red')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-viventa-sand-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-viventa-ocean-600 transition-colors mb-4"
          >
            <FiArrowLeft /> Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FiSettings /> Configuración
          </h1>
          <p className="text-gray-600 mt-1">Administra tu cuenta, privacidad, notificaciones y preferencias.</p>
        </div>

        <div className="space-y-6">
          {/* Profile */}
          <section className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Perfil</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-viventa-turquoise-400 focus:border-transparent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-3 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-viventa-turquoise-400 focus:border-transparent"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. +1 809 555 1234"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Language */}
          <section className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Idioma</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="language-select" className="block text-sm font-semibold text-gray-700 mb-2">Preferencia</label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-3 text-gray-400" />
                  <select
                    id="language-select"
                    className="w-full appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-viventa-turquoise-400 focus:border-transparent"
                    value={lang}
                    onChange={(e) => setLang(e.target.value as 'es' | 'en')}
                    aria-label="Language preference"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Esto actualizará el idioma de la aplicación.
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiBell /> Notificaciones</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">Nuevas propiedades</div>
                  <div className="text-sm text-gray-600">Notificarme cuando haya nuevas propiedades que coincidan con mis búsquedas</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifyNewListings} 
                  onChange={(e) => setNotifyNewListings(e.target.checked)}
                  className="w-5 h-5 text-viventa-ocean-600 rounded focus:ring-2 focus:ring-viventa-turquoise-400"
                  aria-label="Notificar nuevas propiedades"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">Cambios de precio</div>
                  <div className="text-sm text-gray-600">Alertarme cuando cambien los precios de mis propiedades favoritas</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifyPriceChanges} 
                  onChange={(e) => setNotifyPriceChanges(e.target.checked)}
                  className="w-5 h-5 text-viventa-ocean-600 rounded focus:ring-2 focus:ring-viventa-turquoise-400"
                  aria-label="Notificar cambios de precio"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">Mensajes</div>
                  <div className="text-sm text-gray-600">Notificarme cuando reciba mensajes de agentes o administradores</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifyMessages} 
                  onChange={(e) => setNotifyMessages(e.target.checked)}
                  className="w-5 h-5 text-viventa-ocean-600 rounded focus:ring-2 focus:ring-viventa-turquoise-400"
                  aria-label="Notificar mensajes"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">Búsquedas guardadas</div>
                  <div className="text-sm text-gray-600">Resumen semanal de nuevas propiedades que coincidan con mis búsquedas guardadas</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifySavedSearches} 
                  onChange={(e) => setNotifySavedSearches(e.target.checked)}
                  className="w-5 h-5 text-viventa-ocean-600 rounded focus:ring-2 focus:ring-viventa-turquoise-400"
                  aria-label="Notificar búsquedas guardadas"
                />
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <div className="font-medium text-gray-800 flex items-center gap-2"><FiMail className="text-viventa-turquoise-500" /> Newsletter</div>
                  <div className="text-sm text-gray-600">Recibir novedades, consejos y promociones por email</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={newsletter} 
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="w-5 h-5 text-viventa-ocean-600 rounded focus:ring-2 focus:ring-viventa-turquoise-400"
                  aria-label="Suscribirse a newsletter"
                />
              </div>
            </div>
          </section>
          
          {/* Privacy */}
          <section className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiShield /> Privacidad</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">Perfil visible</div>
                  <div className="text-sm text-gray-600">Permitir que otros usuarios vean mi perfil público</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={profileVisible} 
                  onChange={(e) => setProfileVisible(e.target.checked)}
                  className="w-5 h-5 text-viventa-ocean-600 rounded focus:ring-2 focus:ring-viventa-turquoise-400"
                  aria-label="Perfil visible"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">Mostrar email</div>
                  <div className="text-sm text-gray-600">Hacer mi email visible en mi perfil público</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={showEmail} 
                  onChange={(e) => setShowEmail(e.target.checked)}
                  disabled={!profileVisible}
                  className="w-5 h-5 text-viventa-ocean-600 rounded focus:ring-2 focus:ring-viventa-turquoise-400 disabled:opacity-50"
                  aria-label="Mostrar email en perfil"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">Mostrar teléfono</div>
                  <div className="text-sm text-gray-600">Hacer mi teléfono visible en mi perfil público</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={showPhone} 
                  onChange={(e) => setShowPhone(e.target.checked)}
                  disabled={!profileVisible}
                  className="w-5 h-5 text-viventa-ocean-600 rounded focus:ring-2 focus:ring-viventa-turquoise-400 disabled:opacity-50"
                  aria-label="Mostrar teléfono en perfil"
                />
              </div>
            </div>
          </section>
          
          {/* Display Preferences */}
          <section className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiEye /> Preferencias de visualización</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency-select" className="block text-sm font-semibold text-gray-700 mb-2">Moneda</label>
                <select
                  id="currency-select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-viventa-turquoise-400 focus:border-transparent"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'USD' | 'DOP')}
                  aria-label="Seleccionar moneda"
                >
                  <option value="USD">Dólar (USD)</option>
                  <option value="DOP">Peso Dominicano (DOP)</option>
                </select>
              </div>
              <div>
                <label htmlFor="theme-select" className="block text-sm font-semibold text-gray-700 mb-2">Tema</label>
                <select
                  id="theme-select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-viventa-turquoise-400 focus:border-transparent"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                  aria-label="Seleccionar tema"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
              <div>
                <label htmlFor="density-select" className="block text-sm font-semibold text-gray-700 mb-2">Densidad</label>
                <select
                  id="density-select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-viventa-turquoise-400 focus:border-transparent"
                  value={density}
                  onChange={(e) => setDensity(e.target.value as 'comfortable' | 'compact')}
                  aria-label="Seleccionar densidad"
                >
                  <option value="comfortable">Cómoda</option>
                  <option value="compact">Compacta</option>
                </select>
              </div>
            </div>
          </section>
          
          {/* Data Management */}
          <section className="bg-white rounded-2xl shadow border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiTrash2 className="text-red-500" /> Gestión de datos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Exportar mis datos</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Descarga una copia de toda tu información personal, favoritos, búsquedas y actividad.
                </p>
                <button
                  onClick={requestDataExport}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Solicitar exportación
                </button>
              </div>
              <div className="pt-4 border-t border-red-100">
                <h3 className="font-medium text-red-600 mb-2">Eliminar mi cuenta</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Esta acción es permanente y eliminará todos tus datos, favoritos, búsquedas guardadas y preferencias.
                </p>
                <button
                  onClick={deleteAccount}
                  className="px-4 py-2 bg-red-50 border border-red-300 rounded-lg text-red-700 hover:bg-red-100 transition-colors"
                >
                  Eliminar cuenta permanentemente
                </button>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={saveChanges}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-viventa-turquoise-500 to-viventa-ocean-500 hover:shadow-lg"
            >
              Guardar cambios
            </button>
          </div>

          {saved && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-viventa-ocean-700 text-white px-4 py-2 rounded-full shadow">
              {saved}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
