// hooks/useWaitlistPrompt.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { auth } from '@/lib/firebaseClient'

interface WaitlistPromptConfig {
  enabled: boolean
  trigger: 'initial' | 'time' | 'exit' | 'scroll'
}

/**
 * Smart waitlist prompt hook based on industry best practices:
 * - Initial: 15 seconds after landing (warm-up period)
 * - Time-based: Every 3 minutes of browsing
 * - Exit intent: When user moves cursor to leave
 * - Scroll depth: After 50% page scroll
 * 
 * Respects user preferences and doesn't spam
 */
export function useWaitlistPrompt() {
  const [config, setConfig] = useState<WaitlistPromptConfig>({ enabled: false, trigger: 'initial' })

  const shouldShowPrompt = useCallback((): boolean => {
    // Don't show if user is logged in
    if (auth.currentUser) return false

    // Don't show if already submitted
    const submitted = localStorage.getItem('viventa_waitlist_submitted')
    if (submitted) return false

    // Don't show if dismissed recently (24 hours)
    const dismissed = localStorage.getItem('viventa_waitlist_dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)
      if (hoursSinceDismissed < 24) return false
    }

    return true
  }, [])

  // Initial trigger: 15 seconds after page load
  useEffect(() => {
    if (!shouldShowPrompt()) return

    const timer = setTimeout(() => {
      setConfig({ enabled: true, trigger: 'initial' })
    }, 15000) // 15 seconds

    return () => clearTimeout(timer)
  }, [shouldShowPrompt])

  // Time-based trigger: Every 3 minutes
  useEffect(() => {
    if (!shouldShowPrompt()) return

    const lastShown = localStorage.getItem('viventa_waitlist_last_shown')
    const now = Date.now()

    // Check if we should show based on last shown time
    if (lastShown) {
      const minutesSinceLastShown = (now - parseInt(lastShown, 10)) / (1000 * 60)
      if (minutesSinceLastShown < 3) return
    }

    const interval = setInterval(() => {
      if (shouldShowPrompt()) {
        setConfig({ enabled: true, trigger: 'time' })
        localStorage.setItem('viventa_waitlist_last_shown', Date.now().toString())
      }
    }, 180000) // 3 minutes = 180,000ms

    return () => clearInterval(interval)
  }, [shouldShowPrompt])

  // Exit intent trigger
  useEffect(() => {
    if (!shouldShowPrompt()) return

    let exitIntentShown = false

    const handleMouseLeave = (e: MouseEvent) => {
      if (exitIntentShown) return
      if (e.clientY < 10 && shouldShowPrompt()) {
        exitIntentShown = true
        setConfig({ enabled: true, trigger: 'exit' })
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [shouldShowPrompt])

  // Scroll depth trigger: 50%
  useEffect(() => {
    if (!shouldShowPrompt()) return

    let scrollTriggered = false

    const handleScroll = () => {
      if (scrollTriggered) return

      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      
      if (scrollPercent > 50 && shouldShowPrompt()) {
        scrollTriggered = true
        setConfig({ enabled: true, trigger: 'scroll' })
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [shouldShowPrompt])

  const dismissPrompt = useCallback(() => {
    setConfig({ enabled: false, trigger: 'initial' })
    localStorage.setItem('viventa_waitlist_dismissed', Date.now().toString())
  }, [])

  const manualTrigger = useCallback(() => {
    // Allow manual trigger from buttons/CTAs even if user dismissed
    // But still respect if they already submitted
    const submitted = localStorage.getItem('viventa_waitlist_submitted')
    if (!submitted && !auth.currentUser) {
      setConfig({ enabled: true, trigger: 'initial' })
    }
  }, [])

  // Listen for global trigger event (for banners in Footer, etc.)
  useEffect(() => {
    const handleGlobalTrigger = () => manualTrigger()
    document.addEventListener('viventa-open-waitlist', handleGlobalTrigger)
    return () => document.removeEventListener('viventa-open-waitlist', handleGlobalTrigger)
  }, [manualTrigger])

  return {
    isOpen: config.enabled,
    trigger: config.trigger,
    onClose: dismissPrompt,
    open: manualTrigger, // New: manual trigger for banner buttons
  }
}
