import type { Account } from '@draco/shared-api-client';

export interface ShapedAccount {
  account_id: string;
  name: string;
  type: string | null;
}

export interface ShapedAccountsResult {
  summary: string;
  accounts: ShapedAccount[];
}

export function shapeAccounts(accounts: Account[]): ShapedAccountsResult {
  if (accounts.length === 0) {
    return { summary: "You don't belong to any ezRecSports accounts.", accounts: [] };
  }

  return {
    summary: `You belong to ${accounts.length} ezRecSports account${accounts.length === 1 ? '' : 's'}.`,
    accounts: accounts.map((a) => ({
      account_id: a.id,
      name: a.name,
      type: a.configuration?.accountType?.name ?? null,
    })),
  };
}
