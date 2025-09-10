import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@/lib/stripe/client';
import { handleStripeWebhook } from '@/lib/stripe/connect';

// Disable body parsing, we need the raw body to verify the signature
export const dynamic = 'force-dynamic';

// Handle POST requests to /api/webhooks/stripe
export async function POST(req: Request) {
  try {
    // Get the raw body as text
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return new NextResponse('No signature', { status: 400 });
    }

    // Verify the webhook signature
    const event = await verifyWebhookSignature(body, signature);

    // Handle the event
    await handleStripeWebhook(event);

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Webhook error', { status: 400 });
  }
}

// Add OPTIONS method for CORS preflight
// This is necessary for Stripe webhooks
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  });
}
