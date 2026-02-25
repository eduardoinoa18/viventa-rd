# WEEK 2-3 EXECUTION PLAN
## High-Leverage Authority Stack

> **Strategic Goal**: Transform Viventa from "listing database" to "verified investment marketplace"

**Timeline**: Feb 24 - Mar 14, 2026 (3 weeks)  
**Focus**: Authority compounding through investor tooling + verification infrastructure + social proof

---

## 🎯 Strategic Framework

### Why This Sequence Matters

**Week 1 Achievement**: Changed perception (authority positioning)  
**Week 2-3 Goal**: Change behavior (investment tooling + trust infrastructure)

**The Compounding Effect**:
```
Authority (Week 1)
  → Investment Tooling (Week 2)
    → Verification System (Week 2-3)
      → Social Proof (Week 3)
        → Data Moat (Parallel)
          = Market Leader Position
```

Each phase strengthens the previous. This isn't feature addition—it's **strategic layering**.

---

## 📅 WEEK 2 (Feb 24 - Mar 2)
### Theme: "Listing Pages Become Investment Tools"

### 🎯 Phase 1A: Investment Insight Module (Days 1-2)

**Goal**: Transform listing pages from "photo + price" to "investment analysis"

**Components to Build**:

#### 1. InvestmentInsightPanel.tsx
**Location**: `components/InvestmentInsightPanel.tsx`

**Features**:
- Price per m² calculation
- Estimated monthly mortgage payment
- Rental yield estimate (conservative 5-7% model)
- ROI percentage display
- "Ideal para Airbnb" badge (zone-based logic)

**Design**:
- Premium gradient card (teal → cyan)
- Icon-driven metrics (dollar, calculator, chart icons)
- Mobile-responsive grid (2 cols mobile, 3 cols desktop)
- Above-fold placement on listing page

**Calculations**:
```typescript
// Price per m²
pricePerSqM = property.price / property.area

// Mortgage estimate (20% down, 8% interest, 20 years)
principal = price * 0.8
monthlyRate = 0.08 / 12
months = 20 * 12
monthlyPayment = principal * (monthlyRate * (1 + monthlyRate)^months) / ((1 + monthlyRate)^months - 1)

// Rental yield (conservative)
estimatedRent = price * 0.006 (0.6% of price = monthly rent estimate)
annualRent = estimatedRent * 12
grossYield = (annualRent / price) * 100

// Airbnb logic
isAirbnbIdeal = property.city in ['Punta Cana', 'Puerto Plata', 'Las Terrenas', 'Samaná'] 
                && property.propertyType in ['Apartamento', 'Villa', 'Casa']
```

**Data Requirements**:
- `property.price` (already exists)
- `property.area` (already exists)
- `property.city` (already exists)
- `property.propertyType` (already exists)

**Success Metrics**:
- Avg time on listing page increases 30%+
- "Investment insight visible" becomes user feedback phrase
- WhatsApp inquiry mentions "investment potential"

---

#### 2. MortgageCalculator.tsx
**Location**: `components/MortgageCalculator.tsx`

**Features**:
- Interactive slider inputs
- Real-time calculation updates
- Editable assumptions (down payment %, interest rate, term)
- Export/share calculation option
- Mobile-optimized UI

**Input Fields**:
- Property price (pre-filled from listing)
- Down payment % (default 20%, range 10-50%)
- Interest rate % (default 8%, range 5-12%)
- Loan term years (default 20, options: 10, 15, 20, 25, 30)

**Output Display**:
- Monthly mortgage payment (large, bold)
- Total interest paid over life of loan
- Total amount paid
- Amortization preview (first 12 months)

**Design**:
- Clean calculator aesthetic (white card, subtle shadows)
- Teal accent color for sliders
- Large output numbers for readability
- Collapsible amortization table

**Technical Notes**:
- Use `useState` for reactive inputs
- Debounce calculations (300ms) to prevent excessive re-renders
- Format currency with DOP/USD toggle
- Validate inputs (prevent negative values, enforce ranges)

**Success Metrics**:
- 40%+ of listing page visitors interact with calculator
- Avg time on page increases 45+ seconds
- Calculator becomes sharepoint on WhatsApp

---

#### 3. WhatsAppFloatingCTA.tsx
**Location**: `components/WhatsAppFloatingCTA.tsx`

**Features**:
- Persistent floating button (mobile bottom-right)
- Sticky sidebar CTA (desktop right-side)
- Pre-filled message with listing link
- Agent photo + name display
- Online status indicator (if presence data available)

**Message Template**:
```
Hola, me interesa esta propiedad en VIVENTA:

{property.displayTitle}
{property.address}
Precio: {formatted price}

Link: https://viventa.com.do/listing/{id}

¿Está disponible para una visita?
```

**Design - Mobile**:
- Green circular button (60px diameter)
- WhatsApp icon (white)
- Bottom-right fixed position (20px from bottom, 20px from right)
- Pulse animation on page load
- Z-index above all content
- Smooth slide-in animation

**Design - Desktop**:
- Sticky sidebar card (300px width)
- Agent photo (circular, 80px)
- Agent name + verification badge
- "Contactar por WhatsApp" button (green gradient)
- Secondary buttons: "Llamar", "Email"
- Stays visible during scroll

**Technical Notes**:
- Detect mobile vs desktop with `useMediaQuery` or Tailwind breakpoints
- Encode message for URL (`encodeURIComponent`)
- WhatsApp URL format: `https://wa.me/{phone}?text={message}`
- Track click events to analytics (Phase 4)

**Success Metrics**:
- WhatsApp CTR increases 60%+ vs current embedded links
- Mobile conversion significantly higher than desktop
- Agent response time tracked (future verification metric)

---

### 🎯 Phase 1B: Listing Page Integration (Day 3)

**File**: `app/listing/[id]/page.tsx`

**Changes Required**:

1. **Add Investment Insight Panel** (above description)
2. **Add Mortgage Calculator** (collapsible section after features)
3. **Add WhatsApp Floating CTA** (persistent throughout page)
4. **Reorder sections** for conversion optimization

**New Layout Order**:
```
1. Image Gallery (existing)
2. Property Header (price, title, location) (existing)
3. 🆕 Investment Insight Panel (NEW - above fold)
4. Quick Facts Grid (bedrooms, baths, area) (existing)
5. Description (existing)
6. 🆕 Mortgage Calculator (NEW - expandable)
7. Features & Amenities (existing)
8. Verification Status Section (enhance existing)
9. Agent Card (existing)
10. Map (existing)
11. Similar Properties (existing)
12. 🆕 WhatsApp Floating CTA (NEW - persistent)
```

**Code Structure**:
```typescript
export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await getListingById(params.id);
  
  return (
    <div>
      <ImageGallery images={listing.images} />
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <PropertyHeader listing={listing} />
          
          {/* NEW: Investment Insights */}
          <InvestmentInsightPanel listing={listing} />
          
          <QuickFacts listing={listing} />
          <Description listing={listing} />
          
          {/* NEW: Mortgage Calculator */}
          <MortgageCalculator defaultPrice={listing.price} />
          
          <FeaturesAmenities listing={listing} />
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Desktop WhatsApp CTA Sidebar */}
          <div className="hidden lg:block sticky top-24">
            <AgentContactCard agent={listing.agent} />
          </div>
        </div>
      </div>
      
      {/* Mobile WhatsApp Floating Button */}
      <WhatsAppFloatingCTA 
        agent={listing.agent} 
        listing={listing}
        className="lg:hidden"
      />
    </div>
  );
}
```

**Success Metrics**:
- Time on page: 2:30+ minutes (up from ~1:15)
- WhatsApp clicks per listing view: 8%+ (up from ~2%)
- Bounce rate: <35% (down from ~50%)

---

## 📅 WEEK 2-3 (Parallel Track)
### Theme: "Verification Becomes Infrastructure"

### 🎯 Phase 2: Verification System Backend + UI

**Goal**: Make verification structural (not decorative)

---

#### Week 2 - Days 4-5: Database Schema & API

**1. Firestore Collections**

**Collection: `agentVerifications`**
```typescript
interface AgentVerification {
  id: string;
  agentId: string; // ref to users collection
  status: 'pending' | 'approved' | 'rejected' | 'incomplete';
  tier: 'verified' | 'pro' | 'elite' | null;
  
  // Submission data
  submittedAt: Timestamp;
  submittedBy: string; // agentId
  
  // Documents
  documents: {
    nationalId: {
      url: string;
      uploadedAt: Timestamp;
      verified: boolean;
    };
    professionalLicense: {
      url: string | null;
      licenseNumber: string | null;
      uploadedAt: Timestamp | null;
      verified: boolean;
    };
    proofOfAddress: {
      url: string | null;
      uploadedAt: Timestamp | null;
      verified: boolean;
    };
  };
  
  // Phone verification
  phoneVerification: {
    phone: string;
    verified: boolean;
    verifiedAt: Timestamp | null;
    smsCode: string | null; // Store hashed in production
    expiresAt: Timestamp | null;
  };
  
  // Review data
  reviewedAt: Timestamp | null;
  reviewedBy: string | null; // admin userId
  reviewNotes: string | null;
  
  // Performance metrics (for Elite tier)
  performanceMetrics: {
    avgResponseTime: number | null; // minutes
    listingsPublished: number;
    successfulTransactions: number;
    clientRating: number | null; // 0-5
    accountAge: number; // days
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Collection: `propertyVerifications`**
```typescript
interface PropertyVerification {
  id: string;
  propertyId: string; // ref to listings collection
  status: 'unverified' | 'pending' | 'verified' | 'flagged';
  
  // Auto-checks
  autoChecks: {
    hasPriceData: boolean;
    hasLocation: boolean;
    hasImages: boolean;
    priceReasonable: boolean; // within 2 std dev of zone average
    imagesNotStock: boolean | null; // future: image analysis
  };
  
  // Manual verification
  manualReview: {
    reviewed: boolean;
    reviewedAt: Timestamp | null;
    reviewedBy: string | null;
    notes: string | null;
  };
  
  // Documents (optional)
  documents: {
    titleDeed: string | null;
    ownershipProof: string | null;
  };
  
  // Trust score (0-100)
  trustScore: number;
  
  // Flags
  flags: Array<{
    type: 'price_outlier' | 'duplicate_images' | 'suspicious_text' | 'reported';
    flaggedAt: Timestamp;
    flaggedBy: string;
    reason: string;
    resolved: boolean;
  }>;
  
  // Metadata
  verifiedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Collection: `verificationStats`** (for public trust page)
```typescript
interface VerificationStats {
  id: 'global'; // singleton document
  
  agents: {
    total: number;
    verified: number;
    pro: number;
    elite: number;
    pending: number;
  };
  
  properties: {
    total: number;
    verified: number;
    pending: number;
    flagged: number;
  };
  
  verificationRate: number; // percentage
  avgReviewTime: number; // hours
  
  lastUpdated: Timestamp;
}
```

---

**2. API Endpoints**

Create these files:

**`app/api/verification/agent/submit/route.ts`**
- POST: Submit agent verification application
- Upload documents to Firebase Storage
- Create `agentVerifications` document
- Send confirmation email
- Return submission ID

**`app/api/verification/agent/status/route.ts`**
- GET: Check verification status for logged-in agent
- Return current tier, pending requirements, estimated approval time

**`app/api/verification/agent/verify-phone/route.ts`**
- POST: Send SMS verification code
- Store hashed code with expiration
- Return success/error

**`app/api/verification/agent/confirm-phone/route.ts`**
- POST: Verify SMS code
- Update phone verification status
- Trigger tier re-evaluation

**`app/api/admin/verifications/pending/route.ts`**
- GET: List all pending verifications
- Admin-only (check role)
- Return paginated results with filters

**`app/api/admin/verifications/approve/route.ts`**
- POST: Approve agent verification
- Update user role + tier
- Send approval email with badge
- Log admin action

**`app/api/admin/verifications/reject/route.ts`**
- POST: Reject agent verification
- Send rejection email with reason
- Log admin action

**Success Metrics**:
- Agent verification submissions: 10+ per week
- Approval time: <48 hours average
- Rejection rate: <20%

---

#### Week 2-3 - Days 6-8: Verification UI

**1. Agent Verification Application Page**

**File**: `app/dashboard/get-verified/page.tsx`

**Features**:
- Multi-step form (4 steps)
- Document upload with preview
- Phone verification via SMS
- Real-time validation
- Progress indicator
- Badge preview (what they'll earn)

**Steps**:
1. **Basic Info** (name, phone, city)
2. **Documents** (national ID, license upload)
3. **Phone Verification** (SMS code)
4. **Review & Submit**

**Design**:
- Clean wizard UI
- Green checkmarks for completed steps
- Upload zones with drag-drop
- Mobile-friendly file selection
- Estimated approval time display

**Technical**:
- Use Firebase Storage for document uploads
- Validate file types (PDF, JPG, PNG only)
- Max file size: 5MB per document
- Show upload progress bars
- Disable submit until all required fields complete

---

**2. Admin Verification Dashboard**

**File**: `app/master/verifications/page.tsx`

**Features**:
- Pending applications list
- Document viewer (inline PDF/image display)
- Quick approve/reject buttons
- Filter by status, date, tier
- Search by agent name/email
- Bulk actions

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Filters: [All] [Pending] [Approved]        │
│ Search: [___________]                       │
├─────────────────────────────────────────────┤
│                                             │
│ Pending Verifications (23)                 │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ Juan Pérez                              ││
│ │ juan@example.com | 809-555-1234        ││
│ │ Submitted: 2 days ago                   ││
│ │                                         ││
│ │ [View Docs] [Approve] [Reject]         ││
│ └─────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

**Document Viewer Modal**:
- Side-by-side view (document + form)
- Zoom, rotate controls for images
- Notes field for reviewer
- Approve/reject with reason dropdown

**Technical**:
- Real-time updates with Firestore listeners
- Keyboard shortcuts (A = approve, R = reject, N = next)
- Audit logging (who approved what, when)
- Email notifications on approval/rejection

---

**3. Verification Badge System**

**Update Existing Components**:

**`components/PropertyCard.tsx`** (enhance existing verification badge)
- Show tier-specific colors:
  - 🟢 Verified = green
  - 🔵 Pro = blue
  - 🟣 Elite = purple gradient
- Add tooltip with verification details

**`components/AgentCard.tsx`** (add verification badge)
- Badge display near agent name
- "Verificado desde [date]" subtext
- Link to agent verification details

**`app/listing/[id]/page.tsx`** (add verification section)
- "Estado de Verificación" card
- Show property verification status
- Show agent verification tier
- Link to /confianza trust page
- Verification date display

**New Component**: `components/VerificationBadge.tsx`
```typescript
interface VerificationBadgeProps {
  tier: 'verified' | 'pro' | 'elite' | null;
  entityType: 'agent' | 'property';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  verifiedAt?: Date;
}
```

**Design**:
- Tier-specific colors + icons
- Animated shine effect on hover
- Tooltip with verification details
- Responsive sizing

---

## 📅 WEEK 3 (Mar 3 - Mar 10)
### Theme: "Social Proof Drives Urgency"

### 🎯 Phase 3: Social Proof Mechanics

---

#### Day 9-10: Activity Tracking Infrastructure

**1. Analytics Events Collection**

**New Firestore Collection**: `analyticsEvents`
```typescript
interface AnalyticsEvent {
  id: string;
  type: 'page_view' | 'whatsapp_click' | 'favorite' | 'contact' | 'share';
  entityType: 'listing' | 'agent' | 'page';
  entityId: string;
  
  userId: string | null; // null for anonymous
  sessionId: string;
  
  metadata: {
    source?: string; // 'search', 'home', 'direct'
    device?: 'mobile' | 'desktop' | 'tablet';
    city?: string;
    propertyType?: string;
  };
  
  timestamp: Timestamp;
}
```

**API Endpoint**: `app/api/analytics/track/route.ts`
- POST: Log analytics event
- Validate event type
- Store with session ID
- Return success

**Client-side Hook**: `hooks/useAnalytics.ts`
```typescript
export function useAnalytics() {
  const trackEvent = async (type: string, entityId: string, metadata?: any) => {
    await fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ type, entityId, metadata })
    });
  };
  
  return { trackEvent };
}
```

**Integration Points**:
- Listing page load → track view
- WhatsApp button click → track contact
- Favorite button → track save
- Share button → track share
- Calculator interaction → track engagement

---

**2. Aggregated Stats Collection**

**New Collection**: `listingStats`
```typescript
interface ListingStats {
  id: string; // listingId
  
  views: {
    total: number;
    last24h: number;
    last7days: number;
    last30days: number;
  };
  
  contacts: {
    total: number;
    last24h: number;
    whatsappClicks: number;
    phoneClicks: number;
    emailClicks: number;
  };
  
  engagement: {
    favorites: number;
    shares: number;
    calculatorUses: number;
    avgTimeOnPage: number; // seconds
  };
  
  lastUpdated: Timestamp;
}
```

**Cloud Function**: `functions/src/aggregateListingStats.ts`
- Runs every 6 hours (cron: `0 */6 * * *`)
- Aggregates `analyticsEvents` into `listingStats`
- Updates view counts, contact counts
- Calculates trends (trending up/down)

---

#### Day 11: Social Proof Display Components

**1. ActivityIndicator.tsx**

**Location**: `components/ActivityIndicator.tsx`

**Features**:
- Show recent activity on listing
- Display view count (last 7 days)
- Show contact count (last 24h)
- "Trending" badge if views increasing
- Update timestamp

**Display Logic**:
```typescript
// Show views if > 5 in last 7 days
if (stats.views.last7days > 5) {
  return `${stats.views.last7days} personas han visto esta propiedad esta semana`;
}

// Show contacts if > 0 in last 24h
if (stats.contacts.last24h > 0) {
  return `${stats.contacts.last24h} consultas en las últimas 24 horas`;
}

// Show last updated
return `Actualizado hace ${timeSince(property.updatedAt)}`;
```

**Design**:
- Small badge below property title
- Eye icon for views, message icon for contacts
- Gray text, subtle background
- Pulse animation if "hot" (many recent views)

**Placement**:
- Listing page (below title)
- Property cards (bottom-left corner)

---

**2. PlatformActivityBanner.tsx**

**Location**: `components/PlatformActivityBanner.tsx`

**Features**:
- Homepage banner showing platform activity
- Animate number changes
- Link to /search to browse new listings

**Content**:
```
🔥 +23 nuevas propiedades esta semana
✅ 12 agentes verificados este mes
👀 1,250+ visitas en las últimas 24 horas
```

**Design**:
- Horizontal banner (full width)
- Light gradient background (blue → teal)
- Icons + numbers + text inline
- Subtle slide-in animation on page load
- Dismiss button (save preference to localStorage)

**Update Frequency**:
- Fetch stats from `/api/stats/platform-activity`
- Refresh every 30 seconds
- Show skeleton loader during fetch

---

**3. AgentResponseTimeBadge.tsx**

**Location**: `components/AgentResponseTimeBadge.tsx`

**Features**:
- Display agent average response time
- Badge color based on speed:
  - Green: <2 hours
  - Yellow: 2-6 hours
  - Red: >6 hours
- Show on agent cards and listing pages

**Calculation** (backend):
```typescript
// In agentVerifications.performanceMetrics.avgResponseTime
// Calculate from message response times

avgResponseTime = average(
  time between first customer message and agent reply
  for last 30 days
)
```

**Display**:
```
🟢 Responde en menos de 2 horas
```

**Design**:
- Small badge (inline with agent name)
- Color-coded dot indicator
- Tooltip with exact avg time

---

#### Day 12: Social Proof Integration

**Update Listing Page**:
1. Add `<ActivityIndicator>` below property title
2. Add agent response badge to agent card
3. Update "Similar Properties" to show trending badges

**Update Homepage**:
1. Add `<PlatformActivityBanner>` below hero
2. Show "Trending" badge on hot property cards

**Update Property Cards**:
1. Add activity indicator (bottom-left)
2. Add "Trending ↗" badge if views increasing

---

## 📅 PARALLEL TRACK (All 3 Weeks)
### Theme: "Data Moat Building"

### 🎯 Phase 4: Analytics & Intelligence Layer

**Ongoing Tasks**:

1. **Track Everything** (Week 2 start)
   - Page views per listing
   - WhatsApp clicks per listing
   - Calculator usage per listing
   - Time on page
   - Search queries
   - Favorite/save actions
   - Share actions

2. **Store Smartly** (Week 2-3)
   - Use Firestore for queryable data
   - Aggregate hourly → daily → weekly
   - Index properly for performance
   - Archive old events (>90 days)

3. **Visualize Internally** (Week 3)
   - Admin dashboard charts
   - Trending listings report
   - Popular zones heatmap
   - Agent performance rankings
   - Conversion funnel metrics

4. **Prepare for Public Use** (Month 3+)
   - City market reports (avg price, inventory, trends)
   - ROI calculator by zone
   - Investment opportunity finder
   - Market intelligence blog content

---

## 🎯 Success Metrics (Week 2-3 Combined)

### User Behavior Changes

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Avg time on listing page | 1:15 | 2:30+ | Analytics |
| WhatsApp CTR | 2% | 8%+ | Click tracking |
| Bounce rate (listing) | 50% | <35% | Analytics |
| Calculator usage | 0% | 40%+ | Event tracking |
| Agent applications | ~2/week | 10+/week | Database count |
| Verified listings % | 15% | 40%+ | Database query |

### Perception Changes

**Qualitative Indicators**:
- User messages mention "investment analysis"
- Agents request verification proactively
- Competitors notice and react
- Press mentions "verified marketplace"

**Platform Authority Signals**:
- Verification badge becomes status symbol for agents
- Users filter search by "verified only"
- WhatsApp messages reference calculator numbers
- Social proof (view counts) drives urgency

---

## ⚠️ What We Deliberately IGNORE (Next 3 Weeks)

- ❌ Stripe subscription flows (Month 4)
- ❌ Heavy CRM features
- ❌ Complex admin dashboards beyond verification
- ❌ AI/ML features
- ❌ Mobile app development
- ❌ Advanced messaging features

**Why**: Every hour not spent on authority is wasted positioning time.

**Focus = Force Multiplier.**

---

## 🚧 Technical Constraints & Risk Mitigation

### Performance Risks

**Risk**: Investment calculations slow page load  
**Mitigation**: 
- Lazy load mortgage calculator (render on scroll)
- Memoize calculations with `useMemo`
- Debounce input changes (300ms)

**Risk**: Analytics events overwhelm Firestore quota  
**Mitigation**:
- Batch events client-side (send every 10 events or 30s)
- Aggregate to daily summaries quickly
- Archive old events
- Use Firestore quota monitoring

**Risk**: Document uploads fail (verification)  
**Mitigation**:
- Client-side file validation before upload
- Chunked uploads for large files
- Retry logic with exponential backoff
- Clear error messages to users

### Security Risks

**Risk**: Fake verification submissions  
**Mitigation**:
- Require phone verification (SMS)
- Manual admin review required
- CAPTCHA on submission form
- Rate limiting (1 submission per 24h per IP)

**Risk**: Analytics data manipulation  
**Mitigation**:
- Server-side validation of events
- Session ID tracking (prevent replay)
- Anomaly detection (flag unusual patterns)
- Admin audit logs

### UX Risks

**Risk**: Calculator too complex, users bounce  
**Mitigation**:
- Start with simple view, expandable advanced
- Pre-fill with smart defaults
- Clear labels, no jargon
- Mobile-first design

**Risk**: Verification process too burdensome  
**Mitigation**:
- Progressive disclosure (show 1 step at a time)
- Allow save & return later
- Clear value proposition (show badge upfront)
- Estimated approval time display

---

## 📋 Daily Task Breakdown

### Week 2 Sprint

**Day 1 (Mon Feb 24)**
- [ ] Create `InvestmentInsightPanel.tsx`
- [ ] Implement calculation logic
- [ ] Design responsive layout
- [ ] Add to listing page
- [ ] Test mobile/desktop

**Day 2 (Tue Feb 25)**
- [ ] Create `MortgageCalculator.tsx`
- [ ] Build slider inputs
- [ ] Real-time calculation updates
- [ ] Amortization table
- [ ] Mobile optimization

**Day 3 (Wed Feb 26)**
- [ ] Create `WhatsAppFloatingCTA.tsx`
- [ ] Implement mobile floating button
- [ ] Build desktop sticky sidebar
- [ ] Message pre-fill logic
- [ ] Integrate into listing page

**Day 4 (Thu Feb 27)**
- [ ] Design verification database schema
- [ ] Create Firestore collections
- [ ] Build API endpoints (submit, status)
- [ ] SMS verification integration
- [ ] Test API flows

**Day 5 (Fri Feb 28)**
- [ ] Build agent verification form UI
- [ ] Multi-step wizard
- [ ] Document upload component
- [ ] Phone verification flow
- [ ] Test submission

**Day 6 (Sat Feb 29 - optional)**
- [ ] Build admin verification dashboard
- [ ] Pending applications list
- [ ] Document viewer modal
- [ ] Approve/reject actions
- [ ] Testing

**Day 7 (Sun Mar 1 - optional)**
- [ ] Enhance verification badges
- [ ] Update PropertyCard component
- [ ] Update AgentCard component
- [ ] Add verification section to listing page
- [ ] Polish & test

---

### Week 3 Sprint

**Day 8 (Mon Mar 3)**
- [ ] Create analytics events collection
- [ ] Build tracking API endpoint
- [ ] Create `useAnalytics` hook
- [ ] Integrate tracking on key pages
- [ ] Test event logging

**Day 9 (Tue Mar 4)**
- [ ] Create listing stats collection
- [ ] Build aggregation Cloud Function
- [ ] Deploy function
- [ ] Test aggregation logic
- [ ] Monitor performance

**Day 10 (Wed Mar 5)**
- [ ] Create `ActivityIndicator.tsx`
- [ ] Build display logic
- [ ] Add to listing pages
- [ ] Add to property cards
- [ ] Test with real/mock data

**Day 11 (Thu Mar 6)**
- [ ] Create `PlatformActivityBanner.tsx`
- [ ] Build stats API endpoint
- [ ] Animate number changes
- [ ] Add to homepage
- [ ] Test auto-refresh

**Day 12 (Fri Mar 7)**
- [ ] Create `AgentResponseTimeBadge.tsx`
- [ ] Build calculation logic
- [ ] Add to agent cards
- [ ] Add to listing pages
- [ ] Polish all social proof components

**Day 13-14 (Weekend Mar 8-9 - optional)**
- [ ] Integration testing (all new features)
- [ ] Mobile optimization pass
- [ ] Performance testing
- [ ] Bug fixes
- [ ] Documentation updates

---

## 🎉 Week 3 End State

**What Viventa Will Be**:

✅ **Investment-Grade Platform**
- Listing pages show ROI, mortgage estimates, rental potential
- Interactive calculator keeps users engaged
- Investment insights differentiate from competitors

✅ **Verified Marketplace**
- Agent verification system operational
- Property verification workflow active
- Badges displayed prominently everywhere
- Trust infrastructure = competitive moat

✅ **Social Proof Machine**
- Activity indicators create urgency
- Platform stats show momentum
- Agent response times build trust
- Perceived demand drives conversion

✅ **Data Intelligence**
- Tracking every key user action
- Aggregating into insights
- Building foundation for market reports
- Creating data moat

**Market Position**: 
> "The verified investment marketplace of DR with professional infrastructure"

**That's rare. That's valuable. That's monetizable.**

---

## 🚀 Month 4 Preview (Monetization Activation)

Once authority is established (Week 12 complete), activate:

1. **Stripe Subscription Tiers**
   - Free: 3 listings, basic features
   - Pro ($29/mo): 25 listings, verification priority, analytics
   - Elite ($79/mo): Unlimited, featured placement, API access

2. **Featured Listings Marketplace**
   - $15-50 per listing per week
   - Homepage placement
   - Search result boost
   - Social media promotion

3. **Brokerage Plans**
   - $199/mo for teams (5+ agents)
   - Admin dashboard
   - Lead distribution
   - Branded sub-domain

**Revenue Projection** (Conservative):
- Month 4: $1,000 MRR (20 Pro, 5 Elite, 10 featured listings)
- Month 6: $5,000 MRR (growth + brokerage plans)
- Year 1 End: $18,000 MRR (scale + enterprise)

**But only after authority is proven.**

---

## 📖 Related Documentation

- [90-DAY-AUTHORITY-PLAN.md](./90-DAY-AUTHORITY-PLAN.md) - Complete strategic roadmap
- [LISTING-INVESTMENT-MODULE.md](./LISTING-INVESTMENT-MODULE.md) - Investment tooling specs
- [VERIFICATION-SYSTEM-SCHEMA.md](./VERIFICATION-SYSTEM-SCHEMA.md) - Verification architecture
- [SOCIAL-PROOF-MECHANICS.md](./SOCIAL-PROOF-MECHANICS.md) - Social proof implementation
- [HOMEPAGE-AUTHORITY-BLUEPRINT.md](./HOMEPAGE-AUTHORITY-BLUEPRINT.md) - Homepage design
- [MONETIZATION-STRUCTURE.md](./MONETIZATION-STRUCTURE.md) - Revenue model

---

**This is not feature-building. This is market positioning.**

Execute with precision. Ship with confidence. Dominate with authority.
