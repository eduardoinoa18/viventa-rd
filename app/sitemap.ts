import { MetadataRoute } from 'next'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore'

function initFirebase() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  const valid = Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.storageBucket &&
    config.messagingSenderId &&
    config.appId
  )
  if (!valid) return null
  if (!getApps().length) initializeApp(config as any)
  return getFirestore()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com'
  
  // Static pages
  const staticPages = [
    { route: '', priority: 1, changeFrequency: 'daily' as const },
    { route: '/search', priority: 0.9, changeFrequency: 'daily' as const },
    { route: '/agents', priority: 0.8, changeFrequency: 'weekly' as const },
    { route: '/brokers', priority: 0.8, changeFrequency: 'weekly' as const },
    { route: '/professionals', priority: 0.7, changeFrequency: 'weekly' as const },
    { route: '/profesionales', priority: 0.7, changeFrequency: 'weekly' as const },
    { route: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { route: '/apply', priority: 0.6, changeFrequency: 'monthly' as const },
    { route: '/favorites', priority: 0.5, changeFrequency: 'weekly' as const },
    { route: '/disclosures', priority: 0.4, changeFrequency: 'yearly' as const },
    { route: '/login', priority: 0.3, changeFrequency: 'monthly' as const },
    { route: '/signup', priority: 0.3, changeFrequency: 'monthly' as const },
  ].map((page) => ({
    url: `${baseUrl}${page.route}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  // Dynamic property pages
  let propertyPages: MetadataRoute.Sitemap = []
  try {
    const db = initFirebase()
    if (db) {
      const activePropsQ = query(
        collection(db, 'properties'),
        where('status', '==', 'active'),
        limit(1000) // Limit to avoid sitemap size issues
      )
      const propsSnap = await getDocs(activePropsQ)
      
      propertyPages = propsSnap.docs.map((doc: any) => {
        const data = doc.data()
        return {
          url: `${baseUrl}/listing/${doc.id}`,
          lastModified: data.updatedAt?.toDate() || new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        }
      })
    }
  } catch (error: any) {
    // Swallow permission or config errors silently during build
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Sitemap: properties fetch skipped:', error?.code || error?.message || error)
    }
  }

  // Dynamic agent pages
  let agentPages: MetadataRoute.Sitemap = []
  try {
    const db = initFirebase()
    if (db) {
      const agentsQ = query(
        collection(db, 'users'),
        where('role', '==', 'agent'),
        where('status', '==', 'active'),
        limit(500)
      )
      const agentsSnap = await getDocs(agentsQ)
      
      agentPages = agentsSnap.docs.map((doc: any) => {
        const data = doc.data()
        return {
          url: `${baseUrl}/agents/${doc.id}`,
          lastModified: data.updatedAt?.toDate() || new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }
      })
    }
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Sitemap: agents fetch skipped:', error?.code || error?.message || error)
    }
  }

  // Dynamic broker pages
  let brokerPages: MetadataRoute.Sitemap = []
  try {
    const db = initFirebase()
    if (db) {
      const brokersQ = query(
        collection(db, 'users'),
        where('role', '==', 'broker'),
        where('status', '==', 'active'),
        limit(500)
      )
      const brokersSnap = await getDocs(brokersQ)
      
      brokerPages = brokersSnap.docs.map((doc: any) => {
        const data = doc.data()
        return {
          url: `${baseUrl}/brokers/${doc.id}`,
          lastModified: data.updatedAt?.toDate() || new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }
      })
    }
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Sitemap: brokers fetch skipped:', error?.code || error?.message || error)
    }
  }

  return [...staticPages, ...propertyPages, ...agentPages, ...brokerPages]
}
