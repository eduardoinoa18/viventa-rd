'use client'
import { useEffect } from 'react'

export default function ServiceWorkerManager() {
  useEffect(() => {
    const currentBuild = process.env.NEXT_PUBLIC_BUILD_SHA || 'local'

    async function refreshIfBuildChanged() {
      try {
        const key = 'viventa_build_sha'
        const previousBuild = localStorage.getItem(key)
        if (!previousBuild) {
          localStorage.setItem(key, currentBuild)
          return
        }

        if (previousBuild === currentBuild) return

        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(registrations.map((registration) => registration.unregister()))
        }

        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((cacheKey) => caches.delete(cacheKey)))
        }

        localStorage.setItem(key, currentBuild)
        window.location.reload()
      } catch {
        localStorage.setItem('viventa_build_sha', currentBuild)
      }
    }

    refreshIfBuildChanged()

    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered')
          registration.update().catch(() => {})

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('🔄 Nueva versión disponible (actualización silenciosa habilitada)')
                  // Non-intrusive: defer update prompt to a future UX, no blocking confirm dialogs
                  // Optionally, auto-refresh on next navigation or implement a small toast later
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}
