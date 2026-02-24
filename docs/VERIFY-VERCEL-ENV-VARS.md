# Vercel Environment Variables Verification Checklist

## Why Auth Fails on Deployed Versions

Your auth system works on **localhost** because your `.env.local` file has all credentials, but **deployed versions on Vercel fail with 401 errors** because the environment variables aren't synced.

When master-admin attempts login on production:
1. Request reaches `/api/auth/login`
2. Firebase email/password auth fails (master-admin isn't a Firebase user)
3. Fallback check looks for `process.env.MASTER_ADMIN_PASSWORD`
4. **Vercel has no value for `MASTER_ADMIN_PASSWORD`** → fallback fails → 401 error

## Required Environment Variables for Vercel

All of these must be set in your Vercel project settings. Go to:
```
Project Settings → Environment Variables
```

### 1. Master Admin Credentials
```
MASTER_ADMIN_EMAIL=viventa.rd@gmail.com
MASTER_ADMIN_PASSWORD=Imthebestadminhere18
```
**Status**: ⚠️ VERIFY THIS FIRST — likely missing in Vercel

### 2. SMTP Configuration
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=viventa.rd@gmail.com
SMTP_PASS=gecp gnct wdqi grzz
SMTP_FROM=noreply@viventa.com
```

### 3. Firebase Public Config (safe to expose)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBbfVSutdfIEQGRIQm7CvsahpXRF4R1uTk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=viventa-2a3fb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=viventa-2a3fb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=viventa-2a3fb.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=947338447559
NEXT_PUBLIC_FIREBASE_APP_ID=1:947338447559:web:c4976c91825adba104cce2
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-GWQD1BGQMR
```

### 4. Firebase Admin SDK (server-side only, NEVER expose)
```
FIREBASE_ADMIN_PROJECT_ID=viventa-2a3fb
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@viventa-2a3fb.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
**⚠️ IMPORTANT**: The private key must have literal `\n` characters (not actual newlines) when pasted into Vercel's text field.

### 5. Admin Gate & Security
```
ADMIN_GATE_CODE=1713-0415
```

### 6. Session Management
```
SESSION_SECRET=K8yCLcQ0oVt614BGh5l9AOYUdgrbTmfZ
```

## Verification Steps

1. **Go to Vercel Project Settings**
   - Navigate to https://vercel.com/dashboard
   - Select your "Viventa RD" project
   - Click "Settings" → "Environment Variables"

2. **Check for Missing Variables**
   - Look for `MASTER_ADMIN_PASSWORD` — if not present, this is your problem
   - If missing, click "Add New" and paste from `.env.local`

3. **Copy-Paste All Variables**
   - For regular text values, copy directly
   - For `FIREBASE_ADMIN_PRIVATE_KEY`, ensure newlines are literal `\n` sequences (not actual line breaks)

4. **Redeploy After Changes**
   - After adding/updating env vars, trigger a new deployment
   - Go to "Deployments" and click "Redeploy" on the latest commit
   - Or push a new commit to trigger auto-deployment

5. **Test on Staging/Production**
   ```bash
   # Try master-admin login at https://your-vercel-url.vercel.app/admin/login
   # Email: viventa.rd@gmail.com
   # Password: Imthebestadminhere18
   ```

## Files Affected

- `/api/auth/login` — Falls back to `MASTER_ADMIN_PASSWORD` if Firebase fails (requires this env var)
- `/api/uploads/listing-images` — Requires `FIREBASE_ADMIN_PRIVATE_KEY` for server-side image uploads
- All image upload pages — Require `FIREBASE_ADMIN_*` vars to function on production

## Common Issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| 401 on `/api/auth/login` | `MASTER_ADMIN_PASSWORD` missing | Add to Vercel env vars |
| Image upload API fails | `FIREBASE_ADMIN_PRIVATE_KEY` malformed | Check newlines are `\n` not actual breaks |
| Only Firebase users can login | Master-admin fallback disabled | Verify `MASTER_ADMIN_EMAIL` + `MASTER_ADMIN_PASSWORD` in Vercel |
| Emails not sending | SMTP vars missing | Add all `SMTP_*` variables |

## After Verification

Once all variables are added to Vercel and you've redeployed:
1. Test master-admin login at production URL
2. Test image uploads on listing create/edit pages
3. Verify both localhost and deployed versions behave identically

---

**Created**: 2024 (Today)  
**Status**: Action Required - Add missing env vars to Vercel before next deployment
