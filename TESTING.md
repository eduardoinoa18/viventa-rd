# Testing Guide - VIVENTA Platform

## Overview
This document covers the testing approach for VIVENTA, including E2E tests with Playwright and manual QA procedures.

## Playwright E2E Tests

### Setup
Install Playwright and browser drivers:
```powershell
npm install -D @playwright/test
npx playwright install
```

### Running Tests
```powershell
# Run all tests (headless)
npm run test:e2e

# Run with browser UI visible
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/apply.spec.ts

# Debug mode with Playwright Inspector
npx playwright test --debug
```

### Test Coverage

#### Apply Flow (`tests/apply.spec.ts`)
- ✅ Happy path: Submit without resume (agent)
- ✅ Validation error: Missing required fields shows toast
- ✅ Failure path: Error handling and button re-enable

### E2E Mock Mode
Tests run with `NEXT_PUBLIC_E2E=1` and access `/apply?e2e=1` to enable mock mode:
- **Success path**: Skips Firebase uploads/writes, shows success screen after 300ms
- **Failure path**: Add `?e2e=1&fail=1` to simulate error

This allows fast, reliable tests without Firebase dependencies.

### Configuration
See `playwright.config.ts` for:
- Multi-browser testing (Chromium, Firefox, WebKit)
- Mobile device emulation (Pixel 5, iPhone 12)
- Video/screenshot capture on failure
- Auto-start dev server with E2E mode

## Manual QA Checklist

### 1. Agent/Broker Application Flow
**Desktop (Chrome, Safari, Edge)**
- [ ] Navigate to `/apply`
- [ ] Select Agent, fill all required fields
- [ ] Submit WITHOUT resume → Success screen appears
- [ ] Go back, select Broker, attach business document → Success
- [ ] Submit with missing required fields → Toast error, no stuck state
- [ ] Disconnect internet, submit → Toast error after timeout, button re-enabled

**Mobile (iOS Safari, Android Chrome)**
- [ ] All above scenarios on mobile viewport
- [ ] File picker works correctly
- [ ] Toast notifications visible and readable
- [ ] Success screen renders properly

### 2. Search & Browse Experience
**Desktop**
- [ ] Navigate to `/search`
- [ ] Use filters (price, bedrooms, location)
- [ ] Switch between List and Map view
- [ ] Click on PropertyCard → Listing detail page loads
- [ ] Favorite a property (must be logged in)
- [ ] Test sorting (price, date)

**Mobile**
- [ ] Filters accessible via mobile menu
- [ ] Map view usable on touch devices
- [ ] PropertyCard tap target sufficient size

### 3. Header & Navigation
**Desktop**
- [ ] All nav links work (Propiedades, Agentes, Profesionales)
- [ ] Login/Sign Up buttons redirect correctly
- [ ] Hover states show Caribbean colors
- [ ] Mobile menu toggle works at narrow viewport

**Mobile**
- [ ] Hamburger menu opens/closes smoothly
- [ ] All links accessible in mobile menu

### 4. Footer
**Desktop & Mobile**
- [ ] All footer links work
- [ ] Social media links open in new tab
- [ ] Contact email clickable
- [ ] Caribbean color hover states

### 5. Listing Detail Page
**Desktop**
- [ ] Images load with lazy loading
- [ ] Image gallery navigation works
- [ ] Contact form submission (rate-limited)
- [ ] WhatsApp button opens chat with correct number
- [ ] Property details render correctly

**Mobile**
- [ ] Touch-friendly image swipe
- [ ] Contact form usable on mobile
- [ ] WhatsApp button tap target sufficient

### 6. Authentication Flows
**All browsers**
- [ ] Signup with email/password
- [ ] Login with valid credentials
- [ ] Forgot password flow
- [ ] Password setup via email link
- [ ] Session persistence across page reloads

### 7. Admin Listing Creation End-to-End
This validates the full flow from creating a property with the new upload vault to verifying it appears on Search.

1) Pre-checks
- [ ] Visit `/admin/diagnostics` and run the "Probar CORS" button under Firebase Storage. If it fails, follow `FIREBASE-STORAGE-CORS.md`.
- [ ] Ensure you're logged in as an admin (or a user with permission to create listings).

2) Create listing in Admin
- [ ] Go to `/admin/properties/create`.
- [ ] Fill required fields including:
  - Título, precio, tipo de propiedad, ciudad, sector
  - Public Remarks (≥ 50 caracteres) y Professional Remarks
- [ ] Use the image upload vault:
  - [ ] Select 1–20 images (JPG/PNG/WebP, ≤ 5MB each) and start upload
  - [ ] Watch per-file progress; ensure at least one finishes and previews render
  - [ ] Confirm uploaded URLs appear in the form
- [ ] Submit the form and ensure it saves without Firestore validation errors.

3) Approve and verify on Search
- [ ] In Admin properties, set the listing status to `active` (or approve if required).
- [ ] Visit `/search` and filter if needed.
- [ ] Verify the listing appears in the results; clicking card should open the listing detail page.

Troubleshooting
- CORS or upload errors: see `FIREBASE-STORAGE-CORS.md` and re-run the diagnostics CORS test.
- Firestore write failures: check that undefined fields aren’t sent and that required fields are provided.
- Images not visible: open the image URL to ensure it’s public; check Storage rules and path `listing_images/{uid}/...`.

## Cross-Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge | iOS Safari | Android Chrome |
|---------|--------|---------|--------|------|------------|----------------|
| Apply Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search/Filters | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Map View | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Auth Flows | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Image Gallery | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

Legend: ✅ Passed | ❌ Issues | ⏳ Pending

## Performance Testing

### Lighthouse Audit Targets
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >95

### Key Metrics
- First Contentful Paint: <1.8s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.5s
- Cumulative Layout Shift: <0.1

## CI/CD Integration

### GitHub Actions (Recommended)
Add `.github/workflows/playwright.yml`:
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Vercel Preview Deployments
Run E2E tests against preview URLs:
```powershell
$env:PLAYWRIGHT_BASE_URL="https://your-preview-url.vercel.app"
npm run test:e2e
```

## Debugging Failed Tests

### View test reports
```powershell
npx playwright show-report
```

### Run single test in debug mode
```powershell
npx playwright test tests/apply.spec.ts --debug
```

### View trace files
```powershell
npx playwright show-trace playwright-traces/trace.zip
```

## Adding New Tests

1. Create test file in `tests/` directory
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from '@playwright/test'
   ```
3. Write test scenarios with clear descriptions
4. Use page object pattern for complex flows
5. Run locally before committing

## Known Issues & Workarounds

### Issue: Firebase Storage CORS in tests
**Workaround**: Use E2E mock mode (`?e2e=1`) to skip uploads

### Issue: Algolia rate limits in CI
**Workaround**: Use test index with higher limits or mock Algolia responses

## Resources
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [VIVENTA GitHub Repository](https://github.com/eduardoinoa18/viventa-rd)
