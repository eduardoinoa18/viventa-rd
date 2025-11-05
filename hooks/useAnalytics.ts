// hooks/useAnalytics.ts
'use client'
import { useEffect, useCallback } from 'react'
import { trackEvent, trackPageView, getCurrentUserInfo } from '@/lib/analyticsService'
import type { AnalyticsEventType, TrackEventOptions } from '@/types/analytics'

/**
 * Hook for analytics tracking with automatic page view tracking
 */
export function useAnalytics(options: { trackPageView?: boolean; userId?: string; userRole?: string } = {}) {
  const { trackPageView: shouldTrackPageView = true, userId, userRole } = options

  // Get user info from session if not provided
  const userInfo = userId && userRole 
    ? { userId, userRole }
    : getCurrentUserInfo()

  // Track page view on mount
  useEffect(() => {
    if (shouldTrackPageView && typeof window !== 'undefined') {
      trackPageView(userInfo.userId, userInfo.userRole)
    }
  }, [shouldTrackPageView, userInfo.userId, userInfo.userRole])

  // Memoized track function
  const track = useCallback(
    (eventType: AnalyticsEventType, trackOptions: TrackEventOptions = {}) => {
      return trackEvent(eventType, {
        userId: trackOptions.userId || userInfo.userId,
        userRole: trackOptions.userRole || userInfo.userRole,
        ...trackOptions,
      })
    },
    [userInfo.userId, userInfo.userRole]
  )

  return { track }
}

/**
 * Hook for tracking page views only (no automatic tracking)
 */
export function usePageViewTracking(userId?: string, userRole?: string) {
  const userInfo = userId && userRole 
    ? { userId, userRole }
    : getCurrentUserInfo()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      trackPageView(userInfo.userId, userInfo.userRole)
    }
  }, [userInfo.userId, userInfo.userRole])
}
