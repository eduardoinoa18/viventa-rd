# VIVENTA Canonical CRM Stage Model

Last updated: 2026-03-23
Scope: unified model for user, admin, broker, agent, constructora

## 1. Canonical Stage Catalog
| Order | Enum | Label | Entry Criteria | Exit Criteria |
|---|---|---|---|---|
| 1 | `new` | New Lead | Lead created from inquiry, signup, referral, import | Contact attempt logged or disqualified |
| 2 | `qualified` | Qualified | Budget, timeline, and intent validated | Tour scheduled or disqualified |
| 3 | `tour_scheduled` | Tour Scheduled | Date/time confirmed for showing or project visit | Tour completed, no-show, or canceled |
| 4 | `offer_submitted` | Offer Submitted | Buyer submits formal offer or reservation intent | Offer accepted/rejected/expired |
| 5 | `negotiation` | Negotiation | Counter-offer or terms discussion in progress | Terms accepted or lead lost |
| 6 | `under_contract` | Under Contract | Signed contract/reservation with milestone checklist | Closed won or contract canceled |
| 7 | `closed_won` | Closed Won | Deal completed and recorded | Terminal stage |
| 8 | `closed_lost` | Closed Lost | Lead/deal lost with reason code | Terminal stage |

Required terminal reason enums for `closed_lost`:
- `price_mismatch`
- `location_mismatch`
- `financing_failed`
- `chose_competitor`
- `not_responsive`
- `timeline_changed`
- `other`

## 2. Transition Matrix
Allowed transitions:
- `new` -> `qualified`, `closed_lost`
- `qualified` -> `tour_scheduled`, `closed_lost`
- `tour_scheduled` -> `offer_submitted`, `qualified`, `closed_lost`
- `offer_submitted` -> `negotiation`, `under_contract`, `closed_lost`
- `negotiation` -> `under_contract`, `closed_lost`
- `under_contract` -> `closed_won`, `closed_lost`

Blocked transitions:
- Any transition from terminal stages (`closed_won`, `closed_lost`) without explicit reopen policy
- Direct `new` -> `under_contract`
- Direct `qualified` -> `closed_won`

Reopen policy:
- `closed_lost` -> `qualified` allowed only with `reopenReason` and broker/admin approval

## 3. Permission Matrix by Role
| Role | View | Create | Edit Core Fields | Change Stage | Reassign Owner | Close Lead |
|---|---|---|---|---|---|---|
| User | Own lead summary only | Inquiry creates lead | Preferences only | No | No | No |
| Agent | Tenant-scoped assigned leads | Yes | Yes | Yes (non-terminal) | Request only | `closed_lost` only |
| Broker | Tenant-scoped office leads | Yes | Yes | Yes (all) | Yes | Yes |
| Constructora | Developer-scoped project leads | Yes | Yes | Yes (project-linked) | Yes (within scope) | Yes |
| Admin | Global read with audit | No direct create | Policy fields only | Exception workflow only | Exception workflow only | Exception workflow only |

## 4. Data Contract (Firestore)
Collection: `leads/{leadId}`

Required fields:
- `tenantType`: `brokerage | constructora`
- `tenantId`: string
- `stage`: canonical enum
- `stageUpdatedAt`: timestamp
- `stageUpdatedBy`: uid
- `ownerUserId`: uid
- `source`: `web_inquiry | referral | manual | import | campaign`
- `priority`: `low | medium | high`
- `slaDueAt`: timestamp
- `contact`: `{ name, email?, phone? }`
- `listingContext`: `{ listingId?, projectId?, unitId? }`

Optional fields:
- `budgetMin`, `budgetMax`, `currency`
- `timelineMonths`
- `locale`, `preferredAreas[]`, `propertyTypes[]`
- `lostReason` (required when `stage=closed_lost`)
- `reopenReason` (required on reopen)

Validation rules:
- `lostReason` mandatory for `closed_lost`
- Terminal stages immutable without privileged reopen workflow
- `budgetMin <= budgetMax` when both present
- Cross-tenant write attempts denied at server and rules layer

## 5. SLA and Automation Rules
- `new`: first response <= 15 min business hours
- `qualified`: follow-up <= 24h
- `tour_scheduled`: reminder at T-24h and T-2h
- `offer_submitted`: decision checkpoint <= 48h
- `under_contract`: milestone checks every 72h until close

Escalation policy:
- SLA miss creates `activityEvents` of type `lead.sla_breached`
- Escalate to broker/manager queue after two misses

## 6. KPI and Reporting Standard
Core KPIs:
- Stage-to-stage conversion rate
- Time-in-stage median and P90
- SLA breach rate by role/team
- Win rate and loss reason distribution
- Assignment-to-first-contact latency

Dashboard slicing dimensions:
- Role, office/tenant, city, listing type, source channel, date bucket

## 7. Migration Plan and Backfill
Phase A:
- Introduce canonical enums in shared types and API validation
- Add mapping layer from legacy labels to canonical enums

Phase B:
- Backfill existing leads with mapped canonical stages
- Populate `stageUpdatedAt` and reason fields where missing

Phase C:
- Remove legacy labels from UI/API payloads
- Enforce strict transition rules and reopen workflow

## 8. QA and Rollout Checklist
- Unit tests for transition validator
- Contract tests for stage-specific required fields
- Role authorization tests for stage mutation
- Data migration dry-run and rollback script
- Canary rollout by tenant cohorts with kill switch

## 9. Risks, Assumptions, Open Questions
- Risk: legacy reports may break if they depend on old stage strings.
- Risk: constructs with mixed broker+constructora ownership require explicit precedence rules.
- Assumption: all stage updates flow through API/Functions layer, not direct client writes.
- Open question: should `tour_completed` be modeled as a stage or as an event flag under `tour_scheduled`.
