# VIVENTA Platform Overview

A concise, practical overview of the platform: what it does, how it’s organized, and how to operate it in development and production.

## Tech Stack
- Next.js 14 (App Router), React 18, TypeScript 5
- Tailwind CSS for styling
- Firebase: Auth, Firestore, Storage (+ Admin SDK in server routes)
- Stripe for billing (server utilities present)
- Leaflet / OpenStreetMap for maps
- PWA enhancements: offline support, install prompt, network indicators
- Playwright for E2E tests; GitHub Actions for CI (lint, typecheck, build)

## Core Modules and Flows
- Public browsing
  - `/search`: Firestore-backed custom search with filters, pagination, and map view
  - `/listing/[id]`: Listing detail with images, contact, and structured data
- Auth & Profiles
  - `/login`, `/signup`, `/forgot-password`
  - Session helpers in `lib/authClient.ts` and `lib/authSession.ts`
- Admin
  - `/admin/properties`: Manage properties (grid/list, filters, stats)
  - `/admin/properties/create`: Create listing with image upload vault (1–20 images)
  - `/admin/users`, `/admin/agents`, `/admin/brokers`: CRUD, approval flows
  - `/admin/diagnostics`: System health; includes Firebase Storage CORS upload test
- Agent & Broker
  - `/agent`: Dashboard (KPIs, listings, leads, tasks); quick actions
  - `/broker`: Team KPIs, agent performance; Team tab includes search and status filters

## Data Model (high level)
- Collection: `listings`
  - Fields: `title`, `price`, `propertyType`, `listingType`, `publicRemarks`, `professionalRemarks`, `bedrooms`, `bathrooms`, `area`, `images[]`, `agentId`, `agentName`, `status`, `featured`, `location`, `city`, `neighborhood`, optional `soldAt`
  - Visibility: Public pages show only records where `status = 'active'`
- Collection: `users`
  - Fields for roles (admin/agent/broker), profile, status (active/pending/inactive)
- Subcollections (examples): `users/{uid}/saved_searches`

## Storage and Uploads
- Firebase Storage path for property images: `listing_images/{uid}/{random}`
- Storage rules require authenticated uploads (anonymous sign-in is acceptable)
- Create Listing page includes:
  - Client-side validation (JPG/PNG/WebP; ≤5MB; 1–20 files)
  - Per-file progress tracking
  - Preview grid with “Principal” badge
- Production CORS setup required; see `FIREBASE-STORAGE-CORS.md`

## Search Architecture
- Custom Firestore search (no Algolia required)
- Facets: property type, city, neighborhood
- Filters: listing type, price, bedrooms, bathrooms, city, neighborhood, free-text query
- Map integration with Leaflet and price overlays on markers
- See `CUSTOM-SEARCH.md` for design, performance notes, and troubleshooting

## PWA
- Offline indicator, install prompt, and service worker management are integrated
- See `PWA-GUIDE.md` and `PWA-INTEGRATION-EXAMPLES.md`

## CI/CD
- GitHub Actions workflow at `.github/workflows/ci.yml`
  - Runs on push/PR to main/master/dev: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`
  - Uploads `.next` build as artifact
- Vercel deployment recommended
  - Connect repository; add env vars; auto-deploy on push
  - See `VERCEL-DEPLOYMENT.md`

## Environment Variables
Create `.env.local` and provide these values (examples):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- Optional for E2E: `NEXT_PUBLIC_E2E=1` (Playwright dev server already sets this)
- Optional: Algolia keys if using Algolia variants
- Optional: Stripe keys for billing

## Testing
- Playwright E2E tests
  - `tests/search.spec.ts`: Verifies search layout + map
  - `tests/admin-create-listing.spec.ts`: Mocks upload + submission in create listing, then verifies redirect
- See `TESTING.md` for Playwright config, manual QA, and CI setup

## Operational Diagnostics
- `/admin/diagnostics`:
  - Firebase config visibility
  - Firestore collections quick view
  - Algolia/email placeholders
  - Firebase Storage CORS upload test (run after applying CORS)

## Deployment Checklist
- CI passes (lint, typecheck, build)
- Firebase Storage CORS applied (run the diagnostics page test)
- Firestore indexes created if prompted during heavy filter usage
- Environment variables added to Vercel project
- Optional: Enable preview deployments and run E2E against preview URL

## Next Steps and Enhancements
- Listing images: delete-from-storage and drag-to-reorder (primary image selector)
- Broker dashboard actions: approve/suspend agents; bulk changes
- Search performance: add composite indexes as needed; consider server-side caching for facets
- Analytics: wire `lib/analytics.ts` to track search and listing interactions
- Payments: finalize Stripe flows

