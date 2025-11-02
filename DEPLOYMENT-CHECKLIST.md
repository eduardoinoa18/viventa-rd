# Deployment Checklist - VIVENTA

## Pre-Deployment Verification

### ✅ Code Quality
- [x] No TypeScript/lint errors
- [x] Build succeeds (`npm run build`)
- [x] All Algolia dependencies removed
- [x] Custom search implementation complete
- [x] Map view working with Leaflet
- [x] Performance optimizations applied (debouncing, caching)

### 📋 Environment Variables

Required `.env` variables for production:

```bash
# Firebase Client (NEXT_PUBLIC_* are exposed to browser)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBbfVSutdfIEQGRIQm7CvsahpXRF4R1uTk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=viventa-2a3fb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=viventa-2a3fb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=viventa-2a3fb.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=947338447559
NEXT_PUBLIC_FIREBASE_APP_ID=1:947338447559:web:c4976c91825adba104cce2
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-GWQD1BGQMR

# Firebase Admin (server-side only)
FIREBASE_ADMIN_PROJECT_ID=viventa-2a3fb
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@viventa-2a3fb.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email (SMTP or SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=viventa.rd@gmail.com
SMTP_PASS=gecp gnct wdqi grzz
SMTP_FROM=viventa.rd@gmail.com

# Admin Security
ADMIN_GATE_CODE=1713-0415
MASTER_ADMIN_EMAIL=viventa.rd@gmail.com
MASTER_ADMIN_PASSWORD=Imthebestadminhere18

# Optional: Stripe (if payment features enabled)
# STRIPE_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: Mapbox (if using Mapbox instead of Leaflet/OSM)
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
```

## Vercel Deployment Steps

### 1. Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import from GitHub: `eduardoinoa18/viventa-rd`
4. Select `main` branch for production

### 2. Configure Project
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 3. Add Environment Variables
1. In Vercel project → Settings → Environment Variables
2. Add all variables from `.env.local` (see list above)
3. Select environments: Production, Preview, Development
4. **Important**: For `FIREBASE_ADMIN_PRIVATE_KEY`, paste the full key including `\n` characters

### 4. Deploy
1. Click "Deploy"
2. Wait ~3-5 minutes for build
3. Note the deployment URL (e.g., `viventa-rd.vercel.app`)

## Post-Deployment Testing

### Critical Paths to Test

#### 1. Search Page (`/search`)
- [ ] Load search page successfully
- [ ] Text search works (e.g., "santo domingo")
- [ ] City filter dropdown populated with options
- [ ] Property type filter works
- [ ] Price range filter works
- [ ] Bedrooms/bathrooms filters work
- [ ] Pagination works (if >20 results)
- [ ] Map view shows markers
- [ ] Click marker navigates to listing detail
- [ ] Mobile: List/Map toggle works

**Expected Firestore Index Errors:**
When testing filters, Firebase Console will show errors like:
```
The query requires an index. You can create it here:
https://console.firebase.google.com/v1/r/project/viventa-2a3fb/firestore/indexes?create_composite=...
```
Click each link to create required indexes:
- `status (=) + createdAt (desc)`
- `status (=) + location.city (=) + createdAt (desc)`
- `status (=) + propertyType (=) + createdAt (desc)`
- `status (=) + listingType (=) + createdAt (desc)`

**Note:** Index creation takes 2-5 minutes. Test again after indexes are built.

#### 2. Apply Form (`/apply`)
- [ ] Load apply page
- [ ] Form validation works (required fields)
- [ ] File upload works (resume optional)
- [ ] Submit shows "Enviando..." state
- [ ] Success message appears on completion
- [ ] Confirmation email sent
- [ ] Application appears in admin dashboard

#### 3. Admin Dashboard (`/admin`)
- [ ] Load admin gate page
- [ ] Enter gate code: `1713-0415`
- [ ] Login with master admin email
- [ ] 2FA code sent to email
- [ ] Enter 2FA code
- [ ] Dashboard loads with widgets
- [ ] Properties list shows pending/active listings
- [ ] Approve property → changes to active
- [ ] Active property appears in search

#### 4. Property Detail (`/listing/[id]`)
- [ ] Load property detail page
- [ ] Images display correctly
- [ ] Contact form works
- [ ] Favorite button works (logged in)
- [ ] Share button works
- [ ] Amenities display
- [ ] Location map shows

#### 5. Authentication (`/login`, `/signup`)
- [ ] Signup creates new user
- [ ] Login works with email/password
- [ ] Forgot password sends reset email
- [ ] Logout works

### Performance Checks

#### Lighthouse Scores (target >90)
```bash
# Run Lighthouse in Chrome DevTools
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90
```

#### Core Web Vitals
- [ ] LCP (Largest Contentful Paint) <2.5s
- [ ] FID (First Input Delay) <100ms
- [ ] CLS (Cumulative Layout Shift) <0.1

#### Search Performance
- [ ] First search <1s
- [ ] Subsequent filters <300ms
- [ ] Text search debounced (no spam)
- [ ] Facets cached (check console logs)
- [ ] Map markers render smoothly

## Firestore Composite Indexes

After deployment, create these indexes in Firebase Console:

### Basic Search
```
Collection: listings
Fields:
  status (=)
  createdAt (desc)
```

### City Search
```
Collection: listings
Fields:
  status (=)
  location.city (=)
  createdAt (desc)
```

### Property Type Search
```
Collection: listings
Fields:
  status (=)
  propertyType (=)
  createdAt (desc)
```

### Listing Type Search
```
Collection: listings
Fields:
  status (=)
  listingType (=)
  createdAt (desc)
```

### Combined (City + Type)
```
Collection: listings
Fields:
  status (=)
  location.city (=)
  propertyType (=)
  createdAt (desc)
```

**Auto-Creation:** Firebase will provide direct links in error messages. Click to create automatically.

## Monitoring

### Vercel Dashboard
- [ ] Check deployment logs for errors
- [ ] Monitor function execution time
- [ ] Check bandwidth usage

### Firebase Console
- [ ] Firestore: Check read/write quotas
- [ ] Authentication: Monitor user signups
- [ ] Storage: Check file uploads
- [ ] Functions: Check execution logs (if any)

### Error Tracking (Recommended)
Consider adding:
- Sentry for error tracking
- Google Analytics for usage metrics
- LogRocket for session replay

## Rollback Plan

If critical issues found:

### Option 1: Revert to Previous Deployment
1. Vercel → Deployments
2. Find last working deployment
3. Click "⋮" → "Promote to Production"

### Option 2: Revert Git Commit
```bash
git revert HEAD
git push origin main
# Vercel auto-deploys the revert
```

### Option 3: Re-enable Algolia (if search broken)
```bash
# Restore Algolia files
mv lib/_algolia_backup/algoliaClient.ts lib/
mv lib/_algolia_backup/algoliaAdmin.ts lib/
mv app/search/page.tsx.algolia-backup app/search/page.tsx

# Reinstall dependencies
npm install algoliasearch@^4.24.0 react-instantsearch@^7.13.0

# Add env vars back
NEXT_PUBLIC_ALGOLIA_APP_ID=...
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=...
NEXT_PUBLIC_ALGOLIA_INDEX=viventa_listings
ALGOLIA_ADMIN_KEY=...

# Deploy
git add .
git commit -m "revert: restore Algolia search"
git push origin main
```

## Success Criteria

✅ Deployment successful when:
- [ ] All critical paths tested and working
- [ ] Firestore indexes created (no query errors)
- [ ] Search returns results (≥1 active listing)
- [ ] Apply form submits successfully
- [ ] Admin can login and approve listings
- [ ] Performance scores >90 on Lighthouse
- [ ] No console errors in production
- [ ] Mobile experience tested on real device

## Next Steps After Deployment

1. **Domain Setup** (Optional)
   - Add custom domain in Vercel (e.g., `viventa.do`)
   - Configure DNS records
   - Enable SSL (automatic with Vercel)

2. **SEO Optimization**
   - Submit sitemap to Google Search Console
   - Verify site ownership
   - Monitor search performance

3. **Marketing**
   - Share platform with agents/brokers
   - Collect feedback
   - Iterate on features

4. **Monitoring**
   - Set up error alerts
   - Monitor Firestore quotas
   - Track user engagement

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **VIVENTA Docs**: See `CUSTOM-SEARCH.md`, `TESTING.md`, `VERCEL-DEPLOYMENT.md`
- **Issues**: GitHub Issues or viventa.rd@gmail.com
