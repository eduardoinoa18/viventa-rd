// UI-level status normalization
// Maps database status to clean UI states
// Database schema remains UNCHANGED

export type UIStatus = 'draft' | 'published' | 'archived'

export interface ListingWithUIStatus {
  uiStatus: UIStatus
  statusLabel: string
  statusColor: string
  statusBgColor: string
  statusIcon: string
}

/**
 * Normalizes database status to clean UI status
 * Strategy: Map boolean flags + status field → 3 clean states
 * 
 * Database untouched. This is UI-only transformation.
 */
export function normalizeListingStatus(listing: any): UIStatus {
  // Check archived flag first (if exists)
  if (listing.archived === true) return 'archived'
  
  // Map legacy status values to archived
  if (listing.status === 'sold') return 'archived'
  if (listing.status === 'rejected') return 'archived'
  
  // Draft states
  if (listing.status === 'pending') return 'draft'
  if (listing.status === 'draft') return 'draft'
  
  // Published
  if (listing.status === 'active') return 'published'
  
  // Default fallback
  return 'draft'
}

/**
 * Get UI metadata for status badge rendering
 */
export function getStatusMeta(status: UIStatus): ListingWithUIStatus {
  switch (status) {
    case 'published':
      return {
        uiStatus: 'published',
        statusLabel: 'Publicada',
        statusColor: 'text-green-800',
        statusBgColor: 'bg-green-100',
        statusIcon: '✓'
      }
    case 'draft':
      return {
        uiStatus: 'draft',
        statusLabel: 'Borrador',
        statusColor: 'text-yellow-800',
        statusBgColor: 'bg-yellow-100',
        statusIcon: '⏳'
      }
    case 'archived':
      return {
        uiStatus: 'archived',
        statusLabel: 'Archivada',
        statusColor: 'text-gray-800',
        statusBgColor: 'bg-gray-100',
        statusIcon: '📦'
      }
  }
}

/**
 * Get raw database status for API calls
 * Use when updating listing status via API
 */
export function getDBStatus(uiStatus: UIStatus): string {
  switch (uiStatus) {
    case 'published':
      return 'active'
    case 'draft':
      return 'pending'
    case 'archived':
      return 'rejected' // Could also be 'sold' - context dependent
  }
}

/**
 * Get all possible UI statuses for filtering
 */
export function getAllUIStatuses(): Array<{value: string; label: string}> {
  return [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'draft', label: '⏳ Borradores' },
    { value: 'published', label: '✅ Publicadas' },
    { value: 'archived', label: '📦 Archivadas' },
  ]
}

/**
 * Map UI filter to database query
 * Returns DB status values for API filtering
 */
export function mapUIFilterToDB(uiFilter: string): string | null {
  switch (uiFilter) {
    case 'published':
      return 'active'
    case 'draft':
      return 'pending'
    case 'archived':
      return 'rejected' // Future: could query multiple statuses
    case 'all':
    default:
      return null // No filter
  }
}
