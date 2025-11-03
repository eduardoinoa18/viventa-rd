# 🔐 Viventa Demo Credentials

## Last Updated: November 3, 2025

---

## 🎭 Demo Account Credentials

### 👨‍💼 Agent Demo Account
```
Email:    agent.demo@viventa.com
Password: AgentDemo#2025
Role:     Agent
Dashboard: /agent
```

**Features to Test:**
- View agent dashboard with stats
- Manage property listings
- View and manage leads
- Access tasks and calendar
- Test AI assistant

---

### 🏢 Broker Demo Account
```
Email:    broker.demo@viventa.com
Password: BrokerDemo#2025
Role:     Broker
Dashboard: /broker
```

**Features to Test:**
- View broker dashboard with team overview
- Manage team of agents
- Invite new agents to team
- View team performance
- Monitor team presence status
- Access team analytics

---

### 👑 Master Admin Account
```
Email:    eduardoinoa18@gmail.com
Password: (Your personal password)
Role:     Master Admin
Dashboard: /admin
```

**Features to Test:**
- Manage all users (agents, brokers, customers)
- Create and approve professionals
- View applications and leads
- Access analytics and reports
- Manage properties and listings
- Configure system settings
- View activity logs

---

## 🚀 Quick Test Guide

### Testing Agent Account:
1. Go to https://viventa.com.do/login (or localhost:3000/login)
2. Enter agent credentials
3. Should auto-route to `/agent` dashboard
4. Test:
   - ✅ View Overview tab (stats cards)
   - ✅ Check Listings tab
   - ✅ Review Leads tab
   - ✅ Test Tasks functionality
   - ✅ Try creating a new listing

### Testing Broker Account:
1. Go to https://viventa.com.do/login
2. Enter broker credentials
3. Should auto-route to `/broker` dashboard
4. Test:
   - ✅ View team dashboard
   - ✅ Check team members list
   - ✅ Test invite modal
   - ✅ View team presence
   - ✅ Check team performance stats

### Testing Admin Account:
1. Go to https://viventa.com.do/admin/login (or /login)
2. Enter admin credentials
3. Should auto-route to `/admin` dashboard
4. Test:
   - ✅ Click "Create Agent" button
   - ✅ Fill 3-step professional form
   - ✅ Submit and check success
   - ✅ Find professional in users table
   - ✅ Click approve button (award icon)
   - ✅ Confirm credential sending
   - ✅ Check email was sent (check SendGrid dashboard)

---

## 🔄 Creating Demo Accounts (If Needed)

If demo accounts don't exist, create them using the API:

### Method 1: Via API Endpoint
```bash
POST http://localhost:3000/api/dev/seed-pro-users
```

### Method 2: Via Admin UI
1. Login as master admin
2. Go to Admin → Users
3. Click "Create Agent" or "Create Broker"
4. Fill form with demo data
5. Submit and approve

---

## 📧 Email Testing

### SendGrid Email Delivery:
- Welcome emails sent to: agent.demo@viventa.com, broker.demo@viventa.com
- Check SendGrid dashboard for delivery status
- Password reset links expire in 1 hour

### Test Email Flow:
1. Create professional via admin
2. Approve professional
3. Check SendGrid dashboard for sent email
4. Verify email contains:
   - ✅ Professional greeting
   - ✅ Professional code (AGT-XXX or BRK-XXX)
   - ✅ "Set Up My Password" button
   - ✅ Viventa branding

---

## 🐛 Troubleshooting

### Can't Login?
- ✅ Check if Firebase Auth account exists
- ✅ Verify email/password combination
- ✅ Try password reset via /forgot-password
- ✅ Check browser console for errors
- ✅ Clear cookies and try again

### Wrong Dashboard After Login?
- ✅ Check user role in Firestore users collection
- ✅ Verify session cookie (viventa_role)
- ✅ Check /login routing logic
- ✅ Clear session and login again

### Permissions Denied?
- ✅ Check Firestore rules are deployed
- ✅ Verify user role matches rule requirements
- ✅ Check Firebase console → Firestore → Rules
- ✅ Re-deploy rules if needed: `firebase deploy --only firestore:rules`

---

## 🎯 Test Scenarios

### Scenario 1: New Professional Onboarding
1. Admin creates agent via "Create Agent" button
2. Fill comprehensive form (3 steps)
3. Submit → Professional created with code
4. Admin approves → Email sent
5. Agent receives email with credentials
6. Agent sets password
7. Agent logs in → Routes to /agent dashboard
8. **Expected Time:** < 10 minutes

### Scenario 2: Agent Daily Workflow
1. Agent logs in
2. Views dashboard stats
3. Checks new leads
4. Updates listing
5. Contacts client
6. Marks task complete
7. **Expected Time:** 5-10 minutes

### Scenario 3: Broker Team Management
1. Broker logs in
2. Views team dashboard
3. Checks team performance
4. Invites new agent
5. Monitors agent activity
6. Reviews team listings
7. **Expected Time:** 5-10 minutes

---

## 📊 Expected Behavior

### After Login Success:
- ✅ Session cookie set (viventa_role, viventa_uid, viventa_name)
- ✅ Automatic route to appropriate dashboard
- ✅ User data loads from Firestore
- ✅ Dashboard stats populate
- ✅ No permission errors in console

### Dashboard Features:
- ✅ Professional header with gradient
- ✅ Tab navigation working
- ✅ Stats cards show real data
- ✅ Tables load correctly
- ✅ Actions functional (create, edit, delete)
- ✅ Responsive on mobile

---

## 💾 Data Storage

### Firebase Collections Used:
- `users` - User accounts and profiles
- `listings` - Property listings
- `leads` - Customer leads
- `applications` - Professional applications
- `notifications` - System notifications
- `activity_logs` - Audit trail

### Session Storage:
- Cookies: viventa_role, viventa_uid, viventa_name
- Expires: 7 days
- Secure: true (production)
- HttpOnly: true

---

## 🔐 Security Notes

### Demo Account Limitations:
- ⚠️ Demo accounts are for testing only
- ⚠️ Do not use in production
- ⚠️ Passwords should be changed after testing
- ⚠️ Demo data may be reset periodically

### Production Security:
- ✅ All passwords hashed by Firebase Auth
- ✅ Password reset links expire in 1 hour
- ✅ Session cookies are secure
- ✅ Firestore rules enforce permissions
- ✅ Admin actions logged for audit

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase rules are deployed
3. Check Firestore for user data
4. Review SendGrid dashboard for emails
5. Test in incognito mode
6. Clear browser cache/cookies

---

**Ready to Test!** 🚀

Use these credentials to explore the platform and test the professional onboarding workflow.
