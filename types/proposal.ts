// Backend response type
export interface ApiProposal {
  id: string;
  proposalType: string;
  pause: number | null;
  unpause: number | null;
  targetAddress: string | null;
  theSigner: string | null;
  newThreshold: number | null;
  proposer: string;
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'EXECUTED'
    | 'CANCELLED'
    | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

// Frontend model
export interface Proposal {
  id: number;
  proposalType: string;
  proposer: string;
  theSigner?: string | null;
  newThreshold?: number | null;
  targetAddress?: string | null;
  status: string;
  createdAt: Date;
}
