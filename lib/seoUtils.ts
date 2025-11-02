/**
 * SEO Utilities for VIVENTA
 * Structured data, meta tags, and SEO helpers
 */

export interface PropertySEO {
  id: string
  title: string
  description: string
  price: number
  currency?: string
  location: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  images?: string[]
  agentName?: string
}

/**
 * Generate structured data for property listing (JSON-LD)
 */
export function generatePropertySchema(property: PropertySEO) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: property.title,
    description: property.description,
    image: property.images || [],
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: property.currency || 'USD',
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.location,
      addressCountry: 'DO',
    },
    ...(property.agentName && {
      seller: {
        '@type': 'Person',
        name: property.agentName,
      },
    }),
  }
}

/**
 * Generate structured data for real estate agent
 */
export function generateAgentSchema(agent: {
  name: string
  email?: string
  phone?: string
  image?: string
  description?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name,
    ...(agent.email && { email: agent.email }),
    ...(agent.phone && { telephone: agent.phone }),
    ...(agent.image && { image: agent.image }),
    ...(agent.description && { description: agent.description }),
  }
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(breadcrumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

/**
 * Generate meta tags for property pages
 */
export function generatePropertyMeta(property: PropertySEO) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com'
  
  return {
    title: `${property.title} - ${property.location} | VIVENTA`,
    description: property.description.slice(0, 160),
    openGraph: {
      title: property.title,
      description: property.description,
      url: `${baseUrl}/listing/${property.id}`,
      images: property.images?.map(img => ({
        url: img,
        width: 1200,
        height: 630,
        alt: property.title,
      })) || [],
      type: 'website',
      siteName: 'VIVENTA',
    },
    twitter: {
      card: 'summary_large_image',
      title: property.title,
      description: property.description.slice(0, 200),
      images: property.images || [],
    },
  }
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com'
  return `${baseUrl}${path}`
}

/**
 * Common meta keywords for real estate in DR
 */
export const commonKeywords = [
  'bienes raíces',
  'propiedades',
  'República Dominicana',
  'Santo Domingo',
  'Punta Cana',
  'apartamentos',
  'casas',
  'terrenos',
  'inmobiliaria',
  'VIVENTA',
  'venta',
  'alquiler',
  'inversión inmobiliaria',
]

/**
 * Generate robots meta tag
 */
export function getRobotsMeta(options?: { noindex?: boolean; nofollow?: boolean }) {
  const directives = []
  
  if (options?.noindex) directives.push('noindex')
  else directives.push('index')
  
  if (options?.nofollow) directives.push('nofollow')
  else directives.push('follow')
  
  directives.push('max-image-preview:large')
  directives.push('max-snippet:-1')
  directives.push('max-video-preview:-1')
  
  return directives.join(', ')
}
