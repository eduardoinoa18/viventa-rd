// Count documents in listings vs properties
import * as dotenv from 'dotenv'
import * as path from 'path'
import { getAdminDb } from '../lib/firebaseAdmin'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function main() {
  const db = getAdminDb()
  if (!db) {
    console.error('Failed to initialize Firebase Admin')
    process.exit(1)
  }

  const collections = ['listings', 'properties']
  for (const name of collections) {
    const snap = await db.collection(name).get()
    console.log(`${name}: ${snap.size}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
