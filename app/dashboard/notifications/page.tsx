'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedClient from '@/app/auth/ProtectedClient'
import Header from '@/components/Header'
import { FiBell, FiCheck, FiX, FiInfo } from 'react-icons/fi'
import { 
  requestNotificationPermission, 
  hasNotificationPermission, 
  disableNotifications,
  getNotificationPreferences,
  updateNotificationPreferences
} from '@/lib/notificationService'
import { getSession } from '@/lib/authSession'

interface NotificationPreferences {
  notificationsEnabled: boolean
  messages: boolean
  properties: boolean
  achievements: boolean
  marketing: boolean
}

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notificationsEnabled: false,
    messages: true,
    properties: true,
    achievements: true,
    marketing: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session?.uid) {
      setUserId(session.uid)
      loadPreferences(session.uid)
    } else {
      setLoading(false)
    }
  }, [])

  const loadPreferences = async (uid: string) => {
    try {
      setLoading(true)
      const prefs = await getNotificationPreferences(uid)
      if (prefs) {
        setPreferences(prefs)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnableNotifications = async () => {
    if (!userId) return

    try {
      setSaving(true)
      const token = await requestNotificationPermission(userId)
      if (token) {
        setPreferences(prev => ({ ...prev, notificationsEnabled: true }))
        alert('¡Notificaciones habilitadas! Ahora recibirás actualizaciones importantes.')
      } else {
        alert('No se pudo habilitar las notificaciones. Verifica los permisos del navegador.')
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
      alert('Error al habilitar notificaciones.')
    } finally {
      setSaving(false)
    }
  }

  const handleDisableNotifications = async () => {
    if (!userId) return

    try {
      setSaving(true)
      await disableNotifications(userId)
      setPreferences(prev => ({ ...prev, notificationsEnabled: false }))
      alert('Notificaciones deshabilitadas.')
    } catch (error) {
      console.error('Failed to disable notifications:', error)
      alert('Error al deshabilitar notificaciones.')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!userId) return

    try {
      setSaving(true)
      const { notificationsEnabled, ...prefs } = preferences
      const success = await updateNotificationPreferences(userId, prefs)
      if (success) {
        alert('Preferencias guardadas exitosamente.')
      } else {
        alert('Error al guardar preferencias.')
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
      alert('Error al guardar preferencias.')
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <ProtectedClient>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0B2545] mb-2">
              Configuración de Notificaciones
            </h1>
            <p className="text-gray-600">
              Controla cómo y cuándo recibes notificaciones de Viventa RD
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando configuración...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Master Toggle */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#00A676]/10 rounded-lg">
                        <FiBell className="text-[#00A676] text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                          Notificaciones Push
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">
                          Recibe actualizaciones instantáneas sobre actividad importante
                        </p>
                        {preferences.notificationsEnabled ? (
                          <div className="inline-flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <FiCheck /> Habilitadas
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            <FiX /> Deshabilitadas
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={
                        preferences.notificationsEnabled
                          ? handleDisableNotifications
                          : handleEnableNotifications
                      }
                      disabled={saving}
                      className={`px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                        preferences.notificationsEnabled
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-[#00A676] text-white hover:bg-[#008F64]'
                      }`}
                    >
                      {preferences.notificationsEnabled ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                  </div>
                </div>

                {!hasNotificationPermission() && !preferences.notificationsEnabled && (
                  <div className="bg-blue-50 border-t border-blue-100 p-4">
                    <div className="flex items-start gap-3">
                      <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">¿Por qué habilitar notificaciones?</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          <li>Recibe mensajes de clientes instantáneamente</li>
                          <li>Alertas de nuevos leads y oportunidades</li>
                          <li>Notificaciones de badges y logros desbloqueados</li>
                          <li>Actualizaciones de propiedades guardadas</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Preferences */}
              {preferences.notificationsEnabled && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Preferencias de Notificación
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Elige qué tipos de notificaciones quieres recibir
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {/* Messages */}
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Mensajes</h3>
                        <p className="text-sm text-gray-600">
                          Nuevos mensajes de clientes y agentes
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.messages}
                          onChange={() => togglePreference('messages')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00A676]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A676]"></div>
                      </label>
                    </div>

                    {/* Properties */}
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Propiedades</h3>
                        <p className="text-sm text-gray-600">
                          Nuevas propiedades y alertas de precio
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.properties}
                          onChange={() => togglePreference('properties')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00A676]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A676]"></div>
                      </label>
                    </div>

                    {/* Achievements */}
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Logros y Badges</h3>
                        <p className="text-sm text-gray-600">
                          Nuevos badges desbloqueados y subidas de nivel
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.achievements}
                          onChange={() => togglePreference('achievements')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00A676]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A676]"></div>
                      </label>
                    </div>

                    {/* Marketing */}
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Marketing y Promociones</h3>
                        <p className="text-sm text-gray-600">
                          Ofertas especiales, tips y actualizaciones de producto
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={() => togglePreference('marketing')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00A676]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A676]"></div>
                      </label>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      onClick={() => router.back()}
                      className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      disabled={saving}
                      className="px-6 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Guardar Preferencias'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </ProtectedClient>
  )
}
