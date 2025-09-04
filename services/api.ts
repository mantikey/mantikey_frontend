import type { ApiProposal, Proposal } from '../types/proposal';

const transformApiProposal = (api: ApiProposal): Proposal => ({
  id: Number(api.id),
  proposalType: api.proposalType,
  proposer: api.proposer,
  theSigner: api.theSigner,
  newThreshold: api.newThreshold,
  targetAddress: api.targetAddress,
  status: api.status,
  createdAt: new Date(api.createdAt),
});

export const fetchProposals = async (
  apiBaseURL: string
): Promise<Proposal[]> => {
  const res = await fetch(`${apiBaseURL}/proposals?page=1&limit=10`);
  if (!res.ok) throw new Error(`Failed to fetch proposals: ${res.status}`);
  const json = await res.json();
  return json.data.map(transformApiProposal);
};

export const submitProposal = async (
  apiBaseURL: string,
  payload: unknown
): Promise<void> => {
  const res = await fetch(`${apiBaseURL}/proposal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
};
