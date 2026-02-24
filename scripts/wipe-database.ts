/**
 * Complete Database Wipe Script
 * 
 * Deletes EVERYTHING from Firestore and Firebase Auth
 * Use this when you want to start completely fresh
 * 
 * Usage:
 *   npm run db:wipe
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin
admin.initializeApp()

// Firestore collections to clean (all collections in the app)
const COLLECTIONS = [
  'listings',
  'properties', 
  'leads',
  'messages',
  'clients',
  'applications',
  'brokerages',
  'developers',
  'invites',
  'professional_credentials',
  'audit_logs',
  'auth_codes',
  'auth_attempts',
  'push_logs',
  'email_events',
  'analytics_events',
  'counters',
  'users',
]

async function deleteCollection(
  db: any,
  collectionPath: string,
  batchSize: number = 500
): Promise<number> {
  const collectionRef = db.collection(collectionPath)
  const query = collectionRef.limit(batchSize)
  
  let deletedCount = 0
  
  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject, deletedCount)
  })
}

async function deleteQueryBatch(
  db: any,
  query: any,
  resolve: (count: number) => void,
  reject: (error: Error) => void,
  deletedCount: number
) {
  try {
    const snapshot = await query.get()

    if (snapshot.size === 0) {
      resolve(deletedCount)
      return
    }

    const batch = db.batch()
    
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref)
    })

    const batchSize = snapshot.size
    await batch.commit()
    deletedCount += batchSize

    // Recurse on the next process tick
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve, reject, deletedCount)
    })
  } catch (error) {
    reject(error as Error)
  }
}

async function deleteAllAuthUsers(): Promise<number> {
  const auth = admin.auth()
  let deletedCount = 0
  let pageToken: string | undefined
  
  do {
    const listResult = await auth.listUsers(1000, pageToken)
    
    const deletePromises = listResult.users.map(async (user: any) => {
      try {
        await auth.deleteUser(user.uid)
        deletedCount++
        if (deletedCount % 50 === 0) {
          console.log(`   🗑️  Deleted ${deletedCount} auth users...`)
        }
      } catch (error) {
        console.error(`   ⚠️  Failed to delete user ${user.uid}:`, error)
      }
    })
    
    await Promise.all(deletePromises)
    pageToken = listResult.pageToken
  } while (pageToken)
  
  return deletedCount
}

async function main() {
  console.log('\n🧹 COMPLETE DATABASE WIPE')
  console.log('=' .repeat(60))
  console.log('⚠️  WARNING: This will delete EVERYTHING')
  console.log('   ALL Firestore data')
  console.log('   ALL Firebase Auth users')
  console.log('   NO EXCEPTIONS\n')
  
  const db = admin.firestore()
  
  console.log('📦 Cleaning Firestore Collections:')
  console.log('-'.repeat(60))
  
  for (const collectionName of COLLECTIONS) {
    try {
      const count = await deleteCollection(db, collectionName, 500)
      
      if (count > 0) {
        console.log(`✅ ${collectionName.padEnd(30)} → Deleted ${count} documents`)
      } else {
        console.log(`⚪ ${collectionName.padEnd(30)} → Already empty`)
      }
    } catch (error) {
      console.error(`❌ ${collectionName.padEnd(30)} → Error:`, error)
    }
  }
  
  console.log('\n👥 Cleaning Firebase Auth Users:')
  console.log('-'.repeat(60))
  
  try {
    const authDeleteCount = await deleteAllAuthUsers()
    console.log(`✅ Deleted ${authDeleteCount} auth users`)
  } catch (error) {
    console.error('❌ Error deleting auth users:', error)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 COMPLETE WIPE FINISHED')
  console.log('\nDatabase is now completely empty')
  console.log('Next steps:')
  console.log('  1. Create master admin in Firebase Console')
  console.log('  2. Or use signup flow to create new users')
  console.log('\n✨ Ready for fresh start')
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
