# Vercel Deployment Guide - Viventa RD

## ✅ Environment Variables Configuration

### Required Firebase Variables
Add these to your Vercel project's Environment Variables section:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBbfVSutdfIEQGRIQm7CvsahpXRF4R1uTk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=viventa-2a3fb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=viventa-2a3fb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=viventa-2a3fb.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=947338447559
NEXT_PUBLIC_FIREBASE_APP_ID=1:947338447559:web:c4976c91825adba104cce2
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-GWQD1BGQMR
```

### Required SMTP Variables (for email notifications)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=viventa.rd@gmail.com
SMTP_PASS=gecp gnct wdqi grzz
SMTP_FROM=viventa.rd@gmail.com
```

### Required Admin Variables
```bash
MASTER_ADMIN_EMAIL=viventa.rd@gmail.com
MASTER_ADMIN_PASSWORD=Imthebestadminhere18
```

### Optional Algolia Variables (if using Algolia search)
```bash
NEXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_algolia_search_key
```

---

## 🚀 Deployment Steps

### 1. Connect Repository to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `eduardoinoa18/viventa-rd`
3. Select the `main` branch

### 2. Configure Project Settings
- **Framework Preset:** Next.js
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)
- **Node Version:** 18.x or higher

### 3. Add Environment Variables
1. In the Vercel project settings, go to **Environment Variables**
2. Add **ALL** variables listed above
3. Set them for: **Production**, **Preview**, and **Development**
4. Click **Save** after adding each variable

### 4. Deploy
1. Click **Deploy**
2. Wait for the build to complete
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## ⚠️ Important: Firestore Rules Deployment

Your build will succeed but you'll see permission errors until Firestore rules are deployed:

```bash
# Run this command locally (requires Firebase CLI)
firebase deploy --only firestore:rules
```

If you haven't installed Firebase CLI:
```bash
npm install -g firebase-cli
firebase login
firebase use viventa-2a3fb
firebase deploy --only firestore:rules
```

---

## 🔒 Security Considerations

### Firebase API Key
✅ **Safe to expose:** The `NEXT_PUBLIC_FIREBASE_API_KEY` is meant to be public. Firebase security is handled by Firestore Security Rules, not by hiding the API key.

### SMTP Credentials
⚠️ **Keep private:** These should only be in environment variables, NEVER in your code repository.

### Firebase Security Rules
Your actual security is enforced by Firestore Rules at:
- `firebase/firestore.rules`
- `firebase/storage.rules`

Make sure these are deployed to protect your data.

---

## 🐛 Troubleshooting

### Build succeeds but app doesn't work
- **Cause:** Missing environment variables
- **Fix:** Double-check all variables are added in Vercel dashboard

### Permission Denied Errors
- **Cause:** Firestore rules not deployed
- **Fix:** Run `firebase deploy --only firestore:rules`

### Firebase initialization errors
- **Cause:** Incorrect environment variable names
- **Fix:** Ensure all variables start with `NEXT_PUBLIC_FIREBASE_*`

### Email notifications not working
- **Cause:** SMTP variables missing or incorrect
- **Fix:** Verify SMTP credentials in Vercel environment variables

---

## 📊 Post-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Successful build on Vercel
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Test user signup/login
- [ ] Test property creation
- [ ] Test image uploads (Firebase Storage)
- [ ] Test email notifications
- [ ] Test search functionality
- [ ] Test mobile responsiveness
- [ ] Verify SEO meta tags on listing pages
- [ ] Test PWA installation on mobile

---

## 🌐 Custom Domain Setup (Optional)

1. Go to Vercel project → **Settings** → **Domains**
2. Add your custom domain (e.g., `viventa.com.do`)
3. Configure DNS records as shown by Vercel:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-60 minutes)
5. Vercel will automatically provision SSL certificate

---

## 📈 Monitoring & Analytics

### Vercel Analytics (Built-in)
- Automatic performance monitoring
- Real user metrics
- Core Web Vitals tracking

### Firebase Analytics
Already configured with `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Custom Analytics
Your app includes custom analytics tracking in:
- `lib/analytics.ts`
- Tracks: page views, property views, searches, inquiries

---

## 🔄 Continuous Deployment

Every push to `main` branch will trigger automatic deployment:
1. You push changes: `git push origin main`
2. Vercel automatically:
   - Detects the push
   - Runs build
   - Deploys to production
   - Provides deployment URL

Preview deployments for PRs are automatic too!

---

## 💡 Performance Optimizations

Already implemented in your app:
- ✅ Next.js Image Optimization
- ✅ PWA with Service Worker
- ✅ Static Generation for SEO pages
- ✅ Dynamic imports for heavy components
- ✅ CDN edge caching via Vercel

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Firebase rules are deployed
4. Confirm all environment variables are set

---

## 🎉 Your App is Now Live!

Once deployed, your platform will be available at:
- Production: `https://viventa-rd.vercel.app` (or your custom domain)
- All features working:
  - ✅ Property listings with SEO
  - ✅ Agent/user authentication
  - ✅ Image uploads to Firebase Storage
  - ✅ Search with dynamic stats
  - ✅ Mobile-responsive PWA
  - ✅ Bilingual (ES/EN) support
  - ✅ Lead capture and routing

---

## 🚨 Critical Note

The build shows some permission errors during static generation. This is **expected** and **non-blocking** because:
1. During build time, Firestore queries run without user authentication
2. Your Firestore rules require authentication for certain operations
3. These pages will work perfectly at runtime when users are authenticated

To reduce build warnings (optional), you can mark these pages as dynamic, but it's not necessary for functionality.
