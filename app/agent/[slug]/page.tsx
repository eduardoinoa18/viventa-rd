"use client"

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiArrowLeft, FiMail, FiMapPin, FiPhone, FiShield, FiStar,
  FiTrendingUp, FiHome, FiAward, FiGlobe,
} from 'react-icons/fi'
import { VIVENTA_PHONE_E164, VIVENTA_PHONE_DISPLAY, VIVENTA_EMAIL_DISPLAY } from '@/lib/contact'

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

type ListingCard = {
  id: string
  title: string
  price: number
  listingType: string
  propertyType: string
  city: string
  sector?: string
  bedrooms?: number
  bathrooms?: number
  photos?: string[]
}

type ReviewItem = {
  id: string
  authorName: string
  comment: string
  rating: number
  createdAt: string
}

export default function AgentSlugProfilePage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [profile, setProfile] = useState<AgentPublicProfile | null>(null)
  const [listings, setListings] = useState<ListingCard[]>([])
  const [soldListings, setSoldListings] = useState<ListingCard[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
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
          const lid = json.profile?.id
          if (lid) {
            fetch(`/api/professionals/${lid}/reviews`, { cache: 'no-store' })
              .then((r) => r.json())
              .then((d) => { if (active) setReviews(Array.isArray(d?.reviews) ? d.reviews : []) })
              .catch(() => {})
            fetch(`/api/listings/public?agentId=${lid}&limit=6`)
              .then((r) => r.json())
              .then((d) => { if (active) setListings(d?.listings ?? []) })
              .catch(() => {})
            fetch(`/api/listings/public?agentId=${lid}&status=sold&limit=4`)
              .then((r) => r.json())
              .then((d) => { if (active) setSoldListings(d?.listings ?? []) })
              .catch(() => {})
          }
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
    return () => { active = false }
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

            <div className="px-6 py-3 flex flex-wrap gap-2 border-b bg-gray-50">
              {profile?.emailVerified && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
                  <FiShield className="w-3.5 h-3.5" /> Email verificado
                </span>
              )}
              {profile?.identityVerified && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                  <FiAward className="w-3.5 h-3.5" /> Identidad verificada
                </span>
              )}
              {profile?.activeSubscription && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                  <FiStar className="w-3.5 h-3.5" /> Agente Pro
                </span>
              )}
              {profile?.professionalCode && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-200 text-gray-600">
                  Lic. {profile.professionalCode}
                </span>
              )}
              {profile?.languages?.length ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
                  <FiGlobe className="w-3.5 h-3.5" /> {profile.languages.join(' · ')}
                </span>
              ) : null}
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
                  <a
                    href={`https://wa.me/${VIVENTA_PHONE_E164}?text=${encodeURIComponent(`Hola VIVENTA, me interesa contactar al agente ${profile?.name || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg bg-[#00A676] text-white text-xs font-semibold"
                  >
                    WhatsApp a VIVENTA
                  </a>
                </div>
              </div>
            </div>

            <div className="px-6 pt-4">
              <div className="rounded-xl border border-[#00A676]/20 bg-[#F0FBF6] p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0B2545]">Trabaja con este agente</p>
                  <p className="text-xs text-gray-600">Ideal para comprador final, inversionista o propietario que quiera una estrategia guiada en RD.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/contact?agent=${encodeURIComponent(profile?.slug || params.slug)}`} className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-xs font-semibold">
                    Solicitar asesoría
                  </Link>
                  <Link href={`/search?agent=${encodeURIComponent(profile?.slug || params.slug)}`} className="px-3 py-2 rounded-lg border border-[#0B2545] text-[#0B2545] text-xs font-semibold">
                    Ver portafolio completo
                  </Link>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contactar a través de VIVENTA</h2>
                <div className="space-y-3">
                  <a href={`https://wa.me/${VIVENTA_PHONE_E164}?text=${encodeURIComponent(`Hola VIVENTA, me interesa este agente: ${profile?.name || ''}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-[#00A676] transition-all">
                    <div className="w-10 h-10 bg-[#00A676] rounded-full flex items-center justify-center text-white">
                      <FiPhone className="text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">WhatsApp VIVENTA</div>
                      <div className="font-semibold text-gray-900 truncate">{VIVENTA_PHONE_DISPLAY}</div>
                    </div>
                  </a>

                  <a href={`mailto:${VIVENTA_EMAIL_DISPLAY}`} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-[#0B2545] transition-all">
                    <div className="w-10 h-10 bg-[#0B2545] rounded-full flex items-center justify-center text-white">
                      <FiMail className="text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="font-semibold text-gray-900 truncate">{VIVENTA_EMAIL_DISPLAY}</div>
                    </div>
                  </a>
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

            {listings.length > 0 && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiHome className="text-[#0B2545]" /> Propiedades activas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map((l) => (
                    <Link key={l.id} href={`/listing/${l.id}`} className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      {l.photos?.[0] ? (
                        <img src={l.photos[0]} alt={l.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
                          <FiHome className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1">{l.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{l.city}{l.sector ? `, ${l.sector}` : ''}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-[#0B2545]">${l.price.toLocaleString()}</span>
                          {l.bedrooms != null && (
                            <span className="text-xs text-gray-400">{l.bedrooms}h · {l.bathrooms}b</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link href={`/search?agent=${encodeURIComponent(profile?.slug ?? params.slug)}`}
                    className="text-sm text-[#0B2545] hover:underline font-semibold">
                    Ver todos los listados →
                  </Link>
                </div>
              </div>
            )}

            {soldListings.length > 0 && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de cierres recientes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {soldListings.map((l) => (
                    <Link key={l.id} href={`/listing/${l.id}`} className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-3">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1">{l.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{l.city}{l.sector ? `, ${l.sector}` : ''}</p>
                        <div className="mt-2 text-xs text-emerald-700 font-semibold">Cerrada</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Opiniones de clientes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.slice(0, 4).map((review) => (
                    <article key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">{review.authorName || 'Cliente verificado'}</p>
                        <p className="text-xs text-amber-600 font-semibold">{Number(review.rating || 0).toFixed(1)} / 5</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-4">{review.comment || 'Excelente experiencia trabajando con este agente.'}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
