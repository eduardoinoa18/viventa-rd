VIVENTA — Lean MVP (Phase 1)

Foundation quick start
1) Install deps
- npm install
- cd functions && npm install && cd ..

2) Env vars
- Create .env.local with NEXT_PUBLIC_* Firebase + Algolia + optional Mapbox

3) Firebase config (server-side Algolia for Functions)
- firebase functions:config:set algolia.app_id="ALG_APP_ID" algolia.api_key="ALGOLIA_ADMIN_KEY" algolia.index="viventa_listings_dev"

4) Emulators (local dev)
- firebase emulators:start --only auth,firestore,functions,storage
- npm run dev

CI/CD
- .github/workflows/ci.yml: builds Next.js on main/dev
- .github/workflows/functions-deploy.yml: deploys Functions on main (set secrets FIREBASE_TOKEN, FIREBASE_PROJECT_ID)

Branches
- main (prod), dev (staging), feature/* for PRs

Functions utilities
- Seed master admin: in functions/
	- $env:MASTER_ADMIN_EMAIL="you@example.com"; npx ts-node src/seedMasterAdmin.ts
- Configure Algolia index:
	- $env:ALGOLIA_APP_ID=...; $env:ALGOLIA_ADMIN_KEY=...; $env:ALGOLIA_INDEX=viventa_listings_dev; npx ts-node src/configureAlgolia.ts
- Reindex:
	- $env:ALGOLIA_APP_ID=...; $env:ALGOLIA_ADMIN_KEY=...; $env:ALGOLIA_INDEX=viventa_listings_dev; npx ts-node src/reindex.ts

