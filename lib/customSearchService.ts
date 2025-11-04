/**
 * Custom Search Service
 * Firestore-based search with client-side filtering for property listings.
 * Replaces Algolia dependency with zero-cost solution.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebaseClient';

// Listing type definition
export interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency?: 'USD' | 'DOP';
  area: number;
  bedrooms: number;
  bathrooms: number;
  propertyType?: string;
  listingType?: 'sale' | 'rent';
  status?: string;
  images?: string[];
  agentName?: string;
  agentPhone?: string;
  // Location can be stored either as a string fields (city/neighborhood) or nested object
  location?: {
    address?: string;
    city?: string;
    neighborhood?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  city?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  amenities?: string[];
  featured?: boolean;
  views?: number;
  createdAt: any;
  updatedAt?: any;
}

export interface SearchFilters {
  query?: string; // Text search (title, description, location)
  city?: string;
  neighborhood?: string;
  propertyType?: string;
  listingType?: 'sale' | 'rent';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  status?: string;
  // Geo-search
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface SearchResult {
  listing: Listing;
  distance?: number; // Distance in km (if geo-search)
  relevance?: number; // Text match relevance score
}

export interface SearchResponse {
  results: SearchResult[];
  totalHits: number;
  page: number;
  totalPages: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate text relevance score (0-1)
 * Simple fuzzy matching with bonus for exact matches
 */
function calculateRelevance(searchQuery: string, listing: Listing): number {
  if (!searchQuery) return 1;

  const query = searchQuery.toLowerCase().trim();
  const tokens = query.split(/\s+/);

  // Include both nested and top-level location fields in search
  const searchableText = [
    listing.title,
    listing.description,
    typeof listing.location === 'string' ? listing.location : listing.location?.address,
    listing.location?.city,
    listing.location?.neighborhood,
    listing.city,
    listing.neighborhood,
    listing.agentName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let score = 0;
  let maxScore = tokens.length;

  tokens.forEach((token) => {
    if (searchableText.includes(token)) {
      // Exact token match
      score += 1;
    } else {
      // Partial match (fuzzy)
      const partialMatch = searchableText.split(/\s+/).some((word) => {
        return word.includes(token) || token.includes(word);
      });
      if (partialMatch) {
        score += 0.5;
      }
    }
  });

  // Bonus for exact phrase match
  if (searchableText.includes(query)) {
    score += 0.5;
    maxScore += 0.5;
  }

  return Math.min(score / maxScore, 1);
}

/**
 * Build Firestore query with compound filters
 */
function buildFirestoreQuery(filters: SearchFilters) {
  const constraints: any[] = [];

  // Always filter for active listings
  constraints.push(where('status', '==', 'active'));

  // Apply exact match filters
  if (filters.city) {
    // Our properties store city at the top level
    constraints.push(where('city', '==', filters.city));
  }

  if (filters.neighborhood) {
    // Our properties store neighborhood at the top level
    constraints.push(where('neighborhood', '==', filters.neighborhood));
  }

  if (filters.propertyType) {
    constraints.push(where('propertyType', '==', filters.propertyType));
  }

  if (filters.listingType) {
    constraints.push(where('listingType', '==', filters.listingType));
  }

  if (filters.bedrooms) {
    constraints.push(where('bedrooms', '>=', filters.bedrooms));
  }

  if (filters.bathrooms) {
    constraints.push(where('bathrooms', '>=', filters.bathrooms));
  }

  // Price range - note: Firestore requires composite index for range queries
  // We'll do client-side filtering for price to avoid complex index requirements
  
  // Order by creation date (most recent first)
  constraints.push(orderBy('createdAt', 'desc'));

  // Limit initial fetch (we'll filter client-side)
  constraints.push(firestoreLimit(500));

  // Use 'properties' collection as the canonical source for active listings
  return query(collection(db, 'properties'), ...constraints);
}

/**
 * Apply client-side filters that can't be done efficiently in Firestore
 */
function applyClientFilters(
  listings: Listing[],
  filters: SearchFilters
): Listing[] {
  return listings.filter((listing) => {
    // Price range
    if (filters.minPrice && listing.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && listing.price > filters.maxPrice) {
      return false;
    }

    // Area range
    if (filters.minArea && listing.area < filters.minArea) {
      return false;
    }
    if (filters.maxArea && listing.area > filters.maxArea) {
      return false;
    }

    return true;
  });
}

/**
 * Search listings with filters, text search, and geo-search
 */
export async function searchListings(
  filters: SearchFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResponse> {
  try {
    // Build and execute Firestore query
    const firestoreQuery = buildFirestoreQuery(filters);
    const snapshot = await getDocs(firestoreQuery);

    // Convert to Listing objects
    let listings: Listing[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as Listing[];

    // Apply client-side filters
    listings = applyClientFilters(listings, filters);

    // Build SearchResult array with relevance and distance
    let results: SearchResult[] = listings.map((listing) => {
      const result: SearchResult = { listing };

      // Calculate text relevance
      if (filters.query) {
        result.relevance = calculateRelevance(filters.query, listing);
      }

      // Calculate geo-distance
      if (filters.lat && filters.lng) {
        const targetLat = listing.lat ?? listing.location?.coordinates?.latitude;
        const targetLng = listing.lng ?? listing.location?.coordinates?.longitude;
        if (typeof targetLat === 'number' && typeof targetLng === 'number') {
          result.distance = calculateDistance(
            filters.lat,
            filters.lng,
            targetLat,
            targetLng
          );
        }
      }

      return result;
    });

    // Filter by radius if geo-search
    if (filters.radiusKm && filters.lat && filters.lng) {
      results = results.filter(
        (r) => r.distance !== undefined && r.distance <= filters.radiusKm!
      );
    }

    // Filter by text relevance (threshold 0.3)
    if (filters.query) {
      results = results.filter((r) => !r.relevance || r.relevance >= 0.3);
    }

    // Sort results
    results.sort((a, b) => {
      // If geo-search, sort by distance first
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }

      // If text search, sort by relevance first
      if (a.relevance !== undefined && b.relevance !== undefined) {
        return b.relevance - a.relevance;
      }

      // Otherwise sort by creation date (already ordered in Firestore)
      return 0;
    });

    // Paginate
    const totalHits = results.length;
    const totalPages = Math.ceil(totalHits / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = results.slice(startIndex, endIndex);

    return {
      results: paginatedResults,
      totalHits,
      page,
      totalPages,
    };
  } catch (error) {
    console.error('[CustomSearch] Error searching listings:', error);
    throw error;
  }
}

/**
 * Get unique facet values for filters (for autocomplete/dropdowns)
 */
export async function getFacetValues(): Promise<{
  cities: string[];
  neighborhoods: string[];
  propertyTypes: string[];
}> {
  try {
    const q = query(
      collection(db, 'properties'),
      where('status', '==', 'active'),
      firestoreLimit(500)
    );

    const snapshot = await getDocs(q);
    const listings = snapshot.docs.map((doc: any) => doc.data()) as Listing[];

    const cities = new Set<string>();
    const neighborhoods = new Set<string>();
    const propertyTypes = new Set<string>();

    listings.forEach((listing) => {
      // Prefer top-level fields; fall back to nested structure if present
      if (listing.city) cities.add(listing.city);
      else if (listing.location?.city) cities.add(listing.location.city);

      if (listing.neighborhood) neighborhoods.add(listing.neighborhood);
      else if (listing.location?.neighborhood)
        neighborhoods.add(listing.location.neighborhood);

      if (listing.propertyType) propertyTypes.add(listing.propertyType);
    });

    return {
      cities: Array.from(cities).sort(),
      neighborhoods: Array.from(neighborhoods).sort(),
      propertyTypes: Array.from(propertyTypes).sort(),
    };
  } catch (error) {
    console.error('[CustomSearch] Error fetching facet values:', error);
    return { cities: [], neighborhoods: [], propertyTypes: [] };
  }
}
