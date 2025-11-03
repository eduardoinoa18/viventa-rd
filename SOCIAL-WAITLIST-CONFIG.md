# Social Network Waitlist - Configuration Guide

## ✅ Completed Features

### 1. **Email Notifications System**
When a user joins the social network waitlist:

- ✅ **User receives confirmation email** from `noreply@viventa.com`
  - Welcome message
  - List of upcoming features
  - Confirmation of email address
  
- ✅ **Admins receive notification email** with:
  - User's email address
  - IP address
  - Timestamp
  - Source tracking
  - Link to view in admin dashboard

- ✅ **Admin portal notification** created automatically
  - Type: `social_waitlist`
  - Visible in admin dashboard notifications
  - Includes user email and timestamp

### 2. **Data Storage**
- All signups saved to Firestore collection: `waitlist_social`
- Each email is used as document ID (automatic deduplication)
- Fields stored:
  - `email`
  - `ip`
  - `userAgent`
  - `referer`
  - `source`: "social_coming_soon"
  - `status`: "waitlist"
  - `createdAt`
  - `updatedAt`

### 3. **WhatsApp Group Integration**
- ✅ WhatsApp button added to `/social` page
- ✅ Fully styled with green WhatsApp branding
- ✅ Shows "Próximamente Disponible" when not configured
- ✅ Becomes active link when configured

## 🔧 How to Configure WhatsApp Group Link

### Step 1: Create WhatsApp Group
1. Open WhatsApp on your phone
2. Create a new group: "VIVENTA - Red Social Waitlist" (or similar name)
3. Add a welcome message to the group
4. Go to Group Info → Invite via link
5. Copy the invite link (looks like: `https://chat.whatsapp.com/XXXXXXXXXXXXX`)

### Step 2: Add to Environment Variables

**For Development (.env.local):**
```bash
NEXT_PUBLIC_SOCIAL_WHATSAPP_GROUP=https://chat.whatsapp.com/XXXXXXXXXXXXX
```

**For Production (Vercel Dashboard):**
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add new variable:
   - Name: `NEXT_PUBLIC_SOCIAL_WHATSAPP_GROUP`
   - Value: `https://chat.whatsapp.com/XXXXXXXXXXXXX`
   - Environment: Production (and Preview if needed)
4. Redeploy your application

### Step 3: Verify
1. Visit `/social` page
2. Button should now say "Unirme al Grupo" instead of "Próximamente Disponible"
3. Click to test - should open WhatsApp with group invite

## 📊 Admin Dashboard Access

### View Waitlist Signups
Access the waitlist data in your admin panel:

1. **Via Firestore Console:**
   - Collection: `waitlist_social`
   - Each document = one email signup
   - Sort by `createdAt` to see most recent

2. **Via Admin Notifications:**
   - Check notifications panel in admin dashboard
   - Type: `social_waitlist`
   - Click to see email details

3. **Via Email:**
   - Check admin inbox (`viventa.rd@gmail.com`)
   - Subject: "🔔 Nueva Suscripción - Waitlist Red Social VIVENTA"

## 📧 Email Marketing

### Export Waitlist for Campaigns
You can export the email list from Firestore:

```javascript
// Query waitlist_social collection
// Export emails to CSV or your email marketing tool
// Status field helps filter active subscribers
```

### Recommended Actions
1. **Weekly Summary**: Set up a weekly report of new signups
2. **Segmentation**: Tag waitlist users in your CRM
3. **Launch Campaign**: When ready, send launch announcement to all waitlist emails
4. **WhatsApp Updates**: Share sneak peeks in WhatsApp group regularly

## 🎯 User Journey

1. **User visits `/social` page**
2. **Sees "Coming Soon" features list**
3. **Two options to join:**
   - ✉️ Enter email → Get confirmation email + added to marketing list
   - 💬 Join WhatsApp Group → Instant community access
4. **Both routes:**
   - Admin gets notified immediately
   - User added to Firestore for tracking
   - Can be converted to full user when social launches

## 🔒 Security Notes

- Emails sent from `noreply@viventa.com` (protects admin email)
- Rate limiting on API endpoint (10 per hour per IP)
- Email validation before saving
- Automatic deduplication (same email = updates existing record)
- All sensitive data in environment variables

## 📱 Testing

### Test Email Submission
1. Go to `/social`
2. Enter a test email
3. Check:
   - ✅ Success message appears
   - ✅ Email received at test address
   - ✅ Admin email received at `viventa.rd@gmail.com`
   - ✅ Notification appears in admin dashboard
   - ✅ Document created in Firestore `waitlist_social`

### Test WhatsApp (after configuration)
1. Add env variable with WhatsApp link
2. Refresh `/social` page
3. Button should be enabled
4. Click → Opens WhatsApp group invite

## 🚀 Next Steps

1. **Configure WhatsApp Group Link** (see Step 2 above)
2. **Test both email and WhatsApp flows**
3. **Monitor signups in admin dashboard**
4. **Plan launch date and prepare to notify waitlist**
5. **Consider adding more engagement:**
   - Share development updates in WhatsApp
   - Send sneak peek videos via email
   - Create countdown campaign

---

**Questions?** Check the code:
- Frontend: `/components/SocialComingSoon.tsx`
- API: `/app/api/notify/social/route.ts`
- Admin: Firestore collections `waitlist_social` and `notifications`
