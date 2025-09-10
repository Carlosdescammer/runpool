import { stripe } from './client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Connect a Stripe account to our platform
export async function connectStripeAccount(authorizationCode: string) {
  try {
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: authorizationCode,
    });

    if (!response.stripe_user_id) {
      throw new Error('No Stripe user ID in OAuth response');
    }

    // Get the account details
    const account = await stripe.accounts.retrieve(response.stripe_user_id);
    
    // This function would need to be called with a user ID parameter
    // For now, we'll return the account info and let the caller handle the database update

    return {
      success: true,
      accountId: response.stripe_user_id,
      accountStatus: account.details_submitted ? 'complete' : 'incomplete',
    };
  } catch (error) {
    console.error('Error connecting Stripe account:', error);
    throw new Error('Failed to connect Stripe account');
  }
}

// Create a payment intent for a weekly challenge entry
export async function createEntryPaymentIntent(
  amount: number, 
  weekId: string,
  userId: string,
  paymentMethodType: 'card' | 'us_bank_account' = 'card'
) {
  try {
    // Get the week and group details
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: weekData, error: weekError } = await supabase
      .from('weeks')
      .select('*, groups(*)')
      .eq('id', weekId)
      .single();

    if (weekError || !weekData) {
      throw new Error('Week not found');
    }

    const group = weekData.groups;
    if (!group || !group.coach_id) {
      throw new Error('Group or coach not found');
    }

    // Get the coach's Stripe account ID
    const { data: coachData, error: coachError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', group.coach_id)
      .single();

    if (coachError || !coachData?.stripe_account_id) {
      throw new Error('Coach has not connected a Stripe account');
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: [paymentMethodType],
      metadata: {
        week_id: weekId,
        user_id: userId,
        purpose: 'run_pool_entry',
      },
      transfer_data: {
        destination: coachData.stripe_account_id,
      },
      // Allow the user to update payment method if needed
      setup_future_usage: 'off_session',
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Failed to create payment intent');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment');
  }
}

// Process a payout to a winner
export async function processPayout(
  amount: number,
  recipientStripeAccountId: string,
  weekId: string,
  recipientUserId: string
) {
  try {
    // In a real implementation, you would transfer funds from the platform account
    // to the recipient's Stripe account. This requires the platform to collect fees
    // and then transfer the remaining amount to the recipient.
    
    // Create a transfer to the recipient's Stripe account
    const transfer = await stripe.transfers.create({
      amount,
      currency: 'usd',
      destination: recipientStripeAccountId,
      transfer_group: `WEEK_${weekId}`,
      metadata: {
        week_id: weekId,
        recipient_user_id: recipientUserId,
        purpose: 'run_pool_prize',
      },
    });

    // Record the payout in your database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase
      .from('payouts')
      .insert({
        week_id: weekId,
        recipient_id: recipientUserId,
        amount_cents: amount,
        status: 'processing',
        payout_id: transfer.id,
        metadata: {
          transfer_id: transfer.id,
          destination: transfer.destination,
          status: 'paid',
        },
      });

    if (error) {
      console.error('Error recording payout:', error);
      // In a real app, you might want to handle this error more gracefully
      // and potentially reverse the transfer if the database update fails
      throw new Error('Failed to record payout');
    }

    return {
      success: true,
      transferId: transfer.id,
      status: 'paid',
    };
  } catch (error) {
    console.error('Error processing payout:', error);
    throw new Error('Failed to process payout');
  }
}

// Handle Stripe webhook events
export async function handleStripeWebhook(event: Stripe.Event) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentIntentSucceeded(paymentIntent, supabase);
      break;
      
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      await handlePaymentIntentFailed(failedPaymentIntent, supabase);
      break;
      
    case 'transfer.updated':
      const transfer = event.data.object as Stripe.Transfer;
      await handleTransferUpdate(transfer, supabase);
      break;
      
    // Add more event types as needed
  }
}

// Helper function to handle successful payments
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: SupabaseClient) {
  const { week_id: weekId, user_id: userId } = paymentIntent.metadata;
  
  if (!weekId || !userId || paymentIntent.metadata.purpose !== 'run_pool_entry') {
    // Not a Run Pool payment, ignore
    return;
  }
  
  // Update the participant's payment status
  const { error } = await supabase
    .from('participants')
    .update({
      payment_status: 'paid',
      payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('week_id', weekId)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error updating participant payment status:', error);
    return;
  }

  // Send payment success email
  try {
    // For test payments, use metadata email, otherwise get from database
    let userEmail = paymentIntent.metadata.user_email;
    let challengeName = 'Test Challenge';
    
    if (!userEmail || paymentIntent.metadata.source !== 'test-payments-page') {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const { data: weekData } = await supabase
        .from('weeks')
        .select('*, groups(*)')
        .eq('id', weekId)
        .single();
      
      userEmail = userData.user?.email;
      challengeName = weekData?.groups?.name || 'Running Challenge';
    }

    if (userEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.runpool.space';
      await fetch(`${appUrl}/api/notify/payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          amount: paymentIntent.amount,
          weekId,
          challengeName
        }),
      });
    }
  } catch (emailError) {
    console.error('Error sending payment success email:', emailError);
  }
}

// Helper function to handle failed payments
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabase: SupabaseClient) {
  const { week_id: weekId, user_id: userId } = paymentIntent.metadata;
  
  if (!weekId || !userId || paymentIntent.metadata.purpose !== 'run_pool_entry') {
    // Not a Run Pool payment, ignore
    return;
  }
  
  // Update the participant's payment status
  await supabase
    .from('participants')
    .update({
      payment_status: 'failed',
      payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('week_id', weekId)
    .eq('user_id', userId);

  // Send payment failure email
  try {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const { data: weekData } = await supabase
      .from('weeks')
      .select('*, groups(*)')
      .eq('id', weekId)
      .single();

    if (userData.user?.email && weekData) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.runpool.space';
      await fetch(`${appUrl}/api/notify/payment-failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.user.email,
          amount: paymentIntent.amount,
          weekId,
          challengeName: weekData.groups?.name || 'Running Challenge',
          failureReason: paymentIntent.last_payment_error?.message || 'Payment was declined'
        }),
      });
    }
  } catch (emailError) {
    console.error('Error sending payment failure email:', emailError);
  }
}

// Helper function to handle transfer updates
async function handleTransferUpdate(transfer: Stripe.Transfer, supabase: SupabaseClient) {
  // Update the payout status in the database
  const { error } = await supabase
    .from('payouts')
    .update({
      status: (transfer as any).status === 'paid' ? 'completed' : 'failed',
      metadata: {
        ...transfer.metadata,
        transfer_status: (transfer as any).status,
        failure_message: (transfer as any).failure_message || null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('payout_id', transfer.id);
    
  if (error) {
    console.error('Error updating payout status:', error);
    return;
  }

  // Send payout success email if transfer completed
  if ((transfer as any).status === 'paid') {
    try {
      const { data: payoutData } = await supabase
        .from('payouts')
        .select('*, weeks(*, groups(*))')
        .eq('payout_id', transfer.id)
        .single();

      if (payoutData) {
        const { data: userData } = await supabase.auth.admin.getUserById(payoutData.recipient_id);
        
        if (userData.user?.email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.runpool.space';
          await fetch(`${appUrl}/api/notify/payout-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.user.email,
              amount: payoutData.amount_cents,
              weekId: payoutData.week_id,
              challengeName: payoutData.weeks?.groups?.name || 'Running Challenge',
              position: 1 // You might want to calculate actual position
            }),
          });
        }
      }
    } catch (emailError) {
      console.error('Error sending payout success email:', emailError);
    }
  }
}

// Get the Stripe account onboarding link
export async function getStripeOnboardingLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return {
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
    };
  } catch (error) {
    console.error('Error creating account link:', error);
    throw new Error('Failed to create Stripe onboarding link');
  }
}
