import { NextResponse } from 'next/server';
import { connectStripeAccount } from '@/lib/stripe/connect';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');

  // Handle errors from Stripe
  if (error) {
    console.error('Stripe OAuth error:', { error, errorDescription });
    return NextResponse.redirect(
      new URL(`/settings/billing?error=${encodeURIComponent(errorDescription || 'stripe_connect_failed')}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/billing?error=missing_code', request.url)
    );
  }

  try {
    // Connect the Stripe account
    const result = await connectStripeAccount(code);

    // Get the redirect URL from state if provided
    let redirectUrl = '/settings/billing?success=stripe_connected';
    if (state) {
      try {
        const parsedState = JSON.parse(decodeURIComponent(state));
        if (parsedState.redirectTo) {
          redirectUrl = parsedState.redirectTo;
        }
      } catch (e) {
        console.error('Error parsing state:', e);
      }
    }

    // Redirect to success URL
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Error connecting Stripe account:', error);
    return NextResponse.redirect(
      new URL('/settings/billing?error=stripe_connect_failed', request.url)
    );
  }
}
