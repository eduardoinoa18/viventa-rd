# Viventa RD — Phase 1 (Bilingual Starter)

This Phase 1 starter is a minimal but functional bilingual (ES/EN) scaffold for Viventa RD.

Stack:
- Next.js 14 (App Router)
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)

Features included:
- Bilingual content via /locales (ES default, EN optional)
- Public landing page & search (demo)
- Agent Dashboard (create listings with image upload)
- Admin Panel (promote users)
- Listing detail page
- Firestore & Storage rules (in /firebase)

## Setup

1. Install dependencies:
```
npm install
```

2. Create a Firebase project and add a web app. Enable:
 - Authentication (Google & Email)
 - Firestore (in native mode)
 - Storage

3. Add environment variables in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

4. Run locally:
```
npm run dev
# open http://localhost:3000
```

5. Deploy to GitHub & Vercel:
 - Create repo and push code
 - Import to Vercel, add env vars in Vercel dashboard, deploy.

## Notes & Next steps
- Replace demo data with Firestore-powered listing queries for the public search.
- Add role creation and user docs on sign-up (create user doc in Firestore after auth).
- Add Mapbox or Google Maps geolocation picker for listings.
- Integrate Algolia for fast search in Phase 2.
