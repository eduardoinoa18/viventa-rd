// lib/analyticsService.ts
import { AnalyticsEventType, TrackEventOptions } from '@/types/analytics'

/**
 * Track an analytics event (client-side)
 * Sends event to /api/analytics/track
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  options: TrackEventOptions = {}
): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        userId: options.userId,
        userRole: options.userRole,
        sessionId: options.sessionId || getSessionId(),
        metadata: options.metadata,
        page: options.page || window.location.pathname,
        referrer: document.referrer || undefined,
        userAgent: navigator.userAgent,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return false
  }
}

/**
 * Track page view
 */
export function trackPageView(userId?: string, userRole?: string) {
  return trackEvent('page_view', { userId, userRole })
}

/**
 * Track user login
 */
export function trackLogin(userId: string, userRole: string) {
  return trackEvent('login', { 
    userId, 
    userRole,
    metadata: { timestamp: new Date().toISOString() }
  })
}

/**
 * Track user signup
 */
export function trackSignup(userId: string, userRole: string, metadata?: Record<string, any>) {
  return trackEvent('signup', { 
    userId, 
    userRole,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track listing view
 */
export function trackListingView(listingId: string, metadata?: Record<string, any>, userId?: string, userRole?: string | null) {
  return trackEvent('listing_view', {
    userId,
    userRole: userRole || undefined,
    metadata: { listingId, ...metadata }
  })
}

/**
 * Track listing creation
 */
export function trackListingCreate(listingId: string, userId: string, userRole: string) {
  return trackEvent('listing_create', {
    userId,
    userRole,
    metadata: { listingId }
  })
}

/**
 * Track search performed
 */
export function trackSearch(query: string, filters?: Record<string, any>, userId?: string, userRole?: string) {
  return trackEvent('search_performed', {
    userId,
    userRole,
    metadata: { query, filters }
  })
}

/**
 * Track error
 */
export function trackError(error: Error | string, context?: Record<string, any>) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? undefined : error.stack
  
  return trackEvent('error', {
    metadata: {
      error: errorMessage,
      stack: errorStack,
      ...context
    }
  })
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  const key = 'analytics_session_id'
  let sessionId = sessionStorage.getItem(key)
  
  if (!sessionId) {
    sessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    sessionStorage.setItem(key, sessionId)
  }
  
  return sessionId
}

/**
 * Helper to get current user info from session
 */
export function getCurrentUserInfo(): { userId?: string; userRole?: string } {
  // This should be replaced with your actual session logic
  if (typeof window === 'undefined') return {}
  
  try {
    const sessionData = sessionStorage.getItem('user_session')
    if (sessionData) {
      const session = JSON.parse(sessionData)
      return {
        userId: session.uid,
        userRole: session.role
      }
    }
  } catch (e) {
    // Silent fail
  }
  
  return {}
}
