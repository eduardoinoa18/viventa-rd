'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

type AgentProfile = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  bio: string
  profileImage: string
  city: string
  area: string
  languages: string[]
  specialties: string[]
  yearsExperience: number
  websiteUrl: string
  slug: string
  publicProfileEnabled: boolean
  professionalCode: string
}

export default function AgentProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' })
        const sessionJson = await sessionRes.json().catch(() => ({}))
        
        if (!sessionRes.ok || !sessionJson?.session?.uid) {
          router.push('/login?next=/dashboard/agent/profile')
          return
        }

        setSession(sessionJson.session)

        // Load agent profile
        const res = await fetch('/api/agents/current', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        if (res.ok && json?.ok && json?.agent) {
          setProfile(json.agent)
        } else {
          setMessage({ type: 'error', text: 'No se pudo cargar el perfil' })
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Error al cargar el perfil' })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleChange = (field: string, value: any) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const handleLanguagesChange = (value: string) => {
    const languages = value.split(',').map((l) => l.trim()).filter(Boolean)
    handleChange('languages', languages)
  }

  const handleSpecialtiesChange = (value: string) => {
    const specialties = value.split(',').map((s) => s.trim()).filter(Boolean)
    handleChange('specialties', specialties)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/agents/current', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
        cache: 'no-store',
      })

      const json = await res.json().catch(() => ({}))

      if (res.ok && json?.ok) {
        setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' })
      } else {
        setMessage({ type: 'error', text: json?.error || 'Error al guardar' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al guardar el perfil' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Perfil no disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Gestiona tu información profesional y presencia pública</p>
        </div>
        <Link href="/dashboard/agent/overview" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft />
          Volver
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <FiCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Photo & Basic */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Foto de Perfil</h2>
            <div className="mb-4">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.name} className="w-full rounded-lg h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  Sin foto
                </div>
              )}
            </div>
            <input
              type="url"
              placeholder="URL de la foto de perfil"
              value={profile.profileImage}
              onChange={(e) => handleChange('profileImage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Información Profesional</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">Código Profesional</label>
                <p className="text-gray-900 font-mono">{profile.professionalCode || 'No asignado'}</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Slug (URLs públicas)</label>
                <p className="text-gray-900 break-all">{profile.slug}</p>
              </div>
              <div className="pt-3 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.publicProfileEnabled}
                    onChange={(e) => handleChange('publicProfileEnabled', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-gray-700">Perfil público visible</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Editable Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Información Personal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inmobiliaria / Broker</label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad Principal</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="e.g., Santo Domingo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área de Servicio</label>
                <input
                  type="text"
                  value={profile.area}
                  onChange={(e) => handleChange('area', e.target.value)}
                  placeholder="e.g., East Coast, North"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web (opcional)</label>
                <input
                  type="url"
                  value={profile.websiteUrl}
                  onChange={(e) => handleChange('websiteUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Experiencia y Especialidades</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Años de Experiencia</label>
                <input
                  type="number"
                  min="0"
                  value={profile.yearsExperience}
                  onChange={(e) => handleChange('yearsExperience', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idiomas (separados por comas)</label>
                <input
                  type="text"
                  value={profile.languages.join(', ')}
                  onChange={(e) => handleLanguagesChange(e.target.value)}
                  placeholder="Español, Inglés, Francés"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Ej: Español, Inglés</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidades (separadas por comas)</label>
                <input
                  type="text"
                  value={profile.specialties.join(', ')}
                  onChange={(e) => handleSpecialtiesChange(e.target.value)}
                  placeholder="Apartamentos, Casas, Terrenos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Ej: Apartamentos, Casas, Terrenos</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Cuéntanos sobre ti y tu experiencia..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link
              href="/dashboard/agent/overview"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FiSave />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
