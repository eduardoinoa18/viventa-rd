"use client"

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiMail, FiMapPin, FiPhone, FiShield, FiStar, FiTrendingUp, FiHome, FiAward, FiGlobe } from 'react-icons/fi'

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

type BrokerPublicProfile = {
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
  activeListingsCount: number
  soldListingsCount: number
  avgDom: number
  avgSalePrice: number
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

type ReviewItem = {
  id: string
  authorName: string
  comment: string
  rating: number
  createdAt: string
}

type TeamAgent = {
  id: string
  slug: string
  name: string
  rating: number
  area: string
  photo?: string
}

export default function BrokerSlugProfilePage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [profile, setProfile] = useState<BrokerPublicProfile | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<ListingCard[]>([])
  const [soldListings, setSoldListings] = useState<ListingCard[]>([])
  const [teamAgents, setTeamAgents] = useState<TeamAgent[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)

        const profileRes = await fetch(`/api/brokers/profile/${params.slug}`, { cache: 'no-store' })
        const profileJson = await profileRes.json().catch(() => ({}))

        if (!active) return

        if (profileRes.ok && profileJson?.ok) {
          setProfile(profileJson.profile)

          const reviewRes = await fetch(`/api/professionals/${profileJson.profile.id}/reviews`, { cache: 'no-store' })
          const reviewJson = await reviewRes.json().catch(() => ({}))

          if (!active) return

          if (reviewRes.ok && reviewJson?.ok) {
            setReviews(Array.isArray(reviewJson.reviews) ? reviewJson.reviews : [])
          } else {
            setReviews([])
          }

          const lid = profileJson.profile?.id
          if (lid) {
            fetch(`/api/agents?brokerId=${lid}&limit=8`, { cache: 'no-store' })
              .then((r) => r.json())
              .then((d) => { if (active) setTeamAgents(Array.isArray(d?.data) ? d.data : []) })
              .catch(() => {})
            fetch(`/api/listings/public?brokerId=${lid}&limit=6`)
              .then((r) => r.json())
              .then((d) => { if (active) setListings(d?.listings ?? []) })
              .catch(() => {})
            fetch(`/api/listings/public?brokerId=${lid}&status=sold&limit=4`)
              .then((r) => r.json())
              .then((d) => { if (active) setSoldListings(d?.listings ?? []) })
              .catch(() => {})
          }
        } else {
          setProfile(null)
          setReviews([])
        }
      } catch {
        if (!active) return
        setProfile(null)
        setReviews([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [params.slug])

  const averageRating = useMemo(() => {
    if (!reviews.length) return profile?.rating || 0
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0)
    return Number((total / reviews.length).toFixed(1))
  }, [reviews, profile?.rating])

  if (!loading && !profile) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-[#0B2545] mb-3">Perfil no disponible</h1>
          <p className="text-gray-600 mb-6">No encontramos este broker o no está público en este momento.</p>
          <button onClick={() => router.push('/brokers')} className="px-5 py-3 bg-[#3BAFDA] text-white rounded-lg font-semibold">
            Ver brokers
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
            <div className="bg-gradient-to-r from-[#0B2545] to-[#3BAFDA] p-6 text-white">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={profile?.image || '/placeholder.png'}
                  alt={profile?.company || profile?.name || 'Brokerage'}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-4 border-white shadow-lg"
                />
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold break-words">{profile?.company || profile?.name}</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-blue-100">
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
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Vendidos</div>
                <div className="text-2xl font-bold text-[#0B2545]">{profile?.soldListingsCount || 0}</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Avg DOM</div>
                <div className="text-2xl font-bold text-[#0B2545]">{profile?.avgDom || 0}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Rating</div>
                <div className="text-2xl font-bold text-[#0B2545] inline-flex items-center gap-1 justify-center">
                  <FiStar className="text-yellow-400" /> {averageRating}
                </div>
              </div>
            </div>

            {/* Trust badges */}
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
                  <FiStar className="w-3.5 h-3.5" /> Pro
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
              <div className="rounded-xl border border-[#D7ECFA] bg-[#F4FAFF] p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0B2545]">Acciones rápidas</p>
                  <p className="text-xs text-gray-600">Contacta la oficina y navega oportunidades activas en su zona.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/search?broker=${encodeURIComponent(profile?.slug || params.slug)}`} className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-xs font-semibold">
                    Ver oportunidades
                  </Link>
                  {profile?.phone ? (
                    <a
                      href={`https://wa.me/${profile.phone.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg bg-[#3BAFDA] text-white text-xs font-semibold"
                    >
                      WhatsApp a la oficina
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="px-6 pt-4">
              <div className="rounded-xl border border-[#3BAFDA]/20 bg-[#F4FAFF] p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0B2545]">Trabaja o aplica con esta oficina</p>
                  <p className="text-xs text-gray-600">Si eres agente y te interesa unirte a esta estructura, inicia el proceso desde aquí.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/apply?pathway=agent&broker=${encodeURIComponent(profile?.slug || params.slug)}`} className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-xs font-semibold">
                    Aplicar como agente
                  </Link>
                  <Link href={`/contact?broker=${encodeURIComponent(profile?.slug || params.slug)}`} className="px-3 py-2 rounded-lg border border-[#0B2545] text-[#0B2545] text-xs font-semibold">
                    Contactar oficina
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre la oficina</h2>
                <p className="text-gray-700 leading-relaxed break-words">{profile?.bio || 'Esta oficina aún no ha completado su descripción pública.'}</p>

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

                {(profile?.avgSalePrice ?? 0) > 0 && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">Precio promedio de cierre:</span> {new Intl.NumberFormat('es-DO', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(profile?.avgSalePrice ?? 0)}
                  </div>
                )}
              </section>

              <aside className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contactar oficina</h2>
                <div className="space-y-3">
                  {profile?.phone ? (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-[#3BAFDA] transition-all">
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
                      <div className="w-10 h-10 bg-[#3BAFDA] rounded-full flex items-center justify-center text-white">
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
                    <Link className="text-[#0B2545] underline" href={`/broker/${profile?.slug || params.slug}`}>
                      /broker/{profile?.slug || params.slug}
                    </Link>
                  </p>
                </div>
              </aside>
            </div>

            {/* Active Listings Grid */}
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
                  <Link href={`/search?broker=${encodeURIComponent(profile?.slug ?? params.slug)}`}
                    className="text-sm text-[#0B2545] hover:underline font-semibold">
                    Ver todos los listados →
                  </Link>
                </div>
              </div>
            )}

            {teamAgents.length > 0 && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipo de agentes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {teamAgents.map((agent) => (
                    <Link key={agent.id} href={`/agent/${encodeURIComponent(agent.slug || agent.id)}`} className="group block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <img
                          src={agent.photo || '/agent-placeholder.jpg'}
                          alt={agent.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{agent.name}</p>
                          <p className="text-xs text-gray-500 truncate">{agent.area || 'RD'}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-amber-600 font-semibold">Rating {Number(agent.rating || 0).toFixed(1)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {soldListings.length > 0 && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cierres recientes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {soldListings.map((l) => (
                    <Link key={l.id} href={`/listing/${l.id}`} className="group block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">{l.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{l.city}{l.sector ? `, ${l.sector}` : ''}</p>
                      <div className="mt-3 text-xs text-emerald-700 font-semibold">Transacci\u00f3n cerrada</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Rese\u00f1as de clientes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.slice(0, 4).map((review) => (
                    <article key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">{review.authorName || 'Cliente verificado'}</p>
                        <p className="text-xs text-amber-600 font-semibold">{Number(review.rating || 0).toFixed(1)} / 5</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-4">{review.comment || 'Experiencia positiva con esta oficina.'}</p>
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
