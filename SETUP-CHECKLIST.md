# 🔧 VIVENTA Platform - Setup & Configuration Checklist

## ✅ What Was Fixed (Just Deployed)

### Critical Bugs Resolved:
1. **Homepage Redirect Issue** - Fixed middleware redirecting all users from `/` to `/agent`
   - Homepage now accessible to everyone regardless of login status
   - Login/signup pages still redirect logged-in users to appropriate dashboards

2. **TypeScript Build Errors** - Fixed type annotations in admin notifications page
   - Added explicit `(d: any)` type annotations to Firestore map functions

3. **Stripe Dependency Missing** - Added `stripe` package to dependencies
   - Webhook route now builds successfully
   - Package version: 17.3.1

4. **Duplicate BottomNav** - Removed from root layout
   - BottomNav only renders on pages that need it (homepage, dashboard, favorites)
   - Prevents double navigation bars

5. **Build Verification** - Successfully tested with `npm run build`
   - All TypeScript checks passing
   - No compilation errors

---

## 📋 Required Environment Variables Setup

### **Create/Update `.env.local` file:**

```env
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin Authentication (REQUIRED)
MASTER_ADMIN_PASSWORD=your_secure_master_password
MASTER_ADMIN_EMAIL=admin@viventa-rd.com

# Email Notifications (REQUIRED for contact forms)
ADMIN_NOTIFICATION_EMAILS=email1@example.com,email2@example.com

# SendGrid (Option 1 - Recommended)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@viventa-rd.com

# OR SMTP (Option 2 - Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Algolia Search (Optional - for advanced search)
NEXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_search_api_key
ALGOLIA_ADMIN_API_KEY=your_admin_api_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://viventa-rd.com
NEXT_PUBLIC_GOOGLE_VERIFICATION=your_google_verification_code
```

---

## 🔥 Firebase Console Setup Tasks

### 1. **Enable Authentication Methods:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable: Email/Password
   - Enable: Google (optional)
   - Add authorized domains: `viventa-rd.com`, `vercel.app`, `localhost`

### 2. **Create Firestore Database:**
   - Go to Firestore Database → Create database
   - Start in **production mode** (you'll deploy rules separately)
   - Choose location: `us-east1` or closest to Dominican Republic

### 3. **Deploy Firestore Security Rules:**
   ```bash
   cd "c:\Users\eduar\OneDrive\Desktop\Viventa RD"
   firebase deploy --only firestore:rules
   ```
   - Rules file location: `firebase/firestore.rules`

### 4. **Deploy Storage Security Rules:**
   ```bash
   firebase deploy --only storage
   ```
   - Rules file location: `firebase/storage.rules`

### 5. **Create Firestore Indexes:**
   Create these indexes manually in Firebase Console → Firestore Database → Indexes:
   
   **Properties Collection:**
   - Fields: `status (Ascending)`, `createdAt (Descending)`
   - Fields: `status (Ascending)`, `featured (Ascending)`, `createdAt (Descending)`
   - Fields: `agentId (Ascending)`, `createdAt (Descending)`
   
   **Notifications Collection:**
   - Fields: `audience (Array)`, `createdAt (Descending)`
   
   **Contact Submissions Collection:**
   - Fields: `createdAt (Descending)`

### 6. **Create Storage Buckets:**
   - Go to Storage → Create bucket
   - Create folders:
     - `/properties` - for property images
     - `/agents` - for agent profile photos
     - `/users` - for user avatars

---

## 📧 Email Service Setup (Choose One)

### **Option A: SendGrid (Recommended)**
1. Sign up at https://sendgrid.com
2. Create API Key: Settings → API Keys → Create API Key
3. Verify sender identity: Settings → Sender Authentication
4. Add API key to `.env.local` as `SENDGRID_API_KEY`
5. Add verified sender email as `SENDGRID_FROM_EMAIL`

### **Option B: Gmail SMTP**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password: Google Account → Security → App passwords
3. Add credentials to `.env.local`:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your_email@gmail.com`
   - `SMTP_PASSWORD=your_16_char_app_password`

---

## 💳 Stripe Setup (Optional - For Payments)

### If you want to enable billing features:
1. Sign up at https://stripe.com
2. Get test keys: Developers → API keys
3. Add to `.env.local`:
   - `STRIPE_SECRET_KEY` (starts with `sk_test_`)
   - `STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
4. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## 🔍 Algolia Search Setup (Optional - For Advanced Search)

### If you want enhanced search functionality:
1. Sign up at https://www.algolia.com
2. Create application and index named `properties`
3. Get API keys: Settings → API Keys
4. Add to `.env.local`:
   - `NEXT_PUBLIC_ALGOLIA_APP_ID`
   - `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY`
   - `ALGOLIA_ADMIN_API_KEY`
5. Configure index settings:
   - Searchable attributes: `title`, `description`, `location.city`, `location.neighborhood`
   - Attributes for faceting: `propertyType`, `listingType`, `bedrooms`, `bathrooms`, `status`

---

## 🚀 Vercel Deployment Setup

### 1. **Import GitHub Repository:**
   - Go to https://vercel.com/new
   - Import `eduardoinoa18/viventa-rd`
   - Framework Preset: Next.js

### 2. **Add Environment Variables:**
   - Copy ALL variables from `.env.local` to Vercel
   - Settings → Environment Variables → Add each one
   - **Important:** Select "Production", "Preview", and "Development" for each

### 3. **Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Node Version: 18.x or 20.x

### 4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your live site!

### 5. **Add Custom Domain (Optional):**
   - Settings → Domains
   - Add `viventa-rd.com` and `www.viventa-rd.com`
   - Update DNS records as instructed

---

## 📱 PWA Configuration

### Update `public/manifest.json`:
```json
{
  "name": "VIVENTA - Tu Espacio, Tu Futuro",
  "short_name": "VIVENTA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B2545",
  "theme_color": "#00A676",
  "description": "Plataforma inmobiliaria líder en República Dominicana"
}
```

### Generate PWA Icons:
```bash
cd "c:\Users\eduar\OneDrive\Desktop\Viventa RD"
npm run generate-icons
```
- Place your logo as `public/logo.png` (512x512px minimum)
- Script will generate all required icon sizes

---

## 🧪 Testing Checklist

### Test these features after deployment:

#### ✅ **Navigation & Routing:**
- [ ] Homepage loads correctly for all users
- [ ] Logged-in users can still access homepage
- [ ] Login page redirects agents to `/agent` dashboard
- [ ] Login page redirects brokers to `/broker` dashboard
- [ ] Login page redirects regular users to `/dashboard`
- [ ] Mobile bottom navigation shows correct active state
- [ ] All navigation tabs work (Home, Search, Messages, Favorites, Profile)

#### ✅ **Authentication:**
- [ ] Sign up with email/password works
- [ ] Login with email/password works
- [ ] Password reset email sends correctly
- [ ] Master admin can access `/admin` with password
- [ ] Role-based access control works (agent, broker, admin routes)

#### ✅ **Property Features:**
- [ ] Search page loads properties
- [ ] Property detail pages display correctly
- [ ] Property inquiry form sends emails
- [ ] Featured properties show on homepage
- [ ] Advanced filters work properly
- [ ] Favorites can be saved (logged-in users)

#### ✅ **Admin Features:**
- [ ] Notification center loads data
- [ ] Contact submissions appear in admin panel
- [ ] Property inquiries appear in admin panel
- [ ] Mark as read functionality works

#### ✅ **Agent Features:**
- [ ] Agent listings page shows properties
- [ ] Agent can view their listings
- [ ] Status changes save to database
- [ ] Stats display correctly

#### ✅ **Email Notifications:**
- [ ] Contact form sends email to admins
- [ ] Property inquiry sends to agent + admins
- [ ] Auto-reply email sent to inquirer
- [ ] Emails include all required information

---

## 🐛 Known Issues & Solutions

### Issue: "White page" on certain routes
**Solution:** Already fixed! Middleware was redirecting logged-in users from homepage.

### Issue: TypeScript build errors
**Solution:** Already fixed! Added explicit type annotations.

### Issue: Stripe webhook failing
**Solution:** Already fixed! Added stripe package to dependencies.

### Issue: Bottom navigation appearing twice
**Solution:** Already fixed! Removed from root layout.

---

## 📊 Database Collections Structure

Your Firestore should have these collections:

```
users/
  - {userId}/
    - email, role, name, createdAt, etc.
    - saved_searches/ (subcollection)

properties/
  - {propertyId}/
    - title, price, location, images, status, agentId, etc.

agents/
  - {agentId}/
    - name, email, area, rating, photo, etc.

notifications/
  - {notificationId}/
    - message, audience, readBy, createdAt, etc.

contact_submissions/
  - {submissionId}/
    - name, email, message, readBy, createdAt, etc.

property_inquiries/
  - {inquiryId}/
    - propertyId, propertyTitle, name, email, phone, message, visitDate, readBy, createdAt, etc.

billing_customers/ (if using Stripe)
billing_subscriptions/ (if using Stripe)
billing_invoices/ (if using Stripe)
```

---

## 🎯 Next Steps After Setup

1. **Test all functionality locally:**
   ```bash
   npm run dev
   ```
   Visit: http://localhost:3000

2. **Create first master admin account:**
   - Visit: https://your-domain.com/admin/login
   - Enter password from `MASTER_ADMIN_PASSWORD`
   - Will auto-create master admin user

3. **Add sample properties:**
   - Use admin panel or agent dashboard
   - Upload high-quality images
   - Set some properties as "featured"

4. **Test email notifications:**
   - Submit contact form
   - Submit property inquiry
   - Check admin notification center
   - Verify emails received

5. **Configure SEO:**
   - Update `next-sitemap.config.js`
   - Submit sitemap to Google Search Console
   - Verify structured data

---

## 📞 Support & Documentation

- **Firebase Docs:** https://firebase.google.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Stripe Docs:** https://stripe.com/docs
- **Algolia Docs:** https://www.algolia.com/doc/
- **SendGrid Docs:** https://docs.sendgrid.com/

---

## ✨ Recent Features Added

- ✅ Advanced filter modal with 12+ filter options
- ✅ Featured properties section with tabs (Featured/New/Popular)
- ✅ Agent listing management dashboard
- ✅ Property inquiry forms with multi-recipient notifications
- ✅ Admin notification center (3 tabs)
- ✅ Mobile navigation fixes
- ✅ Homepage redirect fix
- ✅ TypeScript compilation fix
- ✅ Stripe webhook integration

---

**Last Updated:** October 29, 2025
**Platform Status:** ✅ Build Passing | All Critical Issues Resolved
