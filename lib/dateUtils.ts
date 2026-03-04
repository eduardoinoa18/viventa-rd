/**
 * Date Utilities for Consistent Date Handling
 * 
 * Standardizes date formatting across the platform using consistent timezone.
 * Uses Dominican Republic timezone (America/Santo_Domingo) for all formatting.
 * 
 * Usage:
 *   import { formatDate, formatRelativeTime } from '@/lib/dateUtils'
 *   
 *   formatDate(new Date())                    // "03/03/2026 14:30:45"
 *   formatRelativeTime(new Date())            // "just now"
 *   formatTime(new Date())                    // "14:30:45"
 *   formatDateShort(new Date())               // "03/03/2026"
 */

/**
 * Format date to localized string (Dominican Republic timezone)
 * Format: DD/MM/YYYY HH:MM:SS
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return '—'
    
    return d.toLocaleString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Santo_Domingo',
    })
  } catch {
    return '—'
  }
}

/**
 * Format date only (no time)
 * Format: DD/MM/YYYY
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return '—'
    
    return d.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Santo_Domingo',
    })
  } catch {
    return '—'
  }
}

/**
 * Format time only
 * Format: HH:MM:SS
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return '—'
    
    return d.toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Santo_Domingo',
    })
  } catch {
    return '—'
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "just now")
 * Useful for activity feeds and recent actions
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return '—'
    
    const now = Date.now()
    const diffMs = now - d.getTime()
    
    if (diffMs < 0) return 'in the future'
    if (diffMs < 1000) return 'just now'
    
    const seconds = Math.floor(diffMs / 1000)
    if (seconds < 60) return `${seconds}s ago`
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks}w ago`
    
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`
    
    const years = Math.floor(months / 12)
    return `${years}y ago`
  } catch {
    return '—'
  }
}

/**
 * Format timestamp for API/database operations
 * ISO format with timezone info
 */
export function formatISO(date: Date | string | null | undefined): string | null {
  if (!date) return null
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString()
  } catch {
    return null
  }
}

/**
 * Parse date string in Dominican Republic timezone
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString)
}

/**
 * Get start of day (midnight) in Dominican timezone
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const localeDate = new Date(
    date.toLocaleString('sv-SE', {
      timeZone: 'America/Santo_Domingo',
    })
  )
  localeDate.setHours(0, 0, 0, 0)
  return localeDate
}

/**
 * Get end of day (23:59:59) in Dominican timezone
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const localeDate = new Date(
    date.toLocaleString('sv-SE', {
      timeZone: 'America/Santo_Domingo',
    })
  )
  localeDate.setHours(23, 59, 59, 999)
  return localeDate
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Add hours to date
 */
export function addHours(date: Date, hours: number): Date {
  const d = new Date(date)
  d.setHours(d.getHours() + hours)
  return d
}

/**
 * Format for email templates (readable date format)
 * Example output: "March 3, 2026 at 2:30 PM"
 */
export function formatEmailDate(date: Date | string): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return '—'
    
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Santo_Domingo',
    })
  } catch {
    return '—'
  }
}
