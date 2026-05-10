import type { TeamManager } from '@draco/shared-api-client';

export function shapeManagersText(managers: TeamManager[], teamName?: string): string {
  if (managers.length === 0) {
    return teamName ? `No managers found for ${teamName}.` : 'No managers found for this team.';
  }

  const lines = managers.map((m) => {
    const name = [m.contact.firstName, m.contact.lastName].filter(Boolean).join(' ');
    return `- ${name}`;
  });

  const header = teamName ? `Managers for ${teamName}:` : 'Team managers:';
  return `${header}\n${lines.join('\n')}`;
}
