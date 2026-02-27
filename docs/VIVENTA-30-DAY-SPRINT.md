# Viventa 30-Day Sprint (Beta Execution)

## Objective
Ship a simple, high-control CRM-first beta for Paraiso Inmobiliario with working role onboarding, lead routing, inbox MVP, buyer matching, and master analytics.

## Week 1 — Admin Control + Identity Lifecycle
- Stabilize role lifecycle for broker/agent/constructora creation and invite completion.
- Ensure admin can edit any user profile (email, status, role, disabled) with Firebase Auth sync.
- Add admin reset-password flow for all managed users.
- Keep all public CTAs centralized into master lead queue.
- Add Paraiso bootstrap endpoint for broker + initial team invites.

### Exit Criteria
- Admin can create and manage broker/agent/constructora accounts end-to-end.
- Invited users can complete onboarding and log in.
- Master admin can suspend/reactivate and update profile data safely.

## Week 2 — CRM + Lead Operations
- Upgrade leads tab into CRM pipeline (new, assigned, contacted, won, lost).
- Add agent/broker lead ownership and transfer actions.
- Add buyer/client creation from CRM with criteria profile.
- Add send-collection flow (manual listing selection) and first branded email template.
- Add lead timeline events (assignment, status change, first response).

### Exit Criteria
- Agents/brokers/admin can operate a full lead pipeline.
- Buyer records and search criteria are saved and actionable.
- Collection emails are sent successfully from CRM.

## Week 3 — Inbox MVP + Pro Collaboration
- Build WhatsApp-style inbox MVP with threads and messages.
- Support message contexts: lead, listing, showing request, general team chat.
- Enable broker-to-team threads and agent-to-agent collaboration.
- Enable agent/broker ↔ constructora operational threads (no public leads for constructora).
- Add admin oversight for all message threads.

### Exit Criteria
- Team collaboration and lead communication happen fully inside Viventa.
- Showing/purchase intent can be initiated and tracked in-thread.

## Week 4 — Search + Intelligence + KPI
- Improve search relevance for free-text intent and mixed metadata filters.
- Add first Price-per-m² sector engine from active inventory.
- Expand master dashboard KPIs: lead funnel, response time, sector demand, top performers.
- Add listing verification workflow (admin-reviewed badge).
- Improve SEO metadata/indexing coverage on listing/project/entity pages.

### Exit Criteria
- Search returns better intent-based results.
- Price/m² snapshots are available per key sectors.
- Master dashboard reflects operational + conversion health.

## Role Rules (Beta)
- Master Admin: full control across users, leads, inbox, listings, analytics.
- Broker: team management, team conversations, own/team CRM views.
- Agent: own listings + assigned leads + buyer CRM tools.
- Constructora: project/availability management + analytics + pro communications only.

## Paraiso Beta Rollout
1. Create broker account for Paraiso Inmobiliario.
2. Invite initial agent team through admin bootstrap endpoint.
3. Upload first verified project/listings.
4. Run lead intake + assignment from master queue.
5. Operate first full deal cycle through CRM + inbox.

## Guardrails
- Keep UX simple: no unnecessary complexity before reliability.
- Prioritize control and data integrity over automation.
- Every new flow must be role-limited and auditable.
