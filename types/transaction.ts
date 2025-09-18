export type TransactionType = 'eth' | 'erc20';
export type TransactionStatus = 'pending' | 'executed' | 'expired';

export interface Transaction {
  id: number;
  toAddress: string;
  txType: TransactionType;
  value: string;
  data: string;
  nonce: number;
  deadline: number;
  erc20Contract: string | null;
  erc20Amount: string | null;
  erc20Symbol: string | null;
  erc20Decimals: number | null;
  status: TransactionStatus;
  createdAt: string;
  txHash: string;
  signatureCount: number;
  currentStatus?: TransactionStatus;
}
