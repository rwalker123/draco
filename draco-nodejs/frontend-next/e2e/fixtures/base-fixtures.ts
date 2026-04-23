import { test as base } from '@playwright/test';

type DracoFixtures = {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  playerId: string;
};

export const test = base.extend<DracoFixtures>({
  accountId: [process.env.E2E_ACCOUNT_ID || '', { option: true }],
  seasonId: [process.env.E2E_SEASON_ID || '', { option: true }],
  teamSeasonId: [process.env.E2E_TEAM_SEASON_ID || '', { option: true }],
  playerId: [process.env.E2E_PLAYER_ID || '', { option: true }],
});

export function getRequiredE2eTestAccountId(): string {
  const accountId = process.env.E2E_TEST_ACCOUNT_ID;
  if (!accountId || accountId.trim() === '') {
    throw new Error(
      'E2E_TEST_ACCOUNT_ID must be set to a non-empty account id for write-scoped Playwright fixtures.',
    );
  }
  return accountId;
}

export { expect } from '@playwright/test';
