# VIVENTA Broker Admin Portal Blueprint

## Vision

Build the Broker Portal as the brokerage operating system, not a listing dashboard.

> Versión localizada para República Dominicana: ver [BROKER-ADMIN-PORTAL-RD.md](docs/BROKER-ADMIN-PORTAL-RD.md).
>
> Arquitectura técnica del núcleo de inventario de proyectos RD: [PROJECT-INVENTORY-SYSTEM-RD.md](docs/PROJECT-INVENTORY-SYSTEM-RD.md).

North-star broker feeling:

> I can run my entire brokerage from here.

---

## Product Positioning

The portal must operate across 5 core brokerage engines:

1. Listings
2. Leads
3. Team
4. Transactions
5. Business Performance

Everything else is enablement around these five engines.

---

## Role Model (Final Authority Rules)

### `master_admin`
- Full platform control.
- Global visibility and overrides.
- Can manage all brokerages, users, listings, and platform rules.

### `admin`
- Operations control delegated by master admin.
- Can run review, compliance, and intake workflows.

### `broker`
- Full control of office-level operations.
- Can manage own office listings, leads, team workflows, transactions.
- Cannot edit marketplace/global listings outside office ownership.

### `agent`
- Personal + assigned workflow execution.
- Can manage own listings/leads/transactions in assigned boundaries.

### `buyer` / `user`
- Public product + buyer dashboard only.
- No `/master` operations access.

---

## Information Architecture (Broker)

Primary nav should be optimized for daily operational rhythm:

1. Dashboard (Command Center)
2. Listings
3. Leads
4. Team
5. Transactions
6. Analytics
7. Marketing
8. Documents
9. Settings

Secondary nav:
- Profile (public broker profile)
- Notifications
- Activity log

---

## Module Definitions

### 1) Command Center (Dashboard)

#### KPI clusters
- Listings: active, new 30d, pending, closed 30d, avg DOM, price-change alerts.
- Revenue: estimated GCI, closed GCI 30d, pipeline value, avg commission per deal.
- Leads: received, assigned, response time, conversion rate, attention-needed queue.
- Team: active agents, listings per agent, agent conversion, top performer.
- Market: average price, DOM trend, inventory trend, demand index.

#### Action bar
- Create listing.
- Assign lead.
- Open transaction.
- Invite agent.

---

### 2) Listings Management

Three clear tabs:

#### My Listings
- Full CRUD for broker-owned listings.
- Media/docs/open-house/marketing material support.
- Duplicate + archive actions.

#### Office Listings
- Office-wide read + governance actions.
- Reassign ownership, review pricing/status, optional publication approval.
- Edit only when ownership/policy allows.

#### Market Listings
- Search/save/share/compare/note.
- Read-only at data layer.

---

### 3) Lead Management

#### Core capabilities
- Assignment/reassignment.
- Timeline + notes.
- Contact workflow states.
- Convert to client, mark lost, escalate.

#### Automation controls
- Round-robin.
- Rule-based routing (location/property type).
- SLA timers and breach escalation.
- Workload balancing.

---

### 4) Team Management

#### Team controls
- Add/suspend/remove agent.
- Role changes within office constraints.
- Commission split policy assignment.
- Lead/listing transfer.

#### Agent profile pane
- Contact + license/compliance status.
- Production metrics.
- Listings handled.
- Closed transactions.

---

### 5) Transactions

#### Standard pipeline
`new_client -> showing -> offer_submitted -> negotiation -> under_contract -> inspection -> appraisal -> closing`

#### Broker operations
- Office-wide transaction board.
- Stage progression and blockers.
- Document upload.
- Commission split tracking.
- Closing date monitoring.

---

### 6) Public Broker Profile

Editable by broker:
- Bio, photo, contact, social links, specialties, service areas.

System-calculated:
- Active/sold listings, avg sale price, avg DOM, reviews/performance indicators.

---

### 7) Marketing Center

MVP:
- Flyer generation.
- Social share assets.
- Property page share tracking.
- Basic campaign tracking.

Phase 2:
- SMS campaigns.
- Landing page generator.
- Ad attribution dashboard.

---

### 8) Analytics & Reporting

Required report packs:
- Listing performance.
- Agent productivity.
- Lead source effectiveness.
- Sales/commission trend lines.

Export:
- CSV, PDF, shareable link snapshots.

---

### 9) Document Storage

Document classes:
- Listing agreements.
- Contracts.
- Disclosures.
- Agent agreements.

Linked entities:
- Listing, transaction, agent.

---

### 10) Notifications

Triggers:
- New lead, reassignment, SLA breach, price change, contract stage change.

Channels:
- In-app + email (MVP).
- SMS (Phase 2).

---

### 11) Settings

Office-level configuration:
- Office profile/logo/contact.
- Commission rules.
- Routing preferences.
- Team permissions template.

---

## Security and Permission Boundaries (Non-Negotiable)

Broker can modify only:
- Listings they own.
- Listings under their brokerage scope when policy allows.

Broker cannot modify:
- Other brokerage listings.
- Global marketplace records.

Global override is reserved for `master_admin`.

---

## Viventa Build Mapping (Current Route Structure)

### Existing strong foundations
- `/master/leads`
- `/master/users`
- `/master/applications`
- `/api/broker/leads`
- `/api/broker/leads/automation`
- `/api/broker/listings/my`
- `/api/broker/listings/office`
- `/api/broker/listings/market`
- `/api/broker/dashboard/overview`
- `/api/broker/team`
- `/api/broker/transactions`

### Immediate UX alignment
1. Keep professionals in `/master` namespace with role-scoped nav and actions.
2. Keep buyers/users in `/dashboard` and public flows.
3. Make dashboard cards action-first (not report-first).

---

## MVP Scope (Broker OS v1)

Ship as three releases:

### Release A — Daily Operations
- Command center KPIs + alerts.
- Listings triad (my/office/market) with strict permissions.
- Lead assignment + SLA + automation controls.

### Release B — Team + Transactions
- Team roster + agent performance cards.
- Transaction pipeline board with stage controls and due dates.

### Release C — Business Intelligence
- Broker analytics reports + exports.
- Public profile polish + marketing center starter tools.

---

## Ultimate Broker Portal Structure (Compass / Zillow Flex / FUB pattern)

Use this hierarchy for elite experience:

1. **Command**: today’s priorities and bottlenecks.
2. **Execution**: leads/listings/transactions boards.
3. **Coaching**: agent scorecards and workload balancing.
4. **Growth**: conversion, channel ROI, market opportunities.
5. **Governance**: compliance, permissions, auditability.

Viventa advantage opportunity:
- Combine marketplace visibility + brokerage operations in one place.
- Keep ownership-aware guardrails as trust differentiator.
- Add localized DR market intelligence and bilingual operations defaults.

---

## KPIs That Define Success

Product success KPIs:
- Broker weekly active rate.
- Lead first-response time.
- Lead-to-appointment conversion.
- Office listing time-to-publish.
- Transaction cycle time.
- Broker retention/churn.

Operational reliability KPIs:
- SLA breach resolution time.
- Automation run success rate.
- Permission violation incidents (target: zero).

---

## Immediate Implementation Backlog (2-4 Sprints)

### Sprint 1
- Standardize command-center KPI cards and alert widgets.
- Finalize role-scoped nav labels per role.
- Add explicit ownership badges in listings + leads + transactions.

### Sprint 2
- Complete office listing governance actions.
- Add lead timeline detail drawer and note audit trail.
- Add workload balancing panel for assignment decisions.

### Sprint 3
- Transaction board with pipeline SLA indicators.
- Agent scorecards (conversion + velocity + workload).
- Exportable analytics views for broker meetings.

### Sprint 4
- Marketing center MVP (flyer + social asset + share tracking).
- Public broker profile enhancements.
- Reporting polish + performance tuning.

---

## Final Principle

If brokers can run revenue, people, and execution from one cockpit, Viventa becomes mission-critical infrastructure, not a listing channel.
