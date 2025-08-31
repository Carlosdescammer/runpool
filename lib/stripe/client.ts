import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('STRIPE_WEBHOOK_SECRET is not set in environment variables');
}

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil', // Use the latest API version
  typescript: true,
});

// Stripe Connect OAuth scopes
export const STRIPE_SCOPES = [
  'read_write',
  'payments',
  'payouts',
  'payment_intents',
  'transfers',
].join(' ');

// Stripe Connect OAuth URL
export function getStripeConnectUrl(redirectUri: string, state?: string): string {
  if (!process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_STRIPE_CLIENT_ID is not set in environment variables');
  }

  const url = new URL('https://connect.stripe.com/oauth/authorize');
  url.searchParams.append('client_id', process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID);
  url.searchParams.append('scope', STRIPE_SCOPES);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('redirect_uri', redirectUri);
  
  if (state) {
    url.searchParams.append('state', state);
  }

  return url.toString();
}

// Verify Stripe webhook signature
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret?: string
): Promise<Stripe.Event> {
  const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw new Error('Webhook signature verification failed');
  }
}

// Calculate Stripe fees for a given amount (in cents)
export function calculateStripeFees(amountCents: number, paymentMethod: 'card' | 'ach' = 'card'): number {
  // Stripe fees (in cents)
  const CARD_PROCESSING_FEE_RATE = 0.029; // 2.9%
  const CARD_PROCESSING_FIXED = 30; // $0.30
  const ACH_PROCESSING_FEE_RATE = 0.008; // 0.8%
  const ACH_PROCESSING_MAX_FEE = 500; // $5.00
  
  if (paymentMethod === 'ach') {
    const fee = Math.ceil(amountCents * ACH_PROCESSING_FEE_RATE);
    return Math.min(fee, ACH_PROCESSING_MAX_FEE);
  } else {
    // Card payment
    return Math.ceil(amountCents * CARD_PROCESSING_FEE_RATE) + CARD_PROCESSING_FIXED;
  }
}

// Format amount for display
export function formatCurrency(amountCents: number): string {
  return (amountCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

// Convert dollars to cents (avoids floating point issues)
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// Convert cents to dollars
export function toDollars(cents: number): number {
  return cents / 100;
}
