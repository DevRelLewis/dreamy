// tokenSystem.ts
import { supabase } from '../../supabase/supabaseClient';
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
    throw new Error(`Token transaction failed: ${error.message}`);
  }

  return data === true;
}
