// Client-side Algolia search client (search-only key)
'use client'
import algoliasearch from 'algoliasearch'

export function getAlgoliaClient() {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
  const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
  if (!appId || !searchKey) {
    console.warn('Algolia env vars missing (NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_SEARCH_KEY)')
  }
  return algoliasearch(appId || 'dev', searchKey || 'search-only-key')
}

export function getListingsIndexName() {
  return process.env.NEXT_PUBLIC_ALGOLIA_INDEX || 'viventa_listings_dev'
}
