// types/analytics.ts

export type AnalyticsEventType =
  | 'page_view'
  | 'login'
  | 'signup'
  | 'logout'
  | 'listing_create'
  | 'listing_view'
  | 'listing_edit'
  | 'listing_delete'
  | 'lead_create'
  | 'lead_opened'
  | 'message_sent'
  | 'file_upload'
  | 'email_sent'
  | 'search_performed'
  | 'favorite_added'
  | 'favorite_removed'
  | 'application_submitted'
  | 'conversion'
  | 'error'

export interface AnalyticsEvent {
  eventId: string
  userId: string | null
  userRole: string | null
  sessionId?: string
  eventType: AnalyticsEventType
  eventName?: string
  metadata?: Record<string, any>
  timestamp: Date
  date: string // YYYY-MM-DD for aggregation
  hour: number // 0-23 for hourly stats
  page?: string
  referrer?: string
  userAgent?: string
  ipAddress?: string
}

export interface AnalyticsDailySummary {
  date: string // YYYY-MM-DD
  // User metrics
  dau: number // Daily Active Users
  wau?: number // Weekly Active Users (rolling 7 days)
  mau?: number // Monthly Active Users (rolling 30 days)
  newUsers: number
  
  // Signups by role
  signupsAgent: number
  signupsBroker: number
  signupsUser: number
  
  // Listings metrics
  listingsCreated: number
  listingsViewed: number
  listingsEdited: number
  
  // Engagement metrics
  leadsCreated: number
  leadsOpened: number
  messagesSent: number
  searchesPerformed: number
  favoritesAdded: number
  
  // Email metrics
  emailsSent: number
  emailDeliveryRate?: number
  
  // Storage metrics
  filesUploaded: number
  storageUsedMB?: number
  
  // Error metrics
  errorCount: number
  errorRate?: number
  
  // Conversion metrics
  conversions: number
  conversionRate?: number
  
  createdAt: Date
  updatedAt: Date
}

export interface TrackEventOptions {
  userId?: string | null
  userRole?: string | null
  sessionId?: string
  metadata?: Record<string, any>
  page?: string
}
