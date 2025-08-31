import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEntryPaymentIntent } from '@/lib/stripe/connect';

// This API route is protected and requires authentication
export async function POST(request: Request) {
  const supabase = createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
  
  try {
    const { weekId, paymentMethodType = 'card' } = await request.json();
    
    if (!weekId) {
      return NextResponse.json(
        { error: 'Week ID is required' },
        { status: 400 }
      );
    }
    
    // Get the week details to determine the entry fee
    const { data: week, error: weekError } = await supabase
      .from('weeks')
      .select('entry_fee_cents, status')
      .eq('id', weekId)
      .single();
      
    if (weekError || !week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }
    
    // Check if the week is still accepting entries
    if (week.status !== 'upcoming' && week.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'This week is not currently accepting entries' },
        { status: 400 }
      );
    }
    
    // Check if the user has already entered this week
    const { data: existingEntry, error: entryError } = await supabase
      .from('participants')
      .select('id, payment_status')
      .eq('week_id', weekId)
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (entryError) {
      console.error('Error checking existing entry:', entryError);
      return NextResponse.json(
        { error: 'Error checking existing entry' },
        { status: 500 }
      );
    }
    
    if (existingEntry) {
      if (existingEntry.payment_status === 'paid') {
        return NextResponse.json(
          { error: 'You have already entered this week\'s challenge' },
          { status: 400 }
        );
      }
      
      // If there's an existing entry with a failed payment, we'll update it
      // Otherwise, we'll create a new one below
    }
    
    // Create or update the participant record
    const participantData = {
      week_id: weekId,
      user_id: user.id,
      payment_status: 'pending',
      updated_at: new Date().toISOString(),
    };
    
    let participantId: string;
    
    if (existingEntry) {
      // Update existing participant
      const { data: updatedParticipant, error: updateError } = await supabase
        .from('participants')
        .update(participantData)
        .eq('id', existingEntry.id)
        .select('id')
        .single();
        
      if (updateError || !updatedParticipant) {
        console.error('Error updating participant:', updateError);
        return NextResponse.json(
          { error: 'Error updating your entry' },
          { status: 500 }
        );
      }
      
      participantId = updatedParticipant.id;
    } else {
      // Create new participant
      const { data: newParticipant, error: createError } = await supabase
        .from('participants')
        .insert([{
          ...participantData,
          created_at: new Date().toISOString(),
        }])
        .select('id')
        .single();
        
      if (createError || !newParticipant) {
        console.error('Error creating participant:', createError);
        return NextResponse.json(
          { error: 'Error creating your entry' },
          { status: 500 }
        );
      }
      
      participantId = newParticipant.id;
    }
    
    // Create the payment intent
    const { clientSecret, paymentIntentId } = await createEntryPaymentIntent(
      week.entry_fee_cents,
      weekId,
      user.id,
      paymentMethodType as 'card' | 'us_bank_account'
    );
    
    // Update the participant with the payment intent ID
    await supabase
      .from('participants')
      .update({
        payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', participantId);
    
    return NextResponse.json({
      clientSecret,
      paymentIntentId,
      amount: week.entry_fee_cents,
      currency: 'usd',
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
