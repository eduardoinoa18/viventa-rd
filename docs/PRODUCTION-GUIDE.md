# Production Stack, Setup, and Launch Guide

This guide summarizes the recommended production stack, why we chose it, what accounts to create, environment variables, deployment pipeline, CORS, and a pre-launch checklist.

## 1 — Recommended production stack (one-line)

Vercel (Next.js App) + Firebase (Auth, Firestore, Storage, Functions, FCM) + Stripe (billing) + SendGrid (email) + Mapbox or OpenCage (maps/geocoding) + Algolia (optional search). Domain on GoDaddy/Namecheap/Cloudflare DNS.

## 2 — Why this stack (short)

- Vercel: Zero-config Next.js hosting, automatic SSL, CDN, preview URLs. Great for App Router and PWA.
- Firebase: Managed Auth, Firestore (real-time + offline), Storage (media), Functions (server logic), FCM for push. Fast to integrate, pay-as-you-go.
- Stripe: Gold standard for subscriptions/payments with webhooks.
- SendGrid: Reliable transactional email delivery.
- Mapbox / OSM: Strong maps UX (Mapbox polished; OSM/Leaflet low-cost).
- Algolia (optional): Instant faceted search at scale; add when needed.

## 3 — Production environment & accounts to create

- Vercel account (connect GitHub repo)
- Firebase project (enable Auth, Firestore, Storage, Functions, FCM)
- Stripe account (test + live keys)
- SendGrid account (API key + verified sender/domain)
- Mapbox account (token) or OpenCage token
- Domain registrar (Namecheap/GoDaddy/Cloudflare). Optional Cloudflare DNS.
- (Optional) Algolia account and index

## 4 — Domain, DNS & SSL

1) Buy domain, e.g., viventa.com.
2) In Vercel Project → Domains → Add `viventa.com`.
3) Add TXT/CNAME records given by Vercel at your registrar/DNS.
4) Vercel will auto-provision SSL.
5) If using Cloudflare DNS: keep Vercel records DNS-only (no orange proxy) per Vercel docs.

## 5 — Firebase Storage CORS

`firebase/cors.json` (committed) contains a safe production setup:

```
[
  {
    "origin": [
      "https://viventa.com",
      "https://www.viventa.com",
      "https://*.vercel.app",
      "http://localhost:3000"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

Apply via gsutil or GCP Console:

- gsutil: `gsutil cors set firebase/cors.json gs://YOUR_BUCKET_NAME`
- GCP Console: Storage → Bucket → CORS configuration → paste JSON

Verify with `/admin/diagnostics` upload test.

## 6 — Environment variables (Vercel & Functions)

Vercel Project → Settings → Environment Variables:

Client (public):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_MAPBOX_TOKEN` (or `OPEN_CAGE_KEY`)
- `NEXT_PUBLIC_ALGOLIA_APP_ID` (optional)
- `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` (optional)
- `NEXT_PUBLIC_SITE_URL` (e.g., `https://viventa.com`)

Server (private):
- `FIREBASE_SERVICE_ACCOUNT` (base64 of service-account JSON)
- `FIREBASE_STORAGE_BUCKET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`
- `SENTRY_DSN` (optional)

If you use Firebase Functions:
- `firebase functions:config:set sendgrid.key="SENDGRID_KEY" algolia.api_key="ALGOLIA_ADMIN_KEY" stripe.secret="STRIPE_SECRET"`

## 7 — Deploy pipeline

A) Vercel
- Push `main` branch to GitHub.
- In Vercel, create a project → Import from GitHub → select repo.
- Build command auto-detected (Next.js). Ensure env vars are set.
- Vercel deploys preview and production.

B) Firebase
- Install CLI: `npm i -g firebase-tools` and `firebase login`.
- Initialize/select your project: `firebase init`.
- Deploy Firestore rules & indexes: `firebase deploy --only firestore:rules,firestore:indexes`.
- Deploy Storage rules: `firebase deploy --only storage`.
- Deploy Functions (if used): `firebase deploy --only functions`.

C) Stripe webhooks
- Local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
- In Stripe Dashboard: add webhook endpoint `https://<vercel-app>/api/webhooks/stripe` and put secret into Vercel.

## 8 — Admin security & token flow

- Middleware gates `/admin` and `/dashboard` server-side via `lib/middlewareAuth.ts` + `/api/auth/verify`.
- Use Firebase session cookies (HttpOnly) in production.
- For admin 2FA: email a code (SendGrid), store hash with expiration; set a custom claim when verified.
- Example (server):
```
const expiresIn = 60 * 60 * 24 * 30 * 1000 // 30 days
const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn })
res.cookie('session', sessionCookie, { httpOnly: true, secure: true, maxAge: expiresIn })
```

## 9 — Storage & media

- Keep originals and thumbnails; store both URLs on listings for fast render.
- Consider Cloudinary/Imgix later for on-the-fly transformations.

## 10 — Push notifications (FCM)

- Generate VAPID keys, add public to client env and private to server.
- Save user tokens to `users/{uid}/fcmTokens`.
- Send via Firebase Admin messaging from Functions or server.

## 11 — Stripe billing flow

- Products & Prices define tiers.
- Checkout → webhook `/api/webhooks/stripe` creates/updates Firestore billing docs.
- Admin can view subscriptions/invoices; rely on Stripe dashboard for refunds/cancels initially.

## 12 — Cost estimates (rough)

- Vercel: $20–200/mo early stage.
- Firebase: pay-as-you-go (reads/writes/storage/functions). Often $20–200/mo early.
- Stripe: per-transaction fees.
- Mapbox: free tier, then usage-based.
- SendGrid: free → paid plans.
- Total early-stage: ~$50–300/mo; scale with usage.

## 13 — Launch checklist

- [ ] Add domain in Vercel and verify DNS.
- [ ] Set all Vercel env vars.
- [ ] Set `FIREBASE_SERVICE_ACCOUNT` (base64) in Vercel.
- [ ] Apply CORS to Storage bucket (`firebase/cors.json`).
- [ ] Deploy Firestore rules & indexes.
- [ ] Deploy Functions if used.
- [ ] Add Stripe webhook endpoint and secret.
- [ ] Verify SendGrid sender domain & API key.
- [ ] Test PWA install, auth, listing create → admin approve → appears in /search.
- [ ] Upload image from browser → CORS OK.
- [ ] Save favorite, test offline reload.
- [ ] Stripe Checkout (test), confirm webhook + Firestore.
- [ ] Admin login + 2FA code.
