# Firebase Storage CORS Fix

## Issue
Firebase Storage was blocking uploads from `viventa.vercel.app` with CORS preflight errors:
```
Access to XMLHttpRequest has been blocked by CORS policy: Response to preflight request doesn't pass access control check
```

## Solution
Apply CORS configuration to your Firebase Storage bucket to allow requests from your production domain.

## Steps to Apply CORS Configuration

### Option 1: Using Google Cloud Console (Recommended)

1. **Open Google Cloud Console**
   - Go to https://console.cloud.google.com/
   - Select your project: `viventa-2a3fb`

2. **Navigate to Cloud Storage**
   - In the left menu, go to **Cloud Storage** → **Buckets**
   - Find and click on your bucket: `viventa-2a3fb.firebasestorage.app`

3. **Apply CORS Configuration**
   - Click on the **Configuration** tab
   - Scroll to **CORS configuration**
   - Click **Edit CORS configuration**
   - Paste this JSON:
   ```json
   [
     {
       "origin": ["https://viventa.vercel.app", "http://localhost:3000"],
       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "X-Requested-With"]
     }
   ]
   ```
   - Click **Save**

### Option 2: Using gsutil CLI

If you have Google Cloud SDK installed:

```bash
# Authenticate
gcloud auth login

# Set your project
gcloud config set project viventa-2a3fb

# Apply CORS configuration
gsutil cors set firebase/cors.json gs://viventa-2a3fb.firebasestorage.app
```

### Option 3: Quick Fix via Firebase CLI

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login
firebase login

# Deploy storage rules (includes CORS if configured)
firebase deploy --only storage
```

## Verification

After applying CORS:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to https://viventa.vercel.app/apply
3. Fill out agent/broker form with a resume/document
4. Submit and verify upload succeeds
5. Check browser console for no CORS errors

## What Changed in Code

- **app/apply/page.tsx**: Fixed undefined field error by only including `resumeUrl`/`documentUrl` if they are defined
- **firebase/cors.json**: Created CORS configuration file for Firebase Storage

## Notes

- CORS configuration typically takes effect immediately
- If issues persist, wait 5-10 minutes for propagation
- The storage.rules file already allows unauthenticated writes to `applications/**` path
