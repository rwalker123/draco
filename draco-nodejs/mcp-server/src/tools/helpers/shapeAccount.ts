import type { Account } from '@draco/shared-api-client';

export function shapeAccountsText(accounts: Account[]): string {
  if (accounts.length === 0) {
    return "You don't belong to any Draco accounts.";
  }

  const lines = accounts.map((a) => {
    const type = a.configuration?.accountType?.name;
    return type ? `- "${a.name}" (${type})` : `- "${a.name}"`;
  });

  return `You belong to ${accounts.length} Draco account${accounts.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}
