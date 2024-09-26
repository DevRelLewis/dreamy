// pages/api/process-query.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { processTokenTransaction } from '../../../components/token system/TokenSystem';
import { hasEnoughTokens } from '../../../components/utils/token utils/TokenUtility';
import { supabase } from '@/supabase/supabaseClient';
import { User } from '../../../components/utils/token utils/types';  // Make sure to import the User type

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(false);
  }

  const { userId, query } = req.body;

  // Fetch user from database
  const { data: user, error } = await supabase
    .from('users')
    .select('id, token_balance')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return res.status(404).json(false);
  }

  if (!hasEnoughTokens(user as User, query)) {
    return res.status(402).json(false);
  }

  const success = await processTokenTransaction(userId, query);

  return res.status(200).json(success);
}