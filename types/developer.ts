/**
 * Developer (Constructora) Types
 * For real estate developers/construction companies
 */

export interface Developer {
  id: string
  
  // Company info
  companyName: string
  slug: string // URL-friendly name
  logoUrl?: string
  description: string
  website?: string
  
  // Trust signals
  yearEstablished?: number
  totalProjects?: number
  completedProjects?: number
  activeProjects?: number
  
  // Contact
  email?: string
  phone?: string
  address?: string
  
  // Social
  facebookUrl?: string
  instagramUrl?: string
  linkedinUrl?: string
  
  // Status
  verified: boolean
  featured: boolean
  status: 'active' | 'inactive' | 'pending'
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy?: string // admin uid who created this
}

export interface DeveloperStats {
  totalListings: number
  activeListings: number
  soldListings: number
  totalValue: number
  averagePrice: number
}

export interface DeveloperWithStats extends Developer {
  stats: DeveloperStats
}
