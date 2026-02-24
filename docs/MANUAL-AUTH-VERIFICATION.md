# 🔎 MASTER ADMIN AUTH — MANUAL VERIFICATION PROTOCOL

**Status:** Ready for Execution  
**Date:** February 17, 2026  
**Branch:** copilot/implement-project-review-plan  
**Commit:** affa6cc

---

## Prerequisites

1. **Environment:** Development server running (`npm run dev`)
2. **Browser:** Chrome/Edge with DevTools
3. **Email Access:** Access to viventa.rd@gmail.com for 2FA codes
4. **Test Accounts:**
   - Master Admin: `viventa.rd@gmail.com`
   - Buyer: (create test account via `/signup`)

---

## 1️⃣ COOKIE SECURITY VALIDATION

### Steps:
1. Start dev server: `npm run dev`
2. Open `http://localhost:3000/login`
3. Login with `viventa.rd@gmail.com`
4. Open DevTools → Application → Cookies → `http://localhost:3000`

### Verify Cookie `__session`:

| Property   | Expected Value         | Status |
|------------|------------------------|--------|
| Name       | `__session`            | [ ]    |
| HttpOnly   | ✅ `true`              | [ ]    |
| Secure     | ⚠️ `false` (dev only)  | [ ]    |
| SameSite   | `Lax`                  | [ ]    |
| Path       | `/`                    | [ ]    |
| Expires    | ~5 days from now       | [ ]    |

**Dev Note:** `Secure` will be `false` in dev (HTTP), `true` in production (HTTPS).

### ❌ FAIL Criteria:
- HttpOnly is `false` → XSS vulnerability
- Path is not `/` → Cookie won't apply to all routes
- Expires in <4 days → Session too short
- Cookie doesn't exist → Auth broken

---

## 2️⃣ MIDDLEWARE CLAIM VALIDATION

### Test A: Master Admin Flow

1. **Login:**
   - Navigate to `/login`
   - Enter: `viventa.rd@gmail.com` + password
   - Click "Iniciar Sesión"

2. **Expected Behavior:**
   - Redirects to `/verify-2fa`
   - Shows 2FA code input form
   - Email received with 6-digit code

3. **2FA Verification:**
   - Enter code from email
   - Click "Verificar"

4. **Expected Behavior:**
   - Redirects to `/master`
   - Shows master admin dashboard
   - Navigation sidebar visible

5. **Route Access Test:**
   - Access `/master` → ✅ Works
   - Access `/master/users` → ✅ Works
   - Access `/master/listings` → ✅ Works
   - Access `/admin` → ✅ Works (legacy fallback)
   - Access `/admin/login` → (behavior TBD)

| Test                          | Expected Result     | Actual Result |
|-------------------------------|---------------------|---------------|
| Login redirects to 2FA        | `/verify-2fa`       | [ ]           |
| 2FA email received            | 6-digit code        | [ ]           |
| 2FA redirects to master       | `/master`           | [ ]           |
| /master accessible            | Dashboard loads     | [ ]           |
| /admin still works            | Legacy UI loads     | [ ]           |

### Test B: Buyer Flow

1. **Create Buyer Account:**
   - Navigate to `/signup`
   - Register new account (NOT master admin)
   - Complete signup

2. **Login as Buyer:**
   - Navigate to `/login`
   - Enter credentials
   - Click "Iniciar Sesión"

3. **Expected Behavior:**
   - NO 2FA prompt
   - Direct redirect to `/search`
   - Property listings visible

4. **Authorization Test:**
   - Manually navigate to `/master`
   - Expected: Redirect to `/login` (403 equivalent)
   - Should NOT crash
   - Should NOT expose error details

| Test                          | Expected Result     | Actual Result |
|-------------------------------|---------------------|---------------|
| Buyer login skips 2FA         | Direct to `/search` | [ ]           |
| /master blocked for buyer     | Redirect to `/login`| [ ]           |
| No error exposed              | Clean redirect      | [ ]           |

---

## 3️⃣ 2FA CLAIM REISSUE TEST

**Purpose:** Verify session cookie is recreated with updated claims.

### Steps:
1. Login as master admin
2. Complete 2FA verification
3. **IMMEDIATELY** open DevTools → Network tab
4. **Filter:** XHR/Fetch
5. Look for `/api/auth/verify-2fa` request

### Verify Response Headers:

```http
Set-Cookie: __session=<new_value>; Path=/; HttpOnly; SameSite=Lax
```

### Cookie Value Change Test:
1. Before 2FA: Copy `__session` cookie value
2. After 2FA: Check if `__session` value CHANGED
3. Decode JWT at https://jwt.io
4. Verify `twoFactorVerified: true` in payload

| Test                          | Expected Result        | Actual Result |
|-------------------------------|------------------------|---------------|
| New Set-Cookie header present | Yes                    | [ ]           |
| Cookie value changed          | Different from before  | [ ]           |
| JWT contains 2FA claim        | `twoFactorVerified: true` | [ ]        |

### Refresh Test:
1. After 2FA verification, REFRESH page
2. Should stay on `/master`
3. Should NOT redirect to `/verify-2fa`
4. Should NOT re-authenticate

---

## 4️⃣ PUBLIC ROUTE ISOLATION TEST

**Purpose:** Verify revenue engine is NEVER tied to auth.

### Test in Incognito Window (No Auth):

| Route                         | Expected Behavior      | Actual Result |
|-------------------------------|------------------------|---------------|
| `/`                           | Homepage loads         | [ ]           |
| `/search`                     | Listings load          | [ ]           |
| `/listing/[any-slug]`         | Detail page loads      | [ ]           |
| `/ciudad/santo-domingo`       | City page loads        | [ ]           |
| `/ciudad/santo-domingo/piantini` | Sector page loads   | [ ]           |
| `/agents`                     | Agent directory loads  | [ ]           |
| `/brokers`                    | Broker directory loads | [ ]           |
| `/contact`                    | Contact form loads     | [ ]           |

### ❌ FAIL Criteria:
- Any route redirects to `/login`
- Cookie set on public browse
- Auth prompt appears
- Middleware blocks access

### Network Tab Verification:
1. Open DevTools → Network
2. Browse public routes
3. Check each request:
   - Status: `200` (not `307` redirect)
   - No `Set-Cookie` headers
   - No auth prompts

---

## 5️⃣ SESSION PERSISTENCE TEST

**Purpose:** Verify cookie survives browser restart.

### Steps:
1. Login as master admin
2. Complete 2FA
3. Navigate to `/master`
4. **CLOSE BROWSER COMPLETELY** (not just tab)
5. **REOPEN BROWSER**
6. Navigate to `http://localhost:3000/master`

### Expected Behavior:
- STAY authenticated
- NO redirect to `/login`
- Master dashboard loads immediately
- Cookie still present in DevTools

| Test                          | Expected Result        | Actual Result |
|-------------------------------|------------------------|---------------|
| Browser restart preserves auth| Stays logged in        | [ ]           |
| Cookie survives close         | Still in DevTools      | [ ]           |
| /master accessible            | No re-auth needed      | [ ]           |

### ❌ FAIL Criteria:
- Logged out after browser restart
- Cookie deleted
- Session expires prematurely

---

## 6️⃣ LOGOUT VALIDATION

### Steps:
1. Login as master admin
2. Complete 2FA
3. Navigate to `/master`
4. **Execute Logout:**
   ```javascript
   // In browser console:
   fetch('/api/auth/logout', { method: 'POST' })
     .then(r => r.json())
     .then(console.log)
   ```
5. Check response: `{ ok: true, redirect: '/login' }`

### Verify Cookie Deletion:
1. Open DevTools → Application → Cookies
2. Check `__session` → Should be DELETED
3. Check legacy cookies → Should be DELETED:
   - `admin_gate_ok`
   - `admin_pw_ok`
   - `admin_2fa_ok`
   - `trusted_admin`
   - `viventa_role`

### Authorization Test After Logout:
1. **WITHOUT REFRESHING**, navigate to `/master`
2. Expected: Redirect to `/login`
3. Middleware should block access

| Test                          | Expected Result        | Actual Result |
|-------------------------------|------------------------|---------------|
| Logout API returns success    | `{ ok: true }`         | [ ]           |
| __session deleted             | Not in DevTools        | [ ]           |
| Legacy cookies deleted        | None present           | [ ]           |
| /master blocked after logout  | Redirect to `/login`   | [ ]           |
| Clean redirect (no error)     | 307 redirect           | [ ]           |

---

## 🚨 CRITICAL FAILURE SCENARIOS

If any of these occur, **STOP TESTING** and report immediately:

1. **XSS Vulnerability:** `httpOnly: false`
2. **Public Route Blocked:** `/search` redirects to login
3. **Claim Bypass:** Access `/master` without 2FA
4. **Session Leak:** Cookie set on unauthenticated browse
5. **Infinite Redirect:** Login loops to login
6. **Stale Claims:** 2FA verified but `twoFactorVerified: false` in JWT

---

## ✅ SUCCESS CRITERIA

All 6 pillars must pass:

- [ ] 1. Cookie security (httpOnly, SameSite, Path, 5-day expiry)
- [ ] 2. Middleware validation (master vs buyer routing)
- [ ] 3. 2FA claim reissue (cookie recreated with new claims)
- [ ] 4. Public route isolation (no auth on revenue engine)
- [ ] 5. Session persistence (survives browser restart)
- [ ] 6. Logout validation (cookies cleared, access blocked)

---

## 📊 TEST RESULTS TEMPLATE

```
## Manual Test Results

**Tester:** [Your Name]
**Date:** [Date]
**Environment:** Development (localhost:3000)

### Pillar 1: Cookie Security
- Status: PASS / FAIL
- Notes: [Details]

### Pillar 2: Middleware Claim Validation
- Status: PASS / FAIL
- Notes: [Details]

### Pillar 3: 2FA Claim Reissue
- Status: PASS / FAIL
- Notes: [Details]

### Pillar 4: Public Route Isolation
- Status: PASS / FAIL
- Notes: [Details]

### Pillar 5: Session Persistence
- Status: PASS / FAIL
- Notes: [Details]

### Pillar 6: Logout Validation
- Status: PASS / FAIL
- Notes: [Details]

### Issues Found:
1. [Issue description]
2. [Issue description]

### Overall Status: READY FOR PRODUCTION / NEEDS FIXES
```

---

## Next Steps After Testing

### If All Tests PASS:
→ Move to Phase 3: Update navigation links  
→ Move to Phase 4: Make `/login` default entry point  
→ Prepare for Phase 5: Delete gate system

### If Tests FAIL:
→ Document failures in detail  
→ Report issues with screenshots  
→ Pause Phase 3-5 until fixes deployed

---

**END OF VERIFICATION PROTOCOL**
