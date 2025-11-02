// lib/analytics.ts
/**
 * Client-side analytics helper to track user behavior
 */

export const trackEvent = async (event: string, data?: Record<string, any>) => {
  if (typeof window === 'undefined') return

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
    })
  } catch (e) {
    // Silent fail - don't disrupt user experience
    console.debug('Analytics track failed', e)
  }
}

// Predefined event types for consistency
export const AnalyticsEvents = {
  // Property events
  PROPERTY_VIEW: 'property_view',
  PROPERTY_FAVORITE: 'property_favorite',
  PROPERTY_UNFAVORITE: 'property_unfavorite',
  PROPERTY_SHARE: 'property_share',
  PROPERTY_CONTACT: 'property_contact',
  
  // Search events
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_FILTER_APPLIED: 'search_filter_applied',
  SEARCH_SAVED: 'search_saved',
  
  // User events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PROFILE_UPDATED: 'profile_updated',
  
  // Agent events
  AGENT_PROFILE_VIEW: 'agent_profile_view',
  AGENT_CONTACT: 'agent_contact',
  
  // Social events
  SOCIAL_POST_VIEW: 'social_post_view',
  SOCIAL_POST_LIKE: 'social_post_like',
  SOCIAL_POST_COMMENT: 'social_post_comment',
  SOCIAL_POST_SHARE: 'social_post_share',
  
  // Engagement
  PAGE_VIEW: 'page_view',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
} as const

// Helper functions for common tracking scenarios
export const analytics = {
  viewProperty: (propertyId: string, propertyTitle?: string) => {
    trackEvent(AnalyticsEvents.PROPERTY_VIEW, { propertyId, propertyTitle })
  },
  
  favoriteProperty: (propertyId: string) => {
    trackEvent(AnalyticsEvents.PROPERTY_FAVORITE, { propertyId })
  },
  
  search: (query: string, filters?: Record<string, any>) => {
    trackEvent(AnalyticsEvents.SEARCH_PERFORMED, { query, filters })
  },
  
  pageView: (path: string, title?: string) => {
    trackEvent(AnalyticsEvents.PAGE_VIEW, { path, title })
  },
  
  contactAgent: (agentId: string, propertyId?: string) => {
    trackEvent(AnalyticsEvents.AGENT_CONTACT, { agentId, propertyId })
  },
}
