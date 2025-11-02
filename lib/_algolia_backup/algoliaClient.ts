import algoliasearch, { SearchClient } from 'algoliasearch/lite'

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || ''
const API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ''
export const ALGOLIA_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_INDEX || 'viventa_listings'

export const isAlgoliaConfigured = Boolean(APP_ID && API_KEY)

let _client: SearchClient | null = null
export function getAlgoliaClient(): SearchClient | null {
	if (!isAlgoliaConfigured) return null
	if (_client) return _client
	_client = algoliasearch(APP_ID, API_KEY)
	return _client
}
