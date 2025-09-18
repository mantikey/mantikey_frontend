export interface TransactionSignaturesResponse {
  txId: number;
  signatures: TransactionSignature[];
}

export interface TransactionSignature {
  signer: string; // EOA address of the signer
  signature: string; // EIP-712 signature
  signedAt: string; // ISO date string from backend
}
