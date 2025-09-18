// composables/transactions.ts
import type { Transaction } from '../types/transaction';
import { useRuntimeConfig } from '#app';
import { TransactionSignaturesResponse } from '../types/signature';
import type { TypedDataDomain, TypedDataField } from 'ethers';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Fetch a paginated list of transactions.
 */
export async function fetchTransactions(
  page: number = 1,
  limit: number = 500
): Promise<PaginatedResponse<Transaction>> {
  const config = useRuntimeConfig();
  const backendURI = config.public.backendURI;

  return await $fetch<PaginatedResponse<Transaction>>(
    `${backendURI}/transactions`,
    {
      method: 'GET',
      query: { page, limit },
    }
  );
}

/**
 * Fetch signatures
 */
export async function fetchSignatures(
  txID: number
): Promise<TransactionSignaturesResponse> {
  const config = useRuntimeConfig();
  const backendURI = config.public.backendURI;

  return await $fetch<TransactionSignaturesResponse>(
    `${backendURI}/signatures`,
    {
      method: 'GET',
      query: { txID },
    }
  );
}

/**
 * Update Tx Status
 */
export async function updateTxStatus(
  txID: string | number,
  hash: string
): Promise<{ message: string; txID: string; txStatus: string }> {
  const config = useRuntimeConfig();
  const backendURI = config.public.backendURI;

  return await $fetch<{ message: string; txID: string; txStatus: string }>(
    `${backendURI}/transaction`,
    {
      method: 'PUT',
      body: {
        txID,
        hash,
      },
    }
  );
}

/**
 * Sign a transaction and submit the signature to backend.
 */
interface SignTransactionParams {
  item: {
    id: string | number;
    nonce: string | number;
    deadline: string | number;
  };
  message: {};
  account: string;
  signature: string;
}

interface SignTransactionResponse {
  dataResponse: any | null;
  error: any | null;
}

export async function recordSignature({
  item,
  message,
  account,
  signature,
}: SignTransactionParams): Promise<SignTransactionResponse> {
  const config = useRuntimeConfig();
  const backendURI = config.public.backendURI;

  const body = {
    pendingTxID: item.id,
    signature,
    message,
    signer: account,
  };

  try {
    const data = await $fetch(`${backendURI}/sign_tx`, {
      method: 'POST',
      body,
    });
    return { dataResponse: data, error: null };
  } catch (err: any) {
    // $fetch puts backend JSON in err.response._data
    const data = err?.response?._data;
    return {
      dataResponse: null,
      error: {
        status: err?.response?.status,
        ...data, // contains { error, message } from backend
      },
    };
  }
}
