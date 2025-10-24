# VIVENTA PWA Features

## Overview
VIVENTA is now a Progressive Web App (PWA) optimized for the Dominican Republic real estate market with offline capabilities, installability, and mobile-first UX.

## PWA Features Implemented

### ✅ Core PWA Features
- **Installable**: Users can install VIVENTA to their home screen (iOS & Android)
- **Offline Support**: Service worker caches assets for offline browsing
- **Fast Loading**: Static assets cached with Cache-First strategy
- **Background Sync**: Favorites sync when connection returns
- **App-like Experience**: Standalone display mode, splash screen, theme colors

### ✅ Dominican Republic Market Optimizations
- **WhatsApp Integration**: One-tap contact with pre-filled messages
- **Currency Toggle**: USD/DOP switching with live conversion
- **Spanish UI**: All prompts and messages in Spanish (es-DO)
- **Offline Favorites**: Save properties to IndexedDB for offline viewing
- **Mobile-First**: Optimized for 80%+ mobile traffic in DR market

## Component Library

### WhatsAppButton
Quick contact button with pre-filled message template
```tsx
import WhatsAppButton from '@/components/WhatsAppButton'

<WhatsAppButton
  phoneNumber="8091234567"
  propertyTitle="Casa en Piantini"
  propertyId="PROP-123"
  propertyPrice="US$250,000"
  agentName="Juan Pérez"
/>
```

### FavoriteButton
Save properties offline with IndexedDB sync
```tsx
import FavoriteButton from '@/components/FavoriteButton'

<FavoriteButton
  property={{
    id: 'prop-123',
    title: 'Apartamento en Bella Vista',
    price: 185000,
    currency: 'USD',
    location: 'Santo Domingo',
    images: ['...'],
    bedrooms: 3,
    bathrooms: 2
  }}
/>
```

### CurrencySwitcher
Toggle between USD and DOP with persistent preference
```tsx
import CurrencySwitcher from '@/components/CurrencySwitcher'

<CurrencySwitcher />
```

### PwaInstallPrompt
Smart install prompt (shows after 2+ visits)
```tsx
// Already added to layout.tsx - no import needed
```

### OfflineIndicator
Shows banner when user is offline
```tsx
// Already added to layout.tsx - no import needed
```

## Offline Storage API

```typescript
import {
  saveFavoriteOffline,
  removeFavoriteOffline,
  getAllFavorites,
  isFavorite,
  syncFavorites
} from '@/lib/offlineFavorites'

// Save property for offline viewing
await saveFavoriteOffline({
  id: 'prop-123',
  title: 'Casa en Piantini',
  price: 350000,
  currency: 'USD',
  location: 'Santo Domingo',
  images: ['url1', 'url2'],
  savedAt: Date.now(),
  lastFetchedAt: Date.now()
})

// Get all offline favorites
const favorites = await getAllFavorites()

// Check if property is favorited
const isFav = await isFavorite('prop-123')

// Manual sync with Firestore
await syncFavorites()
```

## Currency Utilities

```typescript
import {
  formatCurrency,
  convertCurrency,
  formatArea,
  formatFeatures,
  getUserCurrency,
  setUserCurrency
} from '@/lib/currency'

// Format price
formatCurrency(250000, { currency: 'USD', compact: true })
// => "$250K"

formatCurrency(14625000, { currency: 'DOP' })
// => "RD$14,625,000"

// Convert currencies
convertCurrency(100000, 'USD', 'DOP')
// => 5850000

// Format property features
formatArea(150) // => "150 m²"
formatFeatures(3, 2) // => "3 habs · 2 baños"
```

## Caching Strategy

### Static Assets (/_next/static)
- **Strategy**: Cache First
- **TTL**: 1 year
- **Max Entries**: 64 files

### Images (PNG, JPG, WebP, AVIF)
- **Strategy**: Stale While Revalidate
- **TTL**: 30 days
- **Max Entries**: 200 images

### API Calls (/api/*)
- **Strategy**: Network First (5s timeout)
- **TTL**: 5 minutes
- **Max Entries**: 50 responses

## Testing PWA

### Local Development
```bash
# PWA is disabled in dev mode
npm run dev

# Test PWA features in production build
npm run build
npm start
```

### Production Testing
1. Deploy to Vercel/Netlify
2. Open in mobile browser (must be HTTPS)
3. Look for install banner after 2-3 page views
4. Install to home screen
5. Test offline mode (airplane mode)
6. Verify favorites save offline

### Lighthouse Audit
```bash
# Install Lighthouse CLI
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=https://your-site.com
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 95+
- PWA: 100

## Deployment Checklist

- [x] PWA manifest configured
- [x] Service worker generated
- [x] Icons (72-512px + maskable)
- [x] Meta tags (theme-color, apple-touch-icon)
- [x] HTTPS enabled (required for PWA)
- [x] Offline fallback pages
- [x] Install prompt UI
- [x] Background sync for favorites
- [ ] Push notifications (optional)
- [ ] Share Target API (optional)

## Browser Support

### iOS (Safari)
✅ Install to home screen
✅ Standalone mode
✅ Cached resources
❌ Service worker (limited)
❌ Push notifications (not supported)

### Android (Chrome)
✅ Full PWA support
✅ Install banner
✅ Service worker
✅ Background sync
✅ Push notifications

### Desktop
✅ Chrome, Edge (full support)
✅ Firefox (partial support)
❌ Safari (limited PWA features)

## Performance Optimizations

### Images
- Use WebP/AVIF formats
- Lazy load with `loading="lazy"`
- Responsive images with `srcset`
- CDN caching (Vercel Image Optimization)

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting (automatic with Next.js)
- Lazy load modals and drawers

### Fonts
- Preload critical fonts
- Use `font-display: swap`
- Subset fonts to Latin + Spanish characters

## Analytics Events

Track PWA engagement:
```typescript
// Install prompt shown
gtag('event', 'pwa_install_prompt_shown')

// User installs app
gtag('event', 'pwa_installed')

// Offline browsing
gtag('event', 'pwa_offline_usage', { page: '/properties' })

// WhatsApp contact
gtag('event', 'whatsapp_contact', {
  property_id: 'prop-123',
  agent_phone: '18091234567'
})

// Favorite saved offline
gtag('event', 'favorite_offline_save', {
  property_id: 'prop-123'
})
```

## Troubleshooting

### Service Worker Not Updating
```bash
# Clear browser cache
# Go to DevTools > Application > Service Workers > Unregister
# Or add skip waiting to force update
```

### Icons Not Showing
- Verify icons exist in `/public/icons/`
- Check manifest.json paths are correct
- Clear browser cache and reinstall
- Ensure HTTPS is enabled

### Offline Mode Not Working
- Check service worker is registered (DevTools > Application)
- Verify caching strategies in next.config.js
- Test in Incognito mode to avoid cache conflicts

### Install Prompt Not Showing
- Must be HTTPS
- User must visit 2+ times (or customize threshold)
- Check console for beforeinstallprompt event
- Some browsers have different criteria

## Next Steps

### Phase 1 (Completed) ✅
- PWA core setup
- Offline favorites
- WhatsApp integration
- Currency switching

### Phase 2 (Optional)
- Push notifications (price drops, new listings)
- Share Target API (share listings to VIVENTA)
- Background sync for search queries
- Camera API (take photos for property uploads)

### Phase 3 (Future)
- Web Share API
- Contact Picker API
- Geolocation for nearby properties
- Badging API (unread messages count)

## Resources

- [Next.js PWA Guide](https://github.com/shadowwalker/next-pwa)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Can I Use](https://caniuse.com/serviceworkers)

---

Built with ❤️ for the Dominican Republic real estate market
