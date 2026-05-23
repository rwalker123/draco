import type { TeamManager } from '@draco/shared-api-client';

export interface ShapedManager {
  manager_id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
}

export interface ShapedManagersResult {
  summary: string;
  team_name: string | null;
  count: number;
  managers: ShapedManager[];
}

export function shapeManagers(managers: TeamManager[], teamName?: string): ShapedManagersResult {
  const teamLabel = teamName ?? null;

  if (managers.length === 0) {
    return {
      summary: teamName ? `No managers found for ${teamName}.` : 'No managers found for this team.',
      team_name: teamLabel,
      count: 0,
      managers: [],
    };
  }

  const shaped: ShapedManager[] = managers.map((m) => ({
    manager_id: m.id,
    name: [m.contact.firstName, m.contact.lastName].filter(Boolean).join(' ') || 'Unknown',
    first_name: m.contact.firstName ?? null,
    last_name: m.contact.lastName ?? null,
  }));

  return {
    summary: teamName
      ? `${shaped.length} manager${shaped.length === 1 ? '' : 's'} for ${teamName}.`
      : `${shaped.length} team manager${shaped.length === 1 ? '' : 's'}.`,
    team_name: teamLabel,
    count: shaped.length,
    managers: shaped,
  };
}
