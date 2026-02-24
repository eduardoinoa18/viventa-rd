# VIVENTA SYSTEM ARCHITECTURE ANALYSIS

**Focus:** How data flows between roles, where gaps exist, security/scalability insights.

---

## 📊 CURRENT ARCHITECTURE OVERVIEW

### Tech Stack
- **Frontend:** Next.js 14 (React 18) + Tailwind CSS + Leaflet Maps
- **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions)
- **Payments:** Stripe
- **Hosting:** Vercel (serverless Next.js), Firebase (serverless functions)
- **Search:** Custom Firestore queries (no Algolia)
- **CDN:** Vercel edge network + Firebase CDN
- **Notifications:** FCM (Firebase Cloud Messaging)
- **Email:** SendGrid + Nodemailer

### Why This Stack Works
✅ **Fast to market:** Firebase + Next.js = deploy in minutes  
✅ **Scalable:** Firestore auto-scales, no DB management  
✅ **Cost-effective:** Pay per use (cheap at small scale)  
✅ **Real-time:** Firestore listeners for live updates  
✅ **Multi-platform:** One API serves web + mobile (future)  

### Limitations
⚠️ **Firestore costs:** Unoptimized queries expensive at scale  
⚠️ **Cold starts:** Cloud Functions have latency (300ms+)  
⚠️ **Limited full-text search:** Custom solution works but not production-grade  
⚠️ **Regional:** Firebase US region adds latency for Caribbean users  
⚠️ **Locking:** No pessimistic locking (concurrent edits risky)  

---

## 🗄️ FIRESTORE STRUCTURE (Collections & Flow)

### Core Collections

```
firestore/
├── users/
│   ├── {uid}/
│   │   ├── uid: string
│   │   ├── email: string
│   │   ├── name: string
│   │   ├── phone: string
│   │   ├── role: 'user'|'agent'|'broker'|'admin'|'master_admin'
│   │   ├── status: 'active'|'pending'|'suspended'
│   │   ├── profileComplete: boolean
│   │   ├── brokerage: string (if agent/broker)
│   │   ├── brokerage_id: string (if agent)
│   │   ├── licenseNumber: string (if agent/broker)
│   │   ├── yearsExperience: number (if agent)
│   │   ├── specialties: string[] (if agent)
│   │   ├── verified: boolean (if agent/broker)
│   │   ├── createdAt: Timestamp
│   │   ├── updatedAt: Timestamp
│   │   └── /saved_searches/
│   │       └── {searchId}
│   │           ├── query: string
│   │           ├── filters: { city, type, minPrice, maxPrice, ... }
│   │           └── createdAt: Timestamp
│
├── properties/
│   ├── {propertyId}/
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── price: number
│   │   ├── currency: 'USD'|'DOP'
│   │   ├── location: string
│   │   ├── city: string
│   │   ├── neighborhood: string
│   │   ├── lat: number
│   │   ├── lng: number
│   │   ├── bedrooms: number
│   │   ├── bathrooms: number
│   │   ├── area: number
│   │   ├── propertyType: 'apartment'|'house'|'condo'|'land'|'commercial'|'project'
│   │   ├── listingType: 'sale'|'rent'
│   │   ├── images: string[]
│   │   ├── agentId: string
│   │   ├── agentName: string
│   │   ├── brokerageId?: string (if under broker)
│   │   ├── featured: boolean
│   │   ├── status: 'active'|'pending'|'flagged'|'sold'|'draft'
│   │   ├── flagReason?: string (why flagged)
│   │   ├── createdAt: Timestamp
│   │   ├── updatedAt: Timestamp
│   │   ├── approvedAt?: Timestamp
│   │   └── /views/
│   │       └── {viewId} (for analytics)
│   │
├── property_inquiries/
│   ├── {inquiryId}/
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── message: string
│   │   ├── propertyId: string
│   │   ├── propertyTitle: string
│   │   ├── agentId: string
│   │   ├── brokerageId?: string (if under broker)
│   │   ├── intentLevel: 'serious'|'curious'|'just_looking'
│   │   ├── budget?: number
│   │   ├── timeline: 'asap'|'3months'|'browsing'
│   │   ├── status: 'new'|'contacted'|'qualified'|'converted'|'lost'
│   │   ├── assignedToAgent?: string (broker-assigned agent)
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── listings/ (OLD - Being phased out?)
│   └── Similar to properties
│
├── applications/
│   ├── {applicationId}/
│   │   ├── userId: string
│   │   ├── type: 'agent'|'broker'|'new-agent'
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── company: string
│   │   ├── licenseNumber: string
│   │   ├── yearsExperience: number
│   │   ├── volume12m: number
│   │   ├── brokerage: string
│   │   ├── status: 'pending'|'approved'|'rejected'
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── messages/
│   ├── {conversationId}/
│   │   ├── participantIds: string[]
│   │   ├── participants: { [uid]: name }
│   │   ├── lastMessage: string
│   │   ├── lastMessageAt: Timestamp
│   │   ├── /messages/
│   │   │   └── {messageId}/
│   │   │       ├── senderId: string
│   │   │       ├── senderName: string
│   │   │       ├── content: string
│   │   │       ├── createdAt: Timestamp
│   │   │       └── readAt: Timestamp
│   │   └── unreadCount: number
│
├── notifications/
│   ├── {notificationId}/
│   │   ├── userId: string
│   │   ├── type: 'lead'|'approval'|'message'|'alert'
│   │   ├── title: string
│   │   ├── message: string
│   │   ├── refId?: string (property, application, message)
│   │   ├── read: boolean
│   │   ├── createdAt: Timestamp
│   │   └── readAt: Timestamp
│
├── agent_tasks/
│   ├── {taskId}/
│   │   ├── agentId: string
│   │   ├── title: string
│   │   ├── dueDate: string (YYYY-MM-DD)
│   │   ├── priority: 'high'|'medium'|'low'
│   │   ├── completed: boolean
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── projects/ (NEW - for constructoras)
│   ├── {projectId}/
│   │   ├── name: string
│   │   ├── developerName: string
│   │   ├── brokerageId?: string
│   │   ├── agentId: string
│   │   ├── totalUnits: number
│   │   ├── priceRange: { min, max }
│   │   ├── unitTypes: ['1br', '2br', '3br']
│   │   ├── location: string
│   │   ├── city: string
│   │   ├── lat: number
│   │   ├── lng: number
│   │   ├── status: 'pre-sale'|'under-construction'|'ready'
│   │   ├── estimatedCompletion: Timestamp
│   │   ├── gallery: string[]
│   │   ├── amenities: string[]
│   │   ├── createdAt: Timestamp
│   │   └── /leads/
│   │       └── (project-specific leads)
│
├── billing_customers/
│   ├── {customerId}/
│   │   ├── email: string
│   │   ├── name?: string
│   │   ├── stripeCustomerId: string
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── billing_subscriptions/
│   ├── {subscriptionId}/
│   │   ├── customerId: string
│   │   ├── stripeSubscriptionId: string
│   │   ├── plan: 'agent'|'broker'
│   │   ├── status: 'active'|'trialing'|'canceled'|'past_due'
│   │   ├── currentPeriodEnd: Timestamp
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── contact_submissions/
│   ├── {submissionId}/
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── message: string
│   │   ├── source: string (which page)
│   │   ├── status: 'new'|'read'|'responded'
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── social_posts/ (low usage)
│   ├── {postId}/
│   │   ├── authorId: string
│   │   ├── authorName: string
│   │   ├── type: 'sale'|'listing'|'achievement'
│   │   ├── content: string
│   │   ├── likes: number
│   │   ├── createdAt: Timestamp
│   │   └── /comments/ (optional)
│
└── settings/
    ├── billing/
    │   ├── publishableKey: string (Stripe)
    │   ├── priceIds: { agent: string, broker: string }
    │   ├── wallets: { applePay: bool, googlePay: bool }
    │   └── updatedAt: Timestamp
    │
    └── platform/
        ├── maintenanceMode: boolean
        ├── features: { gamification: bool, socialFeed: bool, ... }
        └── updatedAt: Timestamp
```

---

## 🔄 DATA FLOWS (User → Agent → Admin)

### FLOW 1: User Discovery & Inquiry

```
User Signup
  ↓
  Firebase Auth → User profile created in Firestore
  ↓
User Searches
  ↓
  Query Firestore: properties WHERE status='active' AND (city, price filters)
  ↓
  Results returned (list view)
  ↓
User Views Property
  ↓
  Fetch: property details + agent profile + view count
  ↓
User Submits Inquiry
  ↓
  Create: property_inquiry document (agentId = property owner)
  ↓
  ⚠️ MISSING: Send notification to agent
  ↓
Agent Checks Dashboard
  ↓
  Fetch: inquiries WHERE agentId = me (can see intent, budget, timeline)
  ↓
  Agent marks as "contacted", follows up
  ↓
Agent Schedules Viewing
  ↓
  (System doesn't track this - manual outside platform)
  ↓
Agent Marks as "Converted" + Enters Sale Price
  ↓
  Update: inquiry status = 'converted', sale_price recorded
  ↓
Admin Verifies Sale
  ↓
  ⚠️ MISSING: Automated commission calculation
  ↓
  Manually enters: sales record with commission split
  ↓
Agent Sees Revenue
  ↓
  Dashboard shows: total commission + monthly payout
```

### FLOW 2: Agent Onboarding

```
Agent Applies
  ↓
  Form submitted → Create: applications document
  ↓
  Required: license number, experience, company, references
  ↓
Admin Reviews Application
  ↓
  Dashboard: /admin/people or /admin/agents
  ↓
  Approve → Firebase Auth user created + credentials emailed
  ↓
  Firestore: users/{uid} with role='agent', verified=true
  ↓
Agent Logs In
  ↓
  Session saved locally → Redirect to /agent/dashboard
  ↓
Agent Creates Listing
  ↓
  Form submitted → properties document created
  ↓
  Status = 'pending' or 'active' (if first/second listing)
  ↓
Listing Auto-Approved (after 24h)
  ↓
  Status changed to 'active' (if not flagged)
  ↓
Listing Appears in Search
  ↓
  Users can see and inquire
```

### FLOW 3: Broker Team Management

```
Broker Applies
  ↓
  Form submitted → applications document
  ↓
Admin Approves
  ↓
  Firebase Auth user created → role='broker'
  ↓
Broker Logs In
  ↓
  Redirect to /broker/dashboard
  ↓
Broker Invites Agents
  ↓
  Email sent → Agent clicks link → Agent joins team
  ↓
  ⚠️ MISSING: Broker approval workflow
  ↓
Agent Creates Listing Under Broker
  ↓
  Listing.brokerageId = broker.id
  ↓
Lead Arrives
  ↓
  Inquiry created with brokerageId
  ↓
Broker Assigns Lead to Agent
  ↓
  ⚠️ MISSING: Auto-assignment by zone
  ↓
Agent Receives Notification
  ↓
  Agent follows up
  ↓
Commission Split
  ↓
  ⚠️ MISSING: Automated calculation (70/30, etc.)
  ↓
  Admin manually enters: agent gets X%, broker gets Y%
```

---

## 🔐 SECURITY ANALYSIS

### Current Protections ✅

**Authentication:**
- Firebase Auth required for all sensitive operations
- Email/password validation
- Session persistence with cookies

**Authorization:**
- Firestore rules enforce role-based access
- Users can't edit other user's data
- Admins can override

**Data Validation:**
- Server-side validation on API routes
- Input sanitization in form handlers
- Type checking (TypeScript)

**Secrets:**
- Firebase config visible in code (public key only)
- Private keys in environment variables
- Stripe keys in backend only

### Security Gaps ⚠️

| Gap | Risk | Mitigation |
|-----|------|-----------|
| **No rate limiting** | Spam, brute force | Add rate limiter (3h effort) |
| **No audit logging** | Can't track unauthorized access | Add activity log (2h effort) |
| **Firestore rules mismatch** | Role inconsistency | Audit + fix rules (1h effort) |
| **No data encryption** | Data at rest not encrypted | Firestore handles by default |
| **No input sanitization** | XSS in listing descriptions | Sanitize on save + display (2h effort) |
| **User suspension not enforced** | Suspended users can still access | Check suspension status on every request (1h effort) |
| **No phone verification** | Fake phone numbers in inquiries | Optional phone verification (4h effort) |
| **Firestore rules too open** | Possible unintended access | Review + tighten (2h effort) |

---

## 📈 SCALABILITY ANALYSIS

### Current Bottlenecks

1. **Listing Approval (Admin Workload)**
   - Every listing requires manual review
   - At 10 listings/day = 2 hours/day (50 listings/week)
   - Solution: Auto-approve + flag spam

2. **Search Query Costs**
   - Custom search does multiple Firestore queries
   - At 1000 searches/day = ~5000 read ops (expensive)
   - Solution: Algolia when >10K users OR optimize Firestore indexes

3. **Real-Time Updates**
   - Firestore listeners on agent dashboard
   - Each listener = read every 10 seconds if subscribed
   - Solution: Unsubscribe when page unmounted, use caching

4. **Image Storage**
   - Each listing ~5 images × 2-5MB = 10-25MB per listing
   - At 1000 listings = 10-25GB storage
   - Solution: Image compression, CDN cache

5. **Cold Start Latency**
   - Cloud Functions take 300-500ms on first call
   - Solution: Keep functions warm OR migrate to Vercel Edge Functions

### Growth Projections

| Metric | Current | 3 Months | 1 Year |
|--------|---------|----------|--------|
| Users | 100 | 500 | 5,000 |
| Agents | 10 | 50 | 500 |
| Listings | 50 | 500 | 5,000 |
| Daily Searches | 200 | 1,000 | 10,000 |
| Firestore Costs | $20 | $100 | $500 |

**At 1 year scale:**
- Need image compression + CDN
- Need Algolia (or better indexing)
- Need dedicated admin/moderation team
- Need error tracking (Sentry)
- Need caching layer (Redis)

---

## 🔌 API ROUTE AUDIT

**Total API Endpoints:** 45+

### Categorized by Role

**User Routes:**
- `/api/favorites` - Save/unsave properties
- `/api/recommendations` - Get recommendations
- `/api/user/stats` - User stats
- `/api/user/export-data` - Export profile data
- `/api/user/delete-account` - Delete account

**Agent Routes:**
- `/api/agent/tasks` - Create/update/delete tasks
- `/api/agent/assistant` - AI assistant (if enabled)
- `/api/agent/profile` - Get/update agent profile
- `/api/listings/create` - Create listing
- `/api/properties/[id]` - Update property

**Broker Routes:**
- Similar to agent but for broker functions

**Admin Routes:**
- `/api/admin/users` - User management
- `/api/admin/professionals` - Agent/broker applications
- `/api/admin/properties` - Listing moderation
- `/api/admin/stats` - Analytics
- `/api/admin/roles` - Role management
- `/api/admin/billing` - Billing management
- `/api/admin/activity` - Activity logging

**Public Routes:**
- `/api/contact/submit` - Contact form
- `/api/health` - Health check
- `/api/stats/homepage` - Homepage stats

**Observations:**
- ✅ Routes are well-organized by domain
- ✅ Clear naming conventions
- ⚠️ Missing comprehensive input validation
- ⚠️ No rate limiting
- ⚠️ No request signing (could add API keys)

---

## 🗂️ Database Optimization

### Current Indexes (Inferred)

**Should have:**
- properties: `status`, `agentId`, `city`, `propertyType`
- property_inquiries: `agentId`, `status`, `createdAt`
- users: `role`, `status`, `createdAt`
- billing_subscriptions: `customerId`, `status`

**Missing:**
- Compound indexes for common queries
- TTL (time-to-live) for temporary data

### Query Optimization Tips

**Before:**
```typescript
// This scans entire collection
const q = query(collection(db, 'properties'), 
  where('city', '==', 'Santo Domingo'),
  where('status', '==', 'active')
)
```

**After:** (same, but needs index)
```typescript
// Create composite index: (city, status, createdAt)
const q = query(collection(db, 'properties'),
  where('city', '==', 'Santo Domingo'),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc'),
  limit(20)
)
```

---

## 🚀 INFRASTRUCTURE RECOMMENDATIONS

### Phase 1 (Current - MVP)
- Vercel for Next.js hosting ✅
- Firebase for database ✅
- Stripe for payments ✅

### Phase 2 (3-6 months)
- Add image compression + CDN cache
- Add rate limiting to API routes
- Add error tracking (Sentry)
- Set up staging environment

### Phase 3 (6-12 months)
- Migrate search to Algolia OR improve Firestore indexing
- Add Redis caching layer for hot queries
- Migrate analytics to BigQuery
- Add mobile app (React Native)

### Phase 4 (12+ months)
- Consider multi-region deployment (DR + Caribbean)
- Add data warehouse for BI
- Add ML for recommendations
- Consider moving from Firebase to hybrid architecture

---

## ✅ SECURITY CHECKLIST

- [ ] Add rate limiting (3h)
- [ ] Fix Firestore rules inconsistency (1h)
- [ ] Add audit logging (2h)
- [ ] Sanitize user input (2h)
- [ ] Enforce user suspension (1h)
- [ ] Review all Firestore rules (2h)
- [ ] Add error tracking (2h)
- [ ] Enable Firebase security audit (1h)
- [ ] Document security policies (1h)
- [ ] Run penetration test (with contractor)

---

## 🎯 NEXT ARCHITECTURE IMPROVEMENTS

**Priority Order:**

1. **Rate Limiting** (3h) - Prevents abuse
2. **Audit Logging** (2h) - Compliance + debugging
3. **Error Tracking** (2h) - Catch production issues
4. **Data Backup** (4h) - Disaster recovery
5. **Staging Environment** (4h) - Safe testing
6. **Image Optimization** (3h) - Reduce costs
7. **Firestore Indexes** (2h) - Query performance
8. **Redis Caching** (8h) - High-scale caching
9. **Algolia Integration** (12h) - Better search
10. **API Gateway** (8h) - Central control

---

**This architecture is solid for current scale (~100-1000 users).** Focus on operational fixes (auto-approval, spam detection) before infrastructure scaling.

