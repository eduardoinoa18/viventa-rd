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

## GitHub and Vercel deployment

1) Create the GitHub repo

- Go to https://github.com/new and create a repo named `viventa-rd` under your account.
- Do not initialize with a README or .gitignore (the project already includes them).

2) Push the code

```powershell
# from project root
git init
git add .
git commit -m "feat: Viventa RD Phase 1 bilingual Firebase starter"
git branch -M main
git remote add origin https://github.com/<your-username>/viventa-rd.git
git push -u origin main
```

3) Vercel configuration

- In Vercel, import the repository.
- Framework preset: Next.js
- Environment variables (Project Settings → Environment Variables):
	- NEXT_PUBLIC_FIREBASE_API_KEY
	- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
	- NEXT_PUBLIC_FIREBASE_PROJECT_ID
	- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
	- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
	- NEXT_PUBLIC_FIREBASE_APP_ID
- Build/Output: defaults are fine for Next 14.

4) Optional

- If you use Mapbox later, add `NEXT_PUBLIC_MAPBOX_TOKEN`.
- If you want consistent local Node: set `.nvmrc` to an LTS (18 or 20) and run `nvm use`.

## Notes & Next steps
- Replace demo data with Firestore-powered listing queries for the public search.
- Add role creation and user docs on sign-up (create user doc in Firestore after auth).
- Add Mapbox or Google Maps geolocation picker for listings.
- Integrate Algolia for fast search in Phase 2.
