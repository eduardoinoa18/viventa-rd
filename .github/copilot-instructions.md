# GitHub Copilot Instructions for VIVENTA

This document provides coding standards, architectural patterns, and development practices for the VIVENTA real estate platform.

## Project Overview

VIVENTA is a Next.js-based real estate platform for the Dominican Republic featuring:
- Property listings with custom Firestore-based search (no Algolia)
- Multi-role support (users, agents, brokers, admins)
- Firebase backend (Authentication, Firestore, Storage, Functions)
- Progressive Web App (PWA) capabilities
- Stripe payment integration
- Multi-language support (Spanish/English)

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, React Icons
- **Maps**: Leaflet, Mapbox GL, React Map GL
- **State Management**: React hooks, Context API
- **Forms**: Native React forms with validation

### Backend
- **Platform**: Firebase
- **Database**: Cloud Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions (Node.js/TypeScript)
- **Email**: SendGrid, Nodemailer, Resend

### Testing & Quality
- **E2E Testing**: Playwright
- **Type Checking**: TypeScript compiler
- **Linting**: ESLint (Next.js config)
- **Code Style**: Prettier (if configured)

## Coding Standards

### TypeScript Guidelines
- Always use TypeScript for all new code (`.ts` and `.tsx` files)
- Enable strict mode; do not use `any` types unless absolutely necessary
- Define explicit types for function parameters and return values
- Use interfaces for object shapes, types for unions/intersections
- Leverage TypeScript's type inference where it improves readability
- Export types and interfaces when they may be reused

### React & Next.js Best Practices
- Use functional components with hooks exclusively
- Prefer `async/await` over promise chains
- Use Next.js App Router conventions (app directory)
- Implement proper loading states and error boundaries
- Use Server Components by default; only add `'use client'` when necessary
- Follow Next.js file-based routing structure
- Optimize images using Next.js `<Image>` component
- Use metadata API for SEO optimization

### Component Structure
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use composition over prop drilling
- Place shared components in `/components` directory
- Organize feature-specific components within their feature folders (e.g., `/app/admin`, `/app/broker`)
- Name files using PascalCase for components (e.g., `PropertyCard.tsx`)

### Styling with Tailwind CSS
- Use Tailwind utility classes directly in JSX
- Follow responsive design patterns: mobile-first approach
- Use Tailwind's dark mode utilities where applicable
- Keep custom CSS minimal; prefer Tailwind utilities
- Use consistent spacing scale from tailwind.config.js
- Leverage Tailwind's color palette; avoid hardcoded hex colors

### Firebase & Firestore Patterns
- Always handle Firebase operations in try-catch blocks
- Use Firestore security rules for data protection
- Implement proper pagination using Firestore query cursors
- Index Firestore queries appropriately (see firestore.indexes.json)
- Use Firebase Admin SDK only in server-side code or Cloud Functions
- Never expose Firebase admin credentials or service account keys
- Use environment variables for Firebase configuration

### Custom Search Implementation
- VIVENTA uses **custom Firestore-based search** (not Algolia)
- Search implementation is in `/lib` and custom components
- Follow existing patterns when modifying search functionality
- Maintain search indexes as defined in Firestore
- See CUSTOM-SEARCH.md for architecture details

### State Management
- Use React hooks (`useState`, `useEffect`, `useContext`) for local state
- Use Context API for shared state across components
- Keep state as close to where it's used as possible
- Avoid prop drilling; use composition or context
- For complex state, consider useReducer pattern

### Error Handling
- Always handle errors gracefully with user-friendly messages
- Use try-catch blocks for async operations
- Implement error boundaries for React component errors
- Log errors appropriately (console.error in dev, proper logging in production)
- Show toast notifications for user feedback (using react-hot-toast)

### Security Best Practices
- Never commit sensitive data (API keys, credentials) to the repository
- Use environment variables for all configuration
- Validate and sanitize all user inputs
- Implement proper authentication checks on protected routes
- Follow Firebase security rules best practices
- Use Next.js middleware for route protection
- Be cautious with `dangerouslySetInnerHTML`; prefer safe rendering

### Accessibility
- Use semantic HTML elements
- Include appropriate ARIA labels where needed
- Ensure keyboard navigation works properly
- Maintain sufficient color contrast ratios
- Test with screen readers when implementing complex UI

## Development Workflow

### Setup & Installation
```bash
# Install dependencies
npm install
cd functions && npm install && cd ..

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with Firebase configuration

# Start development server
npm run dev

# Start Firebase emulators (optional)
firebase emulators:start --only auth,firestore,functions,storage
```

### Build & Test Commands
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (with browser UI)
npm run test:e2e:headed
```

### Before Committing
1. Run `npm run typecheck` to ensure no TypeScript errors
2. Run `npm run lint` to check code style
3. Test changes in the browser (npm run dev)
4. Run relevant E2E tests if applicable
5. Ensure no console errors in browser
6. Review git diff to verify only intended changes are included

## File Organization

```
/app                    # Next.js app directory (routes & layouts)
  /admin                # Admin portal pages
  /agent                # Agent-specific pages
  /broker               # Broker-specific pages
  /api                  # API routes
  /dashboard            # User dashboard
  /listing              # Property listing pages
/components             # Shared React components
/functions              # Firebase Cloud Functions
  /src                  # Function source code
/hooks                  # Custom React hooks
/lib                    # Shared utilities, helpers, Firebase client
/types                  # TypeScript type definitions
/public                 # Static assets (images, icons, manifest)
/tests                  # Playwright E2E tests
/locales                # i18n translation files
```

## Common Patterns

### Fetching Data in Server Components
```typescript
// app/listing/[id]/page.tsx
export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await getListingById(params.id);
  if (!listing) notFound();
  return <ListingDetails listing={listing} />;
}
```

### Client-side State Management
```typescript
'use client';
import { useState, useEffect } from 'react';

export default function MyComponent() {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData().then(setData).finally(() => setLoading(false));
  }, []);
  
  if (loading) return <LoadingSpinner />;
  return <div>{/* render data */}</div>;
}
```

### Firestore Operations
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getActiveListings() {
  try {
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
}
```

### API Routes
```typescript
// app/api/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Guidelines

### E2E Testing with Playwright
- Write tests for critical user flows
- Place tests in `/tests` directory with `.spec.ts` extension
- Use descriptive test names
- Test files follow pattern: `feature-name.spec.ts`
- Run tests before submitting PRs
- See TESTING.md for manual QA checklist

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('user can search for properties', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="search-input"]', 'Santo Domingo');
  await page.click('[data-testid="search-button"]');
  await expect(page.locator('.property-card')).toHaveCount(10);
});
```

## Environment Variables

Required environment variables (see `.env.local.example`):
- Firebase configuration (API key, project ID, etc.)
- SendGrid/email service credentials
- Stripe API keys
- Other third-party service keys

**Never commit `.env.local` or any file containing secrets**

## Documentation References

- **[PLATFORM-OVERVIEW.md](../PLATFORM-OVERVIEW.md)** - Architecture and modules
- **[CUSTOM-SEARCH.md](../CUSTOM-SEARCH.md)** - Search implementation details
- **[TESTING.md](../TESTING.md)** - Testing strategy and QA checklist
- **[VERCEL-DEPLOYMENT.md](../VERCEL-DEPLOYMENT.md)** - Production deployment
- **[ADMIN-LOGIN-GUIDE.md](../ADMIN-LOGIN-GUIDE.md)** - Admin portal usage
- **[README.md](../README.md)** - Quick start guide

## Additional Notes

- This is a real-world production application serving users in the Dominican Republic
- Focus on code quality, security, and user experience
- Write clear commit messages describing what and why
- Keep accessibility in mind for all UI changes
- When in doubt, follow existing patterns in the codebase
- Performance matters: optimize images, minimize bundle size, lazy load when appropriate
