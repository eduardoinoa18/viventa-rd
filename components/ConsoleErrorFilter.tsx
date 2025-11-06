'use client'
import { useEffect } from 'react'

/**
 * Suppress noisy Firestore SDK internal errors that pollute the console.
 * These 400 Bad Request errors on TYPE=terminate are harmless connection cleanup
 * events that occur during network state changes or page unload.
 */
export default function ConsoleErrorFilter() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalError = console.error
    
    console.error = function (...args: any[]) {
      try {
        const message = String(args[0] || '')
        
        // Filter out Firestore terminate 400 errors
        if (message.includes('Firestore/Write/channel') && 
            message.includes('400 (Bad Request)') &&
            message.includes('TYPE=terminate')) {
          return // Suppress this error
        }
      } catch (e) {
        // If filtering fails, allow error through
      }
      
      // Call original console.error for all other errors
      originalError.apply(console, args)
    }

    return () => {
      // Restore original console.error on unmount
      console.error = originalError
    }
  }, [])

  return null
}
