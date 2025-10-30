import {
  CreateGameBattingStatType,
  CreateGamePitchingStatType,
  GameAttendanceType,
  GameBattingStatLineType,
  GameBattingStatsType,
  GameBattingTotalsType,
  GamePitchingStatLineType,
  GamePitchingStatsType,
  GamePitchingTotalsType,
  TeamCompletedGameType,
  TeamStatsPlayerSummaryType,
  UpdateGameBattingStatType,
  UpdateGamePitchingStatType,
  UpdateGameAttendanceType,
} from '@draco/shared-schemas';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import {
  BattingStatValues,
  IStatsEntryRepository,
  PitchingStatValues,
} from '../repositories/interfaces/IStatsEntryRepository.js';
import { IRosterRepository } from '../repositories/interfaces/IRosterRepository.js';
import {
  dbGameBattingStat,
  dbGamePitchingStat,
  dbRosterSeason,
  dbStatsEntryGame,
} from '../repositories/types/dbTypes.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import type { TeamService } from './teamService.js';
import {
  calculateBattingDerived,
  calculatePitchingDerived,
  convertPitchingInput,
  validateBattingValues,
  validatePitchingInput,
} from './utils/statsEntryValidators.js';

const formatName = (first?: string | null, last?: string | null): string => {
  const trimmedFirst = first?.trim() ?? '';
  const trimmedLast = last?.trim() ?? '';
  const combined = `${trimmedFirst} ${trimmedLast}`.trim();
  return combined.length > 0 ? combined : 'Unknown Player';
};

const PITCHING_RESULT_LABELS = {
  w: 'W',
  l: 'L',
  s: 'S',
} as const;

type PitchingOutcomeRow = {
  playerName: string;
  w: number;
  l: number;
  s: number;
};

const sumPitchingValues = (
  acc: PitchingStatValues,
  current: PitchingStatValues,
): PitchingStatValues => {
  const outs = acc.ip * 3 + acc.ip2 + current.ip * 3 + current.ip2;
  return {
    ip: Math.floor(outs / 3),
    ip2: outs % 3,
    bf: acc.bf + current.bf,
    w: acc.w + current.w,
    l: acc.l + current.l,
    s: acc.s + current.s,
    h: acc.h + current.h,
    r: acc.r + current.r,
    er: acc.er + current.er,
    d: acc.d + current.d,
    t: acc.t + current.t,
    hr: acc.hr + current.hr,
    so: acc.so + current.so,
    bb: acc.bb + current.bb,
    wp: acc.wp + current.wp,
    hbp: acc.hbp + current.hbp,
    bk: acc.bk + current.bk,
    sc: acc.sc + current.sc,
  };
};

export class StatsEntryService {
  private readonly statsEntryRepository: IStatsEntryRepository;
  private readonly rosterRepository: IRosterRepository;
  private readonly teamService: TeamService;

  constructor(
    statsEntryRepository: IStatsEntryRepository = RepositoryFactory.getStatsEntryRepository(),
    rosterRepository: IRosterRepository = RepositoryFactory.getRosterRepository(),
    teamService: TeamService,
  ) {
    if (!teamService) {
      throw new Error('StatsEntryService requires a TeamService instance');
    }

    this.statsEntryRepository = statsEntryRepository;
    this.rosterRepository = rosterRepository;
    this.teamService = teamService;
  }

  async listCompletedGames(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
  ): Promise<TeamCompletedGameType[]> {
    const { leagueseason } = await this.teamService.validateTeamSeasonBasic(
      teamSeasonId,
      seasonId,
      accountId,
    );

    if (!leagueseason) {
      throw new NotFoundError('League season not found for team.');
    }

    const games = await this.statsEntryRepository.listCompletedGames(teamSeasonId, leagueseason.id);

    return games.map((game) => this.mapCompletedGame(game, teamSeasonId));
  }

  async getGameBattingStats(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
  ): Promise<GameBattingStatsType> {
    const leagueSeasonId = await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const game = await this.statsEntryRepository.findTeamGame(gameId, teamSeasonId, leagueSeasonId);
    if (!game) {
      throw new NotFoundError('Game not found.');
    }

    const [statsRows, rosterMembers] = await Promise.all([
      this.statsEntryRepository.listGameBattingStats(gameId, teamSeasonId),
      this.rosterRepository.findRosterMembersByTeamSeason(teamSeasonId),
    ]);

    const stats = statsRows.map((row) => this.mapBattingStatRow(row));
    const totals = this.calculateBattingTotals(stats);
    const usedRosterIds = new Set(statsRows.map((row) => row.playerid.toString()));

    const availablePlayers = rosterMembers
      .filter((member) => !member.inactive && !usedRosterIds.has(member.id.toString()))
      .map((member) => this.mapPlayerSummary(member));

    return {
      gameId: gameId.toString(),
      teamSeasonId: teamSeasonId.toString(),
      stats,
      totals,
      availablePlayers,
    };
  }

  async createGameBattingStat(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
    payload: CreateGameBattingStatType,
  ): Promise<GameBattingStatLineType> {
    await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const rosterMember = await this.ensureRosterMember(
      teamSeasonId,
      BigInt(payload.rosterSeasonId),
    );

    const battingValues: BattingStatValues = {
      ab: payload.ab,
      h: payload.h,
      r: payload.r,
      d: payload.d,
      t: payload.t,
      hr: payload.hr,
      rbi: payload.rbi,
      so: payload.so,
      bb: payload.bb,
      hbp: payload.hbp,
      sb: payload.sb,
      cs: payload.cs,
      sf: payload.sf,
      sh: payload.sh,
      re: payload.re,
      intr: payload.intr,
      lob: payload.lob,
    };

    validateBattingValues(battingValues);

    try {
      const stat = await this.statsEntryRepository.createGameBattingStat(
        gameId,
        teamSeasonId,
        rosterMember.id,
        battingValues,
      );
      await this.statsEntryRepository.addAttendance(gameId, teamSeasonId, rosterMember.id);
      return this.mapBattingStatRow(stat);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictError('Player already has batting stats for this game.');
      }
      throw error;
    }
  }

  async updateGameBattingStat(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
    statId: bigint,
    payload: UpdateGameBattingStatType,
  ): Promise<GameBattingStatLineType> {
    await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const existing = await this.statsEntryRepository.findBattingStatById(statId);

    if (!existing || existing.gameid !== gameId || existing.teamid !== teamSeasonId) {
      throw new NotFoundError('Batting stat not found for this team and game.');
    }

    const battingValues: BattingStatValues = {
      ab: payload.ab,
      h: payload.h,
      r: payload.r,
      d: payload.d,
      t: payload.t,
      hr: payload.hr,
      rbi: payload.rbi,
      so: payload.so,
      bb: payload.bb,
      hbp: payload.hbp,
      sb: payload.sb,
      cs: payload.cs,
      sf: payload.sf,
      sh: payload.sh,
      re: payload.re,
      intr: payload.intr,
      lob: payload.lob,
    };

    validateBattingValues(battingValues);

    const stat = await this.statsEntryRepository.updateGameBattingStat(statId, battingValues);
    return this.mapBattingStatRow(stat);
  }

  async deleteGameBattingStat(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
    statId: bigint,
  ): Promise<void> {
    await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const existing = await this.statsEntryRepository.findBattingStatById(statId);
    if (!existing || existing.gameid !== gameId || existing.teamid !== teamSeasonId) {
      throw new NotFoundError('Batting stat not found for this team and game.');
    }

    await this.statsEntryRepository.deleteGameBattingStat(statId);
  }

  async getGamePitchingStats(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
  ): Promise<GamePitchingStatsType> {
    const leagueSeasonId = await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const game = await this.statsEntryRepository.findTeamGame(gameId, teamSeasonId, leagueSeasonId);
    if (!game) {
      throw new NotFoundError('Game not found.');
    }

    const [statsRows, rosterMembers] = await Promise.all([
      this.statsEntryRepository.listGamePitchingStats(gameId, teamSeasonId),
      this.rosterRepository.findRosterMembersByTeamSeason(teamSeasonId),
    ]);

    const stats = statsRows.map((row) => this.mapPitchingStatRow(row));

    const totals = this.calculatePitchingTotals(stats);

    const usedRosterIds = new Set(statsRows.map((row) => row.playerid.toString()));
    const availablePlayers = rosterMembers
      .filter((member) => !member.inactive && !usedRosterIds.has(member.id.toString()))
      .map((member) => this.mapPlayerSummary(member));

    return {
      gameId: gameId.toString(),
      teamSeasonId: teamSeasonId.toString(),
      stats,
      totals,
      availablePlayers,
    };
  }

  async createGamePitchingStat(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
    payload: CreateGamePitchingStatType,
  ): Promise<GamePitchingStatLineType> {
    const leagueSeasonId = await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const rosterMember = await this.ensureRosterMember(
      teamSeasonId,
      BigInt(payload.rosterSeasonId),
    );

    validatePitchingInput(payload);
    const pitchingValues = convertPitchingInput(payload);

    const playerName = formatName(
      rosterMember.roster?.contacts?.firstname,
      rosterMember.roster?.contacts?.lastname,
    );

    await this.enforcePitchingOutcomeConstraints({
      teamSeasonId,
      gameId,
      leagueSeasonId,
      candidate: {
        playerName,
        w: pitchingValues.w,
        l: pitchingValues.l,
        s: pitchingValues.s,
      },
    });

    try {
      const stat = await this.statsEntryRepository.createGamePitchingStat(
        gameId,
        teamSeasonId,
        rosterMember.id,
        pitchingValues,
      );
      await this.statsEntryRepository.addAttendance(gameId, teamSeasonId, rosterMember.id);
      return this.mapPitchingStatRow(stat);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictError('Player already has pitching stats for this game.');
      }
      throw error;
    }
  }

  async updateGamePitchingStat(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
    statId: bigint,
    payload: UpdateGamePitchingStatType,
  ): Promise<GamePitchingStatLineType> {
    const leagueSeasonId = await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const existing = await this.statsEntryRepository.findPitchingStatById(statId);

    if (!existing || existing.gameid !== gameId || existing.teamid !== teamSeasonId) {
      throw new NotFoundError('Pitching stat not found for this team and game.');
    }

    validatePitchingInput(payload);
    const pitchingValues = convertPitchingInput(payload);

    const playerName = formatName(
      existing.rosterseason?.roster?.contacts?.firstname,
      existing.rosterseason?.roster?.contacts?.lastname,
    );

    await this.enforcePitchingOutcomeConstraints({
      teamSeasonId,
      gameId,
      leagueSeasonId,
      candidate: {
        statId,
        playerName,
        w: pitchingValues.w,
        l: pitchingValues.l,
        s: pitchingValues.s,
      },
    });

    const stat = await this.statsEntryRepository.updateGamePitchingStat(statId, pitchingValues);
    return this.mapPitchingStatRow(stat);
  }

  async deleteGamePitchingStat(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
    statId: bigint,
  ): Promise<void> {
    await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const existing = await this.statsEntryRepository.findPitchingStatById(statId);
    if (!existing || existing.gameid !== gameId || existing.teamid !== teamSeasonId) {
      throw new NotFoundError('Pitching stat not found for this team and game.');
    }

    await this.statsEntryRepository.deleteGamePitchingStat(statId);
  }

  async getGameAttendance(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
  ): Promise<GameAttendanceType> {
    await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const attendance = await this.statsEntryRepository.listAttendance(gameId, teamSeasonId);

    return {
      playerIds: attendance.map((entry) => entry.playerid.toString()),
    };
  }

  async updateGameAttendance(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
    payload: UpdateGameAttendanceType,
  ): Promise<GameAttendanceType> {
    await this.ensureGameForTeam(accountId, seasonId, teamSeasonId, gameId);
    const rosterMembers = await this.rosterRepository.findRosterMembersByTeamSeason(teamSeasonId);
    const memberLookup = new Set(
      rosterMembers.filter((member) => !member.inactive).map((member) => member.id.toString()),
    );

    if (!memberLookup.has(payload.rosterSeasonId)) {
      throw new ValidationError('Player does not belong to this team roster.');
    }

    const playerId = BigInt(payload.rosterSeasonId);

    if (payload.present) {
      await this.statsEntryRepository.addAttendance(gameId, teamSeasonId, playerId);
    } else {
      await this.statsEntryRepository.removeAttendance(gameId, teamSeasonId, playerId);
    }

    const updated = await this.statsEntryRepository.listAttendance(gameId, teamSeasonId);

    return {
      playerIds: updated.map((entry) => entry.playerid.toString()),
    };
  }

  private async ensureGameForTeam(
    accountId: bigint,
    seasonId: bigint,
    teamSeasonId: bigint,
    gameId: bigint,
  ): Promise<bigint> {
    const { leagueseason } = await this.teamService.validateTeamSeasonBasic(
      teamSeasonId,
      seasonId,
      accountId,
    );

    if (!leagueseason) {
      throw new NotFoundError('League season not found for team.');
    }

    const game = await this.statsEntryRepository.findTeamGame(
      gameId,
      teamSeasonId,
      leagueseason.id,
    );
    if (!game) {
      throw new NotFoundError('Game not found for this team in the specified season.');
    }

    return leagueseason.id;
  }

  private async ensureRosterMember(
    teamSeasonId: bigint,
    rosterSeasonId: bigint,
  ): Promise<dbRosterSeason> {
    const members = await this.rosterRepository.findRosterMembersByTeamSeason(teamSeasonId);
    const member = members.find((m) => m.id === rosterSeasonId && !m.inactive);
    if (!member) {
      throw new NotFoundError('Player not found on team roster.');
    }
    return member;
  }

  private mapCompletedGame(game: dbStatsEntryGame, teamSeasonId: bigint): TeamCompletedGameType {
    const isHome = game.hteamid === teamSeasonId;
    const opponent = isHome ? game.visitingteam : game.hometeam;

    return {
      gameId: game.id.toString(),
      gameDate: game.gamedate.toISOString(),
      opponentTeamName: opponent?.name ?? 'Unknown Team',
      isHomeTeam: isHome,
      homeScore: game.hscore ?? 0,
      visitorScore: game.vscore ?? 0,
      gameStatus: game.gamestatus ?? 0,
    };
  }

  private mapPlayerSummary(member: dbRosterSeason): TeamStatsPlayerSummaryType {
    const contact = member.roster?.contacts;
    return {
      rosterSeasonId: member.id.toString(),
      playerId: member.playerid.toString(),
      contactId: contact?.id.toString() ?? '0',
      playerName: formatName(contact?.firstname, contact?.lastname),
      playerNumber: member.playernumber ?? null,
      photoUrl: null,
    };
  }

  private mapBattingStatRow(stat: dbGameBattingStat): GameBattingStatLineType {
    const playerContact = stat.rosterseason?.roster?.contacts;

    const values: BattingStatValues = {
      ab: stat.ab,
      h: stat.h,
      r: stat.r,
      d: stat.d,
      t: stat.t,
      hr: stat.hr,
      rbi: stat.rbi,
      so: stat.so,
      bb: stat.bb,
      hbp: stat.hbp,
      sb: stat.sb,
      cs: stat.cs,
      sf: stat.sf,
      sh: stat.sh,
      re: stat.re,
      intr: stat.intr,
      lob: stat.lob,
    };

    const derived = calculateBattingDerived(values);

    return {
      statId: stat.id.toString(),
      rosterSeasonId: stat.playerid.toString(),
      playerId: stat.rosterseason?.playerid?.toString() ?? '0',
      contactId: playerContact?.id.toString() ?? '0',
      playerName: formatName(playerContact?.firstname, playerContact?.lastname),
      playerNumber: stat.rosterseason?.playernumber ?? null,
      ...values,
      ...derived,
    };
  }

  private calculateBattingTotals(stats: GameBattingStatLineType[]): GameBattingTotalsType {
    const totals = stats.reduce<BattingStatValues>(
      (acc, current) => ({
        ab: acc.ab + current.ab,
        h: acc.h + current.h,
        r: acc.r + current.r,
        d: acc.d + current.d,
        t: acc.t + current.t,
        hr: acc.hr + current.hr,
        rbi: acc.rbi + current.rbi,
        so: acc.so + current.so,
        bb: acc.bb + current.bb,
        hbp: acc.hbp + current.hbp,
        sb: acc.sb + current.sb,
        cs: acc.cs + current.cs,
        sf: acc.sf + current.sf,
        sh: acc.sh + current.sh,
        re: acc.re + current.re,
        intr: acc.intr + current.intr,
        lob: acc.lob + current.lob,
      }),
      {
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
      },
    );

    const derived = calculateBattingDerived(totals);

    return {
      ...totals,
      ...derived,
    };
  }

  private async enforcePitchingOutcomeConstraints({
    teamSeasonId,
    gameId,
    leagueSeasonId,
    candidate,
  }: {
    teamSeasonId: bigint;
    gameId: bigint;
    leagueSeasonId: bigint;
    candidate: { statId?: bigint; playerName: string; w: number; l: number; s: number };
  }): Promise<void> {
    const existingStats = await this.statsEntryRepository.listGamePitchingStats(
      gameId,
      teamSeasonId,
    );
    const candidateStatId = candidate.statId ? candidate.statId.toString() : null;

    const outcomeRows: PitchingOutcomeRow[] = existingStats
      .map((row) => this.mapPitchingStatRow(row))
      .filter((row) => row.statId !== candidateStatId)
      .map((row) => ({
        playerName: row.playerName,
        w: Number(row.w ?? 0),
        l: Number(row.l ?? 0),
        s: Number(row.s ?? 0),
      }));

    outcomeRows.push({
      playerName: candidate.playerName || 'Unknown Player',
      w: Number(candidate.w ?? 0),
      l: Number(candidate.l ?? 0),
      s: Number(candidate.s ?? 0),
    });

    const assignments = {
      w: [] as string[],
      l: [] as string[],
      s: [] as string[],
    };

    outcomeRows.forEach((row) => {
      (['w', 'l', 's'] as const).forEach((field) => {
        const label = PITCHING_RESULT_LABELS[field];
        const value = row[field];

        if (!Number.isFinite(value) || value < 0) {
          throw new ValidationError(
            `${label} must be a non-negative whole number for ${row.playerName}.`,
          );
        }

        if (!Number.isInteger(value)) {
          throw new ValidationError(`${label} must be a whole number for ${row.playerName}.`);
        }

        if (value > 1) {
          throw new ValidationError(`${label} must be 0 or 1 for ${row.playerName}.`);
        }

        if (value === 1) {
          assignments[field].push(row.playerName);
        }
      });

      if (row.w === 1 && row.s === 1) {
        throw new ValidationError(
          `${row.playerName} cannot be credited with both a ${PITCHING_RESULT_LABELS.w} and a ${PITCHING_RESULT_LABELS.s}.`,
        );
      }
    });

    const formatPlayers = (players: string[]): string => players.join(', ');

    if (assignments.w.length > 1) {
      throw new ValidationError(
        `Only one pitcher can be assigned a ${PITCHING_RESULT_LABELS.w}. Currently assigned to ${formatPlayers(assignments.w)}.`,
      );
    }

    if (assignments.l.length > 1) {
      throw new ValidationError(
        `Only one pitcher can be assigned a ${PITCHING_RESULT_LABELS.l}. Currently assigned to ${formatPlayers(assignments.l)}.`,
      );
    }

    if (assignments.s.length > 1) {
      throw new ValidationError(
        `Only one pitcher can be assigned a ${PITCHING_RESULT_LABELS.s}. Currently assigned to ${formatPlayers(assignments.s)}.`,
      );
    }

    const game = await this.statsEntryRepository.findTeamGame(gameId, teamSeasonId, leagueSeasonId);
    if (!game) {
      throw new NotFoundError('Game not found for this team in the specified season.');
    }

    const isHomeTeam = game.hteamid === teamSeasonId;
    const teamScore = isHomeTeam ? (game.hscore ?? 0) : (game.vscore ?? 0);
    const opponentScore = isHomeTeam ? (game.vscore ?? 0) : (game.hscore ?? 0);

    if (teamScore > opponentScore) {
      if (assignments.l.length > 0) {
        throw new ValidationError('Cannot assign a loss to your team in a game they won.');
      }
      // saves allowed when winning (handled above for duplicates)
    } else if (teamScore < opponentScore) {
      if (assignments.w.length > 0) {
        throw new ValidationError('Cannot assign a win to your team in a game they lost.');
      }
      if (assignments.s.length > 0) {
        throw new ValidationError('A save can only be recorded when the team wins.');
      }
    } else {
      if (assignments.w.length > 0 || assignments.l.length > 0) {
        throw new ValidationError('Wins and losses cannot be recorded for a tied game.');
      }
      if (assignments.s.length > 0) {
        throw new ValidationError('A save can only be recorded when the team wins.');
      }
    }
  }

  private mapPitchingStatRow(stat: dbGamePitchingStat): GamePitchingStatLineType {
    const playerContact = stat.rosterseason?.roster?.contacts;

    const values: PitchingStatValues = {
      ip: stat.ip,
      ip2: stat.ip2,
      bf: stat.bf,
      w: stat.w,
      l: stat.l,
      s: stat.s,
      h: stat.h,
      r: stat.r,
      er: stat.er,
      d: stat.d,
      t: stat.t,
      hr: stat.hr,
      so: stat.so,
      bb: stat.bb,
      wp: stat.wp,
      hbp: stat.hbp,
      bk: stat.bk,
      sc: stat.sc,
    };

    const derived = calculatePitchingDerived(values);

    return {
      statId: stat.id.toString(),
      rosterSeasonId: stat.playerid.toString(),
      playerId: stat.rosterseason?.playerid?.toString() ?? '0',
      contactId: playerContact?.id.toString() ?? '0',
      playerName: formatName(playerContact?.firstname, playerContact?.lastname),
      playerNumber: stat.rosterseason?.playernumber ?? null,
      ipDecimal: derived.ipDecimal,
      ...values,
      era: derived.era,
      whip: derived.whip,
      k9: derived.k9,
      bb9: derived.bb9,
      oba: derived.oba,
      slg: derived.slg,
    };
  }

  private calculatePitchingTotals(stats: GamePitchingStatLineType[]): GamePitchingTotalsType {
    const totals = stats.reduce<PitchingStatValues>(
      (acc, current) =>
        sumPitchingValues(acc, {
          ip: current.ip,
          ip2: current.ip2,
          bf: current.bf,
          w: current.w,
          l: current.l,
          s: current.s,
          h: current.h,
          r: current.r,
          er: current.er,
          d: current.d,
          t: current.t,
          hr: current.hr,
          so: current.so,
          bb: current.bb,
          wp: current.wp,
          hbp: current.hbp,
          bk: current.bk,
          sc: current.sc,
        }),
      {
        ip: 0,
        ip2: 0,
        bf: 0,
        w: 0,
        l: 0,
        s: 0,
        h: 0,
        r: 0,
        er: 0,
        d: 0,
        t: 0,
        hr: 0,
        so: 0,
        bb: 0,
        wp: 0,
        hbp: 0,
        bk: 0,
        sc: 0,
      },
    );

    const derived = calculatePitchingDerived(totals);

    return {
      ...totals,
      ipDecimal: derived.ipDecimal,
      era: derived.era,
      whip: derived.whip,
      k9: derived.k9,
      bb9: derived.bb9,
      oba: derived.oba,
      slg: derived.slg,
    };
  }
}
