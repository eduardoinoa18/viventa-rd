'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

type SessionData = {
  uid: string
  role: string
}

type ProfileData = {
  bio: string
  specialties: string[]
  languages: string[]
  officeAddress: string
  website: string
  profileImage: string
  companyLogo: string
  company: string
  yearsExperience: number
  yearsInBusiness: number
  salesCount: number
  teamSize: number
  markets: string
  city: string
  phone: string
  professionalCode: string
  role: string
  name: string
  publicProfileEnabled: boolean
  slug: string
}

const EMPTY_PROFILE: ProfileData = {
  bio: '',
  specialties: [],
  languages: [],
  officeAddress: '',
  website: '',
  profileImage: '',
  companyLogo: '',
  company: '',
  yearsExperience: 0,
  yearsInBusiness: 0,
  salesCount: 0,
  teamSize: 0,
  markets: '',
  city: '',
  phone: '',
  professionalCode: '',
  role: '',
  name: '',
  publicProfileEnabled: true,
  slug: '',
}

function listToArray(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function DashboardSettingsPage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE)
  const [specialtiesInput, setSpecialtiesInput] = useState('')
  const [languagesInput, setLanguagesInput] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' })
        const sessionJson = await sessionRes.json().catch(() => ({}))
        if (!sessionRes.ok || !sessionJson?.ok || !sessionJson?.session) {
          if (!active) return
          setError('Debes iniciar sesión para editar tu perfil.')
          return
        }

        const nextSession = sessionJson.session as SessionData
        if (!active) return
        setSession(nextSession)

        const role = String(nextSession.role || '').toLowerCase()
        if (!['agent', 'broker', 'constructora', 'master_admin'].includes(role)) {
          setError('Tu rol no tiene acceso a configuración de perfil público.')
          return
        }

        const profileRes = await fetch('/api/professionals/profile', { cache: 'no-store' })
        const profileJson = await profileRes.json().catch(() => ({}))
        if (!profileRes.ok || !profileJson?.ok) {
          throw new Error(profileJson?.error || 'No se pudo cargar tu perfil profesional')
        }

        const nextProfile = { ...EMPTY_PROFILE, ...(profileJson.profile || {}) }
        if (!active) return
        setProfile(nextProfile)
        setSpecialtiesInput(Array.isArray(nextProfile.specialties) ? nextProfile.specialties.join(', ') : '')
        setLanguagesInput(Array.isArray(nextProfile.languages) ? nextProfile.languages.join(', ') : '')
      } catch (e: any) {
        if (!active) return
        setError(e?.message || 'No se pudo cargar la configuración')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const publicUrl = useMemo(() => {
    if (!session?.uid) return ''
    const role = String(profile.role || session.role || '').toLowerCase()
    if (role === 'broker') return `/broker/${profile.slug || session.uid}`
    if (role === 'agent') return `/agent/${profile.slug || session.uid}`
    if (role === 'constructora') return `/constructoras/${session.uid}`
    return ''
  }, [profile.role, profile.slug, session?.role, session?.uid])

  async function saveProfile() {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const payload = {
        bio: profile.bio,
        specialties: listToArray(specialtiesInput),
        languages: listToArray(languagesInput),
        officeAddress: profile.officeAddress,
        website: profile.website,
        profileImage: profile.profileImage,
        companyLogo: profile.companyLogo,
        company: profile.company,
        yearsExperience: Number(profile.yearsExperience || 0),
        yearsInBusiness: Number(profile.yearsInBusiness || 0),
        salesCount: Number(profile.salesCount || 0),
        teamSize: Number(profile.teamSize || 0),
        markets: profile.markets,
        city: profile.city,
        phone: profile.phone,
        publicProfileEnabled: profile.publicProfileEnabled,
      }

      const res = await fetch('/api/professionals/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo guardar el perfil')
      }

      setMessage('Perfil público actualizado correctamente.')
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-[#0B2545]">Configuración de perfil público</h1>
            <p className="text-sm text-gray-600 mt-1">Administra la información que verán los usuarios en tu landing pública de Viventa.</p>
            {publicUrl && (
              <p className="text-sm text-gray-700 mt-3">
                URL pública: <Link href={publicUrl} className="text-[#0B2545] underline">{publicUrl}</Link>
              </p>
            )}
          </div>

          {loading ? (
            <div className="bg-white border border-gray-100 rounded-xl p-6 text-gray-600">Cargando configuración...</div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}

              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={profile.publicProfileEnabled}
                  onChange={(e) => setProfile((prev) => ({ ...prev, publicProfileEnabled: e.target.checked }))}
                />
                Mostrar mi perfil públicamente
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="px-3 py-2 border rounded-lg" placeholder="Teléfono" value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} />
                <input className="px-3 py-2 border rounded-lg" placeholder="Ciudad" value={profile.city} onChange={(e) => setProfile((prev) => ({ ...prev, city: e.target.value }))} />
                <input className="px-3 py-2 border rounded-lg md:col-span-2" placeholder="Mercados / zonas atendidas" value={profile.markets} onChange={(e) => setProfile((prev) => ({ ...prev, markets: e.target.value }))} />
                <input className="px-3 py-2 border rounded-lg md:col-span-2" placeholder="Dirección de oficina" value={profile.officeAddress} onChange={(e) => setProfile((prev) => ({ ...prev, officeAddress: e.target.value }))} />
                <input className="px-3 py-2 border rounded-lg md:col-span-2" placeholder="Sitio web" value={profile.website} onChange={(e) => setProfile((prev) => ({ ...prev, website: e.target.value }))} />
                <input className="px-3 py-2 border rounded-lg md:col-span-2" placeholder="URL de imagen de perfil" value={profile.profileImage} onChange={(e) => setProfile((prev) => ({ ...prev, profileImage: e.target.value }))} />
                <input className="px-3 py-2 border rounded-lg md:col-span-2" placeholder="Especialidades (separadas por coma)" value={specialtiesInput} onChange={(e) => setSpecialtiesInput(e.target.value)} />
                <input className="px-3 py-2 border rounded-lg md:col-span-2" placeholder="Idiomas (separados por coma)" value={languagesInput} onChange={(e) => setLanguagesInput(e.target.value)} />
              </div>

              <textarea
                className="w-full px-3 py-2 border rounded-lg min-h-[140px]"
                placeholder="Biografía pública"
                value={profile.bio}
                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-[#00A676] text-white font-semibold disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar perfil'}
                </button>
                <Link href="/dashboard" className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold">
                  Volver al dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
