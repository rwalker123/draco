import { test as base, getRequiredE2eTestAccountId } from './base-fixtures';
import { ApiHelper, tryCleanup } from '../helpers/api';
import { getJwtToken, BASE_URL } from '../helpers/auth';
import { appendCleanupLog } from '../helpers/cleanupLog';

export type ContactScopedData = {
  accountId: string;
  suffix: string;
  players: Array<{ id: string; firstName: string; lastName: string }>;
  manager: { id: string; firstName: string; lastName: string };
};

async function createContactScopedData(
  baseURL: string,
  workerIndex: number,
): Promise<ContactScopedData> {
  const api = new ApiHelper(baseURL, getJwtToken());
  const accountId = getRequiredE2eTestAccountId();
  const suffix = `${Date.now() % 10_000_000}w${workerIndex}`;

  const playerDefs = [
    { firstName: 'E2E', lastName: `PlrA${suffix}` },
    { firstName: 'E2E', lastName: `PlrB${suffix}` },
    { firstName: 'E2E', lastName: `PlrC${suffix}` },
  ];

  const players: ContactScopedData['players'] = [];
  for (const def of playerDefs) {
    const contact = await api.createAccountContact(accountId, def);
    players.push({ id: contact.id, firstName: contact.firstName, lastName: contact.lastName });
  }

  const mgr = await api.createAccountContact(accountId, {
    firstName: 'E2E',
    lastName: `Mgr${suffix}`,
  });
  const manager = { id: mgr.id, firstName: mgr.firstName, lastName: mgr.lastName };

  return { accountId, suffix, players, manager };
}

async function cleanupContactScopedData(baseURL: string, data: ContactScopedData): Promise<void> {
  const api = new ApiHelper(baseURL, getJwtToken());
  const errors: string[] = [];

  await tryCleanup(errors, () => api.deleteContact(data.accountId, data.manager.id));

  for (const player of [...data.players].reverse()) {
    await tryCleanup(errors, () => api.deleteContact(data.accountId, player.id));
  }

  appendCleanupLog(`contact-scoped ${data.suffix}`, errors);
}

type WorkerFixtures = { contactScoped: ContactScopedData };

export const test = base.extend<object, WorkerFixtures>({
  contactScoped: [
    async ({}, use, workerInfo) => {
      const data = await createContactScopedData(BASE_URL, workerInfo.workerIndex);
      await use(data);
      await cleanupContactScopedData(BASE_URL, data);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
