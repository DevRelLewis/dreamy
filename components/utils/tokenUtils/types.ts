// types.ts
export interface User {
    id: string;
    token_balance: number;  
  }
  
  export interface TokenTransaction {
    userId: string;
    amount: number;
    timestamp: Date;
  }