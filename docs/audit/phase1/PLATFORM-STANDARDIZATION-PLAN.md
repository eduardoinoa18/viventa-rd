# VIVENTA Platform Standardization Plan

Last updated: 2026-03-23
Scope: user, admin, broker, agent, constructora

## 1. Executive Summary
VIVENTA has strong feature coverage but inconsistent semantics across role portals (state names, workflow steps, and ownership boundaries differ by surface). This plan defines a canonical platform contract for listings, lead lifecycle, CRM, buyer activity, and recommendation automation while preserving incremental delivery.

Primary outcome for Phase 1-2:
- One canonical CRM stage model and transition policy
- One shared listing lifecycle and visibility model
- Shared event taxonomy for buyer activity and automation
- Standardized permission matrix and tenancy constraints
- Automated saved-search recommendations with compliance controls

## 2. Current State Matrix
| Capability | User | Admin | Broker | Agent | Constructora | Current Risk |
|---|---|---|---|---|---|---|
| Listings search/discovery | Yes | Limited | Yes | Yes | Project/unit-centric | Filter/state naming drift |
| Listing moderation/governance | No | Yes | Partial | No | Partial | Role boundary ambiguity |
| Lead capture and assignment | Yes (inquiry) | Oversight | Yes | Yes | Partial | Inconsistent assignment ownership |
| CRM stage pipeline | Minimal visibility | Oversight | Custom states | Custom states | Custom states | No canonical stage model |
| Buyer activity events | Partial | Dashboarded | Partial | Partial | Partial | Incomplete shared event schema |
| Saved search | Yes | N/A | Indirect | Indirect | Indirect | Matching contract not standardized |
| Auto email recommendations | Partial/manual | N/A | Manual | Manual | Manual | Trigger and idempotency gaps |
| KPI dashboards | Basic | Extensive | Extensive | Extensive | Extensive | Metrics defined differently by role |

## 3. Gap and Inconsistency Report (Highest Risk First)
1. CRM state drift across role surfaces causes reporting mismatch and blocked automation eligibility checks.
2. Permission checks and tenancy scopes are not consistently encoded in all route families, creating risk of cross-tenant leakage.
3. Listings and lead entities use role-specific naming variants, increasing integration complexity and query bugs.
4. Buyer activity and recommendation triggers are not modeled as a single event contract, reducing automation reliability.
5. Email recommendation behavior lacks shared dedupe/frequency policy, risking user fatigue and spam complaints.

## 4. Canonical Platform Standards
### 4.1 Canonical entity names
- `Listing`: marketable property inventory item
- `Lead`: buyer/seller opportunity record
- `Deal`: transaction pipeline object
- `BuyerProfile`: normalized search and intent profile
- `SavedSearch`: persisted user criteria used for matching
- `ActivityEvent`: immutable user/system event

### 4.2 Canonical listing states
- `draft`
- `pending_review`
- `active`
- `paused`
- `under_contract`
- `sold`
- `archived`

### 4.3 Canonical CRM stages (shared)
- `new`
- `qualified`
- `tour_scheduled`
- `offer_submitted`
- `negotiation`
- `under_contract`
- `closed_won`
- `closed_lost`

### 4.4 Permission standard
- User: read own profile/searches, submit inquiries, manage preferences
- Agent: manage own leads/deals/listings within tenant scope
- Broker: manage office leads/deals/listings and assignment policies
- Constructora: manage developer projects/units/reservations in constructora scope
- Admin: moderation, policy, and audit controls; no tenant data mutation without explicit reason code

## 5. Shared Data Model and Event Flow
### 5.1 Core collection contracts
- `listings/{listingId}`: canonical lifecycle + visibility + owner references
- `leads/{leadId}`: source, assignment, stage, SLA fields, tenant references
- `savedSearches/{savedSearchId}`: user criteria, locale, frequency, consent flags
- `activityEvents/{eventId}`: actor, eventType, entityRef, context, timestamp
- `recommendationJobs/{jobId}`: trigger metadata, idempotency key, execution status

### 5.2 Canonical event types
- `listing.created`
- `listing.updated`
- `listing.status_changed`
- `lead.created`
- `lead.stage_changed`
- `buyer.search_saved`
- `buyer.search_updated`
- `buyer.listing_viewed`
- `recommendation.generated`
- `recommendation.email_sent`

## 6. Automation Blueprint
### 6.1 Saved-search criteria matching
- Normalize criteria fields: `city`, `sector`, `priceMin`, `priceMax`, `listingType`, `propertyType`, `bedroomsMin`, `bathroomsMin`, `amenitiesAny`
- Normalize currency at match-time to base comparison currency
- Reject invalid ranges and write validation errors to structured telemetry

### 6.2 Listing recommendation triggers
- Trigger on `listing.created`, and `listing.updated` where searchable fields changed
- Trigger also on `savedSearches` create/update to backfill candidate listings
- Require idempotency key: `hash(eventType + entityId + criteriaVersion + dayBucket)`

### 6.3 Email dispatch and controls
- Frequency options: `instant`, `daily_digest`, `weekly_digest`
- Frequency cap default: max 1 send per user per 12h for instant mode
- Dedupe key per user/listing per 7-day window
- Quiet hours by locale (default 21:00-08:00 local time)

### 6.4 Compliance checks
- Require explicit `marketingOptIn=true` for recommendation emails
- Include one-click unsubscribe token and preference center link
- Enforce suppression list before enqueue/send
- Store consent and unsubscribe audit trail with timestamp/source

## 7. Delivery Roadmap by Phase
### Phase 1 (2 weeks): Foundation
- Ship canonical enums for listing + CRM stages in shared types
- Map existing role-specific states to canonical enums
- Introduce event contract for listing/lead/search activity
- Add permission matrix tests for critical routes

### Phase 2 (2-3 weeks): Automation Core
- Build matching service and recommendation job queue
- Implement idempotency, dedupe, and frequency cap logic
- Integrate templated email dispatch and preference center checks
- Add monitoring dashboards and alert thresholds

### Phase 3 (2 weeks): Hardening and Expansion
- Enable canary rollout cohorts and kill switches
- Tune ranking/freshness and reduce noisy recommendations
- Expand role-specific reporting with shared KPI semantics
- Complete migration/backfill and retire legacy state names

## 8. QA and Observability Checklist
- Type checks and lint pass on touched modules
- E2E coverage for role parity workflows across all five surfaces
- Contract tests for stage transitions and invalid transitions
- Idempotency tests for repeated event replay
- Load test recommendation generation and dispatch throughput
- Monitor: enqueue lag, send failure rate, unsubscribe spike, complaint rate, cross-tenant access denial counts

## 9. Open Questions and Assumptions
- Assumption: existing tenant keys (`officeId`, `brokerageId`, `constructoraCode`) remain source-of-truth in Phase 1.
- Assumption: recommendation automation uses Cloud Functions workers and not request/response routes.
- Open question: whether admin can manually transition CRM stages or only approve policy exceptions.
- Open question: SLA defaults by role/market segment (luxury, general residential, pre-construction).
