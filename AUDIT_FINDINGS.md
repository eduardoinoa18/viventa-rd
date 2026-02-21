# Codebase Audit Findings (2026-02-19)

## Scope
Quick static review focused on:
- Legacy references
- Unused imports / dead declarations
- Security concerns
- Duplicated logic

## Legacy references
1. `lib/algoliaClient.ts` is explicitly marked deprecated and retained as a compatibility stub for legacy imports.
2. `lib/firebaseAdmin.ts` still contains a fallback path to "legacy envs" for split Firebase admin env vars.
3. `lib/stripeService.ts` is explicitly scaffold/stubbed with TODO notes for future server-side implementation.

## Unused imports / declarations
Using TypeScript with `--noUnusedLocals --noUnusedParameters` surfaced a large set of unused imports/declarations (100+).
Representative examples:
- `app/admin/activity/page.tsx`: `FiXCircle` unused.
- `app/admin/master/AuditLogs.tsx`: all imports in declaration unused.
- `app/layout.tsx`: `Link` and `LocaleSwitcher` unused.
- `components/PropertyCard.tsx`: `useEffect` and `formatFeatures` unused.
- `lib/firebaseClient.ts`: several imported Firebase types unused.

## Security issues (high-confidence)
1. `middleware.ts` uses an insecure default trusted-device secret fallback (`'dev-secret-change-me'`) if `TRUSTED_DEVICE_SECRET` is missing.
2. `app/api/dev/seed-pro-users/route.ts` includes hard-coded default demo credentials and only conditionally restricts access in production unless a secret is configured.
3. `app/api/auth/gate/route.ts` performs code comparison but does not implement explicit rate limiting/brute-force protection.
4. `app/api/contact/submit/route.ts` interpolates user-controlled fields directly into HTML email templates (possible injection/content spoofing risk in mail clients).

## Duplicated logic
1. `app/api/contact/route.ts` and `app/api/contact/submit/route.ts` overlap significantly in contact intake responsibility, persistence, and error handling patterns (divergent validation/rate-limit behavior).
2. `lib/firebaseAdmin.ts` duplicates initialization flow between `getAdminDb()` and `getAdminAuth()` (same credential build + app init checks).

## Notes
- This report captures findings; no behavioral code fixes were applied in this commit.
