import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown Error');
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}` },
      { status: 400 }
    );
  }

  console.log('Received event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // For testing, you might need to retrieve the customer email differently
    // as the test event might not include a customer email
    const userEmail = session.customer_email || 'gregory.reeves@teachstone.com';

    console.log('Processing completed checkout for:', userEmail);

    try {
      // Fetch the user from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, token_balance')
        .eq('email', userEmail)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userEmail);
        throw new Error('User not found');
      }

      // Update the user's subscription status and token balance
      const newBalance = userData.token_balance + 1500;
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_subscribed: true,
          token_balance: newBalance
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error('Failed to update user data:', updateError);
        throw new Error('Failed to update user data');
      }

      console.log('Successfully updated user data for:', userEmail);
      return NextResponse.json({ received: true, processed: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }
  } else {
    console.log('Unhandled event type:', event.type);
    return NextResponse.json({ received: true, processed: false });
  }
}