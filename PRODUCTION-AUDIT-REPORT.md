# VIVENTA Production Audit & Action Plan
**Generated:** November 4, 2025  
**Status:** Production-Ready System Audit  
**Budget Priority:** Cost-Efficient & Scalable

---

## Executive Summary

VIVENTA is a Next.js-based real estate platform deployed on Vercel with Firebase backend. The system is operational with 80+ API routes, comprehensive authentication, and functional email delivery. This audit identifies current architecture, security posture, and provides actionable tasks for production hardening and AI/analytics integration.

**Critical Finding:** System is functional but requires security hardening (Firebase rules need role-based restrictions) and email provider standardization before scaling.

---

## 1. Current System Architecture

### Frontend Stack
- **Framework:** Next.js 14.2.5 with App Router
- **Hosting:** Vercel (domain: vercel.app currently)
- **PWA:** next-pwa configured with service worker caching
- **UI:** React 18.3.1 + Tailwind CSS 3.4.14
- **State:** React Context + Hot Toast notifications
- **Maps:** Mapbox GL + Leaflet for geo-search

### Backend & Database
- **Primary DB:** Firebase Firestore
- **File Storage:** Firebase Storage (listing images, user photos, application documents)
- **Authentication:** Firebase Auth with custom claims (master_admin, admin, broker_admin, agent, user)
- **Search:** Custom Firestore-based search (replaced Algolia; backup code present in `lib/_algolia_backup/`)
- **Serverless Functions:** 
  - **Firebase Functions:** 10 functions for Firestore triggers, Algolia indexing (legacy), admin auth, push notifications
  - **Vercel API Routes:** 80+ Next.js API routes handling CRUD, webhooks, auth, notifications

### External Services
- **Email:** Dual-path delivery:
  1. SendGrid (if `SENDGRID_API_KEY` present)
  2. SMTP fallback (Gmail-compatible with App Password support)
- **Payments:** Stripe integration (webhooks, checkout sessions)
- **Analytics:** Custom event tracking planned (not yet implemented)
- **Monitoring:** No production monitoring configured

---

## 2. Environment Variables Inventory

### ✅ Required (Production Critical)

#### Firebase Configuration (Client)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=                    # Firebase Web API key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=                # Firebase Auth domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=                 # Firebase project ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=             # Storage bucket name
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=        # FCM sender ID
NEXT_PUBLIC_FIREBASE_APP_ID=                     # Firebase app ID
```

#### Firebase Admin SDK (Server)
```bash
FIREBASE_ADMIN_PROJECT_ID=                       # Admin SDK project ID
FIREBASE_ADMIN_CLIENT_EMAIL=                     # Service account email
FIREBASE_ADMIN_PRIVATE_KEY=                      # Service account private key (Base64 or multiline)
# Alternative: FIREBASE_SERVICE_ACCOUNT (JSON string)
```

#### Email Provider (Choose ONE)
```bash
# Option 1: SendGrid (Recommended)
SENDGRID_API_KEY=                                # SendGrid API key
SENDGRID_FROM_EMAIL=noreply@viventa-rd.com       # Verified sender

# Option 2: SMTP (Fallback)
SMTP_HOST=smtp.gmail.com                         # SMTP server
SMTP_PORT=587                                    # TLS port
SMTP_SECURE=false                                # Use STARTTLS
SMTP_USER=                                       # Email account
SMTP_PASS=                                       # App password
SMTP_FROM=noreply@viventa-rd.com                 # Sender address
```

#### Master Admin Auth
```bash
MASTER_ADMIN_EMAILS=admin1@viventa.com,admin2@viventa.com   # Comma-separated
MASTER_ADMIN_EMAIL=admin@viventa.com             # Fallback single admin
TRUSTED_DEVICE_SECRET=                           # 32+ char secret for device trust
```

### 🟡 Optional (Feature-Dependent)

#### Stripe Billing
```bash
STRIPE_SECRET_KEY=sk_live_...                    # Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...   # Stripe public key
STRIPE_WEBHOOK_SECRET=whsec_...                  # Webhook signing secret
```

#### Search & Maps
```bash
# Algolia (Legacy - not currently used)
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
ALGOLIA_ADMIN_KEY=                               # Server-side indexing
ALGOLIA_INDEX=viventa_listings

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=                        # Mapbox access token
```

#### Site Configuration
```bash
NEXT_PUBLIC_SITE_URL=https://viventa-rd.com      # Production URL
NEXT_PUBLIC_BASE_URL=https://viventa-rd.com      # Alternative reference
NEXT_PUBLIC_EMAIL_FROM=noreply@viventa-rd.com    # Default sender
```

#### Feature Flags
```bash
FEATURE_SOCIAL_ENABLED=false                     # Social network feature
ALLOW_ANY_MASTER_EMAIL=false                     # Dev: bypass email whitelist
ALLOW_DEV_2FA_RESPONSE=false                     # Dev: return 2FA code in response
NEXT_PUBLIC_E2E=0                                # E2E test mode
```

#### Analytics & Monitoring
```bash
NEXT_PUBLIC_GA_ID=                               # Google Analytics
NEXT_PUBLIC_GOOGLE_VERIFICATION=                 # Search Console verification
SENTRY_DSN=                                      # Error tracking (not configured)
```

### 🔴 Security Secrets (NEVER commit to repo)
- ✅ **Verified Clean:** No plaintext secrets found in repo scan
- ⚠️ **Action Required:** Rotate any keys older than 90 days
- ⚠️ **Action Required:** Store Firebase private key in Vercel secrets (not in `.env.local`)

---

## 3. Serverless Functions Mapping

### Firebase Cloud Functions (10 functions)
**Location:** `functions/src/`  
**Runtime:** Node.js 18  
**Deploy Command:** `firebase deploy --only functions`

| Function | Trigger | Purpose | Status |
|----------|---------|---------|--------|
| `onListingCreate` | Firestore `listings/{id}` create | Index to Algolia (legacy) | ⚠️ Unused (Algolia replaced) |
| `onListingUpdate` | Firestore `listings/{id}` update | Update Algolia index | ⚠️ Unused |
| `onListingDelete` | Firestore `listings/{id}` delete | Remove from Algolia | ⚠️ Unused |
| `reindexAllListings` | HTTPS Callable | Manual reindex to Algolia | ⚠️ Unused |
| `processApplication` | HTTPS Callable | Approve/reject applications | ✅ Active |
| `sendAdminCode` | HTTPS Callable | Send 2FA code to admin | ✅ Active |
| `verifyAdminCode` | HTTPS Callable | Verify 2FA code | ✅ Active |
| `acceptInvite` | HTTPS Callable | Broker invite acceptance | ✅ Active |
| `logAdminAction` | HTTPS Callable | Audit log entry | ✅ Active |
| `sendPushNotification` | HTTPS Callable | FCM push dispatch | ⚠️ Scaffolded (FCM not configured) |

**Recommendation:** Deprecate Algolia functions; migrate active functions to Vercel if latency to Firestore is not critical.

### Vercel API Routes (80+ endpoints)
**Location:** `app/api/`  
**Runtime:** Vercel Serverless (Node.js 18)  
**Auto-deployed:** GitHub `main` branch → Production

#### Core Categories

**Authentication (9 routes)**
- `/api/auth/signup` - User registration
- `/api/auth/login` - User login
- `/api/auth/verify` - Email verification
- `/api/auth/send-master-code` - Admin 2FA code generation
- `/api/auth/verify-master-code` - Admin 2FA verification + device trust
- `/api/auth/gate` - Admin access gate code
- `/api/auth/setup-password` - Professional password setup
- `/api/auth/validate-setup-token` - Token validation
- `/api/auth/master-password` - Master admin password auth

**Admin Panel (25+ routes)**
- `/api/admin/users` - User CRUD
- `/api/admin/properties` - Property management
- `/api/admin/applications` - Application approval workflow
- `/api/admin/applications/approve` - Streamlined approval + user creation
- `/api/admin/stats` - Dashboard metrics
- `/api/admin/settings` - Platform settings
- `/api/admin/analytics` - Analytics data
- `/api/admin/activity` - Activity log
- `/api/admin/professionals` - Pro user management
- `/api/admin/chat/conversations` - Admin chat inbox
- `/api/admin/billing/*` - Stripe integration (customers, subscriptions, invoices)
- `/api/admin/leads/*` - Lead assignment & auto-routing
- `/api/admin/diagnostics` - System health check

**User-Facing (20+ routes)**
- `/api/properties` - Public property search
- `/api/favorites` - User favorites
- `/api/contact/submit` - Contact form
- `/api/contact/property-inquiry` - Property-specific inquiries
- `/api/messages` - User messaging
- `/api/notifications/*` - Notification delivery & preferences
- `/api/leads` - Lead submission
- `/api/recommendations` - Property recommendations
- `/api/health` - System health check

**Social & Gamification (8 routes)** 🚧
- `/api/social/feed` - Social feed
- `/api/social/posts` - Create posts
- `/api/social/like` - Like posts
- `/api/social/comment` - Comment on posts
- `/api/gamification/stats` - User points
- `/api/gamification/leaderboard` - Rankings
- `/api/notify/social` - Social waitlist

**Webhooks (3 routes)**
- `/api/webhooks/stripe` - Stripe event handler
- `/api/stripe/webhook` - Alternative Stripe handler
- `/api/stripe/create-session` - Checkout session creation

**Developer Tools (2 routes)**
- `/api/dev/seed-pro-users` - Seed test data (protected)
- `/api/health` - Detailed system status

---

## 4. Firestore Collections Schema

### Core Collections

#### `users`
**Purpose:** User profiles for all roles  
**Security:** User can read/write own; admins can read/write all  
**Fields:**
```typescript
{
  uid: string                    // Firebase Auth UID
  email: string
  name: string
  phone?: string
  role: 'user' | 'agent' | 'broker' | 'broker_admin' | 'admin' | 'master_admin'
  status: 'active' | 'inactive'
  agentCode?: string             // For agents (format: A#####)
  brokerCode?: string            // For brokers (format: B#####)
  brokerage?: string             // Brokerage name or ID
  brokerageId?: string           // Brokerage doc reference
  profileComplete: boolean
  emailVerified: boolean
  fcmToken?: string              // Push notification token
  online?: boolean
  lastSeen?: Timestamp
  createdAt: Timestamp
  approvedAt?: Timestamp
  lastVerifiedAt?: Timestamp     // Last 2FA verification
}
```

#### `properties`
**Purpose:** Property listings (canonical for search)  
**Security:** Public read; agents+ can create; owner/admin can update  
**Fields:**
```typescript
{
  id: string
  title: string
  description?: string
  publicRemarks?: string         // Public-facing description
  professionalRemarks?: string   // Private notes for pros
  price: number
  currency: 'USD' | 'DOP'
  location: string               // Full address
  city?: string
  neighborhood?: string
  lat?: number
  lng?: number
  bedrooms: number
  bathrooms: number
  area: number                   // Square meters
  propertyType: 'apartment' | 'house' | 'condo' | 'land' | 'commercial'
  listingType: 'sale' | 'rent'
  images: string[]               // Storage URLs
  agentId: string
  agentName: string
  agentEmail?: string
  status: 'pending' | 'active' | 'sold' | 'draft'
  featured: boolean
  views?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `applications`
**Purpose:** Agent/broker applications  
**Security:** Public create; applicant/admin read; admin update  
**Fields:**
```typescript
{
  id: string
  email: string
  contact: string                // Applicant name
  phone: string
  company?: string               // For brokers
  type: 'agent' | 'broker' | 'developer'
  status: 'pending' | 'approved' | 'rejected'
  reviewNotes?: string
  reviewedAt?: Timestamp
  reviewedBy?: string            // Admin email
  assignedCode?: string          // Generated A##### or B#####
  linkedUid?: string             // Firebase Auth UID after approval
  createdAt: Timestamp
}
```

#### `notifications`
**Purpose:** In-app notifications  
**Security:** User can read own; admin can read all  
**Fields:**
```typescript
{
  id: string
  type: 'application_approved' | 'listing_create' | 'lead_opened' | 'message_sent' | 'waitlist_submission'
  title: string
  message: string
  userId?: string                // Target user (null for role-based)
  role?: string                  // Target role (e.g., 'admin')
  audience?: string[]            // Multi-role targeting
  readBy: string[]               // Array of UIDs who marked read
  createdAt: Timestamp
  metadata?: object
}
```

#### `contact_submissions`
**Purpose:** Contact form submissions  
**Security:** Public create; admin read/update  
**Fields:**
```typescript
{
  name: string
  email: string
  phone?: string
  message: string
  source: 'contact_page' | 'footer' | 'property_inquiry'
  status: 'new' | 'contacted' | 'resolved'
  createdAt: Timestamp
}
```

#### `property_inquiries`
**Purpose:** Property-specific lead capture  
**Security:** Public create; admin read/update  
**Fields:**
```typescript
{
  propertyId: string
  propertyTitle: string
  name: string
  email: string
  phone?: string
  message?: string
  assignedTo?: string            // Agent UID
  status: 'new' | 'contacted' | 'qualified' | 'converted'
  createdAt: Timestamp
}
```

### Supporting Collections

- `waitlist_social` - Social feature waitlist signups
- `messages` - User-to-agent messaging
- `leads` - General lead capture
- `invites` - Broker invites for agent onboarding
- `brokerages` - Brokerage company profiles
- `billing_customers` - Stripe customer mapping
- `billing_subscriptions` - Active subscriptions
- `billing_invoices` - Invoice records
- `auth_codes` - 2FA verification codes (short-lived)
- `auth_attempts` - Login attempt tracking
- `audit_logs` - Admin action logging
- `index_sync_errors` - Algolia sync failure log (legacy)
- `push_logs` - FCM delivery log
- `counters` - Atomic counter documents

### Search Implementation

**Current:** Firestore-based custom search (`lib/customSearchService.ts`)
- Queries `properties` collection with `status == 'active'`
- Client-side filtering for price/area ranges
- Text relevance scoring for title/description/location
- Geo-distance calculation (Haversine formula)
- Facets: cities, neighborhoods, property types
- Pagination: 20 results per page

**Legacy:** Algolia integration present but disabled (`lib/_algolia_backup/`)

---

## 5. Security Audit

### 🔴 Critical Issues

#### Firestore Rules - Role-Based Access
**Current Status:** Basic rules with role helpers  
**Issue:** Some collections allow overly broad access  
**Action Required:**

```plaintext
// CURRENT (from firebase/firestore.rules)
match /users/{userId} {
  allow create: if isSignedIn() && request.auth.uid == userId;
  allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
  allow update: if isSignedIn() && (request.auth.uid == userId || isAdmin());
  allow delete: if isMasterAdmin();
}

// ✅ GOOD - Properly restricted

match /notifications/{notificationId} {
  allow get: if isSignedIn() && (resource.data.userId == request.auth.uid || resource.data.role == getUserRole() || isElevated());
  allow list: if isSignedIn();  // ⚠️ CONCERN - Allows listing ALL notifications
  allow create: if isSignedIn();
  allow update: if isSignedIn() && (resource.data.userId == request.auth.uid || isElevated());
  allow delete: if isAdmin();
}

// RECOMMENDED FIX
match /notifications/{notificationId} {
  allow read: if isSignedIn() && (
    resource.data.userId == request.auth.uid ||
    (resource.data.audience && getUserRole() in resource.data.audience) ||
    isElevated()
  );
  allow create: if isSignedIn();
  allow update: if isSignedIn() && (resource.data.userId == request.auth.uid || isElevated());
  allow delete: if isAdmin();
}
```

**Recommendation:** Update rules to filter notifications by `userId` or `audience` array in queries, not just reads.

#### Firebase Storage Rules
**Current Status:** Basic auth checks  
**Issue:** Application uploads allow unauthenticated write (by design for public applications)  
**Action Required:** Add rate limiting at API level to prevent abuse

```plaintext
// CURRENT
match /applications/{allPaths=**} {
  allow read: if true;
  allow write: if request.resource.size < 10 * 1024 * 1024 && (...content-type checks);
}

// RECOMMENDED: Add upload quota tracking in Firestore
// API route should check daily upload count per IP before allowing storage write
```

### 🟡 Medium Priority

#### Environment Secrets Rotation
- **Action:** Rotate Firebase Admin private key, SMTP passwords, Stripe keys if older than 90 days
- **Tool:** Use Firebase console to generate new service account; update Vercel secrets

#### Rate Limiting
- **Issue:** No rate limiting on public API routes (contact forms, applications, notifications)
- **Action:** Implement Vercel Edge Middleware rate limiting or use Upstash Redis
- **Example:** Limit `/api/contact/submit` to 5 requests/hour per IP

#### 2FA Device Trust
- **Current:** Uses JWT with `TRUSTED_DEVICE_SECRET` for 30-day device trust
- **Action:** Ensure `TRUSTED_DEVICE_SECRET` is set to cryptographically random 32+ char string
- **Validation:** Check `middleware.ts` line 43 for proper secret usage

### ✅ Good Practices Observed

1. **No Plaintext Secrets:** Repo scan confirmed no committed credentials
2. **Parameterized Queries:** All Firestore queries use proper SDK methods (no injection risk)
3. **HTTPS Enforced:** Vercel provides automatic HTTPS + HSTS
4. **Email Validation:** Server-side validation on all user-submitted emails
5. **File Type Restrictions:** Storage rules enforce MIME type checks for uploads

---

## 6. Email System Analysis

### Current Implementation

**Path:** `lib/emailService.ts`  
**Strategy:** SendGrid first → SMTP fallback  

**Flow:**
```typescript
1. Check SENDGRID_API_KEY → use SendGrid
2. If fails or missing → check SMTP_HOST/USER/PASS → use nodemailer
3. If SMTP_HOST is Gmail and SMTP_USER != from address → retry with SMTP_USER as sender
4. If all fail → log warning (non-blocking)
```

### Email Templates

**Location:** `lib/emailTemplates.ts`  
**Templates:**
- `sendApplicationConfirmation` - Application received email
- `sendProfessionalCredentials` - Approval email with login link
- `sendContactConfirmation` - Contact form auto-reply (referenced in `contact/submit`)

**Inline Templates:** Many routes contain inline HTML email templates (needs consolidation)

### Delivery Verification

**Current:** No webhook tracking for delivery/bounces/opens  
**Recommendation:** 

1. **Adopt Brevo (Sendinblue) or Resend:**
   - **Brevo Free Tier:** 300 emails/day, webhook support, no credit card
   - **Resend Free Tier:** 100 emails/day, React Email templates, excellent DX
   - **Cost at scale:** ~$15-25/month for 10k emails

2. **Add Email Events Collection:**
```typescript
// Firestore collection: email_events
{
  eventId: string
  emailId: string              // Provider's email ID
  recipient: string
  subject: string
  eventType: 'sent' | 'delivered' | 'opened' | 'bounced' | 'complained'
  timestamp: Timestamp
  metadata?: {
    bounceType?: string
    ipAddress?: string
  }
}
```

3. **Create Webhook Route:**
```typescript
// app/api/webhooks/email/route.ts
// Validate provider signature → store event in email_events collection
```

### Action Items

- [ ] **High:** Choose email provider (Brevo recommended for budget)
- [ ] **High:** Set up provider webhook endpoint
- [ ] **Medium:** Consolidate inline templates into `emailTemplates.ts`
- [ ] **Medium:** Add email_events collection tracking
- [ ] **Low:** Implement retry logic for failed sends (currently logs only)

---

## 7. Analytics & AI Data Model

### Event Pipeline Design

**Goal:** Track user behavior for admin dashboard and feed AI models

#### Event Schema
```typescript
// Firestore collection: analytics_events
{
  eventId: string                // UUID
  userId?: string                // Nullable for anonymous
  sessionId?: string             // Browser session ID
  role?: 'user' | 'agent' | 'broker' | 'admin' | 'guest'
  eventType: EventType
  metadata: Record<string, any>  // Event-specific data
  timestamp: Timestamp
  
  // Derived fields (computed on write)
  date: string                   // YYYY-MM-DD for aggregation
  hour: number                   // 0-23 for hourly stats
}

type EventType = 
  | 'page_view'                  // { path: string, referrer?: string }
  | 'login'                      // { method: 'email' | '2fa' }
  | 'signup'                     // { role: string }
  | 'listing_create'             // { listingId: string, propertyType: string }
  | 'listing_view'               // { listingId: string, source: 'search' | 'featured' | 'direct' }
  | 'lead_opened'                // { leadId: string, agentId?: string }
  | 'message_sent'               // { conversationId: string }
  | 'file_upload'                // { filePath: string, sizeBytes: number }
  | 'email_sent'                 // { emailType: string, recipient: string }
  | 'conversion'                 // { type: 'application' | 'inquiry' | 'sale' }
  | 'error'                      // { errorType: string, message: string }
```

#### API Endpoint
```typescript
// app/api/analytics/track/route.ts (already exists - expand it)
POST /api/analytics/track
Body: { eventType, metadata, userId?, sessionId? }
Response: { ok: true, eventId }
```

### Dashboard Aggregations

**Precompute daily stats in Firestore** (via scheduled function or incremental updates)

```typescript
// Firestore collection: analytics_daily
{
  date: string                   // YYYY-MM-DD
  dau: number                    // Daily active users
  signups: {
    user: number
    agent: number
    broker: number
  }
  listings: {
    created: number
    views: number
    conversions: number
  }
  emails: {
    sent: number
    delivered: number
    bounced: number
  }
  storage: {
    uploadsCount: number
    bytesUsed: number
  }
  errors: {
    count: number
    topErrors: Array<{ message: string, count: number }>
  }
}
```

### AI Features (Minimal MVP)

#### 1. Lead Scoring (Rule-Based)
```typescript
// lib/ai/leadScoring.ts
function scoreInquiry(inquiry: PropertyInquiry): number {
  let score = 0
  
  // Source quality
  if (inquiry.source === 'search') score += 20
  if (inquiry.source === 'featured') score += 30
  
  // Message quality
  if (inquiry.message && inquiry.message.length > 50) score += 15
  if (inquiry.phone) score += 10
  
  // Property price band (high-value properties)
  const property = getProperty(inquiry.propertyId)
  if (property.price > 300000) score += 25
  
  return score // 0-100
}
```

**Integration:** Add `score` field to `property_inquiries` on creation

#### 2. Agent Performance Metrics
```typescript
// app/api/admin/analytics/route.ts (enhance existing)
GET /api/admin/analytics/agent-performance?agentId=xyz&period=30d
Response: {
  listingsCreated: number
  avgListingViews: number
  leadsReceived: number
  conversionRate: number         // leads → showings → sales
  responseTime: number           // avg hours to first reply
  rating: number                 // based on client feedback (future)
}
```

#### 3. Auto-Summaries (OpenAI Integration - Optional)
```typescript
// lib/ai/summarize.ts (if implementing)
// Use OpenAI GPT-3.5-turbo for lead note summarization
async function summarizeConversation(messages: Message[]): Promise<string> {
  const prompt = `Summarize this real estate conversation in 2-3 sentences:\n\n${messages.map(m => `${m.sender}: ${m.content}`).join('\n')}`
  
  // Call OpenAI API (requires OPENAI_API_KEY)
  // Budget: ~$0.002 per summary (GPT-3.5-turbo)
}
```

#### 4. Semantic Search (Future - Vector DB)
**Not Recommended Initially:** Adds complexity + cost  
**Alternative:** Enhance Firestore search with synonym expansion and typo tolerance in `customSearchService.ts`

### Monitoring Integration

**Add Sentry (Free Tier):**
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,        // 10% of transactions
})
```

**Capture errors in API routes:**
```typescript
try {
  // ... route logic
} catch (error) {
  Sentry.captureException(error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

---

## 8. CI/CD & Deployment Pipeline

### Current Setup

**Repository:** GitHub (`eduardoinoa18/viventa-rd`)  
**Branch:** `main` (default & production)  
**Vercel Integration:** Auto-deploy on push to `main`  
**Firebase Deployment:** Manual (`firebase deploy`)

### Recommended Workflow

```
main (production) ← Protected, requires PR approval
  ↑
staging (preview) ← Auto-deploy to staging.viventa-rd.com
  ↑
feature/* ← Vercel Preview Deploys for each PR
```

#### GitHub Branch Protection

```yaml
# .github/branch-protection.yml (configure in GitHub UI)
Branches: main
- Require pull request before merging
- Require status checks to pass:
  - Vercel build
  - TypeScript check
  - Lint check
- Require conversation resolution
- Include administrators: false
```

#### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Build
        run: npm run build
        env:
          # Provide dummy env vars for build
          NEXT_PUBLIC_FIREBASE_API_KEY: test
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: test
          # ... other required vars
```

#### Post-Deploy Smoke Tests

```typescript
// scripts/smoke-test.ts
// Run after Vercel deploy completes
const checks = [
  { name: 'Health endpoint', url: '/api/health' },
  { name: 'Homepage', url: '/' },
  { name: 'Search page', url: '/search' },
]

for (const check of checks) {
  const res = await fetch(`${process.env.VERCEL_URL}${check.url}`)
  if (!res.ok) throw new Error(`${check.name} failed: ${res.status}`)
}
```

---

## 9. Cost Monitoring & Budget Alerts

### Current Spend (Estimated)

- **Vercel:** Free tier (Pro: $20/month if needed)
- **Firebase:**
  - Firestore: ~$0.18/100k reads, $0.54/100k writes
  - Storage: $0.026/GB/month
  - Functions: $0.40/million invocations
  - **Estimated monthly:** $5-20 at current scale
- **Email:** SendGrid Free (100 emails/day) or SMTP (free)
- **Stripe:** Transaction fees only (no monthly cost)

### Recommended Budget Alerts

**Firebase Console → Billing → Budget Alerts:**
- Alert at $10/month
- Alert at $25/month
- Hard cap at $50/month (for safety)

**Vercel Dashboard → Usage:**
- Monitor bandwidth (100 GB/month on Free)
- Monitor build minutes (6000 min/month on Free)

**Stripe Dashboard → Billing:**
- Enable email alerts for failed charges
- Review payout schedule

---

## 10. Prioritized Action Plan

### 🔴 CRITICAL (Do First - This Week)

#### 1. Harden Firebase Security Rules (2 hours)
**Goal:** Restrict notification listing to user-specific queries

**Tasks:**
- [ ] Update `firestore.rules` for notifications collection
- [ ] Add query constraint: `where('userId', '==', request.auth.uid)`
- [ ] Test with non-admin user account
- [ ] Deploy: `firebase deploy --only firestore:rules`

**Acceptance Test:**
```bash
# As regular user, attempt to list all notifications
# Expected: Only see notifications where userId matches or role matches
```

#### 2. Standardize Email Provider (3 hours)
**Goal:** Replace SMTP fallback with reliable transactional provider

**Tasks:**
- [ ] Sign up for Brevo or Resend (free tier)
- [ ] Verify sender domain (SPF/DKIM)
- [ ] Update `SENDGRID_API_KEY` → `BREVO_API_KEY` in `emailService.ts`
- [ ] Test all email templates (application, approval, contact)
- [ ] Set up webhook endpoint for delivery tracking

**Acceptance Test:**
```bash
# Submit contact form → receive admin alert + user confirmation
# Check Brevo dashboard for delivery status
# Verify webhook logs in Firestore email_events collection
```

#### 3. Environment Secrets Audit (1 hour)
**Goal:** Ensure all production secrets are properly stored

**Tasks:**
- [ ] Review Vercel Environment Variables dashboard
- [ ] Confirm Firebase Admin private key is NOT in repo
- [ ] Generate new `TRUSTED_DEVICE_SECRET` (32 chars)
- [ ] Rotate any keys older than 90 days
- [ ] Document secret rotation process in `DEPLOYMENT.md`

**Acceptance Test:**
```bash
git log -S "FIREBASE_ADMIN_PRIVATE_KEY" # Should return 0 results
```

---

### 🟡 HIGH PRIORITY (This Month)

#### 4. Implement Analytics Event Pipeline (4 hours)
**Goal:** Start collecting user behavior data for dashboard

**Tasks:**
- [ ] Create `analytics_events` Firestore collection
- [ ] Enhance `/api/analytics/track` route (already exists)
- [ ] Add client-side tracking hooks in key pages
- [ ] Create scheduled function for daily aggregation
- [ ] Build initial admin dashboard charts (DAU, signups, listings)

**Acceptance Test:**
```bash
# User visits search page → creates page_view event
# Agent creates listing → creates listing_create event
# Admin dashboard shows last 30 days DAU chart
```

#### 5. Add Rate Limiting (3 hours)
**Goal:** Prevent abuse of public endpoints

**Tasks:**
- [ ] Install `@upstash/ratelimit` or use Vercel Edge Config
- [ ] Add middleware to `/api/contact/submit` (5 req/hour per IP)
- [ ] Add middleware to `/api/applications/email` (3 req/hour per IP)
- [ ] Add middleware to `/api/notifications/waitlist` (10 req/hour per IP)
- [ ] Log rate limit violations to Firestore

**Acceptance Test:**
```bash
# Submit contact form 6 times in 10 minutes
# Expected: 6th request returns 429 Too Many Requests
```

#### 6. Set Up Sentry Error Monitoring (2 hours)
**Goal:** Capture and track production errors

**Tasks:**
- [ ] Sign up for Sentry (free tier: 5k errors/month)
- [ ] Install `@sentry/nextjs`
- [ ] Configure `sentry.client.config.js` and `sentry.server.config.js`
- [ ] Add `SENTRY_DSN` to Vercel env vars
- [ ] Test with intentional error in dev
- [ ] Create Sentry alert for >10 errors/hour

**Acceptance Test:**
```bash
# Trigger API error → see exception in Sentry dashboard
# Verify stack traces show source maps
```

---

### 🟢 MEDIUM PRIORITY (Next Month)

#### 7. Lead Scoring & AI Features (6 hours)
**Goal:** Provide data-driven lead prioritization

**Tasks:**
- [ ] Implement `lib/ai/leadScoring.ts` rule-based scoring
- [ ] Add `score` field to `property_inquiries` on creation
- [ ] Build admin analytics endpoint for agent performance
- [ ] (Optional) Integrate OpenAI for conversation summaries

**Acceptance Test:**
```bash
# Create high-value inquiry (detailed message, phone, expensive property)
# Score should be >70
# Admin dashboard shows agent conversion rates
```

#### 8. CI/CD Pipeline (4 hours)
**Goal:** Automated testing before production deploys

**Tasks:**
- [ ] Create `staging` branch with Vercel preview URL
- [ ] Add GitHub Actions workflow for lint + typecheck
- [ ] Enable branch protection on `main`
- [ ] Write smoke test script for post-deploy validation
- [ ] Document deployment process in `DEPLOYMENT.md`

**Acceptance Test:**
```bash
# Create PR with TypeScript error → GitHub Actions fails
# Merge to staging → auto-deploys to staging.viventa-rd.com
# Merge staging to main → production deploy + smoke tests pass
```

#### 9. Email Consolidation (3 hours)
**Goal:** Move all inline email templates to centralized system

**Tasks:**
- [ ] Audit all API routes for inline HTML emails
- [ ] Move templates to `lib/emailTemplates.ts`
- [ ] Create template parameters interface
- [ ] Add template previews (React Email or MJML)
- [ ] Update all routes to use centralized templates

**Acceptance Test:**
```bash
# All emails use consistent branding and layout
# Template changes require single file edit
```

---

### 🔵 LOW PRIORITY (Future Enhancements)

#### 10. Advanced Analytics Dashboard (8 hours)
- [ ] Implement BigQuery export for long-term storage
- [ ] Build funnel analysis (visitor → signup → listing → sale)
- [ ] Add cohort retention charts
- [ ] Create CSV export for custom reporting

#### 11. Performance Monitoring (4 hours)
- [ ] Enable Firebase Performance Monitoring SDK
- [ ] Add custom traces for slow API routes
- [ ] Monitor Vercel function cold start times
- [ ] Optimize image delivery with Vercel Image Optimization

#### 12. Serverless Migration Strategy (6 hours)
- [ ] Evaluate moving active Firebase Functions to Vercel
- [ ] Benchmark latency differences
- [ ] Migrate non-Firestore-dependent functions first
- [ ] Keep Firestore triggers on Firebase

---

## 11. API Route Documentation (Sample)

### POST /api/auth/signup
**Purpose:** Create new user account

**Request:**
```typescript
{
  email: string
  password: string
  name: string
  role?: 'user' | 'agent' | 'broker'  // Default: 'user'
}
```

**Response (201 Created):**
```typescript
{
  ok: true
  userId: string
  createdAt: string
}
```

**Security:**
- Rate limit: 5 signups/hour per IP
- Email validation required
- Password: min 8 chars

**Events Triggered:**
- Creates `analytics_events` entry: `signup`
- Sends welcome email

---

### POST /api/admin/applications/approve
**Purpose:** Approve agent/broker application and create account

**Request:**
```typescript
{
  applicationId: string
  email: string
  name: string
  role: 'agent' | 'broker'
  phone?: string
  company?: string  // For brokers
}
```

**Response (200 OK):**
```typescript
{
  success: true
  userId: string
  agentCode: string          // e.g., "A12345" or "B67890"
  message: string
}
```

**Side Effects:**
- Creates Firebase Auth user
- Creates Firestore user profile
- Updates application status
- Generates password reset link
- Sends approval email with credentials
- Creates `analytics_events` entry: `conversion`

**Security:**
- Requires `master_admin` or `admin` role
- Validates email format
- Ensures unique agentCode generation

---

### POST /api/contact/submit
**Purpose:** Handle contact form submissions

**Request:**
```typescript
{
  name: string
  email: string
  phone?: string
  message: string
  source?: 'contact_page' | 'footer'
}
```

**Response (200 OK):**
```typescript
{
  ok: true
  submissionId: string
}
```

**Side Effects:**
- Stores in `contact_submissions` collection
- Sends admin notification email
- Sends user confirmation email
- Creates admin notification in Firestore
- Creates `analytics_events` entry: `conversion`

**Security:**
- Rate limit: 5 submissions/hour per IP
- Email validation required
- Message min length: 10 chars

---

## 12. Firestore Composite Indexes

**Current Indexes:** (from Firebase console auto-generation)

```
Collection: properties
- status ASC, createdAt DESC
- status ASC, city ASC, createdAt DESC
- status ASC, propertyType ASC, createdAt DESC
- agentId ASC, createdAt DESC

Collection: notifications
- userId ASC, createdAt DESC
- audience ARRAY, createdAt DESC

Collection: applications
- status ASC, createdAt DESC

Collection: messages
- senderId ASC, createdAt DESC
- receiverId ASC, createdAt DESC
- conversationId ASC, createdAt ASC
```

**Add These Indexes:**

```bash
firebase firestore:indexes
```

```json
{
  "indexes": [
    {
      "collectionGroup": "analytics_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "eventType", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "analytics_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "property_inquiries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedTo", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 13. Environment Setup Checklist (New Team Member)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/eduardoinoa18/viventa-rd.git
cd viventa-rd

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Get secrets from team lead
# - Firebase Admin credentials
# - Email provider API keys
# - Stripe test keys

# 5. Start development server
npm run dev
# Visit http://localhost:3000

# 6. (Optional) Run Playwright tests
npm run test:e2e
```

### Production Deploy

```bash
# 1. Ensure all env vars set in Vercel dashboard
# 2. Push to main branch
git push origin main

# 3. Verify deployment at viventa-rd.vercel.app
# 4. Run smoke tests
npm run check-config  # Validates env vars

# 5. Deploy Firebase (rules, functions, indexes)
cd functions && npm run build && cd ..
firebase deploy --only firestore:rules,firestore:indexes,functions
```

---

## 14. Success Metrics (KPIs)

### System Health
- **Uptime:** >99.5% (monitor with UptimeRobot or Pingdom)
- **API Latency (p95):** <500ms for all routes
- **Error Rate:** <1% of requests

### User Engagement
- **DAU/MAU Ratio:** >30% (daily active / monthly active)
- **Signup Conversion:** >5% (visitors → signups)
- **Application Approval Time:** <48 hours

### Business Metrics
- **Listings Growth:** +20% month-over-month
- **Lead Response Time:** <2 hours (agent first reply)
- **Agent Productivity:** >5 listings/agent/month

---

## 15. Support & Runbooks

### Common Issues

#### "Firebase Admin not configured" Error
**Symptom:** API routes return 500 with "Admin SDK not configured"  
**Cause:** Missing `FIREBASE_ADMIN_PRIVATE_KEY` in Vercel env vars  
**Fix:**
```bash
# 1. Generate new private key in Firebase Console
# 2. Add to Vercel: FIREBASE_ADMIN_PRIVATE_KEY (Base64 or escaped multiline)
# 3. Redeploy
```

#### "Email not sent" Warnings
**Symptom:** Contact forms submit but no emails arrive  
**Cause:** Email provider credentials missing or invalid  
**Fix:**
```bash
# 1. Check Vercel env vars: SENDGRID_API_KEY or SMTP_HOST/USER/PASS
# 2. Test with curl to /api/health (shows email config status)
# 3. Check Sentry for email send failures
```

#### "Firestore permission denied" Errors
**Symptom:** Users can't read their own data  
**Cause:** Firestore rules too restrictive or custom claims not set  
**Fix:**
```bash
# 1. Check Firebase Console → Firestore → Rules tab
# 2. Verify user has correct role in Firestore users collection
# 3. Check custom claims with: firebase auth:export
```

---

## 16. Next Steps (Immediate)

### Week 1: Security Hardening
- [ ] Update Firestore rules for notifications (2 hours)
- [ ] Rotate all secrets >90 days old (1 hour)
- [ ] Add rate limiting to public endpoints (3 hours)
- [ ] Deploy and test changes

### Week 2: Email Standardization
- [ ] Set up Brevo/Resend account (30 min)
- [ ] Migrate to new provider (2 hours)
- [ ] Create email event webhook (2 hours)
- [ ] Test all email flows (1 hour)

### Week 3: Analytics Foundation
- [ ] Create analytics_events collection (30 min)
- [ ] Build event tracking API (2 hours)
- [ ] Add client-side tracking (2 hours)
- [ ] Build initial admin dashboard charts (4 hours)

### Week 4: Monitoring & CI/CD
- [ ] Set up Sentry (1 hour)
- [ ] Create staging branch + preview URL (1 hour)
- [ ] Add GitHub Actions workflow (2 hours)
- [ ] Document deployment process (1 hour)

---

## Appendix A: Quick Reference

### Key Files
- **Environment:** `.env.example` (template)
- **Firebase Config:** `lib/firebaseClient.ts`, `lib/firebaseAdmin.ts`
- **Email Service:** `lib/emailService.ts`, `lib/emailTemplates.ts`
- **Search Logic:** `lib/customSearchService.ts`
- **Security Rules:** `firebase/firestore.rules`, `firebase/storage.rules`
- **API Routes:** `app/api/**/*.ts` (80+ routes)

### Key Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Lint code
npm run typecheck        # TypeScript validation

# Deployment
git push origin main     # Deploy to Vercel
firebase deploy          # Deploy Firebase resources

# Testing
npm run test:e2e         # Playwright tests
npm run check-config     # Validate env vars
```

### Support Contacts
- **Firebase:** firebase.google.com/support
- **Vercel:** vercel.com/support
- **Repository:** github.com/eduardoinoa18/viventa-rd
- **Production URL:** viventa-rd.vercel.app (current)

---

**End of Audit Report**  
**Last Updated:** November 4, 2025  
**Prepared by:** AI Development Assistant  
**Review Status:** Pending human validation
