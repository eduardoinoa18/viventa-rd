"use client"

import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiMail, FiMapPin, FiPhone, FiShield, FiStar, FiTrendingUp } from 'react-icons/fi'

type BrokerProfile = {
  id: string
  role: string
  name: string
  company: string
  email: string
  phone: string
  city: string
  area: string
  markets: string
  image: string
  bio: string
  specialties: string[]
  languages: string[]
  website: string
  officeAddress: string
  yearsExperience: number
  salesCount: number
  activeListings: number
  teamSize: number
  rating: number
  reviewsCount: number
  emailVerified: boolean
  identityVerified: boolean
  activeSubscription: boolean
  professionalCode: string
  rankingScore: number
}

type ReviewItem = {
  id: string
  authorName: string
  comment: string
  rating: number
  createdAt: string
}

export default function BrokerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [profile, setProfile] = useState<BrokerProfile | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewName, setReviewName] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        const [profileRes, reviewRes] = await Promise.all([
          fetch(`/api/professionals/${params.id}`, { cache: 'no-store' }),
          fetch(`/api/professionals/${params.id}/reviews`, { cache: 'no-store' }),
        ])

        const profileJson = await profileRes.json().catch(() => ({}))
        const reviewJson = await reviewRes.json().catch(() => ({}))

        if (!active) return

        if (profileRes.ok && profileJson?.ok) {
          setProfile(profileJson.profile)
        } else {
          setProfile(null)
        }

        if (reviewRes.ok && reviewJson?.ok) {
          setReviews(Array.isArray(reviewJson.reviews) ? reviewJson.reviews : [])
        } else {
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
  }, [params.id])

  const averageRating = useMemo(() => {
    if (!reviews.length) return profile?.rating || 0
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0)
    return Number((total / reviews.length).toFixed(1))
  }, [reviews, profile?.rating])

  async function submitReview() {
    if (!reviewName.trim() || !reviewComment.trim()) {
      setReviewMessage('Completa tu nombre y comentario para enviar la reseña.')
      return
    }

    try {
      setSubmittingReview(true)
      setReviewMessage('')

      const response = await fetch(`/api/professionals/${params.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: reviewName,
          comment: reviewComment,
          rating: reviewRating,
        }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo enviar la reseña')
      }

      setReviewName('')
      setReviewComment('')
      setReviewRating(5)
      setReviewMessage('Reseña enviada. Será publicada luego de revisión.')
    } catch (error: any) {
      setReviewMessage(error?.message || 'No se pudo enviar la reseña')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (!loading && !profile) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-[#0B2545] mb-3">Perfil no disponible</h1>
          <p className="text-gray-600 mb-6">No encontramos este brokerage o no está público en este momento.</p>
          <button onClick={() => router.push('/brokers')} className="px-5 py-3 bg-[#3BAFDA] text-white rounded-lg font-semibold">
            Ver brokerages
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
          <div className="max-w-4xl mx-auto px-4 py-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[#0B2545] font-semibold hover:text-[#134074] transition-colors"
            >
              <FiArrowLeft className="text-xl" />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#0B2545] to-[#3BAFDA] p-6 text-white">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={profile?.image || '/brokerage-placeholder.jpg'}
                  alt={profile?.name || 'Broker'}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-4 border-white shadow-lg"
                />
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold">{profile?.name}</h1>
                  {profile?.company && profile.company !== profile.name && (
                    <p className="text-blue-100 mt-1">{profile.company}</p>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-blue-100">
                    <FiMapPin />
                    <span>{profile?.area || 'República Dominicana'}</span>
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

            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Rating</div>
                <div className="text-2xl font-bold text-[#0B2545] inline-flex items-center gap-1 justify-center">
                  <FiStar className="text-yellow-400" /> {averageRating}
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Ventas</div>
                <div className="text-2xl font-bold text-[#0B2545]">{profile?.salesCount || 0}</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">Años exp.</div>
                <div className="text-2xl font-bold text-[#0B2545]">{profile?.yearsExperience || 0}</div>
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Perfil profesional</h2>
              <p className="text-gray-700 leading-relaxed">{profile?.bio || 'Este profesional aún no ha completado su biografía pública.'}</p>

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
            </div>

            <div className="p-6 bg-gray-50 border-t">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contactar</h2>
              <div className="space-y-3">
                {profile?.phone ? (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#3BAFDA] transition-all">
                    <div className="w-12 h-12 bg-[#0B2545] rounded-full flex items-center justify-center text-white">
                      <FiPhone className="text-xl" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Teléfono</div>
                      <div className="font-semibold text-gray-900">{profile.phone}</div>
                    </div>
                  </a>
                ) : null}

                {profile?.email ? (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#0B2545] transition-all">
                    <div className="w-12 h-12 bg-[#3BAFDA] rounded-full flex items-center justify-center text-white">
                      <FiMail className="text-xl" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-semibold text-gray-900">{profile.email}</div>
                    </div>
                  </a>
                ) : null}
              </div>
            </div>

            <div className="p-6 border-t">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Opiniones públicas</h2>
              <div className="space-y-3 mb-6">
                {reviews.length ? reviews.map((review) => (
                  <article key={review.id} className="bg-gray-50 border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{review.authorName}</p>
                      <p className="text-sm text-gray-600">{new Date(review.createdAt).toLocaleDateString('es-DO')}</p>
                    </div>
                    <p className="text-sm text-yellow-600 mb-2">{'★'.repeat(Math.max(1, Math.min(5, Math.round(review.rating || 0))))}</p>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </article>
                )) : (
                  <p className="text-sm text-gray-600">Aún no hay reseñas publicadas.</p>
                )}
              </div>

              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Deja tu reseña</h3>
                <div className="space-y-3">
                  <input
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                    aria-label="Calificación"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} estrellas</option>
                    ))}
                  </select>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Comparte tu experiencia"
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={submitReview}
                    disabled={submittingReview}
                    className="px-4 py-2 bg-[#3BAFDA] text-white rounded-lg font-semibold disabled:opacity-60"
                  >
                    {submittingReview ? 'Enviando...' : 'Enviar reseña'}
                  </button>
                  {reviewMessage ? <p className="text-sm text-gray-700">{reviewMessage}</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
