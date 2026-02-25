// types/project.ts
// Project & Unit schema types for multi-unit real estate infrastructure

export type ProjectStatus = 'active' | 'inactive' | 'archived';
export type ConstructionStatus = 'pre-venta' | 'en-construccion' | 'entrega-proxima' | 'entregado' | 'agotado';
export type VerificationStatus = 'verified' | 'pending' | 'unverified';
export type UnitType = 'apartamento' | 'casa' | 'penthouse' | 'estudio' | 'otro';
export type UnitStatus = 'disponible' | 'separado' | 'en-proceso' | 'vendido' | 'reservado' | 'bloqueado';
export type FinancingType = 'separacion' | 'inicial' | 'contra-entrega' | 'interno' | 'bancario';

/** Project Entity - Root container for multi-unit offerings */
export interface Project {
  id: string;
  developerId: string;
  name: string;
  description: string;
  shortDescription?: string;
  location: {
    city: string;
    sector: string;
    address: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  googleMapsUrl: string;
  
  status: ProjectStatus;
  constructionStatus: ConstructionStatus;
  deliveryDate: Date;
  completionPercent: number; // 0-100
  
  totalUnits: number;
  availableUnits: number;
  smallestUnitMeters?: number;
  smallestUnitPrice?: {
    usd?: number;
    dop?: number;
  };
  
  images: string[];
  featuredImage: string;
  amenities: string[];
  features: string[];
  
  verificationStatus: VerificationStatus;
  views: number;
  favorites: number;
  
  createdAt: Date;
  updatedAt: Date;
}

/** Unit Entity - Individual property within a project */
export interface Unit {
  id: string;
  projectId: string;
  unitNumber: string; // e.g., "101", "2-B"
  unitType: UnitType;
  floor?: number;
  
  bedrooms: number;
  bathrooms: number;
  meters: number;
  lotMeters?: number;
  
  priceUSD: number;
  priceDOP: number;
  pricePerM2: number;
  
  status: UnitStatus;
  availableDate?: Date;
  
  separationAmount?: {
    usd?: number;
    dop?: number;
  };
  initialPercent?: number;
  paymentPlan?: {
    type: string;
    months: number;
    monthlyAmount: {
      usd?: number;
      dop?: number;
    };
  };
  
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Promotional Offer - Marketing promotions tied to project */
export interface PromotionalOffer {
  id: string;
  projectId: string;
  title: string;
  description: string;
  validFrom: Date;
  validUntil: Date;
  discountPercent?: number;
  discountAmount?: {
    usd?: number;
    dop?: number;
  };
  specialTerms?: string;
  minimumPurchase?: number;
  active: boolean;
  createdAt: Date;
}

/** Financing Option - Structured financing terms */
export interface FinancingOption {
  id: string;
  projectId: string;
  type: FinancingType;
  label: string;
  description: string;
  amount?: {
    usd?: number;
    dop?: number;
  };
  percent?: number;
  monthlyAmount?: {
    usd?: number;
    dop?: number;
  };
  months?: number;
  terms: string;
  order: number;
  active: boolean;
  createdAt: Date;
}

/** Project with all related data (for project detail page) */
export interface ProjectDetail extends Project {
  units: Unit[];
  promotionalOffers: PromotionalOffer[];
  financingOptions: FinancingOption[];
  stats: {
    viewsLastWeek: number;
    favoritesCount: number;
    unitsSeparated: number;
    unitsSold: number;
  };
}

/** Create Project DTO */
export interface CreateProjectInput {
  name: string;
  description: string;
  shortDescription?: string;
  city: string;
  sector: string;
  address: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  totalUnits: number;
  constructionStatus: ConstructionStatus;
  deliveryDate: Date | string;
  amenities: string[];
  images: string[];
}

/** Create Unit DTO */
export interface CreateUnitInput {
  unitNumber: string;
  unitType: UnitType;
  floor?: number;
  bedrooms: number;
  bathrooms: number;
  meters: number;
  lotMeters?: number;
  priceUSD: number;
  priceDOP?: number;
  separationAmount?: number;
  initialPercent?: number;
}

/** Bulk Create Units DTO */
export interface BulkCreateUnitsInput {
  units: CreateUnitInput[];
}

/** Unit Inventory Summary */
export interface UnitInventorySummary {
  total: number;
  disponible: number;
  separado: number;
  enProceso: number;
  vendido: number;
  reservado: number;
  bloqueado: number;
}

/** Project Statistics */
export interface ProjectStats {
  projectId: string;
  views: number;
  viewsLastWeek: number;
  favorites: number;
  unitsSold: number;
  unitsSeparated: number;
  availableUnits: number;
  revenue?: {
    usd: number;
    dop: number;
  };
  avgDaysToSell?: number;
  conversionRate?: number;
}
