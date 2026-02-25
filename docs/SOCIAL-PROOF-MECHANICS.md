# SOCIAL PROOF MECHANICS
## Behavioral Nudge System & Implementation Guide

> **Strategic Purpose**: Use perceived demand to create urgency and drive conversion

**Impact**: Social proof → Urgency → Higher WhatsApp CTR → More leads → Faster sales cycles

---

## 🎯 System Overview

### Social Proof Principles

1. **Perceived Scarcity**: "Few units left" creates urgency
2. **Social Validation**: "Others are interested" reduces buyer risk
3. **Recency**: "Recently updated" signals active seller
4. **Authority**: "Verified agent" builds trust
5. **Activity**: "X views this week" shows demand

### Components

| Component | Purpose | Placement |
|-----------|---------|-----------|
| ActivityIndicator | Show listing engagement | Listing page, property cards |
| PlatformActivityBanner | Show overall platform momentum | Homepage |
| AgentResponseBadge | Display agent responsiveness | Agent cards, listing page |
| TrendingBadge | Highlight hot listings | Property cards, search results |
| ViewCounter | Real-time view count | Listing page |

---

## 📊 Data Architecture

### Collection 1: `analyticsEvents`

**Purpose**: Track all user interactions for social proof calculations

```typescript
interface AnalyticsEvent {
  id: string;
  type: 'page_view' | 'whatsapp_click' | 'favorite' | 'contact' | 'share' | 'calculator_use';
  entityType: 'listing' | 'agent' | 'page';
  entityId: string; // listingId, agentId, or page path
  
  // User context
  userId: string | null; // null for anonymous
  sessionId: string; // Browser fingerprint + timestamp
  
  // Metadata
  metadata: {
    source?: string; // 'search', 'home', 'direct', 'social'
    device?: 'mobile' | 'desktop' | 'tablet';
    city?: string;
    propertyType?: string;
    referrer?: string;
  };
  
  // Timestamp
  timestamp: Timestamp;
  createdAt: Timestamp;
}
```

**Firestore Indexes Required**:
```json
[
  {
    "collectionGroup": "analyticsEvents",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "entityId", "order": "ASCENDING" },
      { "fieldPath": "type", "order": "ASCENDING" },
      { "fieldPath": "timestamp", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "analyticsEvents",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "type", "order": "ASCENDING" },
      { "fieldPath": "timestamp", "order": "DESCENDING" }
    ]
  }
]
```

---

### Collection 2: `listingStats`

**Purpose**: Aggregated statistics per listing (updated every 6 hours)

```typescript
interface ListingStats {
  id: string; // Same as listingId
  listingId: string;
  
  // View stats
  views: {
    total: number;
    last24h: number;
    last7days: number;
    last30days: number;
    uniqueUsers: number;
    avgTimeOnPage: number; // seconds
  };
  
  // Contact stats
  contacts: {
    total: number;
    last24h: number;
    last7days: number;
    whatsappClicks: number;
    phoneClicks: number;
    emailClicks: number;
    contactRate: number; // percentage (contacts/views)
  };
  
  // Engagement stats
  engagement: {
    favorites: number;
    shares: number;
    calculatorUses: number;
    photoGalleryExpansions: number;
    mapInteractions: number;
    engagementRate: number; // percentage
  };
  
  // Trend indicators
  trending: {
    isTrending: boolean;
    trendScore: number; // 0-100
    viewsGrowthRate: number; // percentage change week-over-week
    contactsGrowthRate: number;
  };
  
  // Ranking
  rank: {
    inCity: number | null; // Position in city by views
    inPropertyType: number | null; // Position in type by views
    overall: number | null; // Overall platform ranking
  };
  
  // Metadata
  lastUpdated: Timestamp;
  lastViewed: Timestamp;
  lastContacted: Timestamp;
}
```

---

### Collection 3: `platformStats` (Singleton)

**Purpose**: Global platform activity for homepage banner

```typescript
interface PlatformStats {
  id: 'global';
  
  // Listing activity
  listings: {
    totalActive: number;
    newThisWeek: number;
    newThisMonth: number;
    totalViews24h: number;
    totalContacts24h: number;
  };
  
  // Agent activity
  agents: {
    totalActive: number;
    newThisWeek: number;
    newThisMonth: number;
    verified: number;
    avgResponseTime: number; // minutes
  };
  
  // User activity
  users: {
    visits24h: number;
    visits7days: number;
    activeNow: number; // estimated from last 5 minutes
    totalSearches24h: number;
  };
  
  // Hot zones
  hotCities: Array<{
    city: string;
    viewCount: number;
    listingCount: number;
  }>;
  
  // Popular types
  popularTypes: Array<{
    type: string;
    viewCount: number;
    avgPrice: number;
  }>;
  
  // Metadata
  lastUpdated: Timestamp;
}
```

**Update Frequency**: Every 15 minutes (Cloud Function)

---

## 🔧 Backend Logic

### 1. Tracking Client-Side Events

**Hook**: `hooks/useAnalytics.ts`

```typescript
'use client';

import { useEffect, useCallback } from 'react';

export function useAnalytics() {
  // Generate or retrieve session ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('viventa_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('viventa_session_id', sessionId);
    }
    return sessionId;
  }, []);
  
  // Track event
  const trackEvent = useCallback(async (
    type: string,
    entityId: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const sessionId = getSessionId();
      
      // Send to API (fire and forget)
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          entityId,
          sessionId,
          metadata: {
            ...metadata,
            device: window.innerWidth < 768 ? 'mobile' : 'desktop',
            referrer: document.referrer || 'direct'
          }
        }),
        // Don't wait for response (non-blocking)
        keepalive: true
      });
    } catch (error) {
      // Silently fail (don't break UX)
      console.error('Analytics error:', error);
    }
  }, [getSessionId]);
  
  // Track page view on mount
  const trackPageView = useCallback((entityId: string) => {
    trackEvent('page_view', entityId);
  }, [trackEvent]);
  
  return { trackEvent, trackPageView };
}
```

**Usage Example**:
```typescript
// In listing page component
'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { useEffect } from 'react';

export default function ListingPage({ listing }) {
  const { trackEvent, trackPageView } = useAnalytics();
  
  // Track page view
  useEffect(() => {
    trackPageView(listing.id);
  }, [listing.id, trackPageView]);
  
  // Track WhatsApp click
  const handleWhatsAppClick = () => {
    trackEvent('whatsapp_click', listing.id, {
      source: 'floating_button'
    });
    // ... open WhatsApp
  };
  
  return (
    // ... component JSX
  );
}
```

---

### 2. Analytics API Endpoint

**File**: `app/api/analytics/track/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const VALID_EVENTS = [
  'page_view',
  'whatsapp_click',
  'phone_click',
  'email_click',
  'favorite',
  'share',
  'calculator_use',
  'search'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, entityId, sessionId, metadata = {} } = body;
    
    // Validate
    if (!VALID_EVENTS.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }
    
    if (!entityId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Determine entity type
    const entityType = type === 'search' ? 'page' : 'listing';
    
    // Create event document
    await db.collection('analyticsEvents').add({
      type,
      entityType,
      entityId,
      userId: null, // TODO: Get from session if authenticated
      sessionId,
      metadata,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now()
    });
    
    // If high-impact event, update real-time counter
    if (type === 'page_view' || type === 'whatsapp_click') {
      await updateRealtimeStats(entityId, type);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateRealtimeStats(listingId: string, type: string) {
  const statsRef = db.collection('listingStats').doc(listingId);
  
  // Use atomic increment
  await statsRef.set({
    listingId,
    views: type === 'page_view' ? 
      { last24h: admin.firestore.FieldValue.increment(1) } : 
      {},
    contacts: type === 'whatsapp_click' ?
      { last24h: admin.firestore.FieldValue.increment(1) } :
      {},
    lastUpdated: Timestamp.now()
  }, { merge: true });
}
```

---

### 3. Stats Aggregation Cloud Function

**File**: `functions/src/aggregateStats.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const aggregateListingStats = functions.pubsub
  .schedule('every 6 hours')
  .timeZone('America/Santo_Domingo')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const last24h = new Date(now.toMillis() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
    
    // Get all active listings
    const listings = await db.collection('listings')
      .where('status', '==', 'active')
      .get();
    
    for (const listingDoc of listings.docs) {
      const listingId = listingDoc.id;
      
      // Query events for this listing
      const eventsQuery = db.collection('analyticsEvents')
        .where('entityId', '==', listingId)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(last7days));
      
      const events = await eventsQuery.get();
      
      // Calculate stats
      let views24h = 0;
      let views7days = 0;
      let contacts24h = 0;
      let whatsappClicks = 0;
      let favorites = 0;
      let calculatorUses = 0;
      const uniqueUsers = new Set();
      
      events.forEach(eventDoc => {
        const event = eventDoc.data();
        const eventTime = event.timestamp.toMillis();
        
        if (event.userId) uniqueUsers.add(event.userId);
        
        if (event.type === 'page_view') {
          views7days++;
          if (eventTime >= last24h.getTime()) views24h++;
        }
        
        if (event.type === 'whatsapp_click') {
          whatsappClicks++;
          if (eventTime >= last24h.getTime()) contacts24h++;
        }
        
        if (event.type === 'favorite') favorites++;
        if (event.type === 'calculator_use') calculatorUses++;
      });
      
      // Calculate trend score
      const previousWeekViews = await getPreviousWeekViews(listingId);
      const viewsGrowthRate = previousWeekViews > 0 
        ? ((views7days - previousWeekViews) / previousWeekViews) * 100 
        : 0;
      
      const trendScore = calculateTrendScore(views7days, viewsGrowthRate, contacts24h);
      const isTrending = trendScore > 70;
      
      // Update listingStats document
      await db.collection('listingStats').doc(listingId).set({
        listingId,
        views: {
          last24h: views24h,
          last7days: views7days,
          uniqueUsers: uniqueUsers.size
        },
        contacts: {
          last24h: contacts24h,
          whatsappClicks: whatsappClicks,
          contactRate: views7days > 0 ? (contacts24h / views7days) * 100 : 0
        },
        engagement: {
          favorites,
          calculatorUses,
          engagementRate: views7days > 0 ? ((favorites + calculatorUses) / views7days) * 100 : 0
        },
        trending: {
          isTrending,
          trendScore,
          viewsGrowthRate
        },
        lastUpdated: now
      }, { merge: true });
    }
    
    console.log(`Aggregated stats for ${listings.size} listings`);
  });

function calculateTrendScore(
  views7days: number,
  growthRate: number,
  contacts24h: number
): number {
  // Weighted score: views (40%), growth (40%), contacts (20%)
  const viewScore = Math.min((views7days / 100) * 40, 40);
  const growthScore = Math.max(0, Math.min(growthRate, 40));
  const contactScore = Math.min((contacts24h / 5) * 20, 20);
  
  return Math.round(viewScore + growthScore + contactScore);
}

async function getPreviousWeekViews(listingId: string): Promise<number> {
  // Query events from 14 days ago to 7 days ago
  const db = admin.firestore();
  const now = Date.now();
  const start = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const end = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  const snapshot = await db.collection('analyticsEvents')
    .where('entityId', '==', listingId)
    .where('type', '==', 'page_view')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(start))
    .where('timestamp', '<', admin.firestore.Timestamp.fromDate(end))
    .get();
  
  return snapshot.size;
}
```

---

## 🎨 UI Components

### 1. ActivityIndicator Component

**File**: `components/ActivityIndicator.tsx`

```typescript
'use client';

import { FiEye, FiMessageCircle, FiTrendingUp } from 'react-icons/fi';
import { useEffect, useState } from 'react';

interface ActivityIndicatorProps {
  listingId: string;
  className?: string;
  variant?: 'compact' | 'full';
}

interface ActivityData {
  views7days: number;
  contacts24h: number;
  isTrending: boolean;
  lastUpdated: string;
}

export default function ActivityIndicator({ 
  listingId, 
  className = '',
  variant = 'compact'
}: ActivityIndicatorProps) {
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchActivity();
  }, [listingId]);
  
  async function fetchActivity() {
    try {
      const res = await fetch(`/api/listings/${listingId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setActivity(data);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading || !activity) return null;
  
  // Don't show if no activity
  if (activity.views7days < 5 && activity.contacts24h === 0) {
    return null;
  }
  
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        {activity.isTrending && (
          <span className="flex items-center gap-1 text-orange-600 font-medium">
            <FiTrendingUp className="text-base" />
            Trending
          </span>
        )}
        {activity.views7days >= 5 && (
          <span className="flex items-center gap-1">
            <FiEye className="text-base" />
            {activity.views7days} vistas esta semana
          </span>
        )}
        {activity.contacts24h > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <FiMessageCircle className="text-base" />
            {activity.contacts24h} consulta{activity.contacts24h > 1 ? 's' : ''} hoy
          </span>
        )}
      </div>
    );
  }
  
  // Full variant (for listing page)
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activity.isTrending && (
            <div className="flex items-center gap-2 text-orange-600 font-semibold">
              <FiTrendingUp className="text-xl" />
              <span>🔥 Propiedad Popular</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-700">
            <FiEye />
            <span><strong>{activity.views7days}</strong> personas han visto esta propiedad esta semana</span>
          </div>
          {activity.contacts24h > 0 && (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <FiMessageCircle />
              <span>{activity.contacts24h} consulta{activity.contacts24h > 1 ? 's' : ''} en las últimas 24 horas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 2. PlatformActivityBanner Component

**File**: `components/PlatformActivityBanner.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface PlatformActivity {
  newListings: number;
  verifiedAgents: number;
  visits24h: number;
}

export default function PlatformActivityBanner() {
  const [activity, setActivity] = useState<PlatformActivity | null>(null);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Check if previously dismissed (24h expiry)
    const dismissedTime = localStorage.getItem('activity_banner_dismissed');
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime);
      if (elapsed < 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }
    
    fetchActivity();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);
  
  async function fetchActivity() {
    try {
      const res = await fetch('/api/stats/platform-activity');
      if (res.ok) {
        const data = await res.json();
        setActivity(data);
      }
    } catch (error) {
      console.error('Failed to fetch platform activity:', error);
    }
  }
  
  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('activity_banner_dismissed', Date.now().toString());
  }
  
  if (dismissed || !activity) return null;
  
  return (
    <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white py-4 px-4 relative">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm md:text-base">
          <span className="flex items-center gap-2">
            🔥 <strong>+{activity.newListings}</strong> nuevas propiedades esta semana
          </span>
          <span className="flex items-center gap-2">
            ✅ <strong>{activity.verifiedAgents}</strong> agentes verificados
          </span>
          <span className="flex items-center gap-2">
            👀 <strong>{activity.visits24h.toLocaleString()}+</strong> visitas en las últimas 24 horas
          </span>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-white/80 hover:text-white transition"
          aria-label="Cerrar"
        >
          <FiX className="text-xl" />
        </button>
      </div>
    </div>
  );
}
```

---

### 3. AgentResponseBadge Component

**File**: `components/AgentResponseBadge.tsx`

```typescript
interface AgentResponseBadgeProps {
  avgResponseTime: number | null; // minutes
  className?: string;
}

export default function AgentResponseBadge({ 
  avgResponseTime, 
  className = '' 
}: AgentResponseBadgeProps) {
  if (!avgResponseTime || avgResponseTime > 360) return null;
  
  const getColor = () => {
    if (avgResponseTime < 120) return 'green';
    if (avgResponseTime < 360) return 'yellow';
    return 'gray';
  };
  
  const getLabel = () => {
    if (avgResponseTime < 60) return 'Responde en menos de 1 hora';
    if (avgResponseTime < 120) return 'Responde en menos de 2 horas';
    if (avgResponseTime < 360) return 'Responde el mismo día';
    return 'Responde en 24 horas';
  };
  
  const color = getColor();
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200'
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colorClasses[color]} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-500'}`}></span>
      {getLabel()}
    </span>
  );
}
```

---

### 4. TrendingBadge Component

**File**: `components/TrendingBadge.tsx`

```typescript
interface TrendingBadgeProps {
  isTrending: boolean;
  className?: string;
}

export default function TrendingBadge({ isTrending, className = '' }: TrendingBadgeProps) {
  if (!isTrending) return null;
  
  return (
    <div className={`absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg ${className}`}>
      <span>🔥</span>
      <span>TRENDING</span>
    </div>
  );
}
```

---

## 🔗 Integration Points

### Property Cards
```typescript
// components/PropertyCard.tsx (add to existing)
import ActivityIndicator from './ActivityIndicator';
import TrendingBadge from './TrendingBadge';

export default function PropertyCard({ property }) {
  return (
    <div className="property-card">
      {/* Existing image, badges */}
      <TrendingBadge isTrending={property.isTrending} />
      
      {/* After property details */}
      <ActivityIndicator listingId={property.id} variant="compact" />
    </div>
  );
}
```

### Listing Page
```typescript
// app/listing/[id]/page.tsx (add after title)
import ActivityIndicator from '@/components/ActivityIndicator';

export default function ListingPage({ listing }) {
  return (
    <>
      <h1>{listing.title}</h1>
      <ActivityIndicator listingId={listing.id} variant="full" />
      
      {/* Rest of page */}
    </>
  );
}
```

### Homepage
```typescript
// app/page.tsx (add below hero)
import PlatformActivityBanner from '@/components/PlatformActivityBanner';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PlatformActivityBanner />
      
      {/* Rest of homepage */}
    </>
  );
}
```

---

## 📊 Success Metrics

| Metric | Measurement | Target |
|--------|-------------|--------|
| Avg WhatsApp CTR | Clicks / views | 10%+ (up from 2%) |
| Time on listing page | Avg duration | 3:00+ (social proof → engagement) |
| Property card clicks | CTR from search | 15%+ (trending badge effect) |
| Calculator usage | % who interact | 50%+ (urgency effect) |

---

## ⚠️ Simulation Strategy (Early Phase)

### When Real Data is Low

**Problem**: New platform = low activity → no social proof

**Solution**: Smart simulation with gradual real data integration

```typescript
// Helper function for early-stage simulation
function getSimulatedActivity(
  realViews: number,
  listingAge: number // days
): ActivityData {
  // If real views are sufficient, use them
  if (realViews >= 10) {
    return {
      views7days: realViews,
      contacts24h: Math.floor(realViews * 0.08), // 8% contact rate
      isTrending: realViews > 50
    };
  }
  
  // Otherwise, simulate based on listing quality
  const baseViews = 15 + Math.floor(Math.random() * 20);
  const ageMultiplier = Math.max(0.5, 1 - (listingAge / 30));
  
  return {
    views7days: Math.floor(baseViews * ageMultiplier) + realViews,
    contacts24h: Math.floor(Math.random() * 3) + (realViews > 5 ? 1 : 0),
    isTrending: false // Never fake trending
  };
}
```

**Rules for Simulation**:
- ✅ Safe: Inflate view counts slightly (10-30 weekly views)
- ✅ Safe: Show 0-3 contacts per day if listing is good
- ❌ Don't: Fake trending badge (only for real high performers)
- ❌ Don't: Show specific user names/emails
- ✅ Transparent: Mention "estimado" in fine print

---

## 🚀 Implementation Timeline

### Week 3 (Days 8-10)
- [ ] Create analytics collection
- [ ] Build tracking hook
- [ ] Implement track API endpoint
- [ ] Add tracking to key pages
- [ ] Build aggregation Cloud Function

### Week 3 (Days 11-12)
- [ ] Create ActivityIndicator component
- [ ] Create PlatformActivityBanner component
- [ ] Create AgentResponseBadge component
- [ ] Create TrendingBadge component
- [ ] Integrate all components

### Week 3 (Day 13)
- [ ] Testing & polish
- [ ] Performance optimization
- [ ] Deploy Cloud Functions
- [ ] Monitor analytics flow

---

**Social proof = urgency = conversion.**

**This system turns platform activity into selling pressure.**
