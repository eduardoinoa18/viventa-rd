'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FiArrowLeft,
  FiSave,
  FiAlertCircle,
  FiCheckCircle,
  FiUpload,
  FiUser,
  FiGlobe,
} from 'react-icons/fi'

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const suggestedLanguages = ['Espanol', 'Ingles', 'Frances', 'Italiano']
  const suggestedSpecialties = ['Apartamentos', 'Casas', 'Terrenos', 'Comercial', 'Inversion']

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' })
        const sessionJson = await sessionRes.json().catch(() => ({}))
        
        if (!sessionRes.ok || !sessionJson?.session?.uid) {
          router.push('/login?next=/dashboard/agent/profile')
          return
        }

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

  const toggleArrayItem = (field: 'languages' | 'specialties', value: string) => {
    if (!profile) return
    const current = profile[field] || []
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    handleChange(field, next)
  }

  const handlePhotoUpload = async (file: File | null) => {
    if (!file || !profile) return

    setUploadingPhoto(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'agent')

      const res = await fetch('/api/uploads/profile-media', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok || !json?.url) {
        throw new Error(json?.error || 'No se pudo subir la foto')
      }

      handleChange('profileImage', json.url)
      setMessage({ type: 'success', text: 'Foto subida correctamente. Recuerda guardar cambios.' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Error subiendo la foto' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const completion = profile
    ? Math.round(
        ([
          profile.name,
          profile.phone,
          profile.bio,
          profile.city,
          profile.area,
          profile.profileImage,
          profile.languages.length > 0 ? 'yes' : '',
          profile.specialties.length > 0 ? 'yes' : '',
        ].filter(Boolean).length /
          8) *
          100
      )
    : 0

  const completionClass =
    completion >= 95
      ? 'w-full'
      : completion >= 80
      ? 'w-4/5'
      : completion >= 66
      ? 'w-2/3'
      : completion >= 50
      ? 'w-1/2'
      : completion >= 33
      ? 'w-1/3'
      : completion >= 20
      ? 'w-1/5'
      : 'w-[12%]'

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
      <div className="rounded-2xl bg-gradient-to-r from-[#0B2545] to-[#00A676] p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Perfil Profesional del Agente</h1>
            <p className="text-white/90 mt-1">Personaliza tu marca y tu presencia publica en VIVENTA.</p>
          </div>
          <Link href="/dashboard/agent/overview" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25">
            <FiArrowLeft />
            Volver
          </Link>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Perfil completado</span>
            <span className="font-semibold">{completion}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className={`h-full bg-white rounded-full ${completionClass}`} />
          </div>
        </div>
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
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Foto de Perfil</h2>
            <div className="mb-4">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.name} className="w-full rounded-lg h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FiUser className="mx-auto mb-2" />
                    Sin foto
                  </div>
                </div>
              )}
            </div>
            <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
              <FiUpload />
              {uploadingPhoto ? 'Subiendo foto...' : 'Subir foto desde dispositivo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG o WEBP. Maximo 3MB.</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
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
                    title="Mostrar perfil publico"
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
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Información Personal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  title="Nombre completo"
                  value={profile.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  title="Correo electronico"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  title="Telefono"
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
                    title="Empresa o broker"
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
                <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                  <FiGlobe /> Solo tu pagina oficial o landing profesional.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Experiencia y Especialidades</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Años de Experiencia</label>
                <input
                  type="number"
                  title="Anos de experiencia"
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
                  placeholder="Espanol, Ingles"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestedLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleArrayItem('languages', lang)}
                      className={`px-2 py-1 text-xs rounded-full border ${
                        profile.languages.includes(lang)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestedSpecialties.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayItem('specialties', item)}
                      className={`px-2 py-1 text-xs rounded-full border ${
                        profile.specialties.includes(item)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
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

          <div className="flex gap-3 justify-end sticky bottom-3 bg-gray-50/95 p-3 rounded-xl border border-gray-200">
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
