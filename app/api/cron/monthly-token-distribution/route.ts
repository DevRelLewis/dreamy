// app/api/cron/monthly-token-distribution/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET(req: NextRequest) {
  // Verify the request is coming from the cron job
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all subscribed users
    const { data: subscribedUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, token_balance')
      .eq('is_subscribed', true);

    if (fetchError) {
      throw new Error(`Failed to fetch subscribed users: ${fetchError.message}`);
    }

    // Update token balance for each subscribed user
    const updatePromises = subscribedUsers.map(user => 
      supabase
        .from('users')
        .update({ token_balance: user.token_balance + 1500 })
        .eq('id', user.id)
    );

    await Promise.all(updatePromises);

    console.log(`Updated token balance for ${subscribedUsers.length} users`);

    return NextResponse.json({
      message: `Successfully updated token balance for ${subscribedUsers.length} users`,
      success: true
    });
  } catch (error) {
    console.error('Error in monthly token distribution:', error);
    return NextResponse.json(
      { error: 'Failed to process monthly token distribution' },
      { status: 500 }
    );
  }
}