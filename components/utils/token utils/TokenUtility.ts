// tokenUtils.ts
import { TOKENS_PER_CHARACTER, MIN_TOKENS_PER_QUERY } from '../../../constants/constants';
import { User } from './types';  // Make sure to import the User type

export function estimateTokenCost(query: string): number {
  const estimatedTokens = Math.ceil(query.length * TOKENS_PER_CHARACTER);
  return Math.max(estimatedTokens, MIN_TOKENS_PER_QUERY);
}

export function hasEnoughTokens(user: User, query: string): boolean {
  const estimatedCost = estimateTokenCost(query);
  return user.token_balance >= estimatedCost;  // Changed from tokenBalance to token_balance
}