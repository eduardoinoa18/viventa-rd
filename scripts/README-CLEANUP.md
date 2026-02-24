# Database Cleanup Script

## ⚠️ CRITICAL WARNING

This script will **DELETE ALL DATA** from your Firestore database and Firebase Auth except the master admin account.

**This action is IRREVERSIBLE.**

---

## What Gets Deleted

### Firestore Collections (ALL documents):
- ✅ `listings` / `properties` - All property listings
- ✅ `users` - All users except master admin
- ✅ `leads` - All leads
- ✅ `messages` - All messages
- ✅ `clients` - All client data
- ✅ `applications` - All professional applications
- ✅ `brokerages` - All brokerage companies
- ✅ `developers` - All developers
- ✅ `invites` - All invitation tokens
- ✅ `professional_credentials` - All credentials
- ✅ `audit_logs` - All audit logs
- ✅ `auth_codes` - All 2FA codes
- ✅ `auth_attempts` - All auth attempts
- ✅ `push_logs` - All push notifications
- ✅ `email_events` - All email events
- ✅ `analytics_events` - All analytics
- ✅ `counters` - All counters

### Firebase Auth:
- ✅ All user accounts EXCEPT `viventa.rd@gmail.com`

---

## What Gets Preserved

- ❌ Master admin account: `viventa.rd@gmail.com`
- ❌ Master admin user document in Firestore `users` collection
- ❌ Master admin authentication

---

## How to Run

### Option 1: Using npm script (Recommended)

```bash
npm run db:cleanup
```

### Option 2: Direct execution

```bash
cd functions
npx ts-node ../scripts/cleanup-database.ts
```

---

## Environment Variables

The script uses:
- `MASTER_ADMIN_EMAIL` - Email to preserve (defaults to `viventa.rd@gmail.com`)
- Firebase credentials from your environment (`.env.local`, service account, or default app)

---

## After Cleanup

Your database will be completely empty except for:
- 1 Firebase Auth user: `viventa.rd@gmail.com`
- 1 Firestore document: `users/{masterAdminUID}` with `role: 'master_admin'`

You can then:
1. Log in as master admin using the same credentials
2. Start creating fresh data (users, properties, leads, etc.)
3. Seed initial data if needed

---

## Troubleshooting

### "Master admin not found"
- Ensure `viventa.rd@gmail.com` exists in Firebase Auth
- Or set `MASTER_ADMIN_EMAIL` env var to your admin email

### "Permission denied"
- Ensure Firebase Admin SDK has access to your project
- Check service account credentials

### "Cannot read credentials"
- Ensure `.env.local` has Firebase config
- Or set `GOOGLE_APPLICATION_CREDENTIALS` to service account JSON path

---

## Safety Checklist

Before running:
- [ ] I understand this deletes ALL data
- [ ] I have backed up any important data if needed
- [ ] I confirmed the master admin email is correct
- [ ] I am ready to start with a clean database
- [ ] I am NOT running this in production (unless intentional)

---

## Recovery

There is **NO UNDO** for this operation.

If you need to restore data:
- Use Firebase console to restore from backup (if available)
- Re-seed your database from external sources
- Manually re-create accounts and data

---

**Use with caution. This is designed for development/testing environment resets.**
