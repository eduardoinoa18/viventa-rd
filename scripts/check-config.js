#!/usr/bin/env node

/**
 * Firebase Configuration Checker
 * Run this script to verify your Firebase environment variables are set correctly
 */

const chalk = require('chalk') || { green: (s) => s, red: (s) => s, yellow: (s) => s, blue: (s) => s };

console.log('\n🔍 Checking Firebase Configuration...\n');

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

let allPresent = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value && value !== 'your_api_key_here' && value !== 'your_project_id') {
    console.log(`✅ ${varName}`);
  } else {
    console.log(`❌ ${varName} - Missing or placeholder`);
    allPresent = false;
  }
});

console.log('\n---\n');

if (allPresent) {
  console.log('✅ All Firebase environment variables are set!\n');
  console.log('You can now run: npm run dev\n');
} else {
  console.log('⚠️  Some Firebase environment variables are missing.\n');
  console.log('Please follow these steps:\n');
  console.log('1. Copy .env.local.example to .env.local');
  console.log('2. Get your Firebase credentials from: https://console.firebase.google.com/');
  console.log('3. Update .env.local with your actual values');
  console.log('4. Restart your development server\n');
  console.log('For Vercel deployment, add these to: https://vercel.com/your-project/settings/environment-variables\n');
}

// Check optional vars
const optionalVars = [
  'NEXT_PUBLIC_ALGOLIA_APP_ID',
  'NEXT_PUBLIC_ALGOLIA_SEARCH_KEY',
];

let hasOptional = false;
optionalVars.forEach((varName) => {
  if (process.env[varName]) {
    hasOptional = true;
  }
});

if (hasOptional) {
  console.log('ℹ️  Optional: Algolia search is configured\n');
} else {
  console.log('ℹ️  Optional: Algolia search not configured (property search will use basic filtering)\n');
}
