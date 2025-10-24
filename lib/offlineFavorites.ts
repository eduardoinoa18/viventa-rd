// Offline favorites storage using IndexedDB
// Syncs with Firestore when online

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface PropertyData {
  id: string
  title: string
  price: number
  currency: string
  location: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  images: string[]
  agentName?: string
  agentPhone?: string
  savedAt: number
  lastFetchedAt: number
}

interface ViventaDB extends DBSchema {
  favorites: {
    key: string
    value: PropertyData
    indexes: { 'by-saved': number }
  }
  pendingSync: {
    key: string
    value: {
      action: 'save' | 'remove'
      propertyId: string
      timestamp: number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<ViventaDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ViventaDB>('viventa-db', 1, {
      upgrade(db) {
        // Create favorites store
        const favStore = db.createObjectStore('favorites', { keyPath: 'id' })
        favStore.createIndex('by-saved', 'savedAt')
        
        // Create pending sync queue
        db.createObjectStore('pendingSync', { keyPath: 'propertyId' })
      },
    })
  }
  return dbPromise
}

// Save property to favorites
export async function saveFavoriteOffline(property: PropertyData): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['favorites', 'pendingSync'], 'readwrite')
  
  await tx.objectStore('favorites').put({
    ...property,
    savedAt: Date.now(),
    lastFetchedAt: Date.now()
  })
  
  // Add to sync queue
  await tx.objectStore('pendingSync').put({
    action: 'save',
    propertyId: property.id,
    timestamp: Date.now()
  })
  
  await tx.done
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    syncFavorites()
  }
}

// Remove property from favorites
export async function removeFavoriteOffline(propertyId: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['favorites', 'pendingSync'], 'readwrite')
  
  await tx.objectStore('favorites').delete(propertyId)
  
  // Add to sync queue
  await tx.objectStore('pendingSync').put({
    action: 'remove',
    propertyId,
    timestamp: Date.now()
  })
  
  await tx.done
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    syncFavorites()
  }
}

// Get all favorites
export async function getAllFavorites(): Promise<PropertyData[]> {
  const db = await getDB()
  return db.getAllFromIndex('favorites', 'by-saved')
}

// Check if property is favorited
export async function isFavorite(propertyId: string): Promise<boolean> {
  const db = await getDB()
  const property = await db.get('favorites', propertyId)
  return !!property
}

// Sync with Firestore
export async function syncFavorites(): Promise<void> {
  if (!navigator.onLine) return
  
  try {
    const db = await getDB()
    const pendingActions = await db.getAll('pendingSync')
    
    if (pendingActions.length === 0) return
    
    // Send to backend API
    const response = await fetch('/api/favorites/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions: pendingActions })
    })
    
    if (response.ok) {
      // Clear synced actions
      const tx = db.transaction('pendingSync', 'readwrite')
      for (const action of pendingActions) {
        await tx.objectStore('pendingSync').delete(action.propertyId)
      }
      await tx.done
      console.log('✅ Favorites synced')
    }
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

// Initialize sync on app load
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncFavorites)
  
  // Sync every 5 minutes if online
  setInterval(() => {
    if (navigator.onLine) syncFavorites()
  }, 5 * 60 * 1000)
}

// Get offline status
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine
}
