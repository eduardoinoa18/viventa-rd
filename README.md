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
	- When a property is set to a non-active status or deleted, it will be removed from the index.

