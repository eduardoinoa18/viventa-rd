export type ListingStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'sold'
  | 'rented'
  | 'rejected'
  | 'archived';

export type ListingType = 'sale' | 'rent';

export type PropertyType =
  | 'house'
  | 'apartment'
  | 'condo'
  | 'land'
  | 'commercial'
  | 'penthouse'
  | 'villa';

export interface Listing {
  id: string;

  title: string;
  description: string;

  price: number;
  currency: 'DOP' | 'USD';

  // Property details
  propertyType: PropertyType;
  listingType: ListingType;
  bedrooms: number;
  bathrooms: number;
  area: number; // square meters

  // Location (flat structure - no nested objects)
  city: string;
  sector: string;
  latitude: number;
  longitude: number;

  features: string[];
  images: string[];

  status: ListingStatus;

  // Ownership
  ownerId: string; // agent or constructora
  brokerageId?: string;
  projectId?: string;

  isVerified: boolean;

  // Engagement
  views?: number;
  featured_until?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

