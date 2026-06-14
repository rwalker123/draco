import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StatsEntryService } from '../statsEntryService.js';
import { TeamService } from '../teamService.js';
import {
  IRosterRepository,
  IStatsEntryRepository,
  dbGameBattingStat,
  dbRosterSeason,
  dbStatsEntryGame,
} from '../../repositories/index.js';
import { partialMock } from '../../test-utils/partialMock.js';

const accountId = 30n;
const seasonId = 20n;
const teamSeasonId = 10n;
const gameId = 5n;
const leagueSeasonId = 40n;

const makeMember = (overrides: Partial<dbRosterSeason>): dbRosterSeason =>
  partialMock<dbRosterSeason>({
    id: 0n,
    playerid: 0n,
    teamseasonid: teamSeasonId,
    playernumber: '',
    inactive: false,
    substitute: false,
    roster: partialMock<dbRosterSeason['roster']>({
      contacts: partialMock<dbRosterSeason['roster']['contacts']>({
        id: 0n,
        firstname: 'First',
        lastname: 'Last',
      }),
    }),
    ...overrides,
  });

const activeMember = makeMember({ id: 100n, playerid: 1n, inactive: false, substitute: false });
const substituteMember = makeMember({ id: 200n, playerid: 2n, inactive: true, substitute: true });
const releasedMember = makeMember({ id: 300n, playerid: 3n, inactive: true, substitute: false });

describe('StatsEntryService guest (substitute) handling', () => {
  let statsRepo: IStatsEntryRepository;
  let rosterRepo: IRosterRepository;
  let teamService: TeamService;
  let service: StatsEntryService;
  let createGameBattingStat: ReturnType<
    typeof vi.fn<IStatsEntryRepository['createGameBattingStat']>
  >;

  beforeEach(() => {
    createGameBattingStat = vi.fn<IStatsEntryRepository['createGameBattingStat']>();
    createGameBattingStat.mockResolvedValue(
      partialMock<dbGameBattingStat>({ id: 999n, playerid: 200n, rosterseason: substituteMember }),
    );

    statsRepo = partialMock<IStatsEntryRepository>({
      findTeamGame: vi.fn().mockResolvedValue(partialMock<dbStatsEntryGame>({ id: gameId })),
      listGameBattingStats: vi.fn().mockResolvedValue([]),
      addAttendance: vi.fn().mockResolvedValue(undefined),
      createGameBattingStat,
    });

    rosterRepo = partialMock<IRosterRepository>({
      findRosterMembersByTeamSeason: vi
        .fn()
        .mockResolvedValue([activeMember, substituteMember, releasedMember]),
    });

    teamService = partialMock<TeamService>({
      validateTeamSeasonBasic: vi
        .fn()
        .mockResolvedValue(partialMock({ leagueseason: { id: leagueSeasonId } })),
    });

    service = new StatsEntryService(statsRepo, rosterRepo, teamService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes active and substitute players in availablePlayers but excludes released players', async () => {
    const result = await service.getGameBattingStats(accountId, seasonId, teamSeasonId, gameId);

    const ids = result.availablePlayers.map((player) => player.rosterSeasonId);
    expect(ids).toContain('100');
    expect(ids).toContain('200');
    expect(ids).not.toContain('300');

    const guest = result.availablePlayers.find((player) => player.rosterSeasonId === '200');
    expect(guest?.isSubstitute).toBe(true);
  });

  it('allows creating a batting stat for a substitute roster member', async () => {
    await service.createGameBattingStat(accountId, seasonId, teamSeasonId, gameId, {
      rosterSeasonId: '200',
      ab: 0,
      h: 0,
      r: 0,
      d: 0,
      t: 0,
      hr: 0,
      rbi: 0,
      so: 0,
      bb: 0,
      hbp: 0,
      sb: 0,
      cs: 0,
      sf: 0,
      sh: 0,
      re: 0,
      intr: 0,
      lob: 0,
    });

    expect(createGameBattingStat).toHaveBeenCalledWith(
      gameId,
      teamSeasonId,
      200n,
      expect.any(Object),
    );
  });

  it('rejects creating a batting stat for a released (non-substitute) roster member', async () => {
    await expect(
      service.createGameBattingStat(accountId, seasonId, teamSeasonId, gameId, {
        rosterSeasonId: '300',
        ab: 0,
        h: 0,
        r: 0,
        d: 0,
        t: 0,
        hr: 0,
        rbi: 0,
        so: 0,
        bb: 0,
        hbp: 0,
        sb: 0,
        cs: 0,
        sf: 0,
        sh: 0,
        re: 0,
        intr: 0,
        lob: 0,
      }),
    ).rejects.toThrow('not found on team roster');
  });
});
