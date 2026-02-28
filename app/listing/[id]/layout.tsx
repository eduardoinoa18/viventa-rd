import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
  params: { id: string }
}

function resolveBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL
  if (configured) return configured.replace(/\/$/, '')

  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const protocol = h.get('x-forwarded-proto') || 'https'
  if (host) return `${protocol}://${host}`

  return 'https://viventa-rd.com'
}

function toAbsoluteUrl(urlOrPath: string, baseUrl: string) {
  if (!urlOrPath) return `${baseUrl}/logo.png`
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) return urlOrPath
  return `${baseUrl}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`
}

function extractListing(payload: any) {
  if (payload?.ok && payload?.data) return payload.data
  if (payload?.id || payload?.title) return payload
  return null
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const baseUrl = resolveBaseUrl()
  const propertyUrl = `${baseUrl}/listing/${params.id}`

  try {
    const res = await fetch(`${baseUrl}/api/properties/${params.id}`, {
      cache: 'no-store',
    })

    const json = await res.json().catch(() => null)
    const listing = extractListing(json)

    if (!listing) {
      return {
        title: 'Propiedad - VIVENTA RD',
        description: 'Descubre propiedades en República Dominicana con VIVENTA RD.',
        alternates: { canonical: propertyUrl },
      }
    }

    const title = listing?.title ? `${listing.title} - VIVENTA RD` : 'Propiedad - VIVENTA RD'
    const imageRaw = listing.coverImage || listing.images?.[0] || listing.mainImage || listing.image || listing.main_photo_url || '/logo.png'
    const image = toAbsoluteUrl(imageRaw, baseUrl)

    const listingPrice = Number(listing.price || 0)
    const currency = listing.currency || 'USD'
    const description = listing.description
      ? String(listing.description).slice(0, 155)
      : `${listing.title || 'Propiedad'} en ${listing.city || 'República Dominicana'}. Precio referencial: ${new Intl.NumberFormat('es-DO', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(listingPrice)}.`

    return {
      title,
      description,
      alternates: {
        canonical: propertyUrl,
      },
      openGraph: {
        title,
        description,
        url: propertyUrl,
        siteName: 'VIVENTA RD',
        locale: 'es_DO',
        type: 'website',
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: listing?.title || 'VIVENTA RD',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    }
  } catch {
    return {
      title: 'Propiedad - VIVENTA RD',
      description: 'Descubre propiedades en República Dominicana con VIVENTA RD.',
      alternates: { canonical: propertyUrl },
    }
  }
}

export default function ListingLayout({ children }: LayoutProps) {
  return children
}
