"use client"
import { useEffect, useState } from 'react'
import { getSession, saveSession, type UserSession } from '../../../lib/authSession'
import { FiPhone, FiUser, FiGlobe, FiSettings, FiBell } from 'react-icons/fi'

export default function SettingsPage() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [newsletter, setNewsletter] = useState(false)
  const [saved, setSaved] = useState<null | string>(null)

  useEffect(() => {
    const s = getSession()
    setSession(s)
    setName(s?.name || s?.displayName || '')
    setPhone(s?.phone || '')
    // language preference comes from localStorage
    const stored = (typeof window !== 'undefined' && localStorage.getItem('viventa_lang')) as 'es' | 'en' | null
    setLang(stored || 'es')
    const news = (typeof window !== 'undefined' && localStorage.getItem('viventa_news_optin'))
    setNewsletter(news === '1')
  }, [])

  function saveChanges() {
    if (!session) return
    const updated: UserSession = { ...session, name: name || session.name, phone }
    saveSession(updated)
    try {
      localStorage.setItem('viventa_lang', lang)
      localStorage.setItem('viventa_news_optin', newsletter ? '1' : '0')
    } catch {}
    setSaved('Cambios guardados')
    setTimeout(() => setSaved(null), 2000)
    // Optional: reload to apply language changes broadly
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-viventa-sand-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiSettings /> Configuración
          </h1>
          <p className="text-gray-600">Actualiza tus datos, idioma y preferencias.</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-gray-600">Administra qué notificaciones deseas recibir.</div>
              <a
                href="/dashboard/notifications"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-viventa-turquoise-500 to-viventa-ocean-500 text-white font-semibold hover:shadow-md"
              >
                Abrir preferencias
              </a>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <input id="newsletter" type="checkbox" checked={newsletter} onChange={(e)=>setNewsletter(e.target.checked)} />
              <label htmlFor="newsletter" className="text-sm text-gray-700">Quiero recibir novedades por email</label>
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
