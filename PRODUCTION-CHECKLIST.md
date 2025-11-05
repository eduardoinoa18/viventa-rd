# Production Deployment Checklist - VIVENTA RD

**Last Updated:** November 5, 2025  
**Commit:** afc4782

---

## ✅ Completed Items

### Security & Infrastructure
- [x] Firestore security rules hardened (notifications collection)
- [x] Rate limiting on public endpoints (3-10 req/hr)
- [x] Email webhook signature verification (Resend/Svix)
- [x] Daily analytics aggregation with Vercel Cron
- [x] CI/CD pipeline active (.github/workflows/ci.yml)

### Analytics & Monitoring
- [x] Analytics event tracking (19 event types)
- [x] Real-time analytics dashboard (DAU/WAU/MAU)
- [x] Daily aggregation system (analytics_daily collection)
- [x] Email delivery monitoring panel
- [x] Page view tracking on key pages (login, signup, listings, dashboard)
- [x] Search tracking with filters

### Email System
- [x] Resend integration (preferred provider)
- [x] SendGrid fallback support
- [x] SMTP fallback with Gmail-specific handling
- [x] Email event logging (analytics_events + email_events)
- [x] Admin Email Delivery page with filters

### UI/UX
- [x] Design system (6 reusable components: Button, Card, FormField, TextInput, Select, Toggle)
- [x] Admin Settings refactored (14 sections → 250 lines)
- [x] Email Delivery link in AdminSidebar
- [x] Accessibility improvements (ARIA labels, keyboard nav)

---

## 🔧 Manual Configuration Required

### 1. Resend Email Provider Setup (High Priority)
**Why:** Improves deliverability, enables webhook tracking, free tier sufficient for current scale

**Steps:**
1. Sign up at https://resend.com
2. Add and verify your domain:
   - Go to Domains → Add Domain
   - Add DNS records provided by Resend:
     ```
     TXT @ "resend-verification=xxxxx"
     TXT @ "v=spf1 include:amazonses.com ~all"
     CNAME resend._domainkey YOUR_DKIM_VALUE
     ```
   - Wait for verification (can take 24-48 hours)

3. Create API key:
   - Go to API Keys → Create API Key
   - Copy the key (starts with `re_`)

4. Set environment variables in Vercel:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM=notifications@yourdomain.com
   RESEND_WEBHOOK_SECRET=whsec_xxxxxx  # Get from webhook settings
   ```

5. Configure webhook in Resend dashboard:
   - Webhook URL: `https://yourdomain.com/api/webhooks/email`
   - Events: email.sent, email.delivered, email.delivery_delayed, email.complained, email.bounced, email.opened, email.clicked
   - Copy the signing secret and add to `RESEND_WEBHOOK_SECRET`

**Validation:**
- Send a test email via any contact form
- Check Resend dashboard for delivery status
- Check `/admin/email/events` for webhook events
- Verify `analytics_events` and `email_events` collections have entries

---

### 2. Daily Analytics Aggregation (Medium Priority)
**Why:** Vercel Cron already configured but needs production verification

**Steps:**
1. Verify `vercel.json` is deployed:
   ```json
   {
     "crons": [
       {
         "path": "/api/admin/analytics/aggregate",
         "schedule": "0 1 * * *"
       }
     ]
   }
   ```

2. Optional: Set `CRON_SECRET` for manual triggers:
   ```bash
   CRON_SECRET=your-random-secret-here
   ```

3. Manually trigger first aggregation (after deployment):
   ```bash
   curl -X GET "https://yourdomain.com/api/admin/analytics/aggregate?date=2025-11-04" \
     -H "x-cron-secret: YOUR_SECRET"
   ```

4. Verify `analytics_daily` collection in Firestore has documents

**Validation:**
- Wait 24 hours for first scheduled run
- Check Vercel dashboard → Cron Jobs for execution logs
- Visit `/admin/analytics/events` and verify DAU trend uses daily data
- Check `analytics_daily` collection for date-keyed documents

---

### 3. Firestore Security Rules Deployment (High Priority)
**Why:** Updated rules in codebase need Firebase CLI deployment

**Steps:**
1. Ensure Firebase CLI is installed:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Initialize Firebase project (if not done):
   ```bash
   firebase init
   # Select Firestore
   # Use existing project
   # Use firebase/firestore.rules for rules
   ```

3. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. Verify deployment:
   ```bash
   firebase firestore:rules get
   ```

**Validation:**
- Try to query `/notifications` as a non-admin user → should only return their own
- Check Firebase Console → Firestore → Rules for updated timestamp

---

### 4. Environment Variables Audit (Medium Priority)
**Why:** Ensure all production secrets are set in Vercel

**Required Variables:**

#### Firebase (Critical)
```bash
FIREBASE_SERVICE_ACCOUNT=base64_encoded_json_or_raw_json
# OR split format:
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@xxx.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXX\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

#### Email (Critical)
```bash
RESEND_API_KEY=re_xxxxx
RESEND_FROM=notifications@yourdomain.com
RESEND_WEBHOOK_SECRET=whsec_xxxxx
```

#### Optional but Recommended
```bash
CRON_SECRET=random-secret-for-manual-cron-triggers
SENDGRID_API_KEY=SG.xxxxx  # Fallback if Resend fails
SMTP_HOST=smtp.gmail.com    # Final fallback
SMTP_USER=your@gmail.com
SMTP_PASS=app-specific-password
```

#### Algolia Search
```bash
NEXT_PUBLIC_ALGOLIA_APP_ID=your-app-id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=search-only-key
ALGOLIA_ADMIN_API_KEY=admin-key  # Server-side only
```

---

### 5. GitHub Branch Protection (Low Priority)
**Why:** Prevent direct pushes to main, enforce PR reviews

**Steps:**
1. Go to GitHub → Settings → Branches
2. Add rule for `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass (select: `build / Build`)
   - ✅ Require branches to be up to date
   - ⚠️ Do not require approvals for admins (optional)

**Validation:**
- Try to push directly to main → should be rejected
- Create a PR → CI should run automatically

---

### 6. Analytics Firestore Indexes (Optional - Auto-created on demand)
**Why:** Optimize query performance for analytics dashboard

**Composite Indexes Likely Needed:**
```
Collection: analytics_events
Fields: date (Ascending), eventType (Ascending)

Collection: analytics_daily
Fields: date (Ascending)
```

**Steps:**
1. Wait for first Firestore query errors in logs
2. Click the auto-generated index creation link in error message
3. Or manually create via Firebase Console → Firestore → Indexes

---

## 📊 Post-Deployment Verification

### Immediate Checks (0-1 hour)
- [ ] Site loads at production URL
- [ ] Login/signup flows work
- [ ] Search returns results
- [ ] Email delivery works (test contact form)
- [ ] Admin dashboard accessible
- [ ] Analytics events appearing in Firestore

### 24-Hour Checks
- [ ] First daily aggregation ran successfully
- [ ] Email webhooks received (check `/admin/email/events`)
- [ ] No critical errors in Vercel logs
- [ ] Analytics dashboard shows accurate DAU/WAU

### 7-Day Checks
- [ ] Analytics trends display properly
- [ ] Email delivery rate > 95%
- [ ] No rate limiting false positives
- [ ] Search performance acceptable

---

## 🚀 Production URLs

- **App:** https://viventa-rd.vercel.app (or custom domain)
- **Admin:** https://viventa-rd.vercel.app/admin
- **Analytics:** https://viventa-rd.vercel.app/admin/analytics/events
- **Email Delivery:** https://viventa-rd.vercel.app/admin/email/events

---

## 📞 Support & Troubleshooting

### Common Issues

**"Email not sending"**
- Check Vercel logs for error messages
- Verify `RESEND_API_KEY` is set correctly
- Test API key with `curl -H "Authorization: Bearer re_xxx" https://api.resend.com/emails`
- Check Resend dashboard for account status/limits

**"Analytics not showing data"**
- Check browser console for tracking errors
- Verify `/api/analytics/track` returns 200
- Check Firestore `analytics_events` collection has documents
- Ensure Firebase Admin SDK credentials are valid

**"Daily aggregation not running"**
- Check Vercel → Deployments → Cron Jobs tab
- Verify `vercel.json` has crons configuration
- Manually trigger via `/api/admin/analytics/aggregate`
- Check Vercel logs for execution errors

**"Webhook signature invalid"**
- Verify `RESEND_WEBHOOK_SECRET` matches Resend dashboard
- Check webhook logs in Resend dashboard
- Try re-creating the webhook endpoint

### Useful Commands

```bash
# Check Vercel deployment status
vercel ls

# View production logs
vercel logs viventa-rd

# Test API endpoint
curl -X POST https://yourdomain.com/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"eventType":"page_view","userId":"test"}'

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Check Firestore indexes
firebase firestore:indexes
```

---

## 📈 Next Optimization Opportunities

Once stable in production, consider:

1. **Performance**
   - Add Redis for rate limiting (remove in-memory Map)
   - Implement analytics event batching
   - Add CDN caching for static assets

2. **Features**
   - Agent performance scoring (use analytics_events data)
   - Lead scoring algorithm
   - Property recommendation ML model
   - WhatsApp Business API integration

3. **Monitoring**
   - Sentry for error tracking
   - Datadog/New Relic for APM
   - Uptime monitoring (Pingdom/UptimeRobot)

4. **Analytics Enhancements**
   - Funnel analysis (search → view → inquiry → application)
   - Cohort retention analysis
   - A/B testing framework

---

**Status:** Ready for production deployment ✅  
**Estimated Setup Time:** 2-3 hours (mostly waiting for DNS propagation)
