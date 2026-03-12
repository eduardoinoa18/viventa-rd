"use client"

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiArrowLeft, FiMail, FiMapPin, FiPhone, FiShield, FiStar, FiTrendingUp } from 'react-icons/fi'

type AgentPublicProfile = {
  id: string
  slug: string
  name: string
  company: string
  email: string
  phone: string
  image: string
  bio: string
  specialties: string[]
  languages: string[]
  areasServed: string
  yearsExperience: number
  salesCount: number
  activeListingsCount: number
  rating: number
  reviewsCount: number
  emailVerified: boolean
  identityVerified: boolean
  activeSubscription: boolean
  professionalCode: string
  website?: string
  officeAddress?: string
  rankingScore: number
}

export default function AgentSlugProfilePage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [profile, setProfile] = useState<AgentPublicProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/agents/profile/${params.slug}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && json?.ok) {
          setProfile(json.profile)
        } else {
          setProfile(null)
        }
      } catch {
        if (!active) return
        setProfile(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [params.slug])

  if (!loading && !profile) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-[#0B2545] mb-3">Perfil no disponible</h1>
          <p className="text-gray-600 mb-6">No encontramos este agente o no está público en este momento.</p>
          <button onClick={() => router.push('/agents')} className="px-5 py-3 bg-[#00A676] text-white rounded-lg font-semibold">
            Ver agentes
          </button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[#0B2545] font-semibold hover:text-[#134074] transition-colors"
            >
              <FiArrowLeft className="text-xl" />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#0B2545] to-[#00A676] p-6 text-white">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={profile?.image || '/agent-placeholder.jpg'}
                  alt={profile?.name || 'Agente'}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold break-words">{profile?.name}</h1>
                  {profile?.company && (
                    <p className="text-green-100 mt-1 break-words">{profile.company}</p>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-green-100">
                    <FiMapPin />
                    <span className="break-words">{profile?.areasServed || 'República Dominicana'}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                    {profile?.professionalCode && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">Código: {profile.professionalCode}</span>
                    )}
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                      <FiTrendingUp /> Score {profile?.rankingScore || 0}
                    </span>
                    {(profile?.emailVerified || profile?.identityVerified) && (
                      <span className="bg-emerald-500/80 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                        <FiShield /> Verificado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Listados activos</div>
                <div className="text-2xl font-bold text-[#0B2545]">{profile?.activeListingsCount || 0}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Ventas</div>
                <div className="text-2xl font-bold text-[#0B2545]">{profile?.salesCount || 0}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Rating</div>
                <div className="text-2xl font-bold text-[#0B2545] inline-flex items-center gap-1 justify-center">
                  <FiStar className="text-yellow-400" /> {profile?.rating || 0}
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Experiencia</div>
                <div className="text-2xl font-bold text-[#0B2545]">{profile?.yearsExperience || 0}</div>
              </div>
            </div>

            <div className="px-6 pt-6">
              <div className="rounded-xl border border-[#CFE8FF] bg-[#F5FAFF] p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0B2545]">Acciones rápidas</p>
                  <p className="text-xs text-gray-600">Conecta con el agente y explora más propiedades de su portafolio.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/search?agent=${encodeURIComponent(profile?.slug || params.slug)}`} className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-xs font-semibold">
                    Ver listados activos
                  </Link>
                  {profile?.phone ? (
                    <a
                      href={`https://wa.me/${profile.phone.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg bg-[#00A676] text-white text-xs font-semibold"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Perfil profesional</h2>
                <p className="text-gray-700 leading-relaxed break-words">{profile?.bio || 'Este agente aún no ha completado su biografía pública.'}</p>

                {profile?.specialties?.length ? (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Especialidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.specialties.map((item) => (
                        <span key={item} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">{item}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {profile?.languages?.length ? (
                  <div className="mt-4 text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">Idiomas:</span> {profile.languages.join(', ')}
                  </div>
                ) : null}
              </section>

              <aside className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contactar</h2>
                <div className="space-y-3">
                  {profile?.phone ? (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-[#00A676] transition-all">
                      <div className="w-10 h-10 bg-[#0B2545] rounded-full flex items-center justify-center text-white">
                        <FiPhone className="text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Teléfono</div>
                        <div className="font-semibold text-gray-900 truncate">{profile.phone}</div>
                      </div>
                    </a>
                  ) : null}

                  {profile?.email ? (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-[#0B2545] transition-all">
                      <div className="w-10 h-10 bg-[#00A676] rounded-full flex items-center justify-center text-white">
                        <FiMail className="text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="font-semibold text-gray-900 truncate">{profile.email}</div>
                      </div>
                    </a>
                  ) : null}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                  {profile?.officeAddress ? <p className="break-words"><strong>Oficina:</strong> {profile.officeAddress}</p> : null}
                  {profile?.website ? (
                    <p>
                      <strong>Web:</strong>{' '}
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#0B2545] underline break-all">
                        {profile.website}
                      </a>
                    </p>
                  ) : null}
                  <p>
                    <strong>URL pública:</strong>{' '}
                    <Link className="text-[#0B2545] underline" href={`/agent/${profile?.slug || params.slug}`}>
                      /agent/{profile?.slug || params.slug}
                    </Link>
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
