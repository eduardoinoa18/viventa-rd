import algoliasearch from 'algoliasearch'

const appId = process.env.ALGOLIA_APP_ID as string
const apiKey = process.env.ALGOLIA_ADMIN_KEY as string
const indexName = process.env.ALGOLIA_INDEX || 'viventa_listings_dev'

if (!appId || !apiKey) {
  // eslint-disable-next-line no-console
  console.error('Missing ALGOLIA_APP_ID / ALGOLIA_ADMIN_KEY environment variables')
  process.exit(1)
}

async function main() {
  const client = algoliasearch(appId, apiKey)
  const index = client.initIndex(indexName)

  await index.setSettings({
    searchableAttributes: [
      'title',
      'city',
      'neighborhood',
      'address_simple',
      'description',
    ],
    attributesForFaceting: [
      'filterOnly(unit_type)',
      'city',
      'searchable(amenities)',
      'beds',
      'baths',
      'status',
    ],
    customRanking: [
      'desc(score)',
      'desc(recency_score)',
      'desc(quality_score)',
    ],
    ranking: [
      'typo',
      'geo',
      'words',
      'filters',
      'proximity',
      'attribute',
      'exact',
      'custom',
    ],
  })

  await index.saveSynonyms([
    { objectID: 'es-apartamento-condominio', type: 'synonym', synonyms: ['apartamento','condominio'] },
    { objectID: 'es-casa-home', type: 'synonym', synonyms: ['casa','home'] },
    { objectID: 'es-villa', type: 'oneWaySynonym', input: 'villa', synonyms: ['villa'] },
  ], { replaceExistingSynonyms: true })

  // eslint-disable-next-line no-console
  console.log('Algolia index settings and synonyms configured for', indexName)
}

main().catch((e) => { console.error(e); process.exit(1) })
