import algoliasearch from 'algoliasearch/lite'
export const algoliaClient = algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID||'', process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY||'')
export const listingsIndex = algoliaClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX || 'viventa_listings')
