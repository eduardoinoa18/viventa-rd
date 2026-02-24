// Create Master Admin User
import * as dotenv from 'dotenv'
import * as path from 'path'
import { getAdminAuth, getAdminDb } from '../lib/firebaseAdmin'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function createMasterAdmin() {
  console.log('🔧 Creating Master Admin User...\n')
  
  const auth = getAdminAuth()
  const db = getAdminDb()
  
  if (!auth || !db) {
    console.error('❌ Failed to initialize Firebase Admin')
    process.exit(1)
  }
  
  const email = 'viventa.rd@gmail.com'
  const password = 'Imthebestadminhere18'
  
  try {
    // Check if user exists
    let user
    try {
      user = await auth.getUserByEmail(email)
      console.log('✅ User already exists:', user.uid)
      // Update password to ensure it's correct
      await auth.updateUser(user.uid, { password })
      console.log('✅ Updated password for existing user')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create user
        user = await auth.createUser({
          email,
          password,
          emailVerified: true,
        })
        console.log('✅ Created Firebase Auth user:', user.uid)
      } else {
        throw error
      }
    }
    
    // Set custom claims
    await auth.setCustomUserClaims(user.uid, {
      role: 'master_admin',
      twoFactorVerified: false,
    })
    console.log('✅ Set custom claims: role=master_admin')
    
    // Create/update Firestore user document
    await db.collection('users').doc(user.uid).set({
      email,
      role: 'master_admin',
      displayName: 'Master Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true })
    console.log('✅ Created Firestore user document')
    
    console.log('\n✅ Master Admin Ready!')
    console.log('   Email:', email)
    console.log('   Password:', password)
    console.log('   UID:', user.uid)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createMasterAdmin()
