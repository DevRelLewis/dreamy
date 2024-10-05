// app/api/process-query/route.ts
import { NextResponse } from 'next/server';
import { processTokenTransaction } from '@/components/token system/TokenSystem';
import { hasEnoughTokens } from '@/components/utils/token utils/TokenUtility';
import { createClient } from '@supabase/supabase-js';
import { User } from '@/components/utils/token utils/types';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  const { userId, query } = await request.json();

  // Fetch user from database
  const { data: user, error } = await supabase
    .from('users')
    .select('id, token_balance')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return NextResponse.json(false, { status: 404 });
  }

  if (!hasEnoughTokens(user as User, query)) {
    return NextResponse.json(false, { status: 402 });
  }

  const success = await processTokenTransaction(userId, query);

  return NextResponse.json(success);
}