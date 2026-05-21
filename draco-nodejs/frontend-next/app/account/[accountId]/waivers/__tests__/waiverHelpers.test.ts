import { getLeagueNoWaiverMembers, getTeamNoWaiverMembers } from '../WaiversClient';
import type { WaiverMember } from '../useLeagueWaiverData';

type SeasonTeam = WaiverMember['seasonTeams'][number];
type RosterMember = WaiverMember['rosterMember'];

function makeSeasonTeam(overrides: Partial<SeasonTeam> = {}): SeasonTeam {
  return {
    teamSeasonId: 'team-1',
    teamId: 'team-def-1',
    leagueSeasonId: 'league-1',
    leagueName: 'League A',
    teamName: 'Team 1',
    submittedWaiver: false,
    ...overrides,
  };
}

function makeRosterMember(contactId: string, overrides: Partial<RosterMember> = {}): RosterMember {
  return {
    id: `rm-${contactId}`,
    submittedWaiver: false,
    player: {
      id: `player-${contactId}`,
      firstYear: 2024,
      submittedDriversLicense: false,
      contact: {
        id: contactId,
        firstName: 'First',
        lastName: 'Last',
      },
    },
    ...overrides,
  };
}

function makeMember(contactId: string, seasonTeams: SeasonTeam[]): WaiverMember {
  return {
    rosterMember: makeRosterMember(contactId),
    seasonTeams,
  };
}

describe('getTeamNoWaiverMembers', () => {
  it('returns members who have no submitted waiver on any season team', () => {
    const noWaiverMember = makeMember('c1', [makeSeasonTeam({ submittedWaiver: false })]);
    const waiverMember = makeMember('c2', [makeSeasonTeam({ submittedWaiver: true })]);

    const result = getTeamNoWaiverMembers([noWaiverMember, waiverMember]);

    expect(result).toHaveLength(1);
    expect(result[0].rosterMember.player.contact.id).toBe('c1');
  });

  it('excludes members who have a waiver on any season team even if not the current team', () => {
    const memberWithWaiverElsewhere = makeMember('c1', [
      makeSeasonTeam({ teamSeasonId: 'team-1', submittedWaiver: false }),
      makeSeasonTeam({ teamSeasonId: 'team-2', submittedWaiver: true }),
    ]);

    const result = getTeamNoWaiverMembers([memberWithWaiverElsewhere]);

    expect(result).toHaveLength(0);
  });

  it('returns empty array when all members have waivers', () => {
    const members = [
      makeMember('c1', [makeSeasonTeam({ submittedWaiver: true })]),
      makeMember('c2', [makeSeasonTeam({ submittedWaiver: true })]),
    ];

    expect(getTeamNoWaiverMembers(members)).toHaveLength(0);
  });

  it('returns all members when none have waivers', () => {
    const members = [
      makeMember('c1', [makeSeasonTeam({ submittedWaiver: false })]),
      makeMember('c2', [makeSeasonTeam({ submittedWaiver: false })]),
    ];

    expect(getTeamNoWaiverMembers(members)).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(getTeamNoWaiverMembers([])).toHaveLength(0);
  });
});

describe('getLeagueNoWaiverMembers', () => {
  it('returns deduplicated members with no waiver anywhere', () => {
    const noWaiverMember = makeMember('c1', [makeSeasonTeam({ submittedWaiver: false })]);
    const waiverMember = makeMember('c2', [makeSeasonTeam({ submittedWaiver: true })]);

    const data = [{ teamSeasonId: 'team-1', members: [noWaiverMember, waiverMember] }];

    const result = getLeagueNoWaiverMembers(data);

    expect(result).toHaveLength(1);
    expect(result[0].rosterMember.player.contact.id).toBe('c1');
  });

  it('deduplicates members who appear on multiple teams', () => {
    const member = makeMember('c1', [makeSeasonTeam({ submittedWaiver: false })]);
    const data = [
      { teamSeasonId: 'team-1', members: [member] },
      { teamSeasonId: 'team-2', members: [member] },
    ];

    const result = getLeagueNoWaiverMembers(data);

    expect(result).toHaveLength(1);
  });

  it('first occurrence wins for deduplication', () => {
    const memberTeam1 = makeMember('c1', [makeSeasonTeam({ submittedWaiver: false })]);
    const memberTeam2 = makeMember('c1', [makeSeasonTeam({ submittedWaiver: true })]);
    const data = [
      { teamSeasonId: 'team-1', members: [memberTeam1] },
      { teamSeasonId: 'team-2', members: [memberTeam2] },
    ];

    const result = getLeagueNoWaiverMembers(data);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(memberTeam1);
  });

  it('excludes member who has waiver on any team', () => {
    const member = makeMember('c1', [
      makeSeasonTeam({ teamSeasonId: 'team-1', submittedWaiver: false }),
      makeSeasonTeam({ teamSeasonId: 'team-2', submittedWaiver: true }),
    ]);
    const data = [{ teamSeasonId: 'team-1', members: [member] }];

    expect(getLeagueNoWaiverMembers(data)).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(getLeagueNoWaiverMembers([])).toHaveLength(0);
  });

  it('handles multiple teams with multiple members correctly', () => {
    const m1 = makeMember('c1', [makeSeasonTeam({ submittedWaiver: false })]);
    const m2 = makeMember('c2', [makeSeasonTeam({ submittedWaiver: true })]);
    const m3 = makeMember('c3', [makeSeasonTeam({ submittedWaiver: false })]);
    const data = [
      { teamSeasonId: 'team-1', members: [m1, m2] },
      { teamSeasonId: 'team-2', members: [m3] },
    ];

    const result = getLeagueNoWaiverMembers(data);
    expect(result).toHaveLength(2);
    const ids = result.map((m) => m.rosterMember.player.contact.id);
    expect(ids).toContain('c1');
    expect(ids).toContain('c3');
  });
});
