// Lightweight Stripe integration scaffold without pulling the Stripe SDK yet.
// When ready, implement the server-side with the Stripe secret key and replace
// the stubbed API call below.

export type CheckoutPlan = 'agent' | 'broker' | 'constructoras';

export type CheckoutSessionRequest = {
  plan: CheckoutPlan;
  email?: string;
  // Optional metadata to enrich the session
  metadata?: Record<string, string>;
  // Optional success/cancel URLs (fallback to defaults on server)
  successUrl?: string;
  cancelUrl?: string;
};

export type CheckoutSessionResponse = {
  url?: string;      // Hosted checkout URL
  id?: string;       // Session ID
  error?: string;    // Error message, if any
};

// Contract
// input: plan ('agent' | 'broker' | 'constructoras'), optional email
// output: { url } to redirect user to Stripe Checkout
// errors: network/server errors, validation errors
export async function createCheckoutSession(
  payload: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  try {
    const res = await fetch('/api/stripe/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `HTTP ${res.status}: ${text}` };
    }

    const data = (await res.json()) as CheckoutSessionResponse;
    return data;
  } catch (err: any) {
    return { error: err?.message || 'Unexpected error creating checkout session' };
  }
}

// TODO (server): create app/api/stripe/create-session/route.ts
// - Initialize Stripe with STRIPE_SECRET_KEY
// - Map plan -> priceId
// - Create Checkout Session and return { url, id }
// - Validate allowed plans & require authentication if needed
