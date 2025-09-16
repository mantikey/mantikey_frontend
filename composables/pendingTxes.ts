// composables/usePendingTxes.ts
import type { PendingTransaction } from '../types/pending_tx';
import { useRuntimeConfig } from '#app';
import { TransactionSignaturesResponse } from '../types/signed_sigs';

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
 * Fetch a paginated list of pending transactions.
 */
export async function fetchPendingTxes(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<PendingTransaction>> {
  const config = useRuntimeConfig();
  const backendURI = config.public.backendURI;

  return await $fetch<PaginatedResponse<PendingTransaction>>(
    `${backendURI}/pending_txes`,
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

  return await $fetch<TransactionSignaturesResponse>(`${backendURI}/sigs`, {
    method: 'GET',
    query: { txID },
  });
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
    `${backendURI}/tx`,
    {
      method: 'PUT',
      body: {
        txID,
        hash,
      },
    }
  );
}
