---
description: "Use when implementing or reviewing portal features to enforce role parity, standardized workflow states, shared CRM semantics, and consistent naming across user/admin/broker/agent/constructora surfaces."
name: Role Parity And Standards Enforcement
applyTo:
  - app/**
  - components/**
  - lib/**
  - hooks/**
  - functions/src/**
---
# Role Parity And Platform Standards

Use this checklist whenever adding or modifying platform features.

## 1. Role Coverage Check
- Validate which roles are in scope: user, admin, broker, agent, constructora.
- If a role is intentionally excluded, document why and the expected follow-up.
- Avoid shipping role behavior differences without explicit product rationale.

## 2. Canonical Naming And States
- Reuse canonical terms for listings, leads, CRM stages, and activity events.
- Do not introduce duplicate terms for the same concept (example: "new lead" vs "fresh lead") without migration intent.
- Keep state enums consistent across UI labels, API payloads, and Firestore documents.

## 3. Permission And Boundary Safety
- Verify read/write permissions by role before exposing data or actions.
- Enforce least privilege in client code and server-side checks.
- Explicitly review cross-tenant access risks in queries and route handlers.

## 4. Shared Data Contract Discipline
- Confirm data shape compatibility across app routes, components, functions, and Firestore documents.
- Prefer additive schema changes with backward compatibility.
- Add migration/backfill notes for any contract or enum change.

## 5. UX Consistency Requirements
- Keep workflow steps, action names, and status indicators aligned across portals.
- Preserve core interaction patterns for lists, filters, details, and stage transitions.
- Ensure mobile and desktop parity for mission-critical actions.

## 6. Automation Readiness
- Emit or consume consistent events for buyer activity and listing updates.
- Ensure features support saved-search matching and recommendation dispatch hooks.
- Validate idempotency keys or dedupe strategy where repeated triggers are possible.

## 7. Quality Gates
- Run type checks and lint for touched areas.
- Add or update tests for role-specific logic, transitions, and permissions.
- Document rollout risk, monitoring signals, and fallback/kill-switch options for automations.

## 8. Definition Of Done Addendum
- Feature behavior is consistent across in-scope roles.
- Canonical CRM and listing terminology is preserved.
- Permission boundaries are verified.
- Telemetry/KPI hooks are in place for adoption and quality tracking.
