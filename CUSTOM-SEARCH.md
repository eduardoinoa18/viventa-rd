# Custom Search Architecture - VIVENTA

## Overview

VIVENTA uses a **custom Firestore-based search solution** that provides instant property search with advanced filters, geo-location support, and text matching—all without external dependencies or monthly costs.

## Why Custom Search?

### Benefits
- **Zero Cost**: No monthly Algolia subscription ($0/month vs. $99-299/month after free tier)
- **Full Control**: Complete control over search ranking, relevance scoring, and features
- **No External Dependencies**: All search runs on Firestore (already part of Firebase stack)
- **Simplified Deployment**: No API keys or external service configuration needed
- **Privacy**: All search data stays within your Firebase project

### Trade-offs
- **Scale Limits**: Best for < 10K properties; Firestore queries have 500 doc limit per query
- **No Typo Tolerance**: Exact word matching only (no "apartmento" → "apartamento" correction)
- **Client-side Filtering**: Price/area ranges filtered after fetch (not in database query)
- **Basic Relevance**: Simple fuzzy matching vs. Algolia's ML-powered relevance

## Architecture

### `lib/customSearchService.ts`

The core search service provides:

#### 1. **Compound Firestore Queries**
```typescript
searchListings(filters: SearchFilters, page: number, pageSize: number)
```
- Filters active listings by: city, neighborhood, propertyType, listingType, bedrooms, bathrooms
- Orders by `createdAt desc` (most recent first)
- Fetches up to 500 docs per query (Firestore limit)
- Returns paginated results (default 20 per page)

#### 2. **Text Search with Fuzzy Matching**
```typescript
calculateRelevance(searchQuery: string, listing: Listing): number
```
- Searches across: title, description, location (address, city, neighborhood), agentName
- Token-based matching (splits query into words)
- Exact token match: 1.0 score
- Partial token match: 0.5 score
- Exact phrase match: +0.5 bonus
- Filters results with relevance < 0.3 (30% match threshold)

#### 3. **Geo-Distance Calculation**
```typescript
calculateDistance(lat1, lng1, lat2, lng2): number
```
- Haversine formula for accurate geo-distance (in kilometers)
- Filters by `radiusKm` if lat/lng provided
- Sorts results by distance (closest first) when geo-search active

#### 4. **Client-Side Filtering**
```typescript
applyClientFilters(listings: Listing[], filters: SearchFilters): Listing[]
```
- Price range (`minPrice`, `maxPrice`)
- Area range (`minArea`, `maxArea`)
- Applied after Firestore fetch to avoid complex composite indexes

#### 5. **Facet Aggregation**
```typescript
getFacetValues(): Promise<{ cities, neighborhoods, propertyTypes }>
```
- Fetches all active listings (up to 500)
- Extracts unique values for dropdown filters
- Cached on client for performance

### `app/search/page.tsx`

The search UI integrates `customSearchService` with:

- **Filter Sidebar**: City, neighborhood, property type, listing type, price, bedrooms, bathrooms
- **Text Search Bar**: Full-text search across listing fields
- **Pagination**: 20 results per page with prev/next controls
- **Mobile/Desktop Views**: List view and map view toggle
- **Stats Bar**: Total hits, average price, price range
- **Advanced Filters Modal**: Additional filtering options

## Data Flow

```
1. User enters search query and filters
   ↓
2. app/search/page.tsx calls customSearchService.searchListings()
   ↓
3. customSearchService builds Firestore query with exact-match filters
   ↓
4. Firestore returns up to 500 active listings (ordered by createdAt)
   ↓
5. customSearchService applies client-side filters (price, area)
   ↓
6. customSearchService calculates relevance scores (if text search)
   ↓
7. customSearchService calculates geo-distances (if lat/lng provided)
   ↓
8. Results sorted by: distance (if geo) > relevance (if text) > createdAt
   ↓
9. Results paginated and returned to UI
   ↓
10. PropertyCard components render listings
```

## Performance Considerations

### Firestore Query Limits
- **Max docs per query**: 500 (Firestore hard limit)
- **Workaround**: If > 500 properties, paginate Firestore queries with `startAfter()`
- **Current**: Fetches all 500, filters client-side, then paginates UI

### Composite Indexes
Firestore requires composite indexes for multi-field queries. Create indexes for:

1. **Basic Search**
   ```
   Collection: listings
   Fields: status (=) + createdAt (desc)
   ```

2. **City Filter**
   ```
   Collection: listings
   Fields: status (=) + location.city (=) + createdAt (desc)
   ```

3. **Property Type Filter**
   ```
   Collection: listings
   Fields: status (=) + propertyType (=) + createdAt (desc)
   ```

4. **Listing Type Filter**
   ```
   Collection: listings
   Fields: status (=) + listingType (=) + createdAt (desc)
   ```

5. **Combined Filters**
   ```
   Collection: listings
   Fields: status (=) + location.city (=) + propertyType (=) + createdAt (desc)
   ```

**Auto-Creation**: Firestore logs missing index errors with direct links to create them. Run searches with various filter combinations and follow error links.

### Caching Strategy
- **Facet values**: Cached on client; refresh every 5 minutes
- **Search results**: Not cached (always fresh data)
- **PropertyCard images**: Lazy loaded with Next.js Image

### Optimization Tips
1. **Limit initial fetch**: Reduce `firestoreLimit(500)` to `firestoreLimit(100)` if < 100 properties expected
2. **Debounce text input**: Add 300ms debounce to text search to reduce queries
3. **Pre-fetch facets**: Load facet values on page load (not on every filter change)
4. **Index images**: Use Firestore array-contains for image-based searches

## Search Features

### Supported Filters
- ✅ **Text Search**: Title, description, location, agent name
- ✅ **City**: Exact match dropdown (from facets)
- ✅ **Neighborhood**: Exact match dropdown (from facets)
- ✅ **Property Type**: Exact match dropdown (from facets)
- ✅ **Listing Type**: Sale or Rent
- ✅ **Price Range**: Min/max USD
- ✅ **Bedrooms**: Min count
- ✅ **Bathrooms**: Min count
- ✅ **Area Range**: Min/max sqft
- ✅ **Geo-Search**: Radius in km (if lat/lng provided)

### Not Supported (vs. Algolia)
- ❌ **Typo Tolerance**: "apartmento" won't match "apartamento"
- ❌ **Synonyms**: "condo" won't match "condominium" (add manually)
- ❌ **Facet Counts**: No "Santo Domingo (42)" counts in dropdowns
- ❌ **Highlighted Matches**: No bold text showing matched words
- ❌ **Advanced Ranking**: No ML-powered relevance (simple fuzzy matching)

## Migration from Algolia

### What Changed
1. **Search Page**: Removed `react-instantsearch` components; custom React state
2. **Admin Routes**: Removed `upsertListingToAlgolia()` and `removeListingFromAlgolia()` calls
3. **Dependencies**: Removed `algoliasearch` and `react-instantsearch` from `package.json`
4. **Env Vars**: Removed `NEXT_PUBLIC_ALGOLIA_*` and `ALGOLIA_ADMIN_KEY`

### Backward Compatibility
- **Backup Files**: Original Algolia code preserved in:
  - `lib/_algolia_backup/algoliaClient.ts`
  - `lib/_algolia_backup/algoliaAdmin.ts`
  - `app/search/page.tsx.algolia-backup`
- **Restore**: Copy backup files back and reinstall Algolia packages to revert

### Re-enabling Algolia (if needed)
```bash
# 1. Restore Algolia files
mv lib/_algolia_backup/algoliaClient.ts lib/
mv lib/_algolia_backup/algoliaAdmin.ts lib/
mv app/search/page.tsx.algolia-backup app/search/page.tsx

# 2. Reinstall dependencies
npm install algoliasearch@^4.24.0 react-instantsearch@^7.13.0

# 3. Add env vars back to .env.local
NEXT_PUBLIC_ALGOLIA_APP_ID=...
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=...
NEXT_PUBLIC_ALGOLIA_INDEX=viventa_listings
ALGOLIA_ADMIN_KEY=...

# 4. Restore Algolia sync in admin routes
# (manually add back upsertListingToAlgolia/removeListingFromAlgolia calls)
```

## Testing

### Manual Testing Checklist
- [ ] Text search: "santo domingo" → shows Santo Domingo properties
- [ ] City filter: Select "Santo Domingo" → filters by city
- [ ] Property type filter: Select "Apartamento" → filters by type
- [ ] Price range: Min $100K, Max $500K → shows properties in range
- [ ] Bedrooms filter: 2+ → shows properties with ≥2 bedrooms
- [ ] Pagination: Click "Siguiente" → loads next 20 results
- [ ] Empty state: Search "xyzabc123" → shows "No encontramos propiedades"
- [ ] Mobile view: Toggle List/Map → switches views
- [ ] Clear filters: Click "Limpiar filtros" → resets all filters

### Performance Testing
- [ ] First search < 1s (initial Firestore fetch)
- [ ] Subsequent filters < 300ms (client-side filtering)
- [ ] Pagination instant (already fetched data)
- [ ] Facet dropdown load < 500ms

### E2E Tests (Playwright)
```bash
# Add custom search tests
npx playwright test tests/search.spec.ts
```

Create `tests/search.spec.ts`:
```typescript
test('custom search filters properties by city', async ({ page }) => {
  await page.goto('/search');
  await page.selectOption('select:has-text("Ciudad")', 'Santo Domingo');
  await expect(page.locator('.property-card')).toHaveCount(20, { timeout: 5000 });
  await expect(page.locator('text=propiedades encontradas')).toContainText('Santo Domingo');
});
```

## Troubleshooting

### Issue: "No properties found" on first search
**Cause**: No active listings in Firestore or missing composite index  
**Fix**:
1. Check Firebase Console → Firestore → `listings` collection for docs with `status: 'active'`
2. Check browser console for Firestore index errors
3. Click error link to create missing index

### Issue: Search slow (>2s per query)
**Cause**: Fetching all 500 docs every time  
**Fix**:
1. Reduce `firestoreLimit(500)` to `firestoreLimit(100)` in `customSearchService.ts`
2. Add debounce to text search input (300ms)
3. Cache facet values (5-minute TTL)

### Issue: Price filter not working
**Cause**: Client-side filtering applied after Firestore fetch  
**Fix**: This is expected behavior. Price filtering happens after fetch to avoid complex indexes.

### Issue: Geo-search not finding nearby properties
**Cause**: Listings missing `location.coordinates.latitude/longitude` fields  
**Fix**:
1. Check Firestore docs have geo coordinates
2. Verify coordinates in format: `{ latitude: 18.486, longitude: -69.931 }`

### Issue: Text search too strict (no results)
**Cause**: Relevance threshold too high (0.3 = 30% match)  
**Fix**: Lower threshold in `customSearchService.ts`:
```typescript
// Change from 0.3 to 0.2 (20% match)
results = results.filter((r) => !r.relevance || r.relevance >= 0.2);
```

## Future Enhancements

### Short-term (v1.1)
- [ ] Add debounce to text search (300ms)
- [ ] Cache facet values (5-minute TTL)
- [ ] Add loading skeleton for search results
- [ ] Highlight matched text in results
- [ ] Add "Sort by" dropdown (price, date, relevance)

### Medium-term (v1.2)
- [ ] Implement Firestore pagination with `startAfter()` for > 500 properties
- [ ] Add saved searches (save filters to Firestore)
- [ ] Add search alerts (email when new listings match filters)
- [ ] Add "Similar properties" feature (based on price/location/type)

### Long-term (v2.0)
- [ ] Custom synonym dictionary ("condo" → "condominio")
- [ ] Typo tolerance with Levenshtein distance
- [ ] ML-powered relevance scoring (train on user clicks)
- [ ] Facet counts ("Santo Domingo (42)")
- [ ] Instant search (search-as-you-type)

## Cost Analysis

### Firestore Pricing (Custom Search)
- **Reads**: ~500 docs per search × $0.06 per 100K reads = $0.0003 per search
- **Storage**: Negligible (listings already stored)
- **Monthly**: 10K searches = $3/month

### Algolia Pricing (Comparison)
- **Free Tier**: 10K searches/month, 10K records
- **Growth Plan**: $99/month for 100K searches, unlimited records
- **Premium Plan**: $299/month for 1M searches

### Savings
- **Year 1**: $0 (both free tier)
- **Year 2**: ~$1,188 savings (Algolia Growth vs. Firestore)
- **Year 3**: ~$3,588 savings (Algolia Premium vs. Firestore)

## Support

### Documentation
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)
- [Composite Indexes](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Geo-Queries](https://firebase.google.com/docs/firestore/solutions/geoqueries)

### Code References
- `lib/customSearchService.ts` - Core search logic
- `app/search/page.tsx` - Search UI
- `components/PropertyCard.tsx` - Result cards

### Questions?
Open an issue on GitHub or contact viventa.rd@gmail.com
