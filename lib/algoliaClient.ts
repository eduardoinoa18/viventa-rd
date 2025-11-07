// lib/algoliaClient.ts
import algoliasearch from 'algoliasearch';

const APP_ID = process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || '';

if (!APP_ID || !ADMIN_KEY) {
  console.warn('Algolia credentials not configured');
}

export const algoliaClient = algoliasearch(APP_ID, ADMIN_KEY);
