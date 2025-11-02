# Master Admin Setup – Email 2FA Configuration

This guide explains how to configure the **master admin 2FA email delivery** so you receive the verification code when logging in at `/admin/login`.

---

## Current Setup

The system uses **two-factor authentication** for master admin logins. When you submit your email:

1. The API generates a 6-digit code and stores it temporarily (in memory).
2. The system attempts to send the code to your email using **SendGrid** or **SMTP** (depending on `.env.local` configuration).
3. If email sending fails:
   - **In production**: Returns an error `Email provider error. Please check SENDGRID or SMTP credentials.`
   - **In development/localhost**: Returns the code directly in the response under the `devCode` field to allow testing even without email providers.

---

## Credentials & Allowlist

The master admin emails are controlled by environment variables. If you're not receiving codes, confirm:

**Your current email allowlist:**
```bash
MASTER_ADMIN_EMAILS=viventa.rd@gmail.com
```

- Only the emails listed in `MASTER_ADMIN_EMAILS` (or `MASTER_ADMIN_EMAIL`) can request codes.
- In **development** mode, all emails are allowed by default.
- In **production**, the allowlist must match exactly, case-insensitive.

If you need to add multiple emails, separate them with commas:
```bash
MASTER_ADMIN_EMAILS=viventa.rd@gmail.com,admin@viventa.com
```

---

## Email Delivery Setup

Choose **one** provider—either **SendGrid** (recommended) or **SMTP**.

### Option 1: SendGrid (Recommended)

**Why?** SendGrid is free for up to 100 emails/day and has the best deliverability.

1. Sign up at [sendgrid.com](https://sendgrid.com) (free tier: 100 emails/day).
2. Go to **Settings → API Keys** and create a new API key with "Mail Send" permissions.
3. Add these to your `.env.local` file:
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@viventa.com
   ```
   - Use your verified sender address for `SENDGRID_FROM_EMAIL`.
4. Verify a sender in SendGrid (Settings → Sender Authentication).

**Testing locally:**
Run your local dev server:
```bash
npm run dev
```
Visit http://localhost:3000/admin/login, enter your master admin email, and check the terminal for:
```
📧 SendGrid email sent successfully
```

---

### Option 2: SMTP (Gmail or other)

**Gmail example:**

1. Enable **2-Step Verification** on your Gmail account.
2. Go to [Google Account → Security → App passwords](https://myaccount.google.com/apppasswords).
3. Generate an app-specific password.
4. Add these to your `.env.local`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=gecp gnct wdqi grzz
   SMTP_FROM=your-email@gmail.com
   ```

**Testing:**
```bash
npm run dev
```
Visit `/admin/login`, enter your master admin email, and watch terminal logs for:
```
📧 SMTP email sent successfully
```

---

## Troubleshooting

### Problem: "Email provider error" in production

**Cause:** No email provider configured or credentials are invalid.

**Solution:**
- In production, ensure **SendGrid** or **SMTP** environment variables are set.
- Check the logs for error messages like:
  ```
  ❌ No email service configured!
  ❌ Email send error: 403 Forbidden
  ```
- Verify your API key, SMTP password, and sender email are correct.

---

### Problem: "it says sent but I didn't receive the code" (production)

**Cause:** Email is being sent to spam, or the sender email is not verified.

**Solution:**
- **SendGrid:** Verify your sender email in SendGrid Dashboard → Sender Authentication.
- **Gmail SMTP:** Check your Gmail "Sent" folder; confirm the email was sent.
- **Spam folder:** Check recipient's spam/junk folder.
- **Domain authentication:** For production, set up SPF/DKIM records for your domain via SendGrid.

---

### Problem: Works locally, but not in production

**Cause:** `.env.local` is ignored in production. Your production host needs the environment variables configured separately.

**Solution:**
- For **Vercel**: Go to Project Settings → Environment Variables and add `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, and `MASTER_ADMIN_EMAILS`.
- For **other hosts** (Netlify, Render, Railway, etc.): add the same variables in their settings/dashboard.

---

## Local Dev Mode

When running locally (`NODE_ENV=development` or hostname includes `localhost`):

- **All emails** are allowed by default.
- If email sending fails, the API returns a `devCode` field in the response so you can still log in.
- Check the terminal/console logs; it will print:
  ```
  🔐 DEV CODE: 123456
  ```
- Enter this code in the UI to log in.

If you want this behavior in **staging/preview** environments (for testing), add:
```bash
ALLOW_DEV_2FA_RESPONSE=true
```
**DO NOT** enable this in production.

---

## Quick Start Checklist

1. ✅ Choose SendGrid or SMTP.
2. ✅ Add the credentials to `.env.local` (local) or your host's environment variables (production).
3. ✅ Add your master admin email to `MASTER_ADMIN_EMAILS`.
4. ✅ Restart the dev server or redeploy.
5. ✅ Test login at `/admin/login`.
6. ✅ Check terminal logs for "Email sent successfully" or errors.

---

## Example `.env.local` (Complete)

```bash
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=viventa-rd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=viventa-rd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=viventa-rd.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Master Admin 2FA
MASTER_ADMIN_EMAILS=viventa.rd@gmail.com,your-email@gmail.com
ALLOW_ANY_MASTER_EMAIL=false
ALLOW_DEV_2FA_RESPONSE=true

# Email (choose ONE)
# --- SendGrid ---
SENDGRID_API_KEY=SG.abc123...
SENDGRID_FROM_EMAIL=noreply@viventa.com

# --- OR SMTP ---
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=gecp gnct wdqi grzz
# SMTP_FROM=your-email@gmail.com
```

---

## Need Help?

- **Check logs:** The terminal will print detailed diagnostics for email sending.
- **Verify credentials:** Double-check your API key, sender email, and SMTP password.
- **Test provider:** Use SendGrid's API test or send a test email via your SMTP client to verify credentials outside the app.
- **Allowlist:** Ensure your email is in `MASTER_ADMIN_EMAILS`.

---

**Your master admin email:** `viventa.rd@gmail.com`  
**To change or add emails:** Update `MASTER_ADMIN_EMAILS` in `.env.local` or your production environment variables.

Once configured, you'll receive the 6-digit code via email every time you log in at `/admin/login`.
