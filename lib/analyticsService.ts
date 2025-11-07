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
 * Track favorite added
 */
export function trackFavoriteAdded(propertyId: string, metadata?: Record<string, any>, userId?: string, userRole?: string) {
  return trackEvent('favorite_added', {
    userId,
    userRole,
    metadata: { propertyId, ...metadata }
  })
}

/**
 * Track favorite removed
 */
export function trackFavoriteRemoved(propertyId: string, metadata?: Record<string, any>, userId?: string, userRole?: string) {
  return trackEvent('favorite_removed', {
    userId,
    userRole,
    metadata: { propertyId, ...metadata }
  })
}

/**
 * Track contact form submission
 */
export function trackContactSubmission(formType: string, metadata?: Record<string, any>, userId?: string, userRole?: string) {
  return trackEvent('contact_form_submit', {
    userId,
    userRole,
    metadata: { formType, ...metadata }
  })
}

/**
 * Track filter usage
 */
export function trackFilterUsage(filterType: string, filterValue: any, userId?: string, userRole?: string) {
  return trackEvent('filter_used', {
    userId,
    userRole,
    metadata: { filterType, filterValue }
  })
}

/**
 * Track property card click
 */
export function trackPropertyCardClick(propertyId: string, position?: number, listContext?: string, userId?: string, userRole?: string) {
  return trackEvent('property_card_click', {
    userId,
    userRole,
    metadata: { propertyId, position, listContext }
  })
}

/**
 * Track search refinement
 */
export function trackSearchRefinement(previousQuery: string, newQuery: string, metadata?: Record<string, any>, userId?: string, userRole?: string) {
  return trackEvent('search_refined', {
    userId,
    userRole,
    metadata: { previousQuery, newQuery, ...metadata }
  })
}

/**
 * Track navigation flow
 */
export function trackNavigation(fromPage: string, toPage: string, userId?: string, userRole?: string) {
  return trackEvent('navigation', {
    userId,
    userRole,
    metadata: { fromPage, toPage }
  })
}

/**
 * Track WhatsApp button click
 */
export function trackWhatsAppClick(propertyId?: string, agentId?: string, userId?: string, userRole?: string) {
  return trackEvent('whatsapp_click', {
    userId,
    userRole,
    metadata: { propertyId, agentId }
  })
}

/**
 * Track agent profile view
 */
export function trackAgentView(agentId: string, metadata?: Record<string, any>, userId?: string, userRole?: string) {
  return trackEvent('agent_view', {
    userId,
    userRole,
    metadata: { agentId, ...metadata }
  })
}

/**
 * Track saved search
 */
export function trackSavedSearch(searchCriteria: Record<string, any>, userId?: string, userRole?: string) {
  return trackEvent('search_saved', {
    userId,
    userRole,
    metadata: { searchCriteria }
  })
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
