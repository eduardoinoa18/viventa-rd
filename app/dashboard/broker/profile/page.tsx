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
  FiBriefcase,
  FiMapPin,
} from 'react-icons/fi'

type BrokerProfile = {
  id: string
  company: string
  email: string
  phone: string
  website: string
  description: string
  logo: string
  city: string
  areasServed: string[]
  languages: string[]
  yearsEstablished: number
  slug: string
  publicProfileEnabled: boolean
  professionalCode: string
  officeAddress: string
}

export default function BrokerProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<BrokerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const suggestedAreas = ['Santo Domingo', 'Santiago', 'Punta Cana', 'La Romana', 'Puerto Plata']
  const suggestedLanguages = ['Espanol', 'Ingles', 'Frances', 'Aleman']

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' })
        const sessionJson = await sessionRes.json().catch(() => ({}))
        
        if (!sessionRes.ok || !sessionJson?.session?.uid) {
          router.push('/login?next=/dashboard/broker/profile')
          return
        }

        // Load broker profile
        const res = await fetch('/api/brokers/current', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        if (res.ok && json?.ok && json?.broker) {
          setProfile(json.broker)
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

  const handleAreasChange = (value: string) => {
    const areas = value.split(',').map((a) => a.trim()).filter(Boolean)
    handleChange('areasServed', areas)
  }

  const toggleArrayItem = (field: 'areasServed' | 'languages', value: string) => {
    if (!profile) return
    const current = profile[field] || []
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    handleChange(field, next)
  }

  const handleLogoUpload = async (file: File | null) => {
    if (!file || !profile) return

    setUploadingLogo(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'broker')

      const res = await fetch('/api/uploads/profile-media', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.ok || !json?.url) {
        throw new Error(json?.error || 'No se pudo subir el logo')
      }

      handleChange('logo', json.url)
      setMessage({ type: 'success', text: 'Logo subido correctamente. Recuerda guardar cambios.' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Error subiendo el logo' })
    } finally {
      setUploadingLogo(false)
    }
  }

  const completion = profile
    ? Math.round(
        ([
          profile.company,
          profile.phone,
          profile.officeAddress,
          profile.description,
          profile.logo,
          profile.areasServed.length > 0 ? 'yes' : '',
          profile.languages.length > 0 ? 'yes' : '',
        ].filter(Boolean).length /
          7) *
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
      const res = await fetch('/api/brokers/current', {
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
      <div className="rounded-2xl bg-gradient-to-r from-[#0B2545] to-[#FF6B35] p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Perfil de Inmobiliaria</h1>
            <p className="text-white/90 mt-1">Optimiza tu marca, cobertura y conversion con un perfil de alto nivel.</p>
          </div>
          <Link href="/dashboard/broker/overview" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25">
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
        {/* Left Column - Logo & Basic */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Logo de Empresa</h2>
            <div className="mb-4">
              {profile.logo ? (
                <img src={profile.logo} alt={profile.company} className="w-full rounded-lg h-48 object-contain bg-gray-50 p-4" />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FiBriefcase className="mx-auto mb-2" />
                    Sin logo
                  </div>
                </div>
              )}
            </div>
            <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
              <FiUpload />
              {uploadingLogo ? 'Subiendo logo...' : 'Subir logo desde dispositivo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploadingLogo}
                onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG o WEBP. Maximo 3MB.</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Información Legal</h2>
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
            <h2 className="font-semibold text-gray-900 mb-4">Información de Contacto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Inmobiliaria</label>
                <input
                  type="text"
                  title="Nombre de la inmobiliaria"
                  value={profile.company}
                  onChange={(e) => handleChange('company', e.target.value)}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de la Oficina</label>
                <input
                  type="text"
                  value={profile.officeAddress}
                  onChange={(e) => handleChange('officeAddress', e.target.value)}
                  placeholder="Ej: Av. Winston Churchill 953, Santo Domingo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                  <FiMapPin /> Esta direccion se usa para dar confianza en tu perfil publico.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Información Profesional</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Años Establecida</label>
                <input
                  type="number"
                  title="Anos establecida"
                  min="0"
                  value={profile.yearsEstablished}
                  onChange={(e) => handleChange('yearsEstablished', Number(e.target.value))}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Principales Ciudades de Operación (separadas por comas)</label>
                <input
                  type="text"
                  value={profile.areasServed.join(', ')}
                  onChange={(e) => handleAreasChange(e.target.value)}
                  placeholder="Santo Domingo, Santiago, La Romana"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestedAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArrayItem('areasServed', area)}
                      className={`px-2 py-1 text-xs rounded-full border ${
                        profile.areasServed.includes(area)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={profile.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Cuéntanos sobre tu inmobiliaria, especialidades, experiencia..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end sticky bottom-3 bg-gray-50/95 p-3 rounded-xl border border-gray-200">
            <Link
              href="/dashboard/broker/overview"
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
