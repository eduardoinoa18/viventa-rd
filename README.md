VIVENTA — Real Estate Platform for Dominican Republic

## Quick Start

1) **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

2) **Environment variables**
   - Create `.env.local` with Firebase configuration
   - See `.env.local.example` for required vars

3) **Local development**
   ```bash
   # Start Firebase emulators (optional)
   firebase emulators:start --only auth,firestore,functions,storage
   
   # Start Next.js dev server
   npm run dev
   ```

## Custom Search (Zero Cost)

VIVENTA uses a **custom Firestore-based search** solution (no Algolia required):
- 📚 See **[CUSTOM-SEARCH.md](./CUSTOM-SEARCH.md)** for full architecture
- 🔍 Features: text search, geo-distance, faceted filters, pagination
- 💰 Cost: ~$3/month vs. $99-299/month for Algolia
- 🚀 No external dependencies or API keys needed

## Deployment

### Vercel (Recommended)
1. Connect GitHub repo to Vercel
2. Add environment variables from `.env.local`
3. Deploy (automatic on push to `main`)

See **[VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md)** for detailed steps.

## Testing

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed
```

See **[TESTING.md](./TESTING.md)** for manual QA checklist and CI/CD setup.

## Documentation

- **[PLATFORM-OVERVIEW.md](./PLATFORM-OVERVIEW.md)** - High-level architecture, modules, and operations
- **[CUSTOM-SEARCH.md](./CUSTOM-SEARCH.md)** - Search architecture and troubleshooting
- **[TESTING.md](./TESTING.md)** - Playwright E2E tests and manual QA
- **[VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md)** - Production deployment guide
- **[ADMIN-LOGIN-GUIDE.md](./ADMIN-LOGIN-GUIDE.md)** - Admin portal access
- **[MASTER-ADMIN-SETUP.md](./MASTER-ADMIN-SETUP.md)** - Master admin configuration
- **[docs/AI-COORDINATION-PROTOCOL.md](./docs/AI-COORDINATION-PROTOCOL.md)** - Drift-free multi-agent workflow and Git authority rules
	- When a property is set to a non-active status or deleted, it will be removed from the index.

## Phase-One Core MVP Scope (Dominican Republic)

The following features define the non-negotiable MVP. Anything outside this list is Phase Two or later.

### A. Property Listings (MLS-Style Core)

Must support:
- Property types: Apartment, House / Villa, Land (Solar), New Construction / Project (Pre-construction)
- Transaction type: Sale, Rent
- Core listing fields:
   - Price (DOP + USD support)
   - Province / City / Sector (DR geography first, no global abstraction)
   - Bedrooms / Bathrooms
   - Size (m2)
   - Parking
   - Furnished / Semi / Empty
   - Description (Spanish primary, English optional)
   - Image gallery (optimized + lazy loaded)
   - Agent / Broker attribution
   - Status: Active, Pending, Sold, Rented

Explicitly excluded (Phase Two):
- AI price prediction
- Investment ROI calculators
- Mortgage simulators
- International tax logic

### B. Agent / Broker Portal (Lean Version)

Must support:
- Secure authentication
- Create / Edit / Archive listings
- Upload photos
- View leads generated from listings
- Basic performance stats: Views per listing, Leads per listing

Explicitly excluded (Phase Two):
- CRM pipelines
- Automated WhatsApp bots
- Agent ranking algorithms
- Commission tracking automation

### C. Consumer Search and Discovery

Must support:
- Fast search by: Location (Province -> City -> Sector), price range, bedrooms, property type
- Sorting: Price (low -> high, high -> low), Newest listings
- Listing detail page with: Full gallery, Map location (approximate, not exact), Contact agent CTA

Explicitly excluded (Phase Two):
- AI recommendation engines
- Saved searches and alerts
- User accounts beyond basic lead capture

### D. Lead Generation (Revenue Core)

Must support:
- Simple lead capture form: Name, Email, Phone / WhatsApp
- Leads routed to: Listing agent, Admin dashboard (visibility)
- Timestamped lead records

Explicitly excluded (Phase Two):
- Lead scoring
- Automated follow-ups
- Third-party CRM sync

### E. Admin Dashboard (Minimal Control Layer)

Must support:
- View all listings
- Approve / deactivate listings
- View all agents
- View lead activity (read-only)

Explicitly excluded (Phase Two):
- Advanced analytics
- Billing automation
- Multi-role permissions

### F. Technical Constraints (Important)

Mandates:
- Optimize for: Speed, Simplicity, Maintainability
- Prefer: Fewer tables, Clear schemas, Predictable API endpoints
- Avoid: Premature abstractions, Over-engineering, Future-proofing that slows MVP

