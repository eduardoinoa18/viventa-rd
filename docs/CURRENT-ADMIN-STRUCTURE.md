# 🗂 CURRENT ADMIN/MASTER STRUCTURE AUDIT

**Generated:** February 17, 2026  
**Status:** PRE-OPTIMIZATION BASELINE

---

## 📊 EXECUTIVE SUMMARY

**Total Admin Routes:** 43 pages  
**Total API Routes:** 75+ endpoints  
**Master Namespace:** 6 pages (NEW)  
**Legacy Admin:** 37 pages (OLD)  
**Components:** 7 admin-specific  

**Diagnosis:** SPRAWL CONFIRMED

---

## 🏗 DIRECTORY TREE

### ✅ NEW MASTER NAMESPACE
```
app/(dashboard)/master/
├── layout.tsx              ← Master admin layout (uses requireMasterAdmin guard)
├── page.tsx                ← Dashboard with stats (MIGRATED from /admin)
├── analytics/
│   └── page.tsx            ← PLACEHOLDER
├── leads/
│   └── page.tsx            ← PLACEHOLDER
├── listings/
│   └── page.tsx            ← PLACEHOLDER
├── users/
│   └── page.tsx            ← PLACEHOLDER
└── verification/
    └── page.tsx            ← PLACEHOLDER
```

**Status:** Shell created, only dashboard has real functionality.

---

### ⚠️ LEGACY ADMIN NAMESPACE (TO AUDIT)
```
app/admin/
├── page.tsx                            ← Legacy dashboard
├── gate/
│   └── page.tsx                        ← Gate code entry (DELETE CANDIDATE)
├── login/
│   └── page.tsx                        ← Legacy login (DELETE CANDIDATE)
├── verify/
│   └── page.tsx                        ← Legacy 2FA verify (DELETE CANDIDATE)
│
├── properties/
│   ├── page.tsx                        ← Listing table
│   ├── create/
│   │   └── page.tsx                    ← Create listing form
│   └── [id]/
│       └── edit/
│           └── page.tsx                ← Edit listing form
│
├── people/
│   ├── page.tsx                        ← People dashboard
│   ├── agents/
│   │   └── page.tsx                    ← Agents table
│   ├── brokers/
│   │   └── page.tsx                    ← Brokers table
│   ├── applications/                   ← DEAD (redirected in middleware)
│   └── leads/                          ← DEAD (redirected in middleware)
│
├── leads/
│   └── page.tsx                        ← Leads management
│
├── applications/
│   └── page.tsx                        ← Professional applications
│
├── settings/
│   └── page.tsx                        ← Admin settings
│
├── analytics/                          ← DEAD (no page.tsx, has events folder)
├── activity/                           ← DEAD (folder exists, no content)
├── agents/                             ← DEAD (folder exists, no content)
├── billing/                            ← DEAD (folder exists, no content)
├── brokers/                            ← DEAD (folder exists, no content)
├── chat/                               ← DEAD (redirected in middleware)
├── diagnostics/                        ← DEAD (folder exists, no content)
├── email/                              ← DEAD (has events folder, no page)
├── inbox/                              ← DEAD (redirected in middleware)
├── master/                             ← DEAD (folder exists, no content)
├── notifications/                      ← DEAD (redirected in middleware)
├── push/                               ← DEAD (redirected in middleware)
├── roles/                              ← DEAD (folder exists, no content)
└── users/                              ← DEAD (folder exists, no content)
```

**Active Pages:** 10  
**Dead Folders:** 13  
**Gate System:** 3 pages (gate, login, verify)

---

## 🔌 API ROUTES

### ✅ NEW AUTH API (SECURE)
```
app/api/auth/
├── login/route.ts                      ← NEW unified login
├── verify-2fa/route.ts                 ← NEW 2FA verification
├── logout/route.ts                     ← NEW logout
└── send-master-code/route.ts           ← NEW 2FA code sender
```

### ⚠️ LEGACY AUTH API (DELETE CANDIDATES)
```
app/api/auth/
├── gate/route.ts                       ← Gate validation (DELETE)
├── master-password/route.ts            ← Password validation (DELETE)
├── verify-master-code/route.ts         ← Old 2FA (DELETE)
├── setup-password/route.ts             ← Password setup (KEEP?)
├── validate-setup-token/route.ts       ← Token validation (KEEP?)
└── verify/route.ts                     ← Generic verify (AUDIT)
```

### 🏗 ADMIN API ROUTES (75+ ENDPOINTS)
```
app/api/admin/
├── stats/route.ts                      ← Dashboard stats (USED)
│
├── properties/
│   ├── route.ts                        ← CRUD listings
│   └── bulk/route.ts                   ← Bulk operations
│
├── users/
│   ├── route.ts                        ← User management
│   ├── sync/route.ts                   ← Sync with Auth
│   └── reset-password/route.ts         ← Password reset
│
├── leads/
│   ├── route.ts                        ← Leads CRUD
│   ├── assign/route.ts                 ← Lead assignment
│   └── auto-assign/route.ts            ← Auto-assignment logic
│
├── applications/
│   ├── route.ts                        ← Professional apps
│   └── approve/route.ts                ← Application approval
│
├── professionals/route.ts              ← Professional management
│
├── roles/
│   ├── route.ts                        ← Role management
│   └── users/route.ts                  ← User role assignment
│
├── settings/route.ts                   ← System settings
│
├── analytics/
│   ├── aggregate/                      ← DEAD? (no route.ts)
│   ├── daily/                          ← DEAD? (no route.ts)
│   └── events/                         ← DEAD? (no route.ts)
│
├── billing/
│   ├── customers/                      ← DEAD (folder, no content)
│   ├── invoices/                       ← DEAD (folder, no content)
│   ├── payment-link/                   ← DEAD (folder, no content)
│   ├── settings/                       ← DEAD (folder, no content)
│   ├── settings-v2/                    ← DEAD (folder, no content)
│   ├── stats/                          ← DEAD (folder, no content)
│   └── subscriptions/                  ← DEAD (folder, no content)
│
├── chat/
│   └── conversations/
│       └── [id]/
│           └── messages/               ← DEAD (folder, no content)
│
├── inbox/
│   ├── conversations/
│   │   └── [id]/                       ← DEAD (folder, no content)
│   └── mark-read/                      ← DEAD (folder, no content)
│
├── email/
│   └── events/                         ← DEAD (folder, no content)
│
├── activity/                           ← DEAD (folder, no content)
│
├── cleanup-test-data/route.ts          ← Utility (KEEP for dev)
│
├── firebase/
│   └── cleanup/route.ts                ← Firebase cleanup utility
│
├── migrations/
│   └── brokerage-id/route.ts           ← Data migration (one-time?)
│
├── diagnostics/                        ← DEAD (folder, no content)
│
└── sync-search/                        ← DEAD (folder, no content)
```

**Active API Routes:** ~20  
**Dead API Folders:** ~30

---

## 🧩 COMPONENTS

### Admin/Master Components
```
components/
├── AdminCodeModal.tsx                  ← Gate code modal (DELETE CANDIDATE)
├── AdminSidebar.tsx                    ← Legacy admin nav (DELETE CANDIDATE)
├── AdminTopbar.tsx                     ← Legacy admin header (DELETE CANDIDATE)
├── AdminPeopleTabs.tsx                 ← People section tabs (AUDIT)
├── AdminUserDetailsModal.tsx           ← User details popup (KEEP)
├── AdminWidget.tsx                     ← Dashboard widget (KEEP)
└── MasterSidebar.tsx                   ← NEW master nav (KEEP)
```

---

## 🔥 SPRAWL ANALYSIS

### Dead Weight Identified

**Dead Folders (No Content):** 43 total
- `app/admin/activity/`
- `app/admin/agents/`
- `app/admin/analytics/`
- `app/admin/billing/`
- `app/admin/brokers/`
- `app/admin/diagnostics/`
- `app/admin/email/`
- `app/admin/master/`
- `app/admin/roles/`
- `app/admin/users/`
- `app/api/admin/analytics/aggregate/`
- `app/api/admin/analytics/daily/`
- `app/api/admin/analytics/events/`
- `app/api/admin/billing/*` (7 folders)
- `app/api/admin/chat/conversations/[id]/messages/`
- `app/api/admin/inbox/*` (3 folders)
- `app/api/admin/email/events/`
- `app/api/admin/activity/`
- `app/api/admin/diagnostics/`
- `app/api/admin/sync-search/`

**Redirected Routes (Middleware Blocks):**
- `/admin/inbox`
- `/admin/chat`
- `/admin/notifications`
- `/admin/billing`
- `/admin/email`
- `/admin/push`
- `/admin/activity`
- `/admin/master`
- `/admin/agents`
- `/admin/brokers`
- `/admin/users`
- `/admin/roles`
- `/admin/people/leads`
- `/admin/people/applications`

**Gate System (Delete After Auth Migration):**
- `/admin/gate`
- `/admin/login`
- `/admin/verify`
- `/api/auth/gate`
- `/api/auth/master-password`
- `/api/auth/verify-master-code`
- `components/AdminCodeModal.tsx`

---

## 📐 DUPLICATION MATRIX

### Listing Management
- `/admin/properties/*` (3 pages: list, create, edit)
- `/master/listings` (placeholder)
- `/api/admin/properties/*` (2 routes: CRUD, bulk)

**Consolidation Target:** `/master/listings` with inline create/edit

### User Management
- `/admin/people/*` (4 pages: dashboard, agents, brokers, applications)
- `/master/users` (placeholder)
- `/api/admin/users/*` (3 routes)
- `/api/admin/professionals` (1 route)
- `/api/admin/roles/*` (2 routes)

**Consolidation Target:** `/master/users` with role tabs

### Dashboard
- `/admin/page.tsx` (legacy stats)
- `/master/page.tsx` (NEW stats - MIGRATED)
- `/api/admin/stats` (backend)

**Status:** Already consolidated in `/master`

### Navigation
- `AdminSidebar.tsx` (legacy)
- `MasterSidebar.tsx` (new)

**Consolidation Target:** Delete `AdminSidebar.tsx`

---

## 🎯 FUNCTIONAL PAGES (KEEP/MIGRATE)

### Currently Active in `/admin`:
1. `/admin/properties` → Migrate to `/master/listings`
2. `/admin/properties/create` → Inline in `/master/listings`
3. `/admin/properties/[id]/edit` → Inline in `/master/listings`
4. `/admin/people` → Migrate to `/master/users`
5. `/admin/people/agents` → Tab in `/master/users`
6. `/admin/people/brokers` → Tab in `/master/users`
7. `/admin/leads` → Migrate to `/master/leads`
8. `/admin/applications` → Merge into `/master/users`
9. `/admin/settings` → Migrate to `/master/system`
10. `/admin/page.tsx` → Already in `/master/page.tsx`

### Placeholders in `/master`:
1. `/master/analytics` → Build from scratch
2. `/master/leads` → Migrate from `/admin/leads`
3. `/master/listings` → Migrate from `/admin/properties`
4. `/master/users` → Consolidate from `/admin/people` + `/admin/applications`
5. `/master/verification` → DELETE (merge into `/master/users`)

---

## 🧭 NAVIGATION STRUCTURE

### Current Master Sidebar
```typescript
// components/MasterSidebar.tsx
```
Links:
- Dashboard (`/master`)
- Users (`/master/users`)
- Listings (`/master/listings`)
- Leads (`/master/leads`)
- Verification (`/master/verification`)
- Analytics (`/master/analytics`)

### Current Admin Sidebar
```typescript
// components/AdminSidebar.tsx
```
Links:
- Dashboard (`/admin`)
- Properties (`/admin/properties`)
- People (`/admin/people`)
- Leads (`/admin/leads`)
- Applications (`/admin/applications`)
- Settings (`/admin/settings`)

**Duplication:** YES  
**Action:** Delete `AdminSidebar.tsx` after migration

---

## 🚨 CRITICAL FINDINGS

### 1. Folder Bloat
- 43 empty folders
- 14 redirected routes (exist but blocked)
- ~30 dead API endpoints

### 2. Dual Admin Systems
- `/admin/*` (legacy, 10 active pages)
- `/master/*` (new, 1 active page + 5 placeholders)

### 3. Missing Core Features in /master
- Listings management (exists in `/admin/properties`)
- User management (exists in `/admin/people`)
- Leads management (exists in `/admin/leads`)
- Settings (exists in `/admin/settings`)

### 4. Scattered Business Logic
- Role checks in multiple components
- Auth logic in pages (should be middleware/guards only)
- API routes without corresponding pages

---

## 💡 RECOMMENDED STRUCTURE

### Target: Clean 5-Section Master
```
/master/
├── overview/              ← Dashboard (current /master/page.tsx)
├── listings/              ← Migrate from /admin/properties
├── users/                 ← Consolidate /admin/people + /admin/applications
├── analytics/             ← Build new (lightweight)
└── system/                ← Migrate /admin/settings + feature flags
```

**Delete:**
- `/master/leads` (merge into `/master/listings` as status filter)
- `/master/verification` (merge into `/master/users` as tab)

---

## 🗑 DELETE LIST (Phase 1 - Immediate)

### Empty Folders (43 total)
```bash
rm -rf app/admin/activity
rm -rf app/admin/agents
rm -rf app/admin/analytics
rm -rf app/admin/billing
rm -rf app/admin/brokers
rm -rf app/admin/diagnostics
rm -rf app/admin/email
rm -rf app/admin/master
rm -rf app/admin/roles
rm -rf app/admin/users
rm -rf app/api/admin/analytics/aggregate
rm -rf app/api/admin/analytics/daily
rm -rf app/api/admin/analytics/events
rm -rf app/api/admin/billing
rm -rf app/api/admin/chat/conversations/[id]/messages
rm -rf app/api/admin/inbox
rm -rf app/api/admin/email/events
rm -rf app/api/admin/activity
rm -rf app/api/admin/diagnostics
rm -rf app/api/admin/sync-search
```

---

## 🔄 MIGRATION LIST (Phase 2)

### Move Functionality to /master
1. **Listings:**
   - `app/admin/properties/**` → `app/master/listings/`
   - Consolidate create/edit into inline modals

2. **Users:**
   - `app/admin/people/**` → `app/master/users/`
   - Add tabs: Buyers, Agents, Brokers, Constructoras, Admins
   - Merge applications approval

3. **System:**
   - `app/admin/settings/**` → `app/master/system/`

4. **Delete Placeholders:**
   - Remove `/master/verification` (merge into users)
   - Remove `/master/leads` (merge into listings as filter)

---

## 🔒 GATE SYSTEM DELETE (Phase 3 - After Auth Testing)

### Files to Delete
```bash
rm -rf app/admin/gate
rm -rf app/admin/login
rm -rf app/admin/verify
rm -rf app/api/auth/gate
rm -rf app/api/auth/master-password
rm -rf app/api/auth/verify-master-code
rm components/AdminCodeModal.tsx
```

### Middleware Cleanup
Remove gate cookie checks from `middleware.ts`

---

## 📊 FINAL STATE

### After Optimization
```
app/(dashboard)/master/
├── layout.tsx
├── overview/page.tsx       ← Dashboard + stats
├── listings/page.tsx       ← Full CRUD + inline create/edit
├── users/page.tsx          ← All user types + role management
├── analytics/page.tsx      ← Lightweight business intelligence
└── system/page.tsx         ← Settings + feature flags + maintenance

components/
├── MasterSidebar.tsx       ← Only nav component
├── AdminUserDetailsModal.tsx
└── AdminWidget.tsx

app/api/admin/
├── stats/
├── properties/
├── users/
├── leads/
├── applications/
├── professionals/
├── roles/
└── settings/
```

**Total Pages:** 5 (down from 43)  
**Total Components:** 3 (down from 7)  
**Dead Weight:** ELIMINATED

---

**END OF AUDIT**
