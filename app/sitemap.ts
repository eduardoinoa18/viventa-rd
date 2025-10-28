import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com'
  
  // Static pages
  const staticPages = [
    '',
    '/search',
    '/agents',
    '/professionals',
    '/contact',
    '/apply',
    '/favorites',
    '/disclosures',
    '/login',
    '/signup',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // TODO: Add dynamic property and agent pages when connected to Firestore
  // Example:
  // const properties = await getProperties()
  // const propertyPages = properties.map(p => ({
  //   url: `${baseUrl}/listing/${p.id}`,
  //   lastModified: p.updatedAt,
  //   changeFrequency: 'daily',
  //   priority: 0.9,
  // }))

  return staticPages
}
