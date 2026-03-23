# VIVENTA Search-To-Email Automation Blueprint

Last updated: 2026-03-23
Scope: automatic listing recommendations based on saved search criteria

## 1. Automation Overview
Objective: automatically match new/updated listings to buyer saved-search preferences and send high-signal recommendation emails with strict compliance and anti-fatigue controls.

System pattern:
- Event-driven matching pipeline
- Idempotent job processing
- Preference-aware email delivery
- Observability-first rollout

## 2. Data Schemas
### 2.1 Saved Search
```json
{
  "id": "ss_123",
  "userId": "uid_abc",
  "tenantId": "office_1",
  "status": "active",
  "locale": "es-DO",
  "frequency": "instant",
  "criteria": {
    "city": ["Santo Domingo"],
    "sector": ["Piantini", "Naco"],
    "listingType": ["sale"],
    "propertyType": ["apartment"],
    "priceMin": 120000,
    "priceMax": 300000,
    "bedroomsMin": 2,
    "bathroomsMin": 2,
    "amenitiesAny": ["pool", "gym"]
  },
  "marketingOptIn": true,
  "unsubscribed": false,
  "lastTriggeredAt": 0,
  "createdAt": 0,
  "updatedAt": 0
}
```

### 2.2 Listing Event Payload
```json
{
  "eventType": "listing.updated",
  "listingId": "lst_42",
  "changedFields": ["price", "status", "city"],
  "listingSnapshotVersion": 7,
  "timestamp": 0
}
```

### 2.3 Recommendation Job
```json
{
  "id": "rj_789",
  "idempotencyKey": "sha256(...)",
  "trigger": "listing.updated",
  "listingId": "lst_42",
  "savedSearchId": "ss_123",
  "userId": "uid_abc",
  "status": "queued",
  "score": 0.87,
  "dispatchWindow": "2026-03-23T14:00:00.000Z",
  "attempt": 0,
  "createdAt": 0,
  "updatedAt": 0
}
```

## 3. Event and Processing Flow
1. Listing change emits `listing.created` or `listing.updated` event.
2. Matcher reads normalized listing projection and candidate saved searches.
3. For each candidate: evaluate filters and compute ranking score.
4. Persist recommendation jobs with idempotency keys.
5. Dispatcher applies preference/frequency/compliance gates.
6. Email service sends template and records telemetry.
7. Delivery + engagement events feed KPI dashboards.

## 4. Matching and Ranking Spec
Hard filters:
- `status=active`
- listing location intersects saved-search location criteria
- listing price within normalized budget bounds
- listing type/property type compatibility

Soft score factors:
- Price proximity score
- Recency boost
- Amenity overlap
- Historical interaction affinity

Tie-breakers:
1. Newer listing first
2. Higher quality score
3. Higher media completeness

## 5. Delivery and Idempotency Controls
Idempotency:
- Key: `hash(userId + listingId + eventType + listingSnapshotVersion + criteriaHash)`
- Unique index on key in recommendation jobs collection

Dedupe:
- Do not send same listing to same user more than once in 7 days unless price drops >= 5%

Frequency policy:
- `instant`: at most 1 send per 12h
- `daily_digest`: local send at 08:00
- `weekly_digest`: Monday 08:00 local time

Backpressure/retry:
- Retries with exponential backoff up to 5 attempts
- Failed terminal jobs moved to dead-letter collection for manual replay

## 6. Compliance and Preference Management
- Require `marketingOptIn=true` and `unsubscribed=false`
- Enforce global suppression list before send
- Include one-click unsubscribe token and preference center link
- Log consent source and timestamp for audit
- Respect locale-specific quiet hours (default 21:00-08:00)

## 7. Firestore Index and Function Considerations
Suggested indexes:
- `savedSearches(status, marketingOptIn, frequency, updatedAt)`
- `listings(status, city, propertyType, listingType, price, updatedAt)`
- `recommendationJobs(status, dispatchWindow, createdAt)`

Function partitioning:
- `onListingWrite -> enqueueMatchingCandidates`
- `processRecommendationJobs -> compute and persist recommendations`
- `dispatchRecommendationEmails -> send + telemetry`

Operational safeguards:
- Feature flag per tenant and per locale
- Kill switch for dispatcher
- Queue depth alerts and execution duration alarms

## 8. QA, Load, and Reliability Test Plan
- Unit tests: criteria normalization, score computation, idempotency key generation
- Integration tests: event ingestion to job creation and dispatch
- E2E tests: saved-search create/update, recommendation received, unsubscribe flow
- Load tests: burst listing updates and backlog recovery behavior
- Chaos tests: email provider outage and retry/dead-letter correctness

## 9. Rollout, Monitoring, and Success Metrics
Rollout phases:
- Canary 5% users in one city
- Expand to 25% with complaint/unsubscribe guardrails
- Full rollout with tenant-by-tenant controls

Core metrics:
- Match generation latency
- Email send success rate
- Open and click-through rate
- Lead conversion from recommendation clicks
- Complaint and unsubscribe rates

Alert thresholds:
- Send failure > 3% over 15 min
- Unsubscribe spike > 2x baseline in 24h
- Queue lag > 5 min on instant recommendations

## 10. Risks, Assumptions, Open Questions
- Risk: high-cardinality criteria can increase matching cost without careful indexing.
- Risk: duplicate updates from listing sync sources can flood queue without idempotency.
- Assumption: recommendation eligibility uses active/visible listing state only.
- Open question: whether broker/agent can manually suppress recommendations for specific listings.
