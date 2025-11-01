# Algolia Setup Guide - VIVENTA

## What is Algolia?
Algolia powers VIVENTA's advanced property search with instant results, typo tolerance, faceted filters, and geo-search—similar to Zillow's search experience.

## Getting Your API Keys

1. **Sign up at Algolia**
   - Go to https://www.algolia.com/
   - Create a free account (10,000 searches/month, 10,000 records)

2. **Create an Application**
   - Dashboard → Applications → Create Application
   - Name: "VIVENTA Production" (or "VIVENTA Dev" for testing)

3. **Get API Keys**
   - Dashboard → Settings → API Keys
   - Copy these values:
     - **Application ID** (e.g., `ABC123XYZ`)
     - **Search-Only API Key** (safe for client-side)
     - **Admin API Key** (keep secret, server-only)

## Environment Variables Setup

### Local Development (`.env.local`)
Already added with placeholders—fill in your actual values:
```bash
# Algolia Search (Client + Server)
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id_here
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_only_key_here
NEXT_PUBLIC_ALGOLIA_INDEX=viventa_listings
ALGOLIA_ADMIN_KEY=your_admin_key_here
```

### Vercel Deployment
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add these 4 variables:
   - `NEXT_PUBLIC_ALGOLIA_APP_ID` = (your app ID)
   - `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` = (search-only key)
   - `NEXT_PUBLIC_ALGOLIA_INDEX` = `viventa_listings`
   - `ALGOLIA_ADMIN_KEY` = (admin key)
4. Redeploy to apply

## Index Configuration

### Create Index
1. Dashboard → Indices → Create Index
2. Name: `viventa_listings` (must match env var)

### Configure Searchable Attributes
In Index → Configuration → Searchable Attributes, add:
```json
[
  "title",
  "description",
  "location",
  "city",
  "neighborhood",
  "agentName"
]
```

### Configure Facets (Filters)
In Index → Configuration → Attributes for faceting:
```json
[
  "city",
  "propertyType",
  "listingType",
  "bedrooms",
  "bathrooms",
  "status",
  "price"
]
```

### Configure Geo-Search
In Index → Configuration → Geo settings:
- Enable geo search: ✅
- Attribute: `_geoloc`

### Configure Ranking
Algolia's default ranking is good, but you can customize:
1. Dashboard → Index → Configuration → Ranking
2. Suggested order:
   - `typo` (typo tolerance)
   - `geo` (geo distance)
   - `words` (query word matching)
   - `filters` (applied filters)
   - `proximity` (word proximity)
   - `attribute` (attribute ranking)
   - `exact` (exact matches)
   - `custom` (your custom ranking)

### Custom Ranking (Optional)
To boost newer/featured listings:
- Configuration → Ranking → Custom Ranking
- Add: `desc(createdAt)` or `desc(featured)`

## How VIVENTA Uses Algolia

### Client-Side Search (`app/search/page.tsx`)
- Uses `react-instantsearch` with Algolia client SDK
- Instant search as user types
- Faceted filters (price, bedrooms, location)
- Map view with geo-search

### Server-Side Indexing
When admin approves/deletes a listing:
- `app/api/admin/properties/route.ts` calls Algolia Admin API
- `lib/algoliaAdmin.ts` handles `upsertListingToAlgolia()` and `removeListingFromAlgolia()`
- Only **active** listings are indexed

### Data Flow
```
Admin approves listing
  → Firestore `listings` collection updated
  → API route calls `upsertListingToAlgolia(id, data)`
  → Algolia index updated
  → Search page shows new listing instantly
```

## Testing Algolia Integration

### Verify Index is Empty (Fresh Start)
1. Dashboard → Indices → `viventa_listings`
2. Browse → Should show 0 records initially

### Test Indexing
1. Login as admin at `/admin/login`
2. Go to `/admin/properties`
3. Approve a pending listing
4. Check Algolia dashboard → Browse → Record should appear

### Test Search
1. Go to `/search`
2. Type property title/location
3. Results should appear instantly
4. Apply filters (bedrooms, price range)
5. Switch to Map view

## Troubleshooting

### Search page shows "Algolia not configured"
- Check env vars are set in Vercel
- Redeploy after adding vars
- Check browser console for API key errors

### Records not appearing in search
- Verify listing status is `active` (only active listings are indexed)
- Check Algolia dashboard → Logs for indexing errors
- Verify `ALGOLIA_ADMIN_KEY` is set in Vercel (server-side)

### Geo-search not working
- Ensure listing has valid `latitude` and `longitude` in Firestore
- Check `_geoloc` attribute in Algolia record: `{ lat: number, lng: number }`

### Rate limits exceeded
- Free plan: 10,000 searches/month, 10,000 records
- Upgrade to paid plan if needed
- Use caching for frequently accessed data

## Monitoring & Analytics

### Algolia Dashboard
- Monitor search queries: Dashboard → Search Analytics
- View popular searches, no-result queries
- Optimize based on user behavior

### Performance
- Average search time: <50ms (Algolia's guarantee)
- Monitor via Vercel Analytics or custom logging

## Migration from Firestore Query (If Needed)

Current `/search` page already uses Algolia. If you want to add fallback:
```typescript
const searchClient = useMemo(() => getAlgoliaClient(), [])
if (!searchClient) {
  // Fallback to Firestore basic search
  return <BasicSearchUI />
}
```

## Cost Estimation
- **Free Plan**: 10K searches/month, 10K records
- **Growth Plan**: $1/1K searches, $0.40/1K records (starts at $35/mo)
- Most early-stage platforms stay on free tier for 6-12 months

## Next Steps
1. ✅ Sign up and get API keys
2. ✅ Add to `.env.local` and Vercel
3. ✅ Create index and configure attributes
4. ✅ Test admin approve → Algolia indexing
5. ✅ Test search page with filters
6. ✅ Monitor analytics and optimize

## Resources
- [Algolia Dashboard](https://www.algolia.com/dashboard)
- [Algolia Docs](https://www.algolia.com/doc/)
- [React InstantSearch](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/)
- [VIVENTA Algolia Client](./lib/algoliaClient.ts)
- [VIVENTA Algolia Admin](./lib/algoliaAdmin.ts)
