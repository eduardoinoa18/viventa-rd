/**
 * Developer Profile Page - Public Portfolio
 * /constructoras/[id]
 */

import { notFound } from 'next/navigation'
import { getAdminDb } from '@/lib/firebaseAdmin'
import Image from 'next/image'
import { FiGlobe, FiFacebook, FiInstagram, FiLinkedin, FiMapPin, FiPhone, FiMail } from 'react-icons/fi'
import PropertyCard from '@/components/PropertyCard'
import type { Developer } from '@/types/developer'

async function getDeveloperWithListings(idOrSlug: string) {
  const db = getAdminDb()
  if (!db) return null

  let developerDoc = await db.collection('developers').doc(idOrSlug).get()

  if (!developerDoc.exists) {
    const slugSnap = await db
      .collection('developers')
      .where('slug', '==', idOrSlug)
      .limit(1)
      .get()

    if (slugSnap.empty) return null
    developerDoc = slugSnap.docs[0]
  }

  const developerId = developerDoc.id

  const developer: Developer = {
    id: developerId,
    ...developerDoc.data()
  } as Developer

  // Get all listings by this developer
  const listingsSnapshot = await db
    .collection('properties')
    .where('developerId', '==', developerId)
    .get()

  const allListings = listingsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[]

  const activeListings = allListings.filter((l: any) => l.status === 'active')
  const completedListings = allListings.filter((l: any) => l.status === 'sold' || l.status === 'rented')

  return {
    developer,
    activeListings,
    completedListings
  }
}

export default async function DeveloperProfilePage({
  params
}: {
  params: { id: string }
}) {
  const data = await getDeveloperWithListings(params.id)

  if (!data) {
    notFound()
  }

  const { developer, activeListings, completedListings } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Logo */}
            {developer.logoUrl ? (
              <div className="w-32 h-32 bg-white rounded-lg p-4 flex items-center justify-center">
                <Image
                  src={developer.logoUrl}
                  alt={developer.companyName}
                  width={128}
                  height={128}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {developer.companyName?.charAt(0)}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{developer.companyName}</h1>
              {developer.yearEstablished && (
                <p className="text-white/80 mb-4">
                  Fundada en {developer.yearEstablished} • {new Date().getFullYear() - developer.yearEstablished} años en el mercado
                </p>
              )}
              {developer.description && (
                <p className="text-white/90 max-w-3xl">{developer.description}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{activeListings.length}</div>
              <div className="text-sm text-white/80">Proyectos Activos</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{completedListings.length}</div>
              <div className="text-sm text-white/80">Proyectos Entregados</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{developer.totalProjects || (activeListings.length + completedListings.length)}</div>
              <div className="text-sm text-white/80">Total Proyectos</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{developer.yearEstablished ? new Date().getFullYear() - developer.yearEstablished : '—'}</div>
              <div className="text-sm text-white/80">Años Experiencia</div>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="flex flex-wrap gap-4 mt-8 justify-center md:justify-start">
            {developer.website && (
              <a
                href={developer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0B2545] rounded-lg hover:bg-gray-100 transition"
              >
                <FiGlobe /> Sitio Web
              </a>
            )}
            {developer.phone && (
              <a
                href={`tel:${developer.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition"
              >
                <FiPhone /> {developer.phone}
              </a>
            )}
            {developer.email && (
              <a
                href={`mailto:${developer.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition"
              >
                <FiMail /> Contacto
              </a>
            )}
          </div>

          {developer.address && (
            <div className="mt-4 flex items-center gap-2 text-white/80 justify-center md:justify-start">
              <FiMapPin /> {developer.address}
            </div>
          )}

          {/* Social Links */}
          {(developer.facebookUrl || developer.instagramUrl || developer.linkedinUrl) && (
            <div className="flex gap-3 mt-4 justify-center md:justify-start">
              {developer.facebookUrl && (
                <a href={developer.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white" title="Facebook" aria-label="Facebook">
                  <FiFacebook size={24} />
                </a>
              )}
              {developer.instagramUrl && (
                <a href={developer.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white" title="Instagram" aria-label="Instagram">
                  <FiInstagram size={24} />
                </a>
              )}
              {developer.linkedinUrl && (
                <a href={developer.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white" title="LinkedIn" aria-label="LinkedIn">
                  <FiLinkedin size={24} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Projects */}
      {activeListings.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-[#0B2545] mb-6">Proyectos en Venta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeListings.map((listing: any) => (
              <PropertyCard key={listing.id} property={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Projects */}
      {completedListings.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12 bg-white">
          <h2 className="text-3xl font-bold text-[#0B2545] mb-6">Proyectos Entregados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedListings.map((listing: any) => (
              <PropertyCard key={listing.id} property={listing} />
            ))}
          </div>
        </div>
      )}

      {activeListings.length === 0 && completedListings.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">No hay proyectos disponibles en este momento.</p>
        </div>
      )}
    </div>
  )
}
