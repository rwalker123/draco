import type { PublicTeamRosterResponse } from '@draco/shared-api-client';

export interface ShapedRosterMember {
  name: string;
  first_name: string | null;
  last_name: string | null;
  jersey_number: number | null;
  games_played: number | null;
}

export interface ShapedRoster {
  summary: string;
  team_season_id: string;
  team_name: string;
  count: number;
  members: ShapedRosterMember[];
}

export function shapeRoster(roster: PublicTeamRosterResponse): ShapedRoster {
  const { teamSeason, rosterMembers } = roster;

  if (rosterMembers.length === 0) {
    return {
      summary: `No roster members found for ${teamSeason.name}.`,
      team_season_id: teamSeason.id,
      team_name: teamSeason.name,
      count: 0,
      members: [],
    };
  }

  const toJerseyInt = (n: string | null | undefined): number => {
    if (n == null || n === '') return Number.POSITIVE_INFINITY;
    const parsed = parseInt(n, 10);
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
  };

  const sorted = [...rosterMembers].sort((a, b) => {
    const numA = toJerseyInt(a.playerNumber);
    const numB = toJerseyInt(b.playerNumber);
    if (numA !== numB) return numA - numB;
    const nameA = `${a.lastName ?? ''} ${a.firstName ?? ''}`.trim();
    const nameB = `${b.lastName ?? ''} ${b.firstName ?? ''}`.trim();
    return nameA.localeCompare(nameB);
  });

  const members: ShapedRosterMember[] = sorted.map((m) => {
    const jersey = toJerseyInt(m.playerNumber);
    return {
      name: [m.firstName, m.lastName].filter(Boolean).join(' ') || 'Unknown',
      first_name: m.firstName ?? null,
      last_name: m.lastName ?? null,
      jersey_number: Number.isFinite(jersey) ? jersey : null,
      games_played: m.gamesPlayed ?? null,
    };
  });

  return {
    summary: `Roster for ${teamSeason.name} (${members.length} player${members.length === 1 ? '' : 's'}).`,
    team_season_id: teamSeason.id,
    team_name: teamSeason.name,
    count: members.length,
    members,
  };
}
