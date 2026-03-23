# VIVENTA Phase 1 — AI Execution Tracker

Last updated: 2026-03-12  
Baseline commit: `8423c29`  
Branch: `main`

---

## Purpose

This file is the operational tracker for any follow-up AI agent.  
Use it as the **single source of truth** for what is done, what is pending, and what to execute next.

Primary references:
- `docs/audit/phase1/PHASE1-FINDINGS.md`
- `docs/audit/phase1/AI-HANDOFF-2026-03-12.md`
- `docs/audit/phase1/auth-matrix.json`
- `docs/audit/phase1/firebaseclient-imports.json`
- `docs/audit/phase1/high-limits.json`

---

## Current State Snapshot

## Completed
- Auth matrix generated for 152 routes
- Firebase client SDK server-import inventory generated (15 files)
- Firestore high-limit inventory generated (66 findings)
- Human-readable findings report generated
- Typesense schema artifact generated
- Critical fix applied: `app/api/projects/create/route.ts` now uses verified session and `session.uid` as `developerId`

## Still open (high priority)
1. `lib/projectService.ts` still uses `firebaseClient` (server boundary still violated indirectly)
2. Debug/dev endpoints still exposed:
   - `app/api/debug/env/route.ts`
   - `app/api/dev/seed-pro-users/route.ts`
3. No lint/guard rule yet to ban `firebaseClient` imports under `app/api/**`
4. Top high-cost `limit()` endpoints still unrefactored
5. Rate limiter still in-memory (`lib/rateLimiter.ts`)

---

## Priority Queue (Execution Order)

## P0 — Security blockers (do first)

### Task P0.1 — Migrate `lib/projectService.ts` to Admin SDK
**Goal:** Remove client SDK usage from server code path used by `app/api/projects/**` routes.  
**Files:**
- `lib/projectService.ts`
- `app/api/projects/create/route.ts`
- `app/api/projects/list/route.ts`
- `app/api/projects/[projectId]/route.ts`
- `app/api/projects/[projectId]/stats/route.ts`
- `app/api/projects/[projectId]/units/route.ts`
- `app/api/projects/[projectId]/units/[unitId]/route.ts`

**Acceptance criteria:**
- No import of `@/lib/firebaseClient` in `lib/projectService.ts`
- Project APIs functionally unchanged (response shapes preserved)
- Build passes for these routes

---

### Task P0.2 — Lock down debug/dev endpoints
**Goal:** Prevent production data/config leakage and unsafe seed execution.  
**Files:**
- `app/api/debug/env/route.ts`
- `app/api/dev/seed-pro-users/route.ts`

**Required behavior:**
- Either hard-disable in production (`NODE_ENV === 'production'` => `403/404`)
- Or require verified `master_admin` session + 2FA

**Acceptance criteria:**
- Unauthenticated request gets denied
- Non-admin request gets denied
- Production mode access denied by default

---

### Task P0.3 — Enforce server/client SDK boundary via lint
**Goal:** Fail CI/build when `firebaseClient` is imported under `app/api/**`.  
**Files likely involved:**
- `.eslintrc*` or eslint config file in repo

**Suggested rule strategy:**
- `no-restricted-imports` with override on `app/api/**/*`

**Acceptance criteria:**
- Intentional test import in an API route triggers lint failure
- Existing 15 violations are discoverable and block merge until fixed

---

## P1 — Auth normalization on highest-risk routes

### Task P1.1 — Add `getSessionFromRequest()` and role checks
**Target routes first:**
- `app/api/user/delete-account/route.ts`
- `app/api/user/export-data/route.ts`
- `app/api/user/me/route.ts`
- `app/api/user/stats/route.ts`
- `app/api/messages/route.ts`
- `app/api/crm/buyers/route.ts`
- `app/api/crm/buyers/[id]/route.ts`
- `app/api/crm/buyers/[id]/send-matches/route.ts`

**Acceptance criteria:**
- `401` when no valid session
- `403` when role not allowed
- No data returned before auth passes

---

### Task P1.2 — Add tenancy-scoped query filters
**Scope requirements:**
- broker/agent queries include `officeId == session.officeId`
- constructora queries include `constructoraCode == session.code` (or canonical equivalent)
- projects/units include `developerId == session.uid` where applicable

**Acceptance criteria:**
- Cross-tenant request attempts return empty/403
- No route returns globally scoped data for tenant-bound resources

---

## P1 — Scalability hotspots

### Task P1.3 — Refactor top 5 high-cost queries
**Targets from high-limits report:**
- `app/api/admin/users/overview/route.ts` (`limit(10000)`)
- `app/api/admin/growth/overview/route.ts`
- `app/api/admin/marketplace-intelligence/overview/route.ts`
- `app/api/broker/analytics/revenue/route.ts`
- `app/api/activity-events/summary/route.ts`

**Refactor patterns:**
- cursor pagination (`startAfter`) for list endpoints
- pre-aggregation docs for dashboards
- avoid in-memory filtering of oversized snapshots

**Acceptance criteria:**
- No `limit > 500` in these endpoints without explicit reason
- Median response time and reads reduced in local profiling

---

## P2 — Platform hardening

### Task P2.1 — Replace in-memory rate limiter
**File:** `lib/rateLimiter.ts`  
**Target:** Upstash Redis + `@upstash/ratelimit`

### Task P2.2 — Analytics fallback correctness
Ensure analytics APIs return proper error states instead of mock/fallback payloads on data failure.

### Task P2.3 — Auth regression tests
Add route-family tests for:
- unauthenticated access
- wrong-role access
- cross-tenant access attempts

---

## Working Rules for Any AI Continuing This

1. Do not change API response shapes unless required by security bug fix.
2. Prefer minimal, surgical edits per route family.
3. After each task group, run `npm run build` and capture exact errors.
4. Do not commit generated `public/service-worker.js` unless intentionally updating PWA build artifacts.
5. Update this tracker after each merged chunk.

---

## Suggested Progress Logging Format

When finishing a task, append a section:

```md
### Update YYYY-MM-DD HH:mm
- Task: P0.1
- Status: Completed
- Commit: <hash>
- Files changed:
  - path/a
  - path/b
- Validation:
  - npm run build: PASS/FAIL
  - notes
- Remaining blockers:
  - ...
```

---

### Update 2026-03-12 18:40
- Task: P0.1 + P0.2 + P0.3 (partial enforcement)
- Status: Completed (with follow-up items)
- Commit: pending
- Files changed:
  - `lib/projectService.ts`
  - `app/api/projects/list/route.ts`
  - `app/api/debug/env/route.ts`
  - `app/api/dev/seed-pro-users/route.ts`
  - `.eslintrc.json`
- Validation:
  - `npm run build`: PASS
  - Notes: API routes with `@/lib/firebaseClient` now produce lint warnings (non-blocking) via `no-restricted-imports`.
- Remaining blockers:
  - Migrate remaining API routes still importing `@/lib/firebaseClient` (admin/analytics/contact/health/recommendations/stats/stripe/user endpoints)
  - Decide when to raise lint restriction from warning to error after migration

### Update 2026-03-12 20:05
- Task: Workspace unification + demo dataset + admin moderation hardening
- Status: Completed
- Commit: pending
- Files changed:
  - `app/api/listings/workspace/route.ts`
  - `app/dashboard/listings/page.tsx`
  - `app/api/admin/properties/route.ts`
  - `app/api/admin/properties/bulk/route.ts`
  - `app/api/dev/seed-platform-demo/route.ts`
  - `app/dashboard/broker/crm/page.tsx`
  - `docs/DEMO-SEED-PLAYBOOK.md`
- Validation:
  - `npm run build`: PASS
- Notes:
  - Unified listing workspace now supports `my` and `mls` modes with role-based permissions.
  - Master admin-only guard enforced on listing moderation endpoints.
  - New secure non-prod seed endpoint creates constructora + brokers + agents + 10 DR prime demo listings.
- Remaining blockers:
  - Normalize remaining role dashboards into shared component architecture (P1 UX refinement)
  - Extend MLS filters with pagination/indexed query strategy beyond 2,500 row cap

### Update 2026-03-12 20:30
- Task: Listings workspace performance and UX refinement
- Status: Completed
- Commit: pending
- Files changed:
  - `app/api/listings/workspace/route.ts`
  - `app/dashboard/listings/page.tsx`
- Validation:
  - `npm run build`: PASS
- Notes:
  - Added server pagination metadata (`total`, `page`, `pageSize`, `hasMore`).
  - Added workspace search filters (`q`, `city`, `minPrice`, `maxPrice`) and client pagination controls.
- Remaining blockers:
  - Replace 2,500 hard cap with indexed cursor strategy to avoid wide scans under high inventory volume.

### Update 2026-03-12 21:05
- Task: Listings workspace query-first scalability pass
- Status: Completed
- Commit: `2801fbf`
- Files changed:
  - `app/api/listings/workspace/route.ts`
- Validation:
  - `npm run build`: PASS
- Notes:
  - Replaced primary wide-scan behavior with mode-aware Firestore query-first candidate retrieval.
  - Added deduped multi-query aggregation for `my` mode and query-filter application at fetch time (`status`, `city`) before in-memory refinements.
  - Preserved fallback fetch path for sparse/index-miss scenarios and kept response shape stable.
- Remaining blockers:
  - Move from limit-based candidate expansion to true cursor pagination for very high-cardinality MLS inventory.

## Ready-to-Use Prompts for Next AI

### Prompt 1 — Project service migration
"Migrate `lib/projectService.ts` to Firebase Admin SDK so all `app/api/projects/**` endpoints are server-safe. Preserve API response shapes and run build afterward. Update `docs/audit/phase1/AI-EXECUTION-TRACKER.md` with results."

### Prompt 2 — Debug endpoint lockdown
"Secure `app/api/debug/env/route.ts` and `app/api/dev/seed-pro-users/route.ts` so they are not callable by non-master-admin users and are disabled in production. Run build and update tracker."

### Prompt 3 — SDK lint guard
"Add ESLint restrictions preventing `firebaseClient` imports in `app/api/**`. Verify violations are caught. Then list remaining violating files from `docs/audit/phase1/firebaseclient-imports.json`."

### Prompt 4 — Auth high-risk routes
"Implement strong auth (`getSessionFromRequest` + role + tenancy filters) for the highest-risk non-admin routes listed in the tracker P1 section. Keep changes minimal and run build."

### Prompt 5 — Query hotspot refactor
"Refactor the top 5 oversized query endpoints from `high-limits.json` to pagination/aggregation. Keep output behavior stable and document read/latency impact assumptions in tracker update."

### Update 2026-03-23 11:20
- Task: Cross-role platform standardization artifacts (planning/execution docs)
- Status: Completed
- Commit: pending
- Files changed:
  - `docs/audit/phase1/PLATFORM-STANDARDIZATION-PLAN.md`
  - `docs/audit/phase1/CRM-CANONICAL-STAGE-MODEL.md`
  - `docs/audit/phase1/SEARCH-EMAIL-AUTOMATION-BLUEPRINT.md`
- Validation:
  - Documentation artifacts generated and linked to Phase 1 scope
  - Aligned with role parity requirement (user/admin/broker/agent/constructora)
- Notes:
  - Established canonical listing states and CRM stages for cross-portal parity.
  - Defined shared event model and automation controls (idempotency, dedupe, frequency caps, compliance checks).
  - Added phased implementation plan and measurable KPI/observability expectations.
- Remaining blockers:
  - Convert docs into concrete implementation tickets by route family and service owner.
  - Add shared TypeScript enums/contracts for canonical stages and event types in code.
  - Implement and test recommendation automation workers with feature flags and kill switch.
