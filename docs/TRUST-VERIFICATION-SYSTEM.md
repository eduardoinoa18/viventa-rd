# Trust & Verification System Architecture
**VIVENTA — Technical Design for Competitive Moat**

---

## Strategic Purpose

The verification system is VIVENTA's **primary competitive advantage**:

- **Differentiator:** No other DR platform has visible verification
- **Moat:** Requires manual work (can't be instantly copied)
- **Trust Signal:** Immediately visible to users
- **Premium Pricing Justification:** Verified agents can charge more

**Core Principle:**  
Verification must be **visible, credible, and difficult to fake**.

---

## Verification Architecture Overview

### Three Verification Layers

**1. Agent Verification**
- Who: Real estate agents and brokers
- What: Identity, license, phone, email
- Badge: ✓ "Agente Verificado"

**2. Property Verification**
- What: Ownership docs, photo authenticity, pricing accuracy
- Badge: ✓ "Propiedad Verificada"

**3. Performance Verification (Tier 2)**
- What: Response time, client reviews, transaction history
- Badge: ⭐ "Agente Elite"

---

## 1. Agent Verification System

### Data Model Extension

**Add to `users` collection:**

```typescript
interface User {
  // Existing fields...
  
  // Verification fields
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationLevel: 'none' | 'basic' | 'elite'; // tier system
  verificationSubmittedAt?: Date;
  verificationCompletedAt?: Date;
  verificationRejectedReason?: string;
  
  // Documents
  verificationDocs: {
    idCard?: string; // Firebase Storage URL
    realEstateLicense?: string; // Firebase Storage URL
    businessLicense?: string; // Firebase Storage URL (for brokers)
    proofOfAddress?: string; // Firebase Storage URL
  };
  
  // Verified data
  verifiedPhone?: string; // confirmed via SMS
  verifiedEmail?: string; // confirmed via email click
  verifiedLicenseNumber?: string; // manual admin verification
  
  // Performance metrics (for Elite tier)
  performanceMetrics?: {
    responseTimeAvg: number; // in hours
    responseRate: number; // 0-100%
    reviewCount: number;
    reviewRating: number; // 0-5
    activeListings: number;
    successfulTransactions: number;
  };
}
```

### Verification Flow (Agent Perspective)

**Step 1: Agent initiates verification**
- Route: `/dashboard/get-verified`
- UI: Upload form with file inputs
- Required fields:
  - Government-issued ID (front + back)
  - Real estate license (if applicable)
  - Phone number (for SMS verification)
  - Business license (brokers only)

**Step 2: Document upload**
- Firebase Storage path: `/verification/{userId}/id-card.jpg`
- Max file size: 5MB per document
- Allowed formats: JPG, PNG, PDF
- Client-side validation before upload

**Step 3: SMS verification**
- Integration: Twilio or Firebase Phone Auth
- Flow:
  1. Agent enters phone number
  2. System sends 6-digit code
  3. Agent enters code
  4. Phone marked as `verifiedPhone`

**Step 4: Submission**
- Status changes: `unverified` → `pending`
- Email sent to admin: "New verification request from [name]"
- Email sent to agent: "Your verification is being reviewed"

### Verification Flow (Admin Perspective)

**Admin Dashboard: /master/verifications**

**UI Layout:**

```
┌────────────────────────────────────────────────┐
│ Pending Verifications (12)                     │
├────────────────────────────────────────────────┤
│                                                 │
│ [Photo]  Eduardo Inoa                          │
│          eduardo@example.com                   │
│          Agent • Submitted 2 hours ago          │
│                                                 │
│          📄 View ID Card                       │
│          📄 View License                       │
│          📞 Phone: +1-809-555-1234 ✓ Verified  │
│          ✉️ Email: Verified                    │
│                                                 │
│          License #: [___________] (manual input)│
│                                                 │
│          [✓ Approve] [✗ Reject]                │
│                                                 │
├────────────────────────────────────────────────┤
│ ... (more pending verifications)               │
└────────────────────────────────────────────────┘
```

**Admin Actions:**

**Approve:**
1. Click "Approve" button
2. Modal: "Enter license number" (manual check)
3. System updates:
   - `verificationStatus` → `'verified'`
   - `verificationLevel` → `'basic'`
   - `verificationCompletedAt` → `now()`
   - `verifiedLicenseNumber` → `[input]`
4. Email sent to agent: "Congratulations! You're verified"
5. Badge automatically appears on agent profile

**Reject:**
1. Click "Reject" button
2. Modal: "Reason for rejection" (textarea)
3. System updates:
   - `verificationStatus` → `'rejected'`
   - `verificationRejectedReason` → `[reason]`
4. Email sent to agent: "Verification rejected: [reason]"
5. Agent can resubmit with corrected documents

### Verification Badge Display

**Agent Profile Page (`/agents/[id]`):**

```typescript
function AgentVerificationBadge({ agent }: { agent: User }) {
  if (agent.verificationLevel === 'elite') {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full">
        <span className="text-xl">⭐</span>
        <span className="font-semibold">Agente Elite</span>
      </div>
    );
  }
  
  if (agent.verificationStatus === 'verified') {
    return (
      <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full">
        <span className="text-xl">✓</span>
        <span className="font-semibold">Agente Verificado</span>
      </div>
    );
  }
  
  return null; // No badge for unverified
}
```

**Property Listing Card:**
- Small badge in top-left corner of agent section
- Text: "✓ Verificado"
- Color: Green background

**Search Results:**
- Filter option: "Solo agentes verificados" (checkbox)
- Query: `where('verificationStatus', '==', 'verified')`

---

## 2. Property Verification System

### Data Model Extension

**Add to `listings` collection:**

```typescript
interface Listing {
  // Existing fields...
  
  // Verification fields
  propertyVerificationStatus: 'unverified' | 'pending' | 'verified' | 'flagged';
  propertyVerificationDate?: Date;
  propertyVerificationNotes?: string; // admin notes
  
  // Verification checklist (admin-facing)
  verificationChecklist?: {
    ownershipDocsReviewed: boolean;
    photosAuthentic: boolean;
    pricingReasonable: boolean;
    locationConfirmed: boolean;
    agentContactVerified: boolean;
  };
  
  // Flags (for suspicious listings)
  flags?: {
    reason: string; // "Duplicate listing", "Fake photos", "Price too good to be true"
    flaggedBy: string; // admin UID
    flaggedAt: Date;
  }[];
}
```

### Property Verification Logic

**Automatic Checks (on listing creation):**

1. **Agent Verification Inheritance**
   - If agent is `verified` → listing starts as `pending` (needs admin review)
   - If agent is `unverified` → listing starts as `unverified` (low priority review)

2. **Price Reasonableness Check**
   - Query avg price for similar properties (same city, property type, +/- 20% area)
   - If new listing price < 50% of avg → auto-flag for review
   - If new listing price > 300% of avg → auto-flag for review

3. **Duplicate Detection (Phase 2)**
   - Check for similar title + same location + same price
   - Alert admin if potential duplicate found

**Manual Admin Review:**

**Route:** `/master/properties` (already exists)

**New Column:** "Verification Status"
- Values: Unverified, Pending, Verified, Flagged
- Filter dropdown to show only pending verifications

**Review Modal (on property click):**

```
┌──────────────────────────────────────────────┐
│ Property Verification Review                 │
├──────────────────────────────────────────────┤
│                                               │
│ Title: Apartamento en Piantini               │
│ Price: $250,000 USD                          │
│ Agent: Eduardo Inoa (✓ Verified)             │
│                                               │
│ Checklist:                                   │
│ [ ] Ownership docs reviewed (if available)   │
│ [ ] Photos appear authentic (no stock imgs)  │
│ [ ] Pricing is reasonable for area           │
│ [ ] Location coordinates match description   │
│ [ ] Agent contact info verified              │
│                                               │
│ Notes (optional):                            │
│ [_____________________________________]       │
│                                               │
│ [✓ Verify Property] [🚩 Flag] [✗ Reject]    │
└──────────────────────────────────────────────┘
```

**Admin Actions:**

**Verify:**
- Updates `propertyVerificationStatus` → `'verified'`
- Saves checklist items
- Badge appears on listing detail page

**Flag:**
- Updates `propertyVerificationStatus` → `'flagged'`
- Adds flag with reason
- Email to agent: "Your listing has been flagged: [reason]. Please update."

**Reject:**
- Changes listing `status` → `'rejected'`
- Email to agent with reason
- Listing hidden from search

### Property Verification Badge Display

**Listing Detail Page (`/listing/[id]`):**

```typescript
function PropertyVerificationBadge({ listing }: { listing: Listing }) {
  if (listing.propertyVerificationStatus === 'verified') {
    return (
      <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
        <span>✓</span>
        <span>Propiedad Verificada</span>
      </div>
    );
  }
  return null;
}
```

**Search Results / Property Cards:**
- Small badge overlay on image: "✓ Verificada"
- Green background, white text
- Position: Top-left corner of property image

---

## 3. Elite Agent Tier (Performance-Based)

### Criteria for Elite Status

**Automatic promotion to Elite when:**
- Verified for 90+ days
- Response time < 4 hours average
- 10+ successful transactions OR 20+ active listings
- 4.5+ star rating (minimum 5 reviews)
- Zero flags or violations

### Performance Tracking

**New Collection:** `agent_performance`

```typescript
interface AgentPerformance {
  agentId: string;
  period: string; // "2026-02" (year-month)
  
  responseMetrics: {
    avgResponseTime: number; // in hours
    totalInquiries: number;
    respondedInquiries: number;
    responseRate: number; // percentage
  };
  
  engagementMetrics: {
    profileViews: number;
    listingViews: number;
    whatsappClicks: number;
    emailClicks: number;
  };
  
  listingMetrics: {
    activeListings: number;
    soldListings: number;
    rentedListings: number;
    draftListings: number;
  };
  
  reviewMetrics: {
    totalReviews: number;
    avgRating: number; // 0-5
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStar: number;
  };
  
  updatedAt: Date;
}
```

**Calculation Logic:**

Run nightly Cloud Function:
1. Query all leads/inquiries for each agent in past 30 days
2. Calculate avg time between inquiry creation and first agent message
3. Update `users.performanceMetrics`
4. Check Elite criteria
5. Auto-promote if qualified

**Elite Agent Benefits:**
- ⭐ Elite badge (gold/orange gradient)
- Priority in search results (boosted ranking)
- Featured on "Top Agents" homepage section
- Access to advanced analytics dashboard
- Priority customer support
- Higher visibility in agent directory

---

## 4. Review & Rating System

### Data Model

**New Collection:** `reviews`

```typescript
interface Review {
  id: string;
  
  // Relationships
  agentId: string;
  userId: string; // reviewer (must be authenticated)
  listingId?: string; // optional: which property sparked this review
  
  // Review content
  rating: 1 | 2 | 3 | 4 | 5; // star rating
  title: string; // e.g., "Excellent service!"
  comment: string; // full review text
  
  // Verification
  verified: boolean; // true if admin approved, false if pending
  purchaseVerified?: boolean; // true if actual transaction occurred
  
  // Responses
  agentResponse?: {
    text: string;
    respondedAt: Date;
  };
  
  // Moderation
  flagged: boolean;
  flagReason?: string;
  
  // Metadata
  helpful: number; // upvote count
  createdAt: Date;
  updatedAt: Date;
}
```

### Review Submission Flow

**Trigger:** After user sends inquiry via property detail page

**Post-Inquiry Email (7 days later):**
> "How was your experience with [Agent Name]?  
> [Leave a Review]"

**Review Form (`/agents/[id]/review`):**

Fields:
- Star rating (1-5, required)
- Title (max 50 chars, required)
- Comment (max 500 chars, required)
- "Did you complete a transaction?" (optional checkbox)

**Submission:**
- Creates review with `verified: false` (pending admin approval)
- Email to admin: "New review pending approval"
- Email to agent: "You received a new review (pending approval)"

### Review Moderation (Admin)

**Route:** `/master/reviews`

**Actions:**
- **Approve:** Sets `verified: true`, review visible publicly
- **Reject:** Deletes review or marks as flagged
- **Flag:** Marks as inappropriate (not displayed)

### Review Display

**Agent Profile Page:**

```
┌──────────────────────────────────────────┐
│ Reviews (23)                             │
│ ⭐⭐⭐⭐⭐ 4.7 average                     │
├──────────────────────────────────────────┤
│                                           │
│ ⭐⭐⭐⭐⭐ "Excellent service!"            │
│ Maria Rodriguez • 2 days ago             │
│ "Eduardo fue muy profesional y nos       │
│  ayudó a encontrar nuestra casa ideal."  │
│                                           │
│ [👍 Helpful (5)]                         │
│                                           │
│ Agent Response:                          │
│ "¡Gracias Maria! Fue un placer..."      │
│                                           │
├──────────────────────────────────────────┤
│ ... (more reviews)                       │
└──────────────────────────────────────────┘
```

---

## 5. Trust Signals Site-Wide

### Homepage Stats Widget

```typescript
async function getTrustStats() {
  const verifiedAgents = await db.collection('users')
    .where('verificationStatus', '==', 'verified')
    .count()
    .get();
  
  const verifiedProperties = await db.collection('listings')
    .where('propertyVerificationStatus', '==', 'verified')
    .count()
    .get();
  
  const totalListings = await db.collection('listings')
    .where('status', '==', 'active')
    .count()
    .get();
  
  return {
    verifiedAgents: verifiedAgents.data().count,
    verifiedProperties: verifiedProperties.data().count,
    verificationRate: Math.round((verifiedProperties.data().count / totalListings.data().count) * 100),
  };
}
```

Display:
> "200+ agentes verificados"  
> "500+ propiedades verificadas"  
> "95% de propiedades verificadas"

### Trust Page (`/confianza`)

**Content:**

**Section 1: Our Verification Process**
- Explain agent verification steps
- Explain property verification criteria
- Show example badges

**Section 2: Why Verification Matters**
- Protects buyers from scams
- Ensures agent professionalism
- Confirms property authenticity

**Section 3: How to Identify Verified Listings**
- Screenshots of verified badges
- Explanation of Elite tier

**Section 4: Report Issues**
- Link to report form
- Promise of 24-hour response

---

## 6. API Endpoints

### Agent Verification

**POST /api/verification/agent/submit**
- Upload documents
- Update user verification status to `pending`

**POST /api/admin/verification/agent/approve**
- Admin-only
- Approve agent verification
- Send email notification

**POST /api/admin/verification/agent/reject**
- Admin-only
- Reject with reason
- Allow resubmission

### Property Verification

**POST /api/admin/verification/property/verify**
- Admin-only
- Mark property as verified
- Update checklist

**POST /api/admin/verification/property/flag**
- Admin-only
- Flag suspicious listing
- Notify agent

### Reviews

**POST /api/reviews/submit**
- User-submitted review
- Requires authentication
- Creates pending review

**GET /api/reviews/[agentId]**
- Fetch all approved reviews for agent
- Calculate average rating

**POST /api/admin/reviews/moderate**
- Approve or reject review

---

## 7. Security & Anti-Fraud

### Preventing Fake Verifications

1. **Document Validation:**
   - Admin manually reviews all uploads
   - Check ID against public records (if available)
   - Cross-reference license numbers with local real estate board

2. **Phone Verification:**
   - SMS code required (prevents bulk fake accounts)
   - One phone number per account

3. **Email Verification:**
   - Confirm email before submission

4. **Rate Limiting:**
   - Max 3 verification attempts per account
   - Cooldown period of 7 days between rejections

### Preventing Fake Reviews

1. **Verified Purchases Only (Phase 2):**
   - Link reviews to actual inquiries/transactions
   - Only users who contacted agent can review

2. **Admin Moderation:**
   - All reviews pending until approved
   - Check for spam patterns (generic text, repeated phrases)

3. **IP & Device Tracking:**
   - Track reviewer IP/device
   - Flag multiple reviews from same IP

4. **Agent Self-Reviews Blocked:**
   - Cannot review own profile
   - Check userId !== agentId

---

## 8. Rollout Schedule

### Phase 1 (Week 5-6): Agent Verification
- [ ] Build upload form UI
- [ ] Admin verification dashboard
- [ ] Email notifications
- [ ] Badge components

### Phase 2 (Week 7): Property Verification
- [ ] Property verification logic
- [ ] Admin review workflow
- [ ] Auto-flag algorithms

### Phase 3 (Week 8): Performance Tracking
- [ ] Performance metrics collection
- [ ] Elite tier auto-promotion logic
- [ ] Agent dashboard with stats

### Phase 4 (Week 9): Review System
- [ ] Review submission form
- [ ] Review moderation dashboard
- [ ] Public review display

---

## 9. Success Metrics

**Month 2 Targets:**
- 20+ agents verified
- 100+ properties verified
- 50%+ of active listings verified
- 10+ reviews submitted

**Month 3 Targets:**
- 50+ agents verified
- 300+ properties verified
- 75%+ of active listings verified
- 3+ Elite agents
- 30+ reviews submitted

**Month 6 Targets:**
- 200+ agents verified
- 1000+ properties verified
- 90%+ verification rate
- 20+ Elite agents
- 100+ reviews

---

## 10. Competitive Moat Analysis

**Why This Is Hard to Copy:**

1. **Manual Labor:** Competitors can't automate verification
2. **Trust Equity:** Takes time to build credibility
3. **Network Effects:** More verified agents → more buyers → more agents want in
4. **Data Moat:** Performance metrics require historical data
5. **Process Knowledge:** Understanding DR real estate verification is specialized

**Defensibility Score:** 8/10

This verification system becomes VIVENTA's unfair advantage in DR.

---

**Next: Build it systematically over Month 2 (Weeks 5-8).** 🛡️
