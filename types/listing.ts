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

export type DeslindadoStatus = 'deslindado' | 'en-proceso' | 'sin-deslinde' | 'desconocido';
export type FurnishedStatus = 'amueblado' | 'semi-amueblado' | 'sin-amueblar';

export interface Listing {
  id: string;
  listingId?: string;

  title: string;
  description: string;

  // ── Approval workflow ────────────────────────────────────────────────────
  submittedAt?: Date | string | null;
  submittedBy?: string | null;
  submissionNote?: string | null;
  approvedAt?: Date | string | null;
  approvedBy?: string | null;
  approvalNotes?: string | null;
  rejectedAt?: Date | string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  revisionRequestedAt?: Date | string | null;
  revisionNote?: string | null;
  reviewedAt?: Date | string | null;
  reviewedBy?: string | null;

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
  coverImage?: string;
  promoVideoUrl?: string;
  maintenanceFee?: number;
  maintenanceFeeCurrency?: 'DOP' | 'USD';
  maintenanceInfo?: string;
  deslindadoStatus?: DeslindadoStatus;
  furnishedStatus?: FurnishedStatus;
  hoaIncludedItems?: string[];
  mlsOnly?: boolean;
  cobrokeCommissionPercent?: number;
  showingInstructions?: string;
  brokerNotes?: string;
  privateContactName?: string;
  privateContactPhone?: string;
  privateContactEmail?: string;

  inventoryMode?: 'single' | 'project';
  totalUnits?: number;
  availableUnits?: number;
  soldUnits?: number;

  status: ListingStatus;

  // Ownership
  ownerId: string; // agent or constructora
  brokerageId?: string;
  projectId?: string;
  developerId?: string; // NEW: Link to Developer/Constructora

  isVerified: boolean;

  // Engagement
  views?: number;
  featured_until?: Date | null;

  // Admin intelligence signals
  qualityScore?: number;
  visibilityScore?: number;
  seoScore?: number;
  anomalyFlags?: string[];
  duplicateRisk?: boolean;
  missingPhotos?: boolean;
  missingGeocode?: boolean;
  hasAssignedBroker?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

