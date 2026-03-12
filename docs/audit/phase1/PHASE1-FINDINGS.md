# VIVENTA – Phase 1 Security Audit Findings

**Generated:** 2025 · Automated scan of `/app/api/` (152 route handlers)  
**Artifacts:** `docs/audit/phase1/`  
**Script:** `scripts/phase1-audit.ps1`

---

## Executive Summary

| Metric | Value | Risk |
|--------|-------|------|
| Total API routes scanned | **152** | — |
| Auth check: PASS | **38 (25%)** | — |
| Auth check: FAIL | **114 (75%)** | 🔴 Critical |
| Server files using client SDK | **15** | 🔴 Critical |
| Firestore `limit()` calls > 100 | **66** | 🟡 High |
| Hardcoded tenant ID literals | **1 confirmed** | 🟡 High |

The 114 FAIL figure requires careful interpretation — see §2 below.

---

## §1 · Auth Consistency Matrix (38 PASS / 114 FAIL)

The matrix scores each route against three checks:

| Check | Description |
|-------|-------------|
| `usesGetSessionFromRequest` | Calls `getSessionFromRequest()` from `lib/auth/session.ts` |
| `usesAdminSdkOnly` | Does **not** import `firebaseClient.ts` (uses Admin SDK only) |
| `hasOfficeOrOrgScopeFilter` | Contains a tenancy scope keyword (`officeId`, `brokerageId`, `constructoraCode`, etc.) |

PASS = all three true. FAIL = any one false.

Full matrix: [`auth-matrix.json`](auth-matrix.json) (152 entries)

---

## §2 · FAIL Rate Breakdown — False Positives vs. Real Risk

The raw 75% FAIL rate is misleading due to the matrix's strict single-pattern rule.

### Category A: Admin Routes via `requireMasterAdmin()` — 41 routes  
Routes under `app/api/admin/*` use `requireMasterAdmin()` from `lib/requireMasterAdmin.ts`
(or `lib/adminApiAuth.ts`) instead of `getSessionFromRequest()`. This is a **different, dedicated
guard** that enforces `master_admin` role + 2FA cookie verification. These are not unprotected.

**However**: using two separate auth guard patterns across the codebase is an architectural inconsistency.
The audit recommends normalizing all routes to call `getSessionFromRequest()` first, then perform role checks.

### Category B: Auth bootstrapping routes — 12 routes  
`app/api/auth/*` routes (login, logout, session, signup, verify, etc.) are intentionally
unauthenticated — they are the authentication entry points. These are expected FAILs.

### Category C: Genuinely risky routes — ~55 non-admin, non-auth routes  
These are the highest-priority group. They handle real user data but show no `getSessionFromRequest` call.
Selected examples with exposure type:

| Route | Exposure Type | Priority |
|-------|--------------|----------|
| `app/api/stripe/create-session/route.ts` | Payment initiation without session | 🔴 P0 |
| `app/api/stripe/webhook/route.ts` | Payment webhook — needs Stripe sig only | 🟡 P1 |
| `app/api/user/delete-account/route.ts` | Destructive operation | 🔴 P0 |
| `app/api/user/export-data/route.ts` | PII export | 🔴 P0 |
| `app/api/user/me/route.ts` | User profile read | 🟠 P1 |
| `app/api/user/stats/route.ts` | User stats + uses client SDK | 🔴 P0 |
| `app/api/crm/buyers/route.ts` | CRM data access | 🟠 P1 |
| `app/api/crm/buyers/[id]/send-matches/route.ts` | Sends emails to buyers | 🟠 P1 |
| `app/api/projects/create/route.ts` | Creates projects + hardcoded tenant | 🔴 P0 |
| `app/api/messages/route.ts` | Chat messages | 🟠 P1 |
| `app/api/uploads/listing-images/route.ts` | File storage writes | 🟠 P1 |
| `app/api/analytics/agent-performance/route.ts` | Agent PII + uses client SDK | 🟠 P1 |
| `app/api/debug/env/route.ts` | **Exposes env vars** | 🔴 P0 |
| `app/api/dev/seed-pro-users/route.ts` | Seeds DB — no auth | 🔴 P0 |
| `app/api/leads/route.ts` | Lead data | 🟠 P1 |
| `app/api/support/tickets/route.ts` | Support tickets | 🟠 P1 |

> **Immediate action required**: `app/api/debug/env/route.ts` and `app/api/dev/seed-pro-users/route.ts`
> must be removed from production or gated behind a hard auth check before any public launch.

---

## §3 · Firebase Client SDK in Server Routes (15 violations)

**Risk**: The Firebase Client SDK uses user-level credentials and is designed for browser execution.
Using it in Next.js API routes (which run as server-side Node.js) bypasses Firestore Security Rules,
exposes API keys via the server process, and can leak configuration if the route itself is compromised.
All server routes must use only the Firebase Admin SDK (`lib/firebaseAdmin.ts`).

Full list: [`firebaseclient-imports.json`](firebaseclient-imports.json)

### High Priority (sensitive operations)

| File | Operation | Priority |
|------|-----------|----------|
| `app/api/stripe/create-session/route.ts` | Payment session creation | 🔴 P0 |
| `app/api/stripe/webhook/route.ts` | Payment webhook processing | 🔴 P0 |
| `app/api/auth/verify-2fa/route.ts` | 2FA verification | 🔴 P0 |
| `app/api/admin/roles/route.ts` | Admin role assignment | 🔴 P0 |
| `app/api/admin/roles/users/route.ts` | Admin role user lookup | 🔴 P0 |
| `app/api/analytics/agent-performance/route.ts` | Agent PII analytics | 🟠 P1 |
| `app/api/analytics/track/route.ts` | Event tracking | 🟠 P1 |

### Medium Priority

| File | Operation | Priority |
|------|-----------|----------|
| `app/api/contact/route.ts` | Contact form | 🟡 P2 |
| `app/api/contact/submit/route.ts` | Contact submission | 🟡 P2 |
| `app/api/health/route.ts` | Health check | 🟡 P2 |
| `app/api/projects/create/route.ts` | Project creation | 🟠 P1 |
| `app/api/projects/list/route.ts` | Project listing | 🟡 P2 |
| `app/api/recommendations/route.ts` | Property recommendations | 🟡 P2 |
| `app/api/stats/homepage/route.ts` | Homepage stats | 🟡 P2 |
| `app/api/user/stats/route.ts` | User stats | 🟠 P1 |

### Fix Pattern

Replace:
```typescript
// ❌ Wrong — client SDK in server route
import { db } from '@/lib/firebaseClient';
```
With:
```typescript
// ✅ Correct — Admin SDK in server route
import { adminDb } from '@/lib/firebaseAdmin';
```

Note: `adminDb` collection/doc calls are identical in shape to client SDK; the swap is mostly a
one-line import change per file, plus swapping `db` → `adminDb`.

---

## §4 · Firestore Oversized `limit()` Calls (66 violations)

**Risk**: Firestore reads are billed per document. A single `limit(10000)` call on a busy collection
can cost 10,000 document reads in one request. At scale these calls cause:
- Billing spikes
- Cold start timeouts (Vercel 10s default)
- Memory exhaustion in the serverless function
- Poor UX (no progressive loading)

Full list: [`high-limits.json`](high-limits.json) (66 entries)

### Top 20 by severity

| File | Line | `limit(N)` | Recommended Fix |
|------|------|-----------|-----------------|
| `app/api/admin/users/overview/route.ts` | 33 | **10,000** | Paginate (100/page) + aggregate counter |
| `app/api/admin/growth/overview/route.ts` | 53 | **8,000** | Use pre-aggregated stats document |
| `app/api/admin/marketplace-intelligence/overview/route.ts` | 46 | **8,000** | Use pre-aggregated stats document |
| `app/api/admin/growth/overview/route.ts` | 52 | **6,000** | Use pre-aggregated stats document |
| `app/api/admin/marketplace-intelligence/overview/route.ts` | 45 | **5,000** | Use pre-aggregated stats document |
| `app/api/broker/analytics/revenue/route.ts` | 58 | **3,000** | Paginate; stream via cursor |
| `app/api/activity-events/summary/route.ts` | 47 | **3,000** | Cache in Redis / Cloud Firestore aggregation |
| `app/api/broker/leads/automation/route.ts` | 128 | **3,000** | Process in batches of 100 via Cloud Function |
| `app/api/broker/mls/route.ts` | 65 | **2,500** | Paginate (50/page) |
| `app/api/broker/leads/route.ts` | 100 | **2,500** | Paginate with cursor |
| `app/api/agent/dashboard/overview/route.ts` | 69 | **2,500** | Use aggregated metrics doc |
| `app/api/constructora/dashboard/units/route.ts` | 76 | **2,500** | Paginate |
| `app/api/constructora/dashboard/reservations/route.ts` | 77 | **2,500** | Paginate |
| `app/api/broker/transactions/route.ts` | 109 | **2,000** | Paginate |
| `app/api/admin/users/overview/route.ts` | 34 | **2,000** | Aggregate counter |
| `app/api/broker/dashboard/overview/route.ts` | 197 | **2,000** | Cache/aggregate |
| `app/api/constructora/dashboard/overview/route.ts` | 81 | **2,000** | Use stats doc |
| `app/api/constructora/dashboard/deals/route.ts` | 83 | **2,000** | Paginate |
| `app/api/agent/commissions/route.ts` | 48 | **1,500** | Paginate |
| `app/api/broker/dashboard/overview/route.ts` | 262 | **1,500** | Cache/aggregate |

### Remediation Strategy

1. **Admin dashboards** (`admin/users/overview`, `admin/growth`, `admin/marketplace-intelligence`):
   Replace per-request full scans with a **nightly Cloud Function** that writes pre-aggregated stats
   to a single `stats/platform` Firestore document. The API route reads one document instead of 10,000.

2. **Broker/agent dashboards** (`broker/dashboard`, `agent/dashboard`):
   Maintain a per-office counter document (`offices/{officeId}/stats`) updated via Firestore triggers.

3. **Lists/tables** (`broker/leads`, `broker/mls`, `broker/transactions`):
   Replace large `limit()` with cursor-based pagination: `limit(50)` + `startAfter(lastDoc)`.

4. **Automation routes** (`broker/leads/automation`):
   Move bulk operations to Firebase Cloud Functions with batch processing (100 docs/batch).

---

## §5 · Hardcoded Tenant ID Literals (1 confirmed)

**Risk**: Hardcoded IDs bypass multi-tenant isolation. Any user hitting this route operates as the
hardcoded identity, which can cross tenant boundaries and create ghost data.

| File | Line | Code | Fix |
|------|------|------|-----|
| `app/api/projects/create/route.ts` | 56 | `const developerId = 'mock-developer-id'; // TODO: Get from auth` | See below |

### Required Fix

```typescript
// app/api/projects/create/route.ts
// ❌ Current (line 56)
const developerId = 'mock-developer-id'; // TODO: Get from auth

// ✅ Replace with:
const session = await getSessionFromRequest(req);
if (!session?.uid) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const developerId = session.uid;
```

Also add the import if not present:
```typescript
import { getSessionFromRequest } from '@/lib/auth/session';
```

> Note: The automated script's pattern matched `key: "value"` assignment syntax and returned 0.
> This instance uses `const name = 'value'` syntax. Manual grep confirmed 1 match.
> A broader scan is recommended: `grep -rn "= '.*-id'" app/api/` to catch similar patterns.

---

## §6 · In-Process Rate Limiter Warning

`lib/rateLimiter.ts` uses an in-memory Node.js store. **This does not work on Vercel** (serverless):
each cold start gets a fresh counter, meaning the rate limiter resets on every new function instance.
A distributed attacker hitting multiple Vercel regions simultaneously faces no effective rate limiting.

**Fix**: Replace with Redis-backed rate limiting (Vercel KV, Upstash Redis, or similar).

```typescript
// Upstash Ratelimit example
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

---

## §7 · Recommended Remediation Order

### Day 1 (Immediate / Pre-Launch Blockers)

| Priority | Action |
|----------|--------|
| 🔴 P0 | **Delete or hard-gate** `app/api/debug/env/route.ts` — exposes env vars |
| 🔴 P0 | **Delete or hard-gate** `app/api/dev/seed-pro-users/route.ts` — seeds DB unauthenticated |
| 🔴 P0 | Fix `app/api/projects/create/route.ts:56` — replace `mock-developer-id` with session UID |
| 🔴 P0 | Migrate `app/api/stripe/create-session/route.ts` → Admin SDK + add `getSessionFromRequest` |
| 🔴 P0 | Migrate `app/api/stripe/webhook/route.ts` → Admin SDK (session not needed; Stripe sig is auth) |
| 🔴 P0 | Migrate `app/api/auth/verify-2fa/route.ts` → Admin SDK |

### Day 2–3 (High Priority)

| Priority | Action |
|----------|--------|
| 🟠 P1 | Migrate `app/api/admin/roles/route.ts` and `admin/roles/users/route.ts` → Admin SDK |
| 🟠 P1 | Add `getSessionFromRequest` to `user/delete-account`, `user/export-data`, `user/me` |
| 🟠 P1 | Add `getSessionFromRequest` to `crm/buyers/**` routes |
| 🟠 P1 | Add `getSessionFromRequest` to `messages/**` routes |
| 🟠 P1 | Replace in-memory rate limiter with Redis-backed solution |

### Day 4–5 (Medium Priority)

| Priority | Action |
|----------|--------|
| 🟡 P2 | Migrate remaining 8 client SDK servers (`contact`, `health`, `stats`, etc.) → Admin SDK |
| 🟡 P2 | Cap top 5 oversized `limit()` calls (10000, 8000, 8000, 6000, 5000) |
| 🟡 P2 | Create `stats/platform` Firestore document + nightly aggregation Cloud Function |

### Week 2 (Architecture)

| Priority | Action |
|----------|--------|
| 🟡 | Normalize all admin routes: call `getSessionFromRequest()` → then `requireMasterAdmin()` |
| 🟡 | Cursor-based pagination for all broker/agent list routes |
| 🟡 | Implement distributed rate limiting on auth routes |

---

## Appendix: Artifact Files

| File | Description |
|------|-------------|
| [`auth-matrix.json`](auth-matrix.json) | Per-route PASS/FAIL matrix (152 entries) |
| [`firebaseclient-imports.json`](firebaseclient-imports.json) | 15 server routes using client SDK |
| [`high-limits.json`](high-limits.json) | 66 oversized `limit()` calls |
| [`hardcoded-tenant-literals.json`](hardcoded-tenant-literals.json) | Script output (0; see §5 for manual grep result) |
| [`summary.json`](summary.json) | Aggregate counts |
| [`typesense-schemas.json`](typesense-schemas.json) | Typesense collection definitions (listings, transactions, projects) |
