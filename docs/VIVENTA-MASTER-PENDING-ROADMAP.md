# VIVENTA Master Pending Roadmap (Consolidated)

Last updated: 2026-02-27
Owner: Master Admin Product/Operations
Scope: Beta execution with Paraiso Inmobiliario + controlled marketplace model

## Latest Execution Update

### P0.2 started (Control Center v1)
- Added master-only route: `/master/control`.
- Added operational stream API: `/api/admin/control/stream` with:
  - unassigned lead queue
  - SLA classification (`<1h`, `1-6h`, `6h+`)
  - urgency score (simple weighted model)
  - contextual enrichment (city/sector/property type from listing when available)
  - top 3 assignment suggestions (fit score based on coverage text, load, conversion proxy, recent activity)
- Added routing mode scaffold persisted in admin settings:
  - `manual_only`
  - `auto_brokerage`
  - `auto_top_agent`
  - `rotation_mode`
- Added semi-manual assign action from Control Center using existing lead assignment endpoint.

### P0.2 remaining to close
- Enforce all CTA ingestion paths consistently into centralized queue (audit + hardening).
- Add reassignment + fallback owner queue policy controls.
- Add SLA breach notifications/escalation behavior.

### P0.2 hardening progress (just completed)
- Added centralized ingestion endpoint: `/api/leads/ingest`.
- Added shared ingestion service: `lib/leadIngestion.ts`.
- Routed main public CTA entry points through centralized ingestion service:
  - `/api/contact/property-inquiry`
  - `/api/contact/submit`
  - `/api/contact`
  - `/api/leads/chat-request`
- Added global SLA escalation threshold support in Control stream (`controlEscalationHours`, default 2h).
- Added escalation flags in stream payload (`escalated`, `escalationLevel`).
- Added reassignment policy scaffold in stream payload (manual/suggest/broker fallback/escalation log toggles).
- Added assignment/reassignment audit records in `lead_assignment_logs`.

## 1) Reality Check (Done vs Pending)

Not everything in the full vision is done yet.

### ✅ Confirmed implemented (current codebase)
- Master user management page with create/edit/delete/activate flows for:
  - Agents
  - Brokers
  - Constructoras
  - Buyers
- Application review workflow with approve/reject/more-info and approval-side credential handling.
- Lead queue management with assignment and status pipeline (unassigned/assigned/contacted/won/lost).
- Master inbox with conversation view + quick message templates.
- Buyer CRM pages:
  - Buyer list + filters
  - Buyer detail with listing matches
  - Send matches email action
- Listing platform upgrades already shipped:
  - Project inventory (units + statuses)
  - Hotspot map tooling (click placement + auto layout)
  - Dynamic project pricing behavior on listing detail
  - Terrain-aware listing UX
  - Listing metadata/OG improvements

### 🟡 Partially implemented
- Inbox/communications are functional but not yet a full WhatsApp-grade CRM experience (tags, SLA controls, automation rules, rich workflows).
- Role and permission model exists, but subscription-level gating is not fully productized.
- Search is functional and improved, but "search by anything + behavior ranking algorithm" is not complete.
- Analytics exists, but KPI model is not yet fully aligned to the complete operating model.
- Verification exists in platform areas, but full operational verification policy/workflow still needs expansion.

### 🔴 Not complete yet (major pending)
- Full MLS-grade automation loop (smart collections, behavior-triggered drip, advanced matching/ranking).
- Full constructora monetization engine (per-project billing + contract-linked commission tracking + automated enforcement).
- End-to-end transaction/commission trail automation from first contact to close.
- Full DR-wide market intelligence module with robust price/m² trend engine and governance.

---

## 2) Operating Model Locked for Beta

These rules are now part of product direction:

1. All public CTAs route first to Master Admin.
2. Master Admin qualifies + assigns (central switchboard model).
3. Brokers/agents are selling layer.
4. Constructoras are inventory/information layer (no direct public lead inbox).
5. Paraiso Inmobiliario is the first beta broker + first internal power user team.

---

## 3) Priority Backlog (Execution Order)

## P0 — Immediate Foundation (must close first)

### P0.1 Admin OS hardening
- Finalize user lifecycle operations across all roles:
  - create
  - invite
  - reset password
  - activate/suspend
  - edit profile metadata
- Add role-specific profile edit forms (agent/broker/constructora) with validation.
- Add admin audit events for every privileged action.

### P0.2 Lead routing control center
- Enforce central routing for all CTA origins consistently (call/message/whatsapp/showing).
- Add assignment policies:
  - manual assign
  - reassignment
  - fallback owner queue
- Add assignment SLA indicators and overdue states.

### P0.3 Inbox v1 (CRM-first)
- Keep simple UX, but add:
  - conversation tags (showing/offer/follow-up)
  - quick actions (Request Showing, Start Purchase Process)
  - lead context card in chat (listing + buyer snapshot)
- Add cross-role P2P rules:
  - agent ↔ agent
  - broker ↔ team
  - agent/broker ↔ constructora
  - admin oversight across all threads

### P0.4 MLS-lite buyer workflow
- In CRM, allow agent/broker/admin to add buyer + criteria quickly.
- Improve match email (template quality + brand consistency + action CTA).
- Add simple engagement telemetry:
  - open/click events
  - top-viewed listings per buyer

### P0.5 Paraiso onboarding pack
- Create broker org record: Paraiso Inmobiliario.
- Add initial agent team under Paraiso.
- Seed first project listings for beta usage.
- Track friction/issues as beta feedback stream.

---

## P1 — Revenue + Trust Core

### P1.1 Constructora model enforcement
- Restrict constructora workspace to:
  - project/listing management
  - availability updates
  - portfolio/assets
  - performance analytics
- No direct public lead ownership.
- Enable P2P informational communications from agents/brokers/admin.

### P1.2 Verification framework
- Agent/Broker verification states and criteria.
- Listing verification workflow based on admin confirmation of representation + data quality.
- Trust badges wired to both search and listing pages.

### P1.3 KPI dashboard alignment
- Master dashboard KPIs (simple and useful):
  - total leads
  - assigned leads
  - response times
  - active projects
  - units available vs sold
  - top sectors
  - top performers
- Keep implementation lean; avoid overbuilding BI now.

---

## P2 — Intelligence and Scale

### P2.1 Search engine refinement
- Expand query understanding for mixed-intent search terms.
- Improve ranking with weighted relevance (location/price/type/amenities/project metadata).
- Ensure technical SEO for indexed listing and project surfaces.

### P2.2 Price/m² intelligence
- Build sector-level price/m² aggregation service (DR-wide).
- Show basic trend snapshots per sector.
- Use as both buyer guidance and internal inventory strategy signal.

### P2.3 Commission + monetization rails (hidden for beta)
- Project-level subscription records for constructoras.
- Contract metadata storage per constructora/project.
- Event trail for platform-originated transactions (future 2% logic).

---

## 4) Scope Guardrails (to keep platform simple)
- Prefer operationally reliable workflows over feature-heavy UI.
- Ship narrow vertical slices that close real loops:
  - capture → assign → converse → match → close-ready tracking.
- Keep premium routing/subscription toggles feature-flagged for future phase.

---

## 5) Next Sprint Candidate (recommended)
1. P0.2 Lead routing control center completion.
2. P0.3 Inbox v1 CRM tags + quick actions.
3. P0.4 MLS-lite buyer workflow polish (email + telemetry).
4. P0.5 Paraiso onboarding data setup.

If these 4 are completed, Viventa will operate as a controlled, testable CRM marketplace for beta execution.