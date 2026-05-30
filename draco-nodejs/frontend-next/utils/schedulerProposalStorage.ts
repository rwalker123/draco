import type { SchedulerGameRequest, SchedulerSolveResult } from '@draco/shared-schemas';

export interface PersistedSchedulerProposal {
  proposal: SchedulerSolveResult;
  proposalFromGenerated: boolean;
  generatedMatchups: SchedulerGameRequest[] | null;
  selectedGameIds: string[];
}

const buildProposalStorageKey = (accountId: string, seasonId: string): string =>
  `scheduler:proposal:${accountId}:${seasonId}`;

export const loadPersistedProposal = (
  accountId: string,
  seasonId: string,
): PersistedSchedulerProposal | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(buildProposalStorageKey(accountId, seasonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSchedulerProposal;
    if (!parsed || !parsed.proposal || !Array.isArray(parsed.proposal.assignments)) {
      return null;
    }
    return {
      proposal: parsed.proposal,
      proposalFromGenerated: parsed.proposalFromGenerated === true,
      generatedMatchups: Array.isArray(parsed.generatedMatchups) ? parsed.generatedMatchups : null,
      selectedGameIds: Array.isArray(parsed.selectedGameIds) ? parsed.selectedGameIds : [],
    };
  } catch {
    return null;
  }
};

export const savePersistedProposal = (
  accountId: string,
  seasonId: string,
  data: PersistedSchedulerProposal,
): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(buildProposalStorageKey(accountId, seasonId), JSON.stringify(data));
  } catch {}
};

export const clearPersistedProposal = (accountId: string, seasonId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(buildProposalStorageKey(accountId, seasonId));
  } catch {}
};
