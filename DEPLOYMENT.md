# 🚀 Viventa RD Deployment Guide

## Critical: Firebase Environment Variables

Your app requires Firebase configuration to work properly. The errors you're seeing are because these environment variables are missing on Vercel.

### 1. Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ > **Project Settings**
4. Scroll down to "Your apps" section
5. Click the web app icon `</>` or select your existing web app
6. Copy the configuration values

### 2. Add Environment Variables to Vercel

Go to your Vercel project dashboard:
https://vercel.com/eduardoinoa18/viventa-rd/settings/environment-variables

Add these variables (one by one):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Important:** Check all three environments:
- ✅ Production
- ✅ Preview
- ✅ Development

### 3. Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the three dots `...` on the latest deployment
3. Click **Redeploy**
4. Select "Use existing Build Cache" ❌ (uncheck it)
5. Click **Redeploy**

---

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/eduardoinoa18/viventa-rd.git
cd viventa-rd
npm install
```

### 2. Create Local Environment File

Create `.env.local` in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Firebase credentials.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Firebase Setup Checklist

### Authentication
- ✅ Enable Email/Password authentication
- ✅ Add authorized domains (your-domain.vercel.app)

### Firestore Database
- ✅ Create database in production mode
- ✅ Set up security rules (see `firebase/firestore.rules`)

### Storage
- ✅ Enable Firebase Storage
- ✅ Set up security rules (see `firebase/storage.rules`)

### Deploy Rules

```bash
cd functions
npm install
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## Troubleshooting

### Error: `auth/invalid-api-key`
**Solution:** Add `NEXT_PUBLIC_FIREBASE_API_KEY` to Vercel environment variables

### Error: `manifest.json 401`
**Solution:** This should be fixed by the middleware update. Redeploy after pulling latest changes.

### Error: `/contact 404`
**Solution:** The contact route exists. Clear Vercel cache and redeploy.

### App shows blank screen
**Solution:** Check browser console for errors. Usually means Firebase env vars are missing.

---

## Project Structure

```
viventa-rd/
├── app/                    # Next.js 14 App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Agent dashboard
│   ├── login/             # Authentication pages
│   └── page.tsx           # Homepage
├── components/            # React components
├── lib/                   # Utilities
│   ├── firebaseClient.ts  # Firebase initialization
│   ├── firestoreService.ts # Database operations
│   └── storageService.ts  # File uploads
├── firebase/              # Firebase config
│   ├── firestore.rules    # Database security rules
│   └── storage.rules      # Storage security rules
└── functions/             # Cloud Functions
```

---

## Quick Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
git push origin main

# Deploy Firebase rules
cd functions && firebase deploy --only firestore:rules,storage:rules
```

---

## Need Help?

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Make sure Firebase project is active

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | ✅ Yes |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | Algolia App ID (for search) | ⚠️ Optional |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` | Algolia Search Key | ⚠️ Optional |
