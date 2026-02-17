/**
 * Database Cleanup Script
 * 
 * Deletes ALL data from Firestore and Firebase Auth
 * EXCEPT the master admin user (viventa.rd@gmail.com)
 * 
 * Usage:
 *   npm run db:cleanup
 * 
 * Environment Variables Required:
 *   - MASTER_ADMIN_EMAIL (defaults to viventa.rd@gmail.com)
 *   - Firebase credentials via GOOGLE_APPLICATION_CREDENTIALS or default app initialization
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin
admin.initializeApp()

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL || 'viventa.rd@gmail.com'

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
  'users', // Special handling - keep master admin only
]

async function getMasterAdminUID(): Promise<string | null> {
  try {
    const auth = admin.auth()
    const user = await auth.getUserByEmail(MASTER_ADMIN_EMAIL)
    console.log(`✅ Found master admin: ${MASTER_ADMIN_EMAIL} (UID: ${user.uid})`)
    return user.uid
  } catch (error) {
    console.error(`❌ Master admin not found: ${MASTER_ADMIN_EMAIL}`)
    console.error('   Create the account first or set MASTER_ADMIN_EMAIL env var')
    return null
  }
}

async function deleteCollection(
  db: any,
  collectionPath: string,
  batchSize: number = 500,
  preserveDocId?: string
): Promise<number> {
  const collectionRef = db.collection(collectionPath)
  const query = collectionRef.limit(batchSize)
  
  let deletedCount = 0
  
  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject, preserveDocId, deletedCount)
  })
}

async function deleteQueryBatch(
  db: any,
  query: any,
  resolve: (count: number) => void,
  reject: (error: Error) => void,
  preserveDocId: string | undefined,
  deletedCount: number
) {
  try {
    const snapshot = await query.get()

    if (snapshot.size === 0) {
      resolve(deletedCount)
      return
    }

    const batch = db.batch()
    let batchDeleteCount = 0
    
    snapshot.docs.forEach((doc: any) => {
      // Skip the document we want to preserve (master admin user)
      if (preserveDocId && doc.id === preserveDocId) {
        console.log(`   ⏭️  Skipping preserved document: ${doc.id}`)
        return
      }
      batch.delete(doc.ref)
      batchDeleteCount++
    })

    await batch.commit()
    deletedCount += batchDeleteCount

    // Recurse on the next process tick to avoid blocking
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve, reject, preserveDocId, deletedCount)
    })
  } catch (error) {
    reject(error as Error)
  }
}

async function deleteAllAuthUsers(masterAdminUID: string): Promise<number> {
  const auth = admin.auth()
  let deletedCount = 0
  let pageToken: string | undefined
  
  do {
    const listResult = await auth.listUsers(1000, pageToken)
    
    const deletePromises = listResult.users
      .filter((user: any) => user.uid !== masterAdminUID)
      .map(async (user: any) => {
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
  console.log('\n🧹 DATABASE CLEANUP SCRIPT')
  console.log('=' .repeat(60))
  console.log(`Master Admin Email: ${MASTER_ADMIN_EMAIL}`)
  console.log('This will delete ALL data except the master admin account\n')
  
  // Get master admin UID
  const masterAdminUID = await getMasterAdminUID()
  if (!masterAdminUID) {
    console.error('\n❌ Cannot proceed without master admin account')
    process.exit(1)
  }
  
  const db = admin.firestore()
  
  console.log('\n📦 Cleaning Firestore Collections:')
  console.log('-'.repeat(60))
  
  for (const collectionName of COLLECTIONS) {
    try {
      const preserveDoc = collectionName === 'users' ? masterAdminUID : undefined
      const count = await deleteCollection(db, collectionName, 500, preserveDoc)
      
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
    const authDeleteCount = await deleteAllAuthUsers(masterAdminUID)
    console.log(`✅ Deleted ${authDeleteCount} auth users (kept master admin)`)
  } catch (error) {
    console.error('❌ Error deleting auth users:', error)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 CLEANUP COMPLETE')
  console.log('\nPreserved:')
  console.log(`  - Master Admin: ${MASTER_ADMIN_EMAIL} (UID: ${masterAdminUID})`)
  console.log('  - User document in Firestore users collection')
  console.log('\nDeleted:')
  console.log('  - All other Firestore documents')
  console.log('  - All other Firebase Auth users')
  console.log('\n✨ Database is now clean and ready for fresh data')
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
