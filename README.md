Viventa RD — Lean MVP Full Package

Quick start:
1. npm install
2. cd functions && npm install
3. firebase functions:config:set algolia.app_id="ALG_APP_ID" algolia.api_key="ALGOLIA_ADMIN_KEY" algolia.index="viventa_listings"
4. add .env.local for next.js with NEXT_PUBLIC_* vars
5. firebase emulators:start --only firestore,auth,functions,storage
6. npm run dev
