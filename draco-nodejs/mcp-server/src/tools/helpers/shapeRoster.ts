import type { PublicTeamRosterResponse } from '@draco/shared-api-client';

export function shapeRosterText(roster: PublicTeamRosterResponse): string {
  const { teamSeason, rosterMembers } = roster;

  if (rosterMembers.length === 0) {
    return `No roster members found for ${teamSeason.name}.`;
  }

  const sorted = [...rosterMembers].sort((a, b) => {
    const numA = a.playerNumber ?? Infinity;
    const numB = b.playerNumber ?? Infinity;
    if (numA !== numB) return numA - numB;
    const nameA = `${a.lastName ?? ''} ${a.firstName ?? ''}`.trim();
    const nameB = `${b.lastName ?? ''} ${b.firstName ?? ''}`.trim();
    return nameA.localeCompare(nameB);
  });

  const lines = sorted.map((m) => {
    const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || 'Unknown';
    const num = m.playerNumber != null ? `#${m.playerNumber}` : '--';
    return `${num.padEnd(5)} ${name}`;
  });

  return `Roster for ${teamSeason.name} (${rosterMembers.length} player${rosterMembers.length === 1 ? '' : 's'}):\n\n#     Name\n${'-'.repeat(30)}\n${lines.join('\n')}`;
}
