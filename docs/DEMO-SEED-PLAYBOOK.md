# Demo Seed Playbook (DR Prime)

Use this endpoint in non-production while logged in as `master_admin` with 2FA session:

- `POST /api/dev/seed-platform-demo`
- Optional body: `{ "reset": true }`

## What it creates
- 1 demo constructora account
- 2 demo broker accounts
- 2 demo agent accounts
- 10 realistic DR listings for prime areas (Santo Domingo, Punta Cana, Santiago, Las Terrenas, Juan Dolio)

## Notes
- Endpoint is disabled in production (`404`).
- Endpoint requires `master_admin` authorization and 2FA.
- Listings are tagged with `demoSeedTag = demo_dr_prime_2026`.
- Re-running is idempotent by title (updates existing demo rows).
