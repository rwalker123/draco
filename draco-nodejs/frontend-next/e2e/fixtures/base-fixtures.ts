import { test as base } from '@playwright/test';

type DracoFixtures = {
  accountId: string;
};

export const test = base.extend<DracoFixtures>({
  accountId: [process.env.E2E_ACCOUNT_ID || '', { option: true }],
});

export { expect } from '@playwright/test';
