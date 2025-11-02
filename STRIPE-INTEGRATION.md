# Stripe Integration Guide

This document explains how to set up and use the Stripe billing integration in the VIVENTA admin dashboard.

## Overview

The billing system allows master admins to:
- Manage subscription plans for Agents and Brokers
- Create customers and subscriptions
- Track payments and invoices
- Generate payment links
- Monitor MRR, churn, and active subscriptions

## Setup Instructions

### 1. Create Stripe Account
- Sign up at https://stripe.com
- Get your API keys from the Dashboard

### 2. Create Products and Prices
1. Go to Stripe Dashboard → Products
2. Create two products:
   - **Agent Plan** (e.g., $49/month)
   - **Broker Plan** (e.g., $99/month)
3. For each product, create a recurring Price
4. Copy the Price IDs (format: `price_xxxxx`)

### 3. Configure Environment Variables
Add these to your `.env.local` file:

```bash
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Webhook Secret (get after creating webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Site URL (for payment redirects)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 4. Set Up Webhook Endpoint
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the Signing Secret and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 5. Configure Admin Dashboard
1. Log in as Master Admin
2. Go to Admin → Billing → Plans & Pricing
3. Paste your Stripe Publishable Key
4. Paste the Price IDs for Agent and Broker plans
5. Click Save

## Usage

### Creating Customers
- Go to Admin → Billing → Customers
- Enter email and optional name
- Click "Create Customer"
- Customer is created in Stripe and synced to Firestore

### Creating Subscriptions
- Go to Admin → Billing → Subscriptions
- Enter customer email and select plan
- Click "Create Subscription"
- Subscription is created in Stripe and synced to Firestore

### Generating Payment Links
- Go to Admin → Billing → Overview
- Click "Create Agent Payment Link" or "Create Broker Payment Link"
- Link is copied to clipboard
- Share with customers to complete payment

### Using Checkout Sessions
The `createCheckoutSession()` function in `lib/stripeService.ts` can be called from your frontend:

```typescript
import { createCheckoutSession } from '@/lib/stripeService'

const result = await createCheckoutSession({
  plan: 'agent',
  email: 'customer@example.com',
  successUrl: 'https://yourdomain.com/success',
  cancelUrl: 'https://yourdomain.com/cancel',
})

if (result.url) {
  window.location.href = result.url
} else {
  console.error(result.error)
}
```

## Data Storage

All billing data is stored in Firestore:

- **settings/billing** - Publishable key, price IDs, wallet settings
- **billing_customers** - Customer records synced from Stripe
- **billing_subscriptions** - Active and past subscriptions
- **billing_invoices** - Payment history

## Apple Pay & Google Pay

Stripe Checkout automatically offers Apple Pay and Google Pay where supported:
- Apple Pay: On Safari with compatible devices
- Google Pay: On Chrome with compatible devices and saved payment methods

No additional configuration needed for basic support. Native wallet integrations (domain verification, merchant validation) are marked as "Coming Soon" in the admin UI.

## Testing

Use Stripe test mode:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

Monitor webhook events in Stripe Dashboard → Developers → Events

## Production Checklist

Before going live:
- [ ] Switch to live API keys (remove `_test_` from keys)
- [ ] Update webhook endpoint to production URL
- [ ] Test full payment flow end-to-end
- [ ] Verify customer emails are sent
- [ ] Set up monitoring for failed payments
- [ ] Review Stripe Dashboard settings (tax, billing portal, etc.)
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Configure customer portal for self-service

## Security Notes

- Never expose `STRIPE_SECRET_KEY` in client-side code
- Always verify webhook signatures with `STRIPE_WEBHOOK_SECRET`
- Use environment variables for all sensitive keys
- Rate-limit payment link creation to prevent abuse
- Validate all input on the server side

## Support

For issues with:
- Stripe integration: Check Stripe Dashboard logs and webhook events
- Payment failures: Review customer's payment method and Stripe Radar rules
- Webhook errors: Verify signature and check server logs

For more information: https://stripe.com/docs
