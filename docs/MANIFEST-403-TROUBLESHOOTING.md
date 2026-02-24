# Manifest.json 403 Troubleshooting

## Background
You reported receiving a **403 error** for `manifest.json` in production. The file exists at `/public/manifest.json` and is correctly excluded from middleware. This guide helps diagnose the issue.

## Quick Checks

### 1. Verify Deployment Platform (Vercel)
- Check **Vercel dashboard → Deployment logs** for errors during build/deploy.
- Ensure `/public` folder assets are deployed correctly.
- Confirm `manifest.json` appears in the deployed file tree (Vercel → Deployment → Files).

### 2. Check Middleware Exclusion
✅ **Already Confirmed**: `middleware.ts` config matcher explicitly excludes `manifest.json`:
```typescript
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)",
  "/dashboard/:path*"
],
```

### 3. Verify CSP Headers
✅ **Already Confirmed**: `next.config.js` applies CSP headers via `async headers()` for all routes `/(.*)`—these do not block static assets but may affect how browsers cache or report manifest errors.

### 4. Check Browser Cache / CDN
- Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R) to bypass browser cache.
- If using Cloudflare or another CDN in front of Vercel, purge cache for `/manifest.json`.

### 5. Verify File Permissions (unlikely)
- Ensure `manifest.json` is committed to git and not in `.gitignore`.
- Run `git ls-files public/manifest.json` locally to confirm it's tracked.

### 6. Check Server Logs
- In Vercel dashboard, check **Functions logs** or **Edge logs** for any 403 requests.
- Look for security rules, firewall policies, or access controls that might block static assets.

### 7. Test Direct Access
- Visit `https://your-domain.com/manifest.json` directly in a new incognito window.
- If 403 persists, this is likely a hosting/CDN/firewall issue, not Next.js middleware.

## Likely Causes & Solutions

### Cause 1: CDN/Firewall Rules
**Solution**: Check Cloudflare, Vercel WAF, or any security layers for rules blocking `.json` files or specific paths. Whitelist `/manifest.json`.

### Cause 2: Incorrect Vercel Build Output
**Solution**: Redeploy via `vercel --prod` or re-trigger deployment in Vercel dashboard to ensure fresh build includes all public assets.

### Cause 3: PWA Service Worker Conflict
**Solution**: If service worker is caching an old version that returns 403, clear service worker registrations in browser DevTools → Application → Service Workers → Unregister. Then reload.

### Cause 4: Environment-Specific Issue (not in local dev)
**Solution**: Confirm `NODE_ENV=production` build locally with `npm run build && npm start` and access `http://localhost:3000/manifest.json`. If it works locally but fails in prod, issue is deployment-specific.

## Next Steps

1. **Verify in Vercel**: Check deployment logs and file tree for `manifest.json`.
2. **Test Direct URL**: Access `https://your-prod-domain.com/manifest.json` in incognito.
3. **Check CDN/Firewall**: Review any security layers in front of Vercel.
4. **Purge Cache**: Hard refresh and clear service workers.
5. **Re-deploy**: Trigger a fresh Vercel deployment.

If issue persists after these checks, provide:
- Direct URL to manifest.json in production
- Screenshot of browser Network tab showing 403 response headers
- Vercel deployment logs (if any errors)

---

**Status**: Code is correct. Issue is likely hosting/CDN/caching. Follow steps above to diagnose production environment.
