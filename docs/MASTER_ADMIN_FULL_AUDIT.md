# 🎯 MASTER ADMIN FULL AUDIT

**Date:** February 16, 2026  
**Purpose:** Comprehensive audit before Master Admin restructure  
**Target:** Clean, minimal `/master` namespace

---

## 📋 EXECUTIVE SUMMARY

**Current State:**
- 13 admin page routes under `/admin/*`
- 18 admin API routes under `/api/admin/*`
- 6 admin-specific components
- Multiple role check patterns (inline checks, guards, middleware)
- 6 files over 400 lines (largest: 1,190 lines)
- Route fragmentation: `/admin/people`, `/admin/people/agents`, `/admin/people/brokers`

**Critical Findings:**
- ⚠️ **NO** `/master` namespace exists yet
- ⚠️ Role checks scattered across 100+ locations
- ⚠️ Settings page is 1,190 lines (needs decomposition)
- ⚠️ Duplicate guards: `requireAdmin()`, `requireMasterAdmin()`, `ProtectedClient`, middleware
- ⚠️ Dead link: `/admin/activity` referenced but doesn't exist
- ⚠️ 15 removed routes still in middleware redirect list

**Recommendation:** Full restructure to `/master` namespace with unified guards.

---

## 1️⃣ ROUTE MAP

### Current Admin Routes (13 pages)

| Route | File | Lines | Status |
|-------|------|-------|--------|
| `/admin` | app/admin/page.tsx | 274 | ✅ Active |
| `/admin/login` | app/admin/login/page.tsx | 231 | ✅ Active |
| `/admin/gate` | app/admin/gate/page.tsx | 52 | ✅ Active (middleware-only) |
| `/admin/verify` | app/admin/verify/page.tsx | 93 | ⚠️ Deprecated (redirects to login) |
| `/admin/properties` | app/admin/properties/page.tsx | 500 | ✅ Active (⚠️ large) |
| `/admin/properties/create` | app/admin/properties/create/page.tsx | 788 | ✅ Active (⚠️ large) |
| `/admin/properties/[id]/edit` | app/admin/properties/[id]/edit/page.tsx | 812 | ✅ Active (⚠️ large) |
| `/admin/people` | app/admin/people/page.tsx | 536 | ✅ Active (⚠️ large) |
| `/admin/people/agents` | app/admin/people/agents/page.tsx | 3 | ⚠️ Redirect only |
| `/admin/people/brokers` | app/admin/people/brokers/page.tsx | 7 | ⚠️ Redirect only |
| `/admin/leads` | app/admin/leads/page.tsx | 289 | ✅ Active |
| `/admin/applications` | app/admin/applications/page.tsx | 572 | ✅ Active (⚠️ large) |
| `/admin/settings` | app/admin/settings/page.tsx | 1,190 | ✅ Active (⚠️ HUGE) |

**⚠️ Files Over 400 Lines:** 6 files  
**🔥 Critical:** settings/page.tsx at 1,190 lines

### Routes with Keywords

**Files containing "admin":**
```
app/admin/page.tsx
app/admin/login/page.tsx
app/admin/gate/page.tsx
app/admin/verify/page.tsx
app/admin/properties/page.tsx
app/admin/properties/create/page.tsx
app/admin/properties/[id]/edit/page.tsx
app/admin/people/page.tsx
app/admin/people/agents/page.tsx
app/admin/people/brokers/page.tsx
app/admin/leads/page.tsx
app/admin/applications/page.tsx
app/admin/settings/page.tsx
```

**Files containing "master":**
```
app/api/auth/master-password/route.ts
```

**Files containing "people":**
```
app/admin/people/page.tsx
app/admin/people/agents/page.tsx
app/admin/people/brokers/page.tsx
```

**Files containing "dashboard":**
```
NONE (no dedicated dashboard folder)
```

**Files containing "super":**
```
NONE
```

### Removed Routes (Redirected in Middleware)

These routes are mentioned in middleware but have **no pages:**

```
/admin/inbox → /admin
/admin/chat → /admin
/admin/notifications → /admin
/admin/analytics → /admin
/admin/billing → /admin
/admin/email → /admin
/admin/push → /admin
/admin/activity → /admin (⚠️ DEAD LINK from ActivityWidget)
/admin/master → /admin
/admin/agents → /admin
/admin/brokers → /admin
/admin/users → /admin
/admin/roles → /admin
/admin/people/leads → /admin
/admin/people/applications → /admin
```

**Total removed routes:** 15

---

## 2️⃣ ROLE LOGIC MAP

### Role Check Patterns Found

**1. `master_admin` role checks (100+ occurrences)**

**Locations:**
- `types/user.ts` - Type definition
- `middleware.ts` - Route protection (line 88, 133)
- `lib/requireMasterAdmin.ts` - Guard function
- `lib/adminApiAuth.ts` - API guard (deprecated wrapper)
- `components/Header.tsx` - Navigation visibility (3 instances)
- `components/BottomNav.tsx` - Admin home logic (2 instances)
- `components/NotificationCenter.tsx` - Audience logic (3 instances)
- `components/AdminSidebar.tsx` - Role-based navigation (8 instances)
- `app/admin/*` - ProtectedClient guards (8 pages)
- `app/api/admin/*` - requireMasterAdmin() calls (18 routes)
- `app/login/page.tsx` - Redirect logic
- `app/listing/[id]/page.tsx` - Permission checks (2 instances)
- Firebase rules - Security rules (3 instances)
- Functions - Cloud Functions auth (3 instances)

**2. Inline role checks**

```typescript
// Pattern 1: Direct comparison
if (role === 'master_admin') { ... }

// Pattern 2: Array includes (Firebase Functions)
if (['admin', 'master_admin'].includes(role)) { ... }

// Pattern 3: Negation
if (role !== 'master_admin') { ... }
```

**Found in:**
- middleware.ts (2 direct checks)
- app/admin/properties/create/page.tsx (1 check)
- app/api/notifications/send/route.ts (4 checks)
- app/api/properties/route.ts (1 check)
- components/Header.tsx (3 checks)
- components/BottomNav.tsx (2 checks)
- components/NotificationCenter.tsx (3 checks)
- functions/src/adminAuth.ts (1 check)
- functions/src/applications.ts (1 check)
- functions/src/sendPush.ts (1 check)

**3. Legacy 'admin' role checks**

```typescript
// Still exist in Firebase Functions
if (['admin', 'master_admin'].includes(role)) { ... }
```

**Found in:**
- functions/src/adminAuth.ts (line 18)
- functions/src/sendPush.ts (line 25)
- firebase/firestore.rules (line 11, 15)
- app/api/admin/users/reset-password/route.ts (line 8)
- components/AdminSidebar.tsx (navigation roles)

**Status:** ⚠️ Legacy 'admin' role still exists in some locations

### Guard Functions

**Primary Guard:** `requireMasterAdmin()`

**Locations:**
- **Definition:** `lib/requireMasterAdmin.ts` (line 46)
- **Used in 18 API routes:**
  - app/api/admin/users/route.ts (4 calls)
  - app/api/admin/settings/route.ts (2 calls)
  - app/api/admin/professionals/route.ts (2 calls)
  - app/api/admin/properties/route.ts
  - app/api/admin/leads/route.ts
  - app/api/admin/applications/route.ts
  - app/api/admin/stats/route.ts
  - app/api/admin/roles/route.ts
  - app/api/admin/users/sync/route.ts
  - app/api/admin/users/reset-password/route.ts
  - app/api/admin/properties/bulk/route.ts
  - app/api/admin/leads/assign/route.ts
  - app/api/admin/leads/auto-assign/route.ts
  - app/api/admin/migrations/brokerage-id/route.ts
  - app/api/admin/firebase/cleanup/route.ts
  - app/api/admin/cleanup-test-data/route.ts
  - app/api/admin/applications/approve/route.ts
  - app/api/admin/roles/users/route.ts

**Secondary Guard:** `requireAdmin()` (DEPRECATED)

**Location:** `lib/adminApiAuth.ts` (line 12)
**Status:** Wrapper that calls `requireMasterAdmin()`
**Note:** Should be removed

**Client Guard:** `ProtectedClient` component

**Location:** `app/auth/ProtectedClient.tsx`
**Default:** `allowed={['master_admin']}`
**Used in 8 admin pages:**
- app/admin/page.tsx
- app/admin/people/page.tsx
- app/admin/properties/page.tsx
- app/admin/properties/create/page.tsx
- app/admin/properties/[id]/edit/page.tsx (2 instances)
- app/admin/leads/page.tsx
- app/admin/applications/page.tsx
- app/admin/settings/page.tsx

**Middleware Guard**

**Location:** `middleware.ts`
**Logic:**
```typescript
// Line 88: Require master_admin for all /admin/* routes
if (role !== 'master_admin') {
  return NextResponse.redirect(new URL('/admin/login', req.url));
}

// Line 133: Exclude master_admin from general redirects
const isLoggedInUser = role && role !== 'master_admin';
```

### Duplication Analysis

**Guard locations (4 layers):**
1. ✅ Middleware (route-level)
2. ✅ ProtectedClient (page-level)
3. ✅ requireMasterAdmin() (API-level)
4. ⚠️ Inline checks (scattered)

**Problem:** Same logic implemented 4 different ways

---

## 3️⃣ GUARD LOCATIONS

### Middleware Protection

**File:** `middleware.ts`

**Admin route protection (lines 73-104):**
```typescript
// Gate requirement for /admin and /admin/login
if (path.startsWith('/admin') && (path === '/admin' || path === '/admin/login')) {
  if (!adminGate) {
    return NextResponse.redirect(new URL('/admin/gate', req.url));
  }
}

// Full protection for other admin pages
if (path.startsWith('/admin') && !['/admin/login','/admin/gate'].includes(path)) {
  // Must have passed gate
  if (!adminGate) {
    return NextResponse.redirect(new URL('/admin/gate', req.url));
  }
  
  // Must be master_admin
  if (role !== 'master_admin') {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  
  // Must have completed 2FA
  if (!admin2FA) {
    // Check trusted device cookie...
    return NextResponse.redirect(new URL('/admin', req.url));
  }
}
```

**Features:**
- ✅ Gate code check
- ✅ Role verification
- ✅ 2FA enforcement
- ✅ Trusted device support
- ⚠️ Complex nested logic

### API Route Guards

**Pattern (all 18 admin API routes):**

```typescript
import { requireMasterAdmin } from '@/lib/requireMasterAdmin'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireMasterAdmin(req)
    // ... protected logic
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

**Consistency:** ✅ All admin API routes use same pattern

### Page-Level Guards

**Pattern (8 admin pages):**

```typescript
import ProtectedClient from '@/app/auth/ProtectedClient'

export default function AdminPage() {
  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      {/* content */}
    </ProtectedClient>
  )
}
```

**Issue:** ⚠️ Some pages allow both 'master_admin' and 'admin' (legacy)

### Summary

**Total guard implementations:**
- Middleware: 1 (global /admin/* protection)
- API guards: 18 routes
- Page guards: 8 pages
- Inline checks: 20+ scattered locations

**Redundancy level:** HIGH

---

## 4️⃣ DUPLICATE LAYOUTS

### Admin Layout Components

**1. AdminSidebar.tsx**

**Location:** `components/AdminSidebar.tsx`
**Lines:** 95
**Purpose:** Main navigation for admin panel

**Navigation items:**
```typescript
{ href: '/admin', label: 'Dashboard', icon: <FiGrid />, roles: ['master_admin', 'admin'] },
{ href: '/admin/properties', label: 'Properties', icon: <FiHome />, roles: ['master_admin', 'admin', 'agent', 'broker'] },
{ href: '/admin/people', label: 'People', icon: <FiUsers />, roles: ['master_admin', 'admin', 'broker'] },
{ href: '/admin/leads', label: 'Leads', icon: <FiTarget />, roles: ['master_admin', 'admin', 'agent', 'broker'] },
{ href: '/admin/applications', label: 'Applications', icon: <FiClipboard />, roles: ['master_admin', 'admin'] },
{ href: '/admin/settings', label: 'Settings', icon: <FiSettings />, roles: ['master_admin'] },
```

**Role-based visibility:** ✅ Yes
**Mobile responsive:** ✅ Yes
**Issues:** Still references 'admin' role

**2. AdminTopbar.tsx**

**Location:** `components/AdminTopbar.tsx`
**Lines:** 206
**Purpose:** Top bar with notifications and profile

**Features:**
- Notification center
- Profile dropdown
- Quick actions
- Admin-specific notifications

**Issues:** Duplicates notification logic from NotificationCenter

**3. AdminPeopleTabs.tsx**

**Location:** `components/AdminPeopleTabs.tsx`
**Lines:** 47
**Purpose:** Tab navigation for people page

**Tabs:** All Users, Agents, Brokers
**Issue:** Should be part of people page component

### Other Admin Components

**4. AdminWidget.tsx**

**Lines:** 24
**Purpose:** Dashboard stat widget
**Status:** ✅ Reusable, clean

**5. AdminCodeModal.tsx**

**Lines:** 46
**Purpose:** 2FA code entry modal
**Status:** ✅ Specific to admin auth flow

**6. AdminUserDetailsModal.tsx**

**Lines:** 148
**Purpose:** User detail view/edit modal
**Status:** ⚠️ Could be split into view/edit components

### Layout Patterns

**NO dedicated layout.tsx files** in app/admin/

**Each page includes:**
```typescript
<AdminSidebar />
<div className="flex-1">
  <AdminTopbar />
  <main>
    {/* page content */}
  </main>
</div>
```

**Duplication:** ✅ Layout structure repeated in every admin page

**Opportunity:** Create `app/admin/layout.tsx` or `app/(dashboard)/master/layout.tsx`

---

## 5️⃣ ADMIN API ROUTES

### Complete API Route Inventory (18 routes)

| Route | Methods | Lines | Purpose | Guard |
|-------|---------|-------|---------|-------|
| `/api/admin/stats` | GET | ~80 | Dashboard stats (users, properties, leads, DAU/WAU/MAU) | ✅ requireMasterAdmin |
| `/api/admin/users` | GET, POST, PATCH, DELETE | ~350 | User CRUD, filtering, invitations | ✅ requireMasterAdmin (4×) |
| `/api/admin/users/sync` | POST | ~120 | Sync Firebase Auth → Firestore | ✅ requireMasterAdmin |
| `/api/admin/users/reset-password` | POST | ~50 | Generate password reset link | ⚠️ 'admin' or 'master_admin' |
| `/api/admin/properties` | GET, POST, PATCH, DELETE | ~280 | Property CRUD, status management | ✅ requireMasterAdmin (3×) |
| `/api/admin/properties/bulk` | POST | ~90 | Bulk approve/reject properties | ✅ requireMasterAdmin |
| `/api/admin/leads` | GET, PATCH | ~180 | Lead management, status updates | ✅ requireMasterAdmin (2×) |
| `/api/admin/leads/assign` | POST | ~70 | Manual lead assignment | ✅ requireMasterAdmin |
| `/api/admin/leads/auto-assign` | POST | ~110 | Auto-assign lead (round-robin) | ✅ requireMasterAdmin |
| `/api/admin/professionals` | POST, PATCH | ~320 | Agent/broker profile management | ✅ requireMasterAdmin (2×) |
| `/api/admin/applications` | GET, PATCH | ~140 | Application status updates | ✅ requireMasterAdmin |
| `/api/admin/applications/approve` | POST | ~180 | Approve application + create user | ✅ requireMasterAdmin |
| `/api/admin/settings` | GET, POST | ~150 | Admin settings CRUD | ✅ requireMasterAdmin (2×) |
| `/api/admin/roles` | GET, POST | ~80 | Role management (legacy?) | ✅ requireMasterAdmin |
| `/api/admin/roles/users` | GET, POST | ~90 | Assign roles to users (legacy?) | ✅ requireMasterAdmin |
| `/api/admin/cleanup-test-data` | POST | ~60 | Delete test data | ✅ requireMasterAdmin |
| `/api/admin/firebase/cleanup` | POST | ~70 | Firebase cleanup utilities | ✅ requireMasterAdmin |
| `/api/admin/migrations/brokerage-id` | GET, POST | ~150 | Data migration utilities | ✅ requireMasterAdmin |

**Total lines:** ~2,600+ across 18 API routes

### API Capabilities by Category

**User Management (4 routes):**
- CRUD operations
- User sync
- Password reset
- Role assignment

**Property Management (2 routes):**
- CRUD operations
- Bulk status updates

**Lead Management (3 routes):**
- Lead tracking
- Manual assignment
- Auto-assignment

**Professional Management (1 route):**
- Agent/broker CRUD

**Application Management (2 routes):**
- Review applications
- Approve + create accounts

**System Management (6 routes):**
- Settings
- Stats
- Cleanup
- Migrations
- Roles

### Guard Consistency

✅ **17 routes use requireMasterAdmin() correctly**
⚠️ **1 route allows 'admin' or 'master_admin':** `/api/admin/users/reset-password`

### Legacy Routes

**Potentially obsolete:**
- `/api/admin/roles` - Role CRUD (not used in UI?)
- `/api/admin/roles/users` - User role assignment (duplicate of users endpoint?)

---

## 6️⃣ FILE SIZE WARNINGS

### Files Over 400 Lines

| File | Lines | Severity | Recommendation |
|------|-------|----------|----------------|
| app/admin/settings/page.tsx | 1,190 | 🔥 CRITICAL | Split into sections: General, Email, Notifications, Integration |
| app/admin/properties/[id]/edit/page.tsx | 812 | ⚠️ HIGH | Extract form into component |
| app/admin/properties/create/page.tsx | 788 | ⚠️ HIGH | Share form component with edit page |
| app/admin/people/page.tsx | 536 | ⚠️ MEDIUM | Extract user table, modals into components |
| app/admin/applications/page.tsx | 572 | ⚠️ MEDIUM | Extract application card component |
| app/admin/properties/page.tsx | 500 | ⚠️ MEDIUM | Extract property table component |

### Component Size Analysis

**Admin components:** All under 210 lines ✅

**Largest admin component:** AdminTopbar.tsx (206 lines)

### Recommendations

**settings/page.tsx (1,190 lines):**
```
Split into:
- /master/settings/general (site info, currency)
- /master/settings/email (SMTP, templates)
- /master/settings/notifications (push, in-app)
- /master/settings/integrations (API keys, webhooks)
```

**properties/create + edit (1,600 lines combined):**
```
Extract shared components:
- PropertyForm.tsx (form fields)
- PropertyImageUpload.tsx (image handling)
- PropertyLocationPicker.tsx (map + coordinates)
- usePropertyForm.ts (form logic hook)
```

**people/page.tsx (536 lines):**
```
Extract components:
- UserTable.tsx
- UserRow.tsx
- InviteUserModal.tsx
- EditUserModal.tsx
```

---

## 7️⃣ DEAD ROUTES

### Orphaned Routes (No navigation links)

**1. `/admin/gate`**
- **Status:** Functional
- **Access:** Middleware redirect only
- **Purpose:** Gate code entry before admin login
- **Action:** ✅ Keep (required for security flow)

**2. `/admin/verify`**
- **Status:** Deprecated
- **Access:** Middleware redirects to `/admin/login`
- **Purpose:** Old verification page
- **Action:** ❌ DELETE (already redirects)

**3. `/admin/people/agents`**
- **Status:** Redirect stub (3 lines)
- **Access:** Redirects to `/admin/people?tab=agents`
- **Purpose:** Legacy route
- **Action:** ⚠️ CONSOLIDATE (can remove, handle via query param)

**4. `/admin/people/brokers`**
- **Status:** Redirect stub (7 lines)
- **Access:** Redirects to `/admin/people?tab=brokers`
- **Purpose:** Legacy route
- **Action:** ⚠️ CONSOLIDATE (can remove, handle via query param)

### Dead Links (Referenced but don't exist)

**1. `/admin/activity`**
- **Linked from:** components/ActivityWidget.tsx (line 128)
- **Status:** NO PAGE EXISTS
- **Action:** ❌ Remove link OR create page

### Middleware Redirect List (15 removed routes)

These routes are in middleware redirect list but have **no pages:**

```typescript
// All redirect to /admin
'/admin/inbox',
'/admin/chat',
'/admin/notifications',
'/admin/analytics',
'/admin/billing',
'/admin/email',
'/admin/push',
'/admin/activity', // ← ALSO DEAD LINK
'/admin/master',
'/admin/agents',
'/admin/brokers',
'/admin/users',
'/admin/roles',
'/admin/people/leads',
'/admin/people/applications'
```

**Action:** ⚠️ Clean up middleware (reduce redirect list)

### Summary

**Deletable routes:** 2
- app/admin/verify/page.tsx (deprecated)
- Components linking to /admin/activity

**Consolidatable routes:** 2
- app/admin/people/agents/page.tsx (redirect stub)
- app/admin/people/brokers/page.tsx (redirect stub)

**Middleware cleanup:** Remove 15 redirect entries

---

## 8️⃣ NAVIGATION STRUCTURE

### Primary Navigation: AdminSidebar

**Location:** components/AdminSidebar.tsx

**Main Menu (6 items):**
1. Dashboard (`/admin`)
2. Properties (`/admin/properties`)
3. People (`/admin/people`)
4. Leads (`/admin/leads`)
5. Applications (`/admin/applications`)
6. Settings (`/admin/settings`)

**Quick Actions (3 items):**
1. Create Property
2. Manage People
3. Manage Leads

**Role-based visibility:**
- master_admin: All 6 tabs
- admin: 5 tabs (no Settings)
- agent: Properties, Leads
- broker: Properties, People, Leads

**Issues:**
- ⚠️ Still references 'admin' role
- ⚠️ Agent/broker access to admin panel (should they?)

### Secondary Navigation: AdminTopbar

**Location:** components/AdminTopbar.tsx

**Features:**
- Notifications (badge count)
- Profile dropdown
- Quick actions dropdown

**Issues:**
- Notification logic duplicates NotificationCenter
- No clear link structure (mostly modals)

### Mobile Navigation: BottomNav

**Location:** components/BottomNav.tsx

**Admin integration:**
```typescript
const adminHome = session?.role === 'master_admin' ? '/admin' : '/search'
```

**Issue:** Shows admin icon only for master_admin

---

## 9️⃣ ROLE ENFORCEMENT AUDIT

### Current UserRole Type

**Location:** types/user.ts

```typescript
export type UserRole =
  | 'buyer'
  | 'agent'
  | 'broker'
  | 'constructora'
  | 'master_admin';
```

✅ **Clean, Phase 1 compliant**

### Legacy Role References

**Still exist in:**

**1. Firebase Functions (3 files)**
```typescript
// functions/src/adminAuth.ts (line 18)
if (!['admin','master_admin'].includes(role))

// functions/src/applications.ts (line 22)
if (!['broker_admin','master_admin'].includes(role))

// functions/src/sendPush.ts (line 25)
if (!['master_admin', 'admin'].includes(callerRole))
```

**2. Firebase Rules**
```typescript
// firebase/firestore.rules (line 11, 13, 15)
function isAdmin() { return getUserRole() in ['master_admin','admin']; }
function isMasterAdmin() { return getUserRole() == 'master_admin'; }
function isAgentOrAbove() { ... 'agent','admin','broker_admin','master_admin' ...}
```

**3. Client-side types**
```typescript
// lib/authClient.ts (line 9)
role: 'master_admin' | 'admin' | 'broker' | 'agent' | 'client';
```

**4. ProtectedClient**
```typescript
// Many admin pages allow both: allowed={['master_admin','admin']}
```

### Environment Variables

**Master admin configuration:**
```
MASTER_ADMIN_EMAIL=viventa.rd@gmail.com
MASTER_ADMIN_EMAILS=admin1@viventa.com,admin2@viventa.com
MASTER_ADMIN_PASSWORD=Imthebestadminhere18
```

**Used in:**
- lib/requireMasterAdmin.ts (line 35)
- lib/adminApiAuth.ts (line 18)
- functions/src/seedMasterAdmin.ts

### Inconsistencies

❌ **'admin' role still exists** in Firebase Functions and security rules  
❌ **'broker_admin' role** referenced in applications.ts  
❌ **'client' role** in authClient.ts (should be 'buyer')

---

## 🎯 RESTRUCTURE PLAN

### Phase 1: Create `/master` Namespace

**New structure:**
```
app/
  (dashboard)/
    master/
      layout.tsx          ← Unified guard, sidebar
      page.tsx            ← Overview dashboard
      users/
        page.tsx          ← Replaces /admin/people
      listings/
        page.tsx          ← Replaces /admin/properties
        create/
          page.tsx
        [id]/
          edit/
            page.tsx
      leads/
        page.tsx
      verification/
        page.tsx          ← Replaces /admin/applications
      analytics/
        page.tsx          ← New (stats from dashboard)
```

**Delete:**
```
app/admin/*                         ← Entire folder
components/AdminSidebar.tsx         ← Replace with MasterSidebar
components/AdminTopbar.tsx          ← Replace with MasterHeader
components/AdminPeopleTabs.tsx      ← Consolidate into users page
```

### Phase 2: Consolidate Guards

**Create:** `lib/auth/guards.ts`

```typescript
export async function requireMasterAdmin() {
  // Single source of truth
}

export function useMasterAdmin() {
  // Client-side hook
}
```

**Delete:**
```
lib/adminApiAuth.ts                 ← Deprecated wrapper
lib/requireMasterAdmin.ts           ← Move to guards.ts
app/auth/ProtectedClient.tsx        ← Replace with layout guard
```

**Update middleware:**
```typescript
// Simplify /master/* protection
if (path.startsWith('/master')) {
  if (role !== 'master_admin') {
    return NextResponse.redirect(new URL('/master/login', req.url));
  }
}
```

### Phase 3: Split Large Files

**settings/page.tsx (1,190 lines) → 4 pages:**
```
/master/settings/general
/master/settings/email
/master/settings/notifications
/master/settings/integrations
```

**properties/create + edit (1,600 lines) → shared components:**
```
components/master/PropertyForm.tsx
components/master/PropertyImageUpload.tsx
hooks/usePropertyForm.ts
```

**people/page.tsx (536 lines) → components:**
```
components/master/UserTable.tsx
components/master/UserDetailsModal.tsx
components/master/InviteUserModal.tsx
```

### Phase 4: Clean Role References

**Update Firebase Functions:**
```typescript
// Remove 'admin', 'broker_admin'
// Use only 'master_admin'
```

**Update Firestore rules:**
```typescript
function isMasterAdmin() { 
  return getUserRole() == 'master_admin'; 
}
// Remove isAdmin()
```

**Update client types:**
```typescript
// lib/authClient.ts
role: UserRole  // Import from types/user.ts
```

### Phase 5: Update Navigation

**Create:** `components/master/MasterSidebar.tsx`

**Tabs (6 max):**
1. Overview
2. Users
3. Listings
4. Leads
5. Verification
6. Analytics

**Delete role-based visibility** (master_admin only)

### Phase 6: Migrate API Routes

**Keep structure, update imports:**
```
/api/admin/* → Keep (legacy support)
OR
/api/master/* → New namespace
```

**Update guards:**
```typescript
import { requireMasterAdmin } from '@/lib/auth/guards'
```

---

## 📊 METRICS

### Current Complexity

**Routes:** 13 admin pages + 18 API routes = 31 total  
**Components:** 6 admin-specific  
**Guards:** 4 different patterns  
**Total lines (admin pages):** ~4,700  
**Total lines (admin components):** ~570  
**Total lines (admin API):** ~2,600  
**Grand total:** ~7,870 lines

### Target Post-Restructure

**Routes:** 10 master pages + 18 API routes = 28 total (-3)  
**Components:** 10 master-specific (+4 extracted)  
**Guards:** 1 unified pattern (-3)  
**Avg page size:** <300 lines (currently ~360)  
**Largest file:** <500 lines (currently 1,190)

### Effort Estimate

**Low risk (1-2 hours):**
- Create /master namespace structure
- Create layout.tsx with guard
- Move small pages (dashboard, leads)

**Medium risk (3-4 hours):**
- Split settings into 4 pages
- Extract property form components
- Update navigation

**High risk (5-6 hours):**
- Migrate all API imports
- Update middleware
- Test all auth flows
- Update Firebase Functions/Rules

**Total:** 9-12 hours

---

## ✅ PHASE 1 SUCCESS CRITERIA

Before moving to restructure:

- [ ] All admin routes documented
- [ ] All role checks catalogued
- [ ] All guards identified
- [ ] File size issues flagged
- [ ] Dead routes listed
- [ ] Navigation structure mapped

**Status:** ✅ **AUDIT COMPLETE**

---

## 🚀 NEXT STEPS

1. **User approval** of restructure plan
2. **Create** `/app/(dashboard)/master/layout.tsx` with guard
3. **Move** admin pages to new structure (1 at a time)
4. **Split** large files (settings, properties)
5. **Consolidate** guards into single pattern
6. **Update** navigation components
7. **Clean** Firebase Functions and rules
8. **Delete** legacy /admin folder
9. **Test** all flows
10. **Ship** clean build

---

## 🎯 FINAL RECOMMENDATION

**Proceed with full Master Admin restructure.**

**Rationale:**
- Current structure is fragmented (13 routes, 4 guard patterns)
- File sizes exceed maintainability threshold (1,190 lines)
- Role logic scattered across 100+ locations
- Dead routes and links create confusion
- No unified layout/guard strategy

**New `/master` namespace will provide:**
- Single source of truth for admin operations
- Clean 6-tab navigation
- Unified guard at layout level
- Files under 500 lines
- Zero role confusion
- Scalable for future features

**Risk level:** MEDIUM  
**Impact:** HIGH (eliminates entire class of bugs)  
**Effort:** 9-12 hours  

**Status:** Ready for execution.
