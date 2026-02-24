/**
 * Inspect Properties Collection
 * 
 * Shows all documents in properties collection with all fields
 * Helps diagnose why properties might not appear in search
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin
admin.initializeApp()

async function inspectProperties() {
  const db = admin.firestore()
  
  try {
    console.log('🔍 Inspecting properties collection...\n')
    
    const snapshot = await db.collection('properties').get()
    
    console.log(`Total documents: ${snapshot.size}\n`)
    
    snapshot.forEach((doc: any) => {
      const data = doc.data()
      console.log(`📋 Document ID: ${doc.id}`)
      console.log(`   status: ${data.status}`)
      console.log(`   published: ${data.published}`)
      console.log(`   city: ${data.city}`)
      console.log(`   price: ${data.price}`)
      console.log(`   title: ${data.title}`)
      console.log(`   createdAt: ${data.createdAt}`)
      console.log(`   updatedAt: ${data.updatedAt}`)
      console.log(`   agentId: ${data.agentId}`)
      console.log(`   agentName: ${data.agentName}`)
      console.log(`   propertyType: ${data.propertyType}`)
      console.log(`   listingType: ${data.listingType}`)
      console.log('')
    })
    
    console.log('✅ Full dump complete')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

inspectProperties()
