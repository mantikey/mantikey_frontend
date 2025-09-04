export interface Transaction {
  id: number;
  to: string;
  value: bigint;
  data: string;
  functionName?: string;
  txHash: string;
  signatures: number;
  threshold: number;
  status: 'pending' | 'executed' | 'rejected';
  createdAt: Date;
}
