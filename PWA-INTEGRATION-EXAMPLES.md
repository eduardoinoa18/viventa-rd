# PWA Component Integration Examples

## Quick Integration Guide

### 1. Add Favorite Button to Property Cards

```tsx
// components/PropertyCard.tsx
import FavoriteButton from './FavoriteButton';
import { formatCurrency, formatFeatures } from '@/lib/currency';

export default function PropertyCard({ property }: { property: any }) {
  const favoriteData = {
    id: property.id,
    title: property.title,
    price: property.price_usd,
    currency: 'USD',
    location: `${property.city}, ${property.neighborhood}`,
    bedrooms: property.beds,
    bathrooms: property.baths,
    images: [property.image],
  };

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton property={favoriteData} />
      </div>
      {/* Rest of card */}
    </div>
  );
}
```

### 2. Add WhatsApp Button to Property Details

```tsx
// app/properties/[id]/page.tsx
import WhatsAppButton from '@/components/WhatsAppButton';

export default function PropertyDetail({ property }) {
  return (
    <div>
      <WhatsAppButton
        phoneNumber={property.agent.phone}
        propertyTitle={property.title}
        propertyId={property.id}
        propertyPrice={formatCurrency(property.price)}
        agentName={property.agent.name}
      />
    </div>
  );
}
```

### 3. Add Currency Switcher to Header

```tsx
// components/Header.tsx
import CurrencySwitcher from './CurrencySwitcher';

export default function Header() {
  return (
    <header>
      <nav>
        {/* Logo and nav items */}
        <CurrencySwitcher />
        {/* Login/Signup buttons */}
      </nav>
    </header>
  );
}
```

### 4. Create Favorites Page

```tsx
// app/favorites/page.tsx
'use client'
import { useEffect, useState } from 'react';
import { getAllFavorites } from '@/lib/offlineFavorites';
import PropertyCard from '@/components/PropertyCard';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    const saved = await getAllFavorites();
    setFavorites(saved);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mis Favoritos</h1>
      {favorites.length === 0 ? (
        <p>No tienes propiedades guardadas</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {favorites.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Use Currency Formatting

```tsx
import { formatCurrency, formatFeatures, formatArea } from '@/lib/currency';

// Format prices
formatCurrency(250000, { currency: 'USD', compact: true }); // "$250K"
formatCurrency(14625000, { currency: 'DOP' }); // "RD$14,625,000"

// Format features
formatFeatures(3, 2); // "3 habs · 2 baños"
formatArea(150); // "150 m²"
```

## Mobile Optimizations

### Responsive Property Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {properties.map(prop => <PropertyCard key={prop.id} property={prop} />)}
</div>
```

### Bottom Action Bar (Mobile)

```tsx
// Add to property detail pages
<div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden shadow-lg z-30">
  <div className="flex gap-2">
    <WhatsAppButton phoneNumber={agent.phone} className="flex-1" />
    <FavoriteButton property={property} />
  </div>
</div>
```

### Touch-Friendly Buttons

All PWA components use touch-friendly sizing (min 44x44px tap targets).

## Testing Checklist

- [ ] Install app to home screen
- [ ] Save property to favorites (online)
- [ ] Go offline, view saved properties
- [ ] Come back online, verify sync
- [ ] Test WhatsApp button opens app
- [ ] Toggle currency USD/DOP
- [ ] Check offline indicator appears when offline
- [ ] Verify install prompt shows after 2+ visits
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Run Lighthouse PWA audit (target: 100/100)

## Performance Tips

### Image Optimization

```tsx
<img
  src={property.image}
  alt={property.title}
  loading="lazy"
  width={400}
  height={300}
  className="object-cover"
/>
```

### Lazy Load Components

```tsx
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});
```

### Preload Critical Assets

```tsx
// app/layout.tsx
<head>
  <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
  <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
</head>
```

## Analytics Events

Track PWA engagement in your analytics:

```typescript
// When user installs app
gtag('event', 'pwa_installed');

// When user saves property offline
gtag('event', 'offline_favorite_save', {
  property_id: property.id
});

// When user contacts via WhatsApp
gtag('event', 'whatsapp_contact', {
  property_id: property.id,
  agent_id: agent.id
});
```

## Next Steps

1. **Integrate components** into existing pages (PropertyCard, ListingDetail, Header)
2. **Create favorites page** at `/favorites`
3. **Add WhatsApp buttons** to all property detail pages
4. **Test offline** mode with saved favorites
5. **Run Lighthouse** audit and optimize
6. **Deploy** to production and test install flow

All PWA features are production-ready! 🚀
