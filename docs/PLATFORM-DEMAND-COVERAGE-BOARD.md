# Viventa Demand Coverage Board

Last updated: 2026-03-06  
Owner: Master Admin Product/Engineering

## Objective

Single source of truth to ensure every demand/request is captured, prioritized, assigned, implemented, and verified.

## Status Legend

- `DONE` implemented and validated
- `IN_PROGRESS` active implementation in current cycle
- `NEXT` approved for immediate upcoming cycle
- `BACKLOG` acknowledged, pending capacity or dependency

## Active Coverage Board

| ID | Area | Demand | Status | Owner | Artifact |
|---|---|---|---|---|---|
| DEM-001 | Branding | Reusable logo across public/admin surfaces | DONE | Frontend | `components/BrandLogo.tsx` |
| DEM-002 | Trust/Visibility | Only active + approved professionals visible publicly | DONE | Backend | `app/api/agents/route.ts`, `app/api/brokers/route.ts` |
| DEM-003 | Professional Landing | Broker public landing by slug | DONE | Fullstack | `app/broker/[slug]/page.tsx` |
| DEM-004 | Professional Landing | Agent public landing by slug | DONE | Fullstack | `app/agent/[slug]/page.tsx`, `app/api/agents/profile/[slug]/route.ts` |
| DEM-005 | Professional Profile Ops | Self-service professional public profile settings | DONE | Fullstack | `app/dashboard/settings/page.tsx` |
| DEM-006 | Governance | Admin control to hide/show public professional profile | DONE | Fullstack | `app/(dashboard)/master/users/page.tsx`, `app/api/admin/users/route.ts` |
| DEM-007 | Security | Impersonation safe start/stop + audit + lockouts | DONE | Backend | `app/api/admin/users/impersonate/route.ts`, `app/api/admin/stop-impersonation/route.ts` |
| DEM-008 | Oversight | User activity timeline in master profile | DONE | Fullstack | `app/api/admin/users/[id]/activity/route.ts` |
| DEM-009 | Inventory RD | Sprint 1 backend closure (`INV-003` to `INV-008`) | IN_PROGRESS | Backend | `docs/PROJECT-INVENTORY-RD-SPRINT-1-EXECUTION-PLAN.md` |
| DEM-010 | Routing Ops | Lead routing control center hardening completion | NEXT | Fullstack | `app/api/admin/control/stream/route.ts` |
| DEM-011 | Broker Admin RD | Broker OS DR reality model execution (office ops, MLS interno, pipeline, comisiones, documentos) | DONE | Fullstack | `docs/BROKER-OS-ARCHITECTURE.md`, `app/dashboard/page.tsx`, `app/api/broker/dashboard/overview/route.ts`, `app/api/broker/mls/route.ts`, `app/api/broker/transactions/route.ts` |
| DEM-012 | Agent Portal RD | Agent dashboard finalization (personal production, leads, listings, activity, transactions) | DONE | Fullstack | `app/dashboard/page.tsx`, `app/api/agent/dashboard/overview/route.ts` |
| DEM-013 | Constructora RD | Constructora workspace finalization (projects, inventory, reservations, broker handoff) | DONE | Fullstack | `app/dashboard/page.tsx`, `app/api/constructora/dashboard/overview/route.ts` |
| DEM-014 | Permissions Core | Master-admin-first role inheritance + scoped data isolation enforcement by office/project | DONE | Backend | `middleware.ts`, `app/api/auth/login/route.ts`, `lib/listingOwnership.ts` |

## Missing Elements Radar (Immediate)

1. Agent SEO/canonical policy finalization (`/agent/:slug` primary, legacy route compatibility strategy).
2. Server-side impersonation guardrails expansion in all privileged mutation APIs.
3. Public profile completeness scoring + nudges in dashboard settings.
4. Admin bulk operations for profile visibility and status transitions.
5. Structured SLA/ownership report for lead queue leakage.
6. DR brokerage ops baseline hardening (WhatsApp-first lead contact, reserve-before-contract workflow, referral commission traces).
7. Office-level permissions audit to prevent cross-office data leakage in broker/agent APIs.

## Execution Protocol

Every new demand follows this order:

1. Add entry in this board (`ID`, scope, owner, status).
2. Link implementation artifact(s) when code starts.
3. Move status only after validation (errors/build/test).
4. Update roadmap/pipeline references.

### DR Reality Rule (Mandatory)

All items touching Broker/Agent/Constructora must validate against Dominican Republic operating reality:

1. Lead handling supports WhatsApp-first operations.
2. Transaction flow supports `reserva` before signed contract.
3. Commission logic supports split and referral scenarios.
4. Office-scoped data access is enforced server-side.
5. Project inventory changes preserve constructora ownership boundaries.
