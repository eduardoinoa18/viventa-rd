# STEP 1 · Week 1 Build Spec
## Lead State Machine (Single Owner Deterministic Model)

Date: 2026-03-01
Owner: Admin Platform / Core Operations
Status: Ready for implementation

---

## 1) Objective

Implement a deterministic lead lifecycle engine for Viventa admin operations.

This week delivers:
- Strict lead stage state machine
- Single-owner enforcement
- Server-side SLA timers per stage
- Immutable stage and assignment audit trail
- Compatibility layer for legacy `status` consumers

This is the P0 foundation for all Step 1 Operational Integrity work.

---

## 2) Architecture Decision (Final)

### Lead ownership model
**Single owner only**.

- Canonical owner field: `ownerAgentId` (string | null)
- Optional non-owning collaborators: `collaboratorAgentIds: string[]` (read/assist only)
- Exactly one accountable owner at any point in time (or explicit unassigned during intake)

Why:
- Deterministic routing and accountability
- Clear SLA responsibility
- Clean auditability and escalation logic

---

## 3) Current State (from codebase)

Existing foundation already present:
- Stage engine and transition validator in `lib/leadLifecycle.ts`
- Queue API supports `leadStage`, transition checks, and SLA due timestamp in `app/api/admin/leads/queue/route.ts`
- Stage event and reassignment logs already written to:
  - `lead_stage_events`
  - `lead_assignment_logs`

Key inconsistencies to resolve in Week 1:
- Legacy status vs stage duality (`status` + `leadStage`) still mixed
- Assignment field shape not fully canonical (`assignedTo` varies)
- Older auto-assign endpoint writes to other collections (`property_inquiries`, etc.)
- Admin leads UI still drives by legacy statuses only

---

## 4) Domain Model (Week 1 Target)

## 4.1 Lead document (`leads/{leadId}`)

Required fields:
- `id: string`
- `leadStage: LeadStage`
- `legacyStatus: LegacyLeadStatus` (derived compatibility field)
- `ownerAgentId: string | null`
- `ownerAssignedAt: Timestamp | null`
- `ownerAssignedBy: string | null`
- `ownerAssignmentReason: string | null`
- `stageChangedAt: Timestamp`
- `stageChangedBy: string | null`
- `stageChangeReason: string`
- `stageSlaDueAt: Timestamp | null`
- `slaBreached: boolean`
- `slaBreachedAt: Timestamp | null`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

Optional but recommended:
- `collaboratorAgentIds: string[]`
- `inboxConversationId: string | null`
- `source: 'property' | 'project' | 'agent' | 'direct'`
- `sourceId: string | null`
- `buyerName`, `buyerEmail`, `buyerPhone`, `message`

## 4.2 Stage events collection (`lead_stage_events`)

Event payload:
- `leadId`
- `previousStage`
- `newStage`
- `actorUserId`
- `actorEmail`
- `reason`
- `createdAt`
- `requestId` (new)

## 4.3 Assignment log collection (`lead_assignment_logs`)

Event payload:
- `leadId`
- `previousOwnerAgentId`
- `newOwnerAgentId`
- `eventType: 'assigned' | 'reassigned' | 'unassigned'`
- `reason`
- `actorUserId`
- `actorEmail`
- `createdAt`
- `requestId` (new)

---

## 5) State Machine Contract

Use canonical enum:
- `new`
- `assigned`
- `contacted`
- `qualified`
- `negotiating`
- `won`
- `lost`
- `archived`

Allowed transitions:
- `new -> assigned | lost | archived`
- `assigned -> contacted | lost | archived`
- `contacted -> qualified | lost | archived`
- `qualified -> negotiating | lost | archived`
- `negotiating -> won | lost | archived`
- `won -> archived`
- `lost -> archived`
- `archived -> (none)`

Hard rules:
- Transition attempts outside matrix return `400 INVALID_STAGE_TRANSITION`
- Terminal stages (`won|lost|archived`) cannot be assigned/reassigned
- Reassigning owner requires non-empty reason
- If stage moves to `assigned` and owner missing => reject

---

## 6) SLA Engine Contract

Stage SLA policy (server-owned):
- `new`: 1h
- `assigned`: 2h
- `contacted`: 24h
- `qualified`: 48h
- `negotiating`: 72h
- `won|lost|archived`: no SLA

Computation:
- `stageSlaDueAt` recomputed on every stage change
- `slaBreached` computed by server read-time or materialized update task
- Breach condition: `now > stageSlaDueAt` and stage not terminal

Week 1 includes:
- utility function hardening in `lib/leadLifecycle.ts`
- shared SLA evaluator for APIs/UI

---

## 7) API Contracts (Week 1)

## 7.1 Update lead lifecycle
`PATCH /api/admin/leads/queue`

Request:
```json
{
  "id": "lead_123",
  "leadStage": "qualified",
  "ownerAgentId": "uid_abc",
  "reason": "buyer budget validated",
  "inboxConversationId": "conv_456"
}
```

Validation:
- id required
- transition valid
- if owner change and prior owner exists -> reason required
- owner required when resulting stage is `assigned` or later (except explicit rule exceptions)

Response:
```json
{
  "ok": true,
  "message": "Lead updated successfully"
}
```

## 7.2 Assign/reassign convenience endpoint
`POST /api/admin/leads/assign`

Request:
```json
{
  "leadId": "lead_123",
  "agentId": "uid_abc",
  "note": "manual redistribution"
}
```

Behavior:
- Sets `ownerAgentId`
- If stage is `new`, auto-transition to `assigned`
- Writes assignment log + stage event

## 7.3 Queue read endpoint
`GET /api/admin/leads/queue?stage=&legacyStatus=&ownerAgentId=&sla=overdue&limit=`

Response additions:
- `slaBreached`
- `secondsToBreach` (or negative overdue seconds)
- stage-first stats block

## 7.4 Deprecation marker
`POST /api/admin/leads/auto-assign`
- Keep temporarily but route internally to canonical owner fields.
- Stop writing to non-canonical lead source collections for new flow.

---

## 8) Backward Compatibility

During migration window keep:
- `status` as derived field from stage (`stageToLegacyStatus`)

Compatibility map:
- `new -> unassigned`
- `assigned -> assigned`
- `contacted|qualified|negotiating -> contacted`
- `won -> won`
- `lost|archived -> lost`

Rule:
- API accepts legacy `status` input only as fallback (deprecated)
- API always stores canonical `leadStage`

---

## 9) Migration Plan (No downtime)

## Phase A: Schema prep (Day 1)
- Add canonical owner fields and SLA fields to write paths
- Keep existing fields untouched

## Phase B: Backfill script (Day 2)
Create script `scripts/migrations/backfill-lead-owner-stage.ts`:
- For each lead:
  - infer `leadStage` from existing `leadStage || status`
  - map assignment into `ownerAgentId`
  - set missing `stageChangedAt`, `stageSlaDueAt`
  - set `legacyStatus`

## Phase C: Dual-read dual-write (Day 3)
- Reads prioritize canonical fields
- Writes update both canonical and compatibility fields

## Phase D: UI switch (Day 4)
- Admin leads page uses stage filters and shows SLA timers
- Legacy status pills can remain as secondary labels

## Phase E: Enforcement hardening (Day 5)
- Reject invalid payloads that conflict with canonical rules
- Emit warning logs for deprecated inputs

---

## 10) Implementation File Plan

Core updates:
- `lib/leadLifecycle.ts` (tighten rules, add helpers)
- `app/api/admin/leads/queue/route.ts` (canonical ownerAgentId + stage-first)
- `app/api/admin/leads/assign/route.ts` (canonical ownership)
- `app/api/admin/leads/auto-assign/route.ts` (bridge/deprecate behavior)
- `app/(dashboard)/master/leads/page.tsx` (stage-first UI + SLA countdown prep)
- `types/lead.ts` (new canonical Lead model)

Additions:
- `lib/leadSla.ts` (shared evaluator, optional)
- `scripts/migrations/backfill-lead-owner-stage.ts`
- `docs/STEP-1-WEEK-1-LEAD-STATE-MACHINE-SPEC.md` (this doc)

---

## 11) Test Plan (Week 1)

API tests (must pass):
1. Valid transition `assigned -> contacted` succeeds
2. Invalid transition `new -> won` fails
3. Reassignment without reason fails
4. Reassignment with reason writes assignment log
5. Terminal-stage lead cannot be reassigned
6. SLA due date updates on stage change
7. Queue response includes deterministic stage stats

UI tests (target):
1. Stage filter shows deterministic results
2. Status update from dropdown only offers valid transitions
3. Assignment modal requires reason when owner changes
4. Overdue leads are visually flagged

Migration verification:
- 100% leads have `leadStage` and `ownerAgentId` (nullable only where explicitly unassigned)
- 0 leads in impossible transition state

---

## 12) Acceptance Criteria (Week 1 Done)

- Every lead has one canonical owner field (`ownerAgentId`) or explicit null unassigned
- All stage transitions are server-validated by matrix
- Every stage change is logged in `lead_stage_events`
- Every owner change is logged in `lead_assignment_logs`
- SLA due date is consistently computed and persisted per stage
- Admin queue can render stage + SLA breach status from canonical fields
- Legacy status remains available only as compatibility output

---

## 13) Out of Scope (Week 1)

- Duplicate detection engine (Step 1 later / Step 2 core)
- Listing quality scoring engine
- Revenue, billing, subscription models
- Full war-room UI redesign

---

## 14) Week 1 Delivery Sequence (Day-level)

Day 1: Type + lifecycle utilities hardening
Day 2: Queue + assign endpoint canonicalization
Day 3: Migration script and dry-run on staging data
Day 4: Admin leads UI adaptation (stage-first + SLA indicators)
Day 5: Regression pass, build/typecheck, rollout checklist

---

## 15) Rollout Safety Checklist

Before production:
- Run migration in staging and verify sampled lead timelines
- Validate no API consumers break with compatibility status
- Confirm admin role permissions still enforced (`requireMasterAdmin`)
- Confirm error codes are explicit (`INVALID_STAGE`, `INVALID_STAGE_TRANSITION`, `REASSIGN_REASON_REQUIRED`)

After production:
- Monitor assignment log write success rate
- Monitor invalid-transition API rejection counts
- Monitor SLA breach counts for abnormal spikes

---

This spec is the implementation contract for P0.2 Lead State Machine in Step 1.