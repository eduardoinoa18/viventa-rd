# Admin Login Troubleshooting Guide

## 🔐 Master Admin Login Process

The admin login uses **2-Factor Authentication (2FA)** with email verification codes.

### Login URL
```
http://localhost:3000/admin/login
```

### Process Flow
1. **Enter Email**: Use `viventa.rd@gmail.com` (configured in `.env.local`)
2. **Receive Code**: A 6-digit code is sent to your email
3. **Enter Code**: Input the code within 10 minutes
4. **Access Admin**: Redirected to `/admin` dashboard

---

## ✅ Your Current Configuration

Your `.env.local` file has the correct setup:

```env
MASTER_ADMIN_EMAIL=viventa.rd@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=viventa.rd@gmail.com
SMTP_PASS=gecp gnct wdqi grzz
SMTP_FROM=viventa.rd@gmail.com
```

---

## 🧪 Development Mode Features

When running in **development** (`npm run dev`), you get special features:

### 1. Console Code Display
If email sending fails, the verification code is printed in the terminal:

```
═══════════════════════════════════════
📧 MASTER ADMIN VERIFICATION CODE
═══════════════════════════════════════
Email: viventa.rd@gmail.com
Code: 123456
Expires: 10/28/2025, 10:30:00 AM
═══════════════════════════════════════
```

### 2. Dev Code in UI
The code also appears in the login interface with a "Use" button for quick access.

### 3. Any Email Allowed
In development, you can use **any email address** to test the flow, not just the configured master admin email.

---

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid credentials" Error

**Possible Causes:**
- Email not in allowlist (production only)
- Typo in email address

**Solution:**
```bash
# Check your .env.local has:
MASTER_ADMIN_EMAIL=viventa.rd@gmail.com

# Or allow any email in development:
ALLOW_ANY_MASTER_EMAIL=true
```

### Issue 2: Email Not Received

**Possible Causes:**
- Gmail app password expired
- SMTP credentials incorrect
- Email in spam folder

**Solution:**

1. **Check spam folder** in viventa.rd@gmail.com

2. **Verify Gmail App Password** is still valid:
   - Go to: https://myaccount.google.com/apppasswords
   - If expired, generate new one and update `.env.local`

3. **Test SMTP connection** manually:
```bash
# In terminal, test if nodemailer can connect
node -e "const nm=require('nodemailer');nm.createTransport({host:'smtp.gmail.com',port:587,auth:{user:'viventa.rd@gmail.com',pass:'gecp gnct wdqi grzz'}}).verify((e,s)=>console.log(e?'❌ Failed':'✅ Success'))"
```

4. **Use SendGrid instead** (more reliable):
```env
# Add to .env.local
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=noreply@viventa.com
```

### Issue 3: "Invalid verification code" Error

**Possible Causes:**
- Code expired (10 minutes limit)
- Typo in code
- Used same code twice

**Solution:**
- Click "Resend Code" button
- Check you're entering all 6 digits
- Code is case-insensitive but must be exact

### Issue 4: "Too many attempts" Error

**Possible Causes:**
- Entered wrong code 5 times

**Solution:**
- Request a new code (automatic reset)
- Wait 1 minute before retrying

### Issue 5: Still Redirecting After Login

**Possible Causes:**
- Session not saved properly
- Cookie issues

**Solution:**
```bash
# Clear browser cookies for localhost:3000
# Or use incognito mode

# Restart dev server
npm run dev
```

---

## 🔍 How to Debug

### Step 1: Check Terminal Logs

When you request a code, you should see:
```
📧 Attempting to send verification email to: viventa.rd@gmail.com
📧 SENDGRID_API_KEY exists: false
📧 SMTP_HOST exists: true
📧 Using SMTP/Nodemailer...
📧 SMTP Config: { host: 'smtp.gmail.com', port: '587', user: '***', pass: '***' }
✅ SMTP email sent successfully: <message-id>
```

If you see:
```
❌ Email send error: [error details]
```
Then there's an SMTP issue. Check the error message.

### Step 2: Check Browser Console

Open DevTools (F12) → Console tab. Look for:
- Network errors (500, 403, 401)
- JavaScript errors
- API response details

### Step 3: Test API Directly

Test the send-code API:
```bash
curl -X POST http://localhost:3000/api/auth/send-master-code \
  -H "Content-Type: application/json" \
  -d '{"email":"viventa.rd@gmail.com"}'
```

Should return:
```json
{
  "ok": true,
  "message": "Verification code sent to your email",
  "expiresIn": 600,
  "devCode": "123456"
}
```

### Step 4: Check Email Actually Sent

1. Log into viventa.rd@gmail.com
2. Check inbox for "VIVENTA Master Admin - Verification Code"
3. Check spam/promotions folders
4. If not there, issue is with SMTP

---

## 🔧 Quick Fixes

### Force Development Mode Response

Add to `.env.local`:
```env
ALLOW_DEV_2FA_RESPONSE=true
```
This shows the code in the API response even in production mode.

### Use Alternative Email Service

Instead of Gmail SMTP, use SendGrid (free tier):

1. Sign up: https://sendgrid.com/
2. Create API key
3. Add to `.env.local`:
```env
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=noreply@viventa.com
```

SendGrid is more reliable and won't get blocked by firewalls.

---

## 📝 Testing Checklist

Before asking for help, verify:

- [ ] Running `npm run dev` (development server)
- [ ] Visiting `http://localhost:3000/admin/login`
- [ ] Using `viventa.rd@gmail.com` as email
- [ ] Checking terminal for console output
- [ ] Looking for dev code in UI
- [ ] Checking `.env.local` exists and has SMTP credentials
- [ ] No firewall blocking port 587
- [ ] Gmail account accessible

---

## 🆘 Still Having Issues?

### What to Send Me:

1. **Terminal output** when clicking "Send Verification Code":
   ```
   Copy everything from "📧 Attempting to send..." to the end
   ```

2. **Error message** shown in the UI:
   ```
   Screenshot or exact text of the error
   ```

3. **Browser console logs**:
   ```
   F12 → Console tab → screenshot any red errors
   ```

4. **Network tab**:
   ```
   F12 → Network tab → filter by "auth" → screenshot failed requests
   ```

With this information, I can pinpoint the exact issue!

---

## 🎯 Expected Behavior

### ✅ Success Flow:

1. Enter email → Click "Send Verification Code"
2. See: "✅ Verification code sent! Check your email"
3. Terminal shows: `✅ SMTP email sent successfully`
4. Dev code appears in UI: "Dev code: 123456 [Use]"
5. Enter code → Click "Verify & Login"
6. Redirected to `/admin` dashboard
7. Can access all admin pages

### ❌ What "Before Was Not Happening" Might Mean:

If it was working before and suddenly stopped:

**Possible Cause**: Gmail app password expired or was revoked

**Solution**: 
1. Go to Google Account: https://myaccount.google.com/apppasswords
2. Delete old "VIVENTA App" password
3. Create new app password
4. Update `.env.local` with new password
5. Restart `npm run dev`

---

## 🔐 Security Notes

- Codes expire after 10 minutes
- Maximum 5 attempts per code
- Codes are single-use (deleted after verification)
- Production mode requires exact email match
- Dev codes only show in development/localhost

---

**Need more help?** Send me the specific error message you're seeing and the terminal output! 🚀
