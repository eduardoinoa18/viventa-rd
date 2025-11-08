# Repository Review & Continuity Checklist

This document helps the Copilot agent (and human reviewers) systematically assess current state and plan next steps.

## 1. High-Level Health
- [ ] Build passes (`npm run build`)
- [ ] No TypeScript errors
- [ ] No uncommitted changes
- [ ] Dependencies updated & minimal
- [ ] ENV variables documented (add to docs/ENVIRONMENT.md if missing)

## 2. Recent Major Changes (Already Implemented)
- Message API endpoints: mark-read & typing
- Enhanced public listing page: gallery carousel, share buttons, similar properties
- Security hardening: removed demo credentials, added rate limiting to cleanup endpoint
- Documentation organization: 46 markdown files moved into `docs/`
- Skeleton loaders: property card, message thread, activity feed, agent card
- Cleanup: removed stale backup `.old` files

## 3. Pending / Backlog Items
- [ ] SEO metadata exports for listing, search, static marketing pages
- [ ] Mobile polish: pull-to-refresh, improved touch spacing
- [ ] Agent dashboard KPIs & actionable widgets
- [ ] Advanced search: map + multi-filter + saved searches UX
- [ ] Email notifications: inquiries, unread messages, saved search alerts
- [ ] Onboarding flow improvements (progress tracker, guidance overlays)
- [ ] Gamification / engagement (streaks, badges, referral incentives)
- [ ] Automated tests for new API routes (messages, cleanup)
- [ ] ErrorBoundary integration around critical routes
- [ ] Observability: lightweight logging + analytics events audit

## 4. Security & Compliance
- [ ] Rate limits applied to all sensitive admin routes
- [ ] Input validation (Zod / schema) for all API payloads
- [ ] Firestore rules audited for least privilege
- [ ] Secrets safe (no accidental console logging, no plaintext secrets)

## 5. Performance
- [ ] Image optimization verified (lazy loading, responsive sizes)
- [ ] Avoid N+1 queries in property listing page
- [ ] Consider caching for similar properties query
- [ ] Lighthouse run (scores recorded in `docs/PERFORMANCE.md`)

## 6. DX & Maintainability
- [ ] Consistent component folder structure
- [ ] Dead code removal pass (identify unused components in `components/`)
- [ ] Shared utility extraction (duplicate logic in API routes?)
- [ ] Add scripts for common tasks (e.g., data seeding)

## 7. Testing Strategy (Proposed)
Create `__tests__/` folder:
- [ ] Unit: rateLimiter behavior
- [ ] Unit: currency formatting & i18n
- [ ] Integration: messages/typing API
- [ ] Integration: listing page renders gallery + similar properties

## 8. Release & Rollback
- [ ] Document rollback steps in `docs/DEPLOYMENT.md`
- [ ] Tag release once merged (e.g., v0.2.0)

## 9. Action Plan (Next Iteration)
1. Add SEO metadata utilities (`lib/seoUtils.ts` enhancement + dynamic head components)
2. Implement saved searches + email notification skeleton
3. Agent dashboard KPI widgets (leverage existing analytics hooks)
4. Add rate limiter + schema validation to all remaining admin APIs
5. Begin test harness setup (Jest / Vitest) and first 4 tests

## 10. Meta
- Last updated: (update when modifying)
- Branch: `copilot/vscode1762629539177`

---
Feel free to check off items as they are completed and keep this document updated per PR.
