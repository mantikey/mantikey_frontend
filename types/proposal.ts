// Frontend model
export interface Proposal {
  id: number;
  proposalType: string;
  theSigner?: string | null;
  newThreshold?: number | null;
  targetAddress?: string | null;
  status: string;
  votes: number | null;
  hasVoted: boolean;
  createdAt: Date | null;
  deadline: Date | null;
  executed: boolean;
}
