// tokenSystem.ts
import { supabase } from '../../supabase/supabaseClient';
import { User, TokenTransaction } from '../utils/token utils/types';
import { estimateTokenCost } from '../utils/token utils/TokenUtility';

export async function processTokenTransaction(userId: string, query: string): Promise<boolean> {
  const tokenCost = estimateTokenCost(query);

  // Start a Supabase transaction
  const { data, error } = await supabase.rpc('process_token_transaction', {
    p_user_id: userId,
    p_token_cost: tokenCost
  });

  if (error) {
    console.error('Error processing token transaction:', error);
    return false;
  }

  if (data && data.success) {
    // Transaction successful
    await logTokenTransaction(userId, -tokenCost);
    return true;
  }

  return false;
}

async function logTokenTransaction(userId: string, amount: number): Promise<void> {
  const { error } = await supabase
    .from('token_transactions')
    .insert({ userId, amount, timestamp: new Date() });

  if (error) {
    console.error('Error logging token transaction:', error);
  }
}