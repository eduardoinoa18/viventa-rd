import * as admin from 'firebase-admin'
import algoliasearch from 'algoliasearch'
import { computeFinalScore } from './searchIndexUtils'

admin.initializeApp()
const db = admin.firestore()

const appId = process.env.ALGOLIA_APP_ID as string
const apiKey = process.env.ALGOLIA_ADMIN_KEY as string
const indexName = process.env.ALGOLIA_INDEX || 'viventa_listings_dev'
const client = algoliasearch(appId, apiKey)
const index = client.initIndex(indexName)

async function main() {
  const snap = await db.collection('listings').get()
  const objects = snap.docs.map((d) => ({ objectID: d.id, ...d.data(), score: computeFinalScore(d.data() as any) }))
  await index.saveObjects(objects)
  // eslint-disable-next-line no-console
  console.log('Reindexed', objects.length, 'listings')
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
