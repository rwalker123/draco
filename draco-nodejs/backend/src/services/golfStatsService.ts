import {
  GolfLeaderType,
  GolfScoringAverageType,
  GolfSkinsEntryType,
  GolfFlightLeadersType,
  GolfLeaderboardType,
  GolfPuttContestEntryType,
  RegenerateStatsResultType,
} from '@draco/shared-schemas';
import { IGolfMatchRepository } from '../repositories/interfaces/IGolfMatchRepository.js';
import { IGolfScoreRepository } from '../repositories/interfaces/IGolfScoreRepository.js';
import { IGolfFlightRepository } from '../repositories/interfaces/IGolfFlightRepository.js';
import { IGolfTeamRepository } from '../repositories/interfaces/IGolfTeamRepository.js';
import { IGolfRosterRepository } from '../repositories/interfaces/IGolfRosterRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { ServiceFactory } from './serviceFactory.js';
import { NotFoundError } from '../utils/customErrors.js';
import { GolfHandicapService } from './golfHandicapService.js';
import { GolfMatchStatus } from '../utils/golfConstants.js';

interface PlayerScoreData {
  contactId: bigint;
  firstName: string;
  lastName: string;
  teamName?: string;
  scores: number[];
  netScores: number[];
  courseHandicaps: number[];
}

interface HoleScoreData {
  contactId: bigint;
  firstName: string;
  lastName: string;
  teamName?: string;
  hole: number;
  score: number;
}

const HOLE_FIELDS = [
  'holescrore1',
  'holescrore2',
  'holescrore3',
  'holescrore4',
  'holescrore5',
  'holescrore6',
  'holescrore7',
  'holescrore8',
  'holescrore9',
  'holescrore10',
  'holescrore11',
  'holescrore12',
  'holescrore13',
  'holescrore14',
  'holescrore15',
  'holescrore16',
  'holescrore17',
  'holescrore18',
] as const;

const MENS_HANDICAP_FIELDS = [
  'menshandicap1',
  'menshandicap2',
  'menshandicap3',
  'menshandicap4',
  'menshandicap5',
  'menshandicap6',
  'menshandicap7',
  'menshandicap8',
  'menshandicap9',
  'menshandicap10',
  'menshandicap11',
  'menshandicap12',
  'menshandicap13',
  'menshandicap14',
  'menshandicap15',
  'menshandicap16',
  'menshandicap17',
  'menshandicap18',
] as const;

const PUTTS_FIELDS = [
  'putts1',
  'putts2',
  'putts3',
  'putts4',
  'putts5',
  'putts6',
  'putts7',
  'putts8',
  'putts9',
  'putts10',
  'putts11',
  'putts12',
  'putts13',
  'putts14',
  'putts15',
  'putts16',
  'putts17',
  'putts18',
] as const;

export class GolfStatsService {
  private readonly matchRepository: IGolfMatchRepository;
  private readonly scoreRepository: IGolfScoreRepository;
  private readonly flightRepository: IGolfFlightRepository;
  private readonly teamRepository: IGolfTeamRepository;
  private readonly rosterRepository: IGolfRosterRepository;
  private readonly handicapService: GolfHandicapService;

  constructor() {
    this.matchRepository = RepositoryFactory.getGolfMatchRepository();
    this.scoreRepository = RepositoryFactory.getGolfScoreRepository();
    this.flightRepository = RepositoryFactory.getGolfFlightRepository();
    this.teamRepository = RepositoryFactory.getGolfTeamRepository();
    this.rosterRepository = RepositoryFactory.getGolfRosterRepository();
    this.handicapService = ServiceFactory.getGolfHandicapService();
  }

  async getFlightLeaders(flightId: bigint): Promise<GolfFlightLeadersType> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const playerData = await this.collectPlayerScores(flightId);

    const lowActualScore = this.calculateLowScoreLeaders(playerData, 'actual');
    const lowNetScore = this.calculateLowScoreLeaders(playerData, 'net');
    const scoringAverages = this.calculateScoringAverages(playerData);
    const skins = await this.calculateSkinsLeaders(flightId);
    const netSkins = await this.calculateNetSkinsLeaders(flightId, undefined);

    return {
      flightId: flightId.toString(),
      flightName: flight.league.name,
      lowActualScore,
      lowNetScore,
      scoringAverages,
      skins: skins.length > 0 ? skins : undefined,
      netSkins: netSkins.length > 0 ? netSkins : undefined,
    };
  }

  async getLowScoreLeaders(
    flightId: bigint,
    type: 'actual' | 'net',
    limit = 10,
  ): Promise<GolfLeaderType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const playerData = await this.collectPlayerScores(flightId);
    return this.calculateLowScoreLeaders(playerData, type, limit);
  }

  async getScoringAverages(flightId: bigint, limit = 20): Promise<GolfScoringAverageType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const playerData = await this.collectPlayerScores(flightId);
    return this.calculateScoringAverages(playerData, limit);
  }

  async getSkinsLeaders(flightId: bigint, weekNumber?: number): Promise<GolfSkinsEntryType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    return this.calculateSkinsLeaders(flightId, weekNumber);
  }

  async getScoreTypeLeaders(flightId: bigint): Promise<GolfLeaderboardType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const matches = await this.matchRepository.findByFlightId(flightId);
    const completedMatches = matches.filter((m) => m.matchstatus === GolfMatchStatus.COMPLETED);

    const playerCounts = new Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        teamName?: string;
        aces: number;
        eagles: number;
        birdies: number;
        pars: number;
      }
    >();

    const matchIds = completedMatches.map((m) => m.id);
    const scoresByMatchId = await this.scoreRepository.findByMatchIds(matchIds);

    for (const match of completedMatches) {
      const matchScores = scoresByMatchId.get(match.id) ?? [];

      for (const ms of matchScores) {
        if (ms.golfscore.isabsent) continue;

        const score = ms.golfscore;
        const course = score.golfcourse;
        if (!course) continue;

        const contact = score.golfer.contact;
        const contactIdStr = contact.id.toString();

        if (!playerCounts.has(contactIdStr)) {
          playerCounts.set(contactIdStr, {
            contactId: contact.id,
            firstName: contact.firstname,
            lastName: contact.lastname,
            teamName: ms.teamsseason.name,
            aces: 0,
            eagles: 0,
            birdies: 0,
            pars: 0,
          });
        }

        const counts = playerCounts.get(contactIdStr)!;
        const isFemale = score.golfer.gender === 'F';

        HOLE_FIELDS.forEach((field, index) => {
          const holeScore = score[field] as number;
          if (holeScore <= 0) return;

          const holeNumber = index + 1;
          const parField = isFemale
            ? (`womanspar${holeNumber}` as keyof typeof course)
            : (`menspar${holeNumber}` as keyof typeof course);
          const par = course[parField] as number;
          if (!par || par <= 0) return;

          const diff = holeScore - par;
          if (holeScore === 1) counts.aces++;
          else if (diff <= -2) counts.eagles++;
          else if (diff === -1) counts.birdies++;
          else if (diff === 0) counts.pars++;
        });
      }
    }

    const buildLeaderboard = (
      category: string,
      categoryLabel: string,
      getValue: (p: { aces: number; eagles: number; birdies: number; pars: number }) => number,
    ): GolfLeaderboardType => {
      const sorted = Array.from(playerCounts.values())
        .map((p) => ({ ...p, value: getValue(p) }))
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      let rank = 1;
      let prevValue = -1;
      let prevRank = 1;

      const leaders: GolfLeaderType[] = sorted.map((p, index) => {
        if (p.value !== prevValue) {
          rank = index + 1;
          prevRank = rank;
        } else {
          rank = prevRank;
        }
        prevValue = p.value;

        return {
          contactId: p.contactId.toString(),
          firstName: p.firstName,
          lastName: p.lastName,
          teamName: p.teamName,
          value: p.value,
          rank,
        };
      });

      return { category, categoryLabel, leaders };
    };

    const leaderboards: GolfLeaderboardType[] = [
      buildLeaderboard('eagles', 'Most Eagles', (p) => p.eagles),
      buildLeaderboard('birdies', 'Most Birdies', (p) => p.birdies),
      buildLeaderboard('pars', 'Most Pars', (p) => p.pars),
    ];

    const acesLeaderboard = buildLeaderboard('aces', 'Most Aces', (p) => p.aces);
    if (acesLeaderboard.leaders.length > 0) {
      leaderboards.unshift(acesLeaderboard);
    }

    return leaderboards;
  }

  async getPuttContestResults(
    flightId: bigint,
    filterWeekNumber?: number,
  ): Promise<GolfPuttContestEntryType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    const matches = await this.matchRepository.findByFlightId(flightId);
    const completedMatches = matches.filter((m) => m.matchstatus === GolfMatchStatus.COMPLETED);

    const entries: GolfPuttContestEntryType[] = [];

    const filteredMatches =
      filterWeekNumber !== undefined
        ? completedMatches.filter((m) => m.weeknumber === filterWeekNumber)
        : completedMatches;
    const matchIds = filteredMatches.map((m) => m.id);
    const scoresByMatchId = await this.scoreRepository.findByMatchIds(matchIds);

    for (const match of filteredMatches) {
      const matchScores = scoresByMatchId.get(match.id) ?? [];

      for (const ms of matchScores) {
        if (ms.golfscore.isabsent) continue;

        const score = ms.golfscore;
        const contact = score.golfer.contact;

        PUTTS_FIELDS.forEach((field, index) => {
          const putts = score[field] as number | null;
          if (putts === null || putts === undefined || putts < 3) return;

          entries.push({
            contactId: contact.id.toString(),
            firstName: contact.firstname,
            lastName: contact.lastname,
            holeNumber: index + 1,
            putts,
            matchId: match.id.toString(),
            matchDate: match.matchdate.toISOString(),
            weekNumber: match.weeknumber ?? undefined,
          });
        });
      }
    }

    return entries;
  }

  private async collectPlayerScores(flightId: bigint): Promise<Map<string, PlayerScoreData>> {
    const teams = await this.teamRepository.findByFlightId(flightId);
    const matches = await this.matchRepository.findByFlightId(flightId);
    const completedMatches = matches.filter((m) => m.matchstatus === GolfMatchStatus.COMPLETED);

    const playerDataMap = new Map<string, PlayerScoreData>();

    for (const team of teams) {
      const roster = await this.rosterRepository.findByTeamSeasonId(team.id);

      for (const entry of roster) {
        if (!entry.isactive) continue;

        const golferIdStr = entry.golferid.toString();
        if (!playerDataMap.has(golferIdStr)) {
          playerDataMap.set(golferIdStr, {
            contactId: entry.golfer.contact.id,
            firstName: entry.golfer.contact.firstname,
            lastName: entry.golfer.contact.lastname,
            teamName: team.name,
            scores: [],
            netScores: [],
            courseHandicaps: [],
          });
        }
      }
    }

    const matchIds = completedMatches.map((m) => m.id);
    const scoresByMatchId = await this.scoreRepository.findByMatchIds(matchIds);

    for (const match of completedMatches) {
      const matchScores = scoresByMatchId.get(match.id) ?? [];

      for (const ms of matchScores) {
        if (ms.golfscore.isabsent) continue;

        const golferIdStr = ms.golfscore.golferid.toString();
        const playerData = playerDataMap.get(golferIdStr);

        if (playerData) {
          const score = ms.golfscore.totalscore;
          playerData.scores.push(score);

          const handicapIndex = await this.handicapService.calculateHandicapIndex(
            ms.golfscore.golferid,
          );
          if (handicapIndex !== null) {
            const isFemale = ms.golfscore.golfer.gender === 'F';
            const teeInfo = ms.golfscore.golfteeinformation;
            const courseRating = Number(isFemale ? teeInfo.womansrating : teeInfo.mensrating) || 72;
            const slopeRating = Number(isFemale ? teeInfo.womanslope : teeInfo.menslope) || 113;
            const course = ms.golfscore.golfcourse;
            const par = course
              ? HOLE_FIELDS.map(
                  (_, i) =>
                    (course[
                      (isFemale ? `womanspar${i + 1}` : `menspar${i + 1}`) as keyof typeof course
                    ] as number) || 0,
                ).reduce((a, b) => a + b, 0)
              : 72;

            const courseHandicap = this.handicapService.calculateCourseHandicap(
              handicapIndex,
              slopeRating,
              courseRating,
              par,
            );

            playerData.courseHandicaps.push(courseHandicap.courseHandicap);
            playerData.netScores.push(score - courseHandicap.courseHandicap);
          } else {
            playerData.netScores.push(score);
          }
        }
      }
    }

    return playerDataMap;
  }

  private calculateLowScoreLeaders(
    playerData: Map<string, PlayerScoreData>,
    type: 'actual' | 'net',
    limit = 10,
  ): GolfLeaderType[] {
    const leaders: Array<{
      contactId: bigint;
      firstName: string;
      lastName: string;
      teamName?: string;
      value: number;
    }> = [];

    for (const [, data] of playerData) {
      const scores = type === 'actual' ? data.scores : data.netScores;
      if (scores.length === 0) continue;

      const lowestScore = Math.min(...scores);
      leaders.push({
        contactId: data.contactId,
        firstName: data.firstName,
        lastName: data.lastName,
        teamName: data.teamName,
        value: lowestScore,
      });
    }

    leaders.sort((a, b) => a.value - b.value);

    let rank = 1;
    let prevValue = -1;
    let prevRank = 1;

    return leaders.slice(0, limit).map((leader, index) => {
      if (leader.value !== prevValue) {
        rank = index + 1;
        prevRank = rank;
      } else {
        rank = prevRank;
      }
      prevValue = leader.value;

      return {
        contactId: leader.contactId.toString(),
        firstName: leader.firstName,
        lastName: leader.lastName,
        teamName: leader.teamName,
        value: leader.value,
        rank,
      };
    });
  }

  private calculateScoringAverages(
    playerData: Map<string, PlayerScoreData>,
    limit = 20,
  ): GolfScoringAverageType[] {
    const averages: GolfScoringAverageType[] = [];

    for (const [, data] of playerData) {
      if (data.scores.length === 0) continue;

      const avgScore =
        Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10;
      const avgNetScore =
        data.netScores.length > 0
          ? Math.round((data.netScores.reduce((a, b) => a + b, 0) / data.netScores.length) * 10) /
            10
          : undefined;

      averages.push({
        contactId: data.contactId.toString(),
        firstName: data.firstName,
        lastName: data.lastName,
        teamName: data.teamName,
        roundsPlayed: data.scores.length,
        averageScore: avgScore,
        averageNetScore: avgNetScore,
      });
    }

    averages.sort((a, b) => a.averageScore - b.averageScore);

    return averages.slice(0, limit);
  }

  private async calculateSkinsLeaders(
    flightId: bigint,
    filterWeekNumber?: number,
  ): Promise<GolfSkinsEntryType[]> {
    const matches = await this.matchRepository.findByFlightId(flightId);
    const completedMatches = matches.filter((m) => m.matchstatus === GolfMatchStatus.COMPLETED);

    const matchesByWeek = new Map<number | null, typeof completedMatches>();
    for (const match of completedMatches) {
      const week = match.weeknumber;
      if (!matchesByWeek.has(week)) matchesByWeek.set(week, []);
      matchesByWeek.get(week)!.push(match);
    }

    const skinsMap = new Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        teamName?: string;
        skinsWon: number;
      }
    >();

    for (const [weekKey, weekMatches] of matchesByWeek) {
      if (filterWeekNumber !== undefined && weekKey !== filterWeekNumber) continue;

      const pooledHoleScores: HoleScoreData[] = [];

      for (const match of weekMatches) {
        const matchWithScores = await this.matchRepository.findByIdWithScores(match.id);
        if (!matchWithScores) continue;

        if (weekKey === null) {
          const holeScores = this.collectHoleScores(matchWithScores);
          for (let hole = 1; hole <= 18; hole++) {
            const holeData = holeScores.filter((h) => h.hole === hole);
            if (holeData.length === 0) continue;

            const minScore = Math.min(...holeData.map((h) => h.score));
            const winners = holeData.filter((h) => h.score === minScore);

            if (winners.length === 1) {
              const winner = winners[0];
              const contactIdStr = winner.contactId.toString();

              if (!skinsMap.has(contactIdStr)) {
                skinsMap.set(contactIdStr, {
                  contactId: winner.contactId,
                  firstName: winner.firstName,
                  lastName: winner.lastName,
                  teamName: winner.teamName,
                  skinsWon: 0,
                });
              }

              skinsMap.get(contactIdStr)!.skinsWon++;
            }
          }
        } else {
          pooledHoleScores.push(...this.collectHoleScores(matchWithScores));
        }
      }

      if (weekKey !== null) {
        for (let hole = 1; hole <= 18; hole++) {
          const holeData = pooledHoleScores.filter((h) => h.hole === hole);
          if (holeData.length === 0) continue;

          const minScore = Math.min(...holeData.map((h) => h.score));
          const winners = holeData.filter((h) => h.score === minScore);

          if (winners.length === 1) {
            const winner = winners[0];
            const contactIdStr = winner.contactId.toString();

            if (!skinsMap.has(contactIdStr)) {
              skinsMap.set(contactIdStr, {
                contactId: winner.contactId,
                firstName: winner.firstName,
                lastName: winner.lastName,
                teamName: winner.teamName,
                skinsWon: 0,
              });
            }

            skinsMap.get(contactIdStr)!.skinsWon++;
          }
        }
      }
    }

    return Array.from(skinsMap.values())
      .filter((e) => e.skinsWon > 0)
      .map((e) => ({
        contactId: e.contactId.toString(),
        firstName: e.firstName,
        lastName: e.lastName,
        teamName: e.teamName,
        skinsWon: e.skinsWon,
        skinsType: 'actual' as const,
      }))
      .sort((a, b) => b.skinsWon - a.skinsWon);
  }

  async calculateNetSkinsLeaders(
    flightId: bigint,
    filterWeekNumber?: number,
  ): Promise<GolfSkinsEntryType[]> {
    const matches = await this.matchRepository.findByFlightId(flightId);
    const completedMatches = matches.filter((m) => m.matchstatus === GolfMatchStatus.COMPLETED);

    const matchesByWeek = new Map<number | null, typeof completedMatches>();
    for (const match of completedMatches) {
      const week = match.weeknumber;
      if (!matchesByWeek.has(week)) matchesByWeek.set(week, []);
      matchesByWeek.get(week)!.push(match);
    }

    const skinsMap = new Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        teamName?: string;
        skinsWon: number;
      }
    >();

    for (const [weekKey, weekMatches] of matchesByWeek) {
      if (filterWeekNumber !== undefined && weekKey !== filterWeekNumber) continue;

      if (weekKey === null) {
        for (const match of weekMatches) {
          const matchWithScores = await this.matchRepository.findByIdWithScores(match.id);
          if (!matchWithScores) continue;

          const pool = await this.buildNetScorePool([matchWithScores]);
          this.applyNetSkinsFromPool(pool, skinsMap);
        }
      } else {
        const matchesWithScores = await Promise.all(
          weekMatches.map((m) => this.matchRepository.findByIdWithScores(m.id)),
        );
        const validMatches = matchesWithScores.filter(
          (m): m is NonNullable<typeof m> => m !== null,
        );
        const pool = await this.buildNetScorePool(validMatches);
        this.applyNetSkinsFromPool(pool, skinsMap);
      }
    }

    return Array.from(skinsMap.values())
      .filter((e) => e.skinsWon > 0)
      .map((e) => ({
        contactId: e.contactId.toString(),
        firstName: e.firstName,
        lastName: e.lastName,
        teamName: e.teamName,
        skinsWon: e.skinsWon,
        skinsType: 'net' as const,
      }))
      .sort((a, b) => b.skinsWon - a.skinsWon);
  }

  private async buildNetScorePool(
    matchesWithScores: NonNullable<
      Awaited<ReturnType<IGolfMatchRepository['findByIdWithScores']>>
    >[],
  ): Promise<
    Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        teamName?: string;
        netScores: Map<number, number>;
      }
    >
  > {
    const pool = new Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        teamName?: string;
        netScores: Map<number, number>;
      }
    >();

    for (const matchWithScores of matchesWithScores) {
      const course = matchWithScores.golfcourse;
      const teeInfo = matchWithScores.golfteeinformation;
      if (!course || !teeInfo) continue;

      for (const ms of matchWithScores.golfmatchscores) {
        if (ms.golfscore.isabsent) continue;

        const score = ms.golfscore;
        const contact = ms.golfer.contact;
        const contactIdStr = contact.id.toString();
        const isFemale = ms.golfer.gender === 'F';

        const handicapFields = isFemale
          ? ([
              'womanshandicap1',
              'womanshandicap2',
              'womanshandicap3',
              'womanshandicap4',
              'womanshandicap5',
              'womanshandicap6',
              'womanshandicap7',
              'womanshandicap8',
              'womanshandicap9',
              'womanshandicap10',
              'womanshandicap11',
              'womanshandicap12',
              'womanshandicap13',
              'womanshandicap14',
              'womanshandicap15',
              'womanshandicap16',
              'womanshandicap17',
              'womanshandicap18',
            ] as const)
          : MENS_HANDICAP_FIELDS;

        const holeHandicapIndexes = handicapFields.map(
          (field) => course[field as keyof typeof course] as number,
        );

        const handicapIndex = await this.handicapService.calculateHandicapIndex(score.golferid);

        let courseHandicap = 0;
        if (handicapIndex !== null) {
          const courseRating = Number(isFemale ? teeInfo.womansrating : teeInfo.mensrating) || 72;
          const slopeRating = Number(isFemale ? teeInfo.womanslope : teeInfo.menslope) || 113;
          const par = HOLE_FIELDS.map(
            (_, i) =>
              (course[
                (isFemale ? `womanspar${i + 1}` : `menspar${i + 1}`) as keyof typeof course
              ] as number) || 0,
          ).reduce((a, b) => a + b, 0);
          const result = this.handicapService.calculateCourseHandicap(
            handicapIndex,
            slopeRating,
            courseRating,
            par,
          );
          courseHandicap = result.courseHandicap;
        }

        const strokesPerHole = this.distributeStrokesToHoles(courseHandicap, holeHandicapIndexes);
        const netScores = new Map<number, number>();

        HOLE_FIELDS.forEach((field, index) => {
          const holeScore = score[field as keyof typeof score] as number;
          if (holeScore <= 0) return;
          netScores.set(index + 1, holeScore - strokesPerHole[index]);
        });

        if (!pool.has(contactIdStr)) {
          pool.set(contactIdStr, {
            contactId: contact.id,
            firstName: contact.firstname,
            lastName: contact.lastname,
            teamName: ms.teamsseason.name,
            netScores: new Map(),
          });
        }

        const existing = pool.get(contactIdStr)!;
        for (const [holeNumber, netScore] of netScores) {
          existing.netScores.set(holeNumber, netScore);
        }
      }
    }

    return pool;
  }

  private applyNetSkinsFromPool(
    pool: Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        teamName?: string;
        netScores: Map<number, number>;
      }
    >,
    skinsMap: Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        teamName?: string;
        skinsWon: number;
      }
    >,
  ): void {
    for (let hole = 1; hole <= 18; hole++) {
      const holeEntries: Array<{
        contactId: bigint;
        firstName: string;
        lastName: string;
        teamName?: string;
        netScore: number;
      }> = [];

      for (const [, playerData] of pool) {
        const netScore = playerData.netScores.get(hole);
        if (netScore === undefined) continue;
        holeEntries.push({
          contactId: playerData.contactId,
          firstName: playerData.firstName,
          lastName: playerData.lastName,
          teamName: playerData.teamName,
          netScore,
        });
      }

      if (holeEntries.length === 0) continue;

      const minNetScore = Math.min(...holeEntries.map((e) => e.netScore));
      const winners = holeEntries.filter((e) => e.netScore === minNetScore);

      if (winners.length === 1) {
        const winner = winners[0];
        const contactIdStr = winner.contactId.toString();

        if (!skinsMap.has(contactIdStr)) {
          skinsMap.set(contactIdStr, {
            contactId: winner.contactId,
            firstName: winner.firstName,
            lastName: winner.lastName,
            teamName: winner.teamName,
            skinsWon: 0,
          });
        }

        skinsMap.get(contactIdStr)!.skinsWon++;
      }
    }
  }

  private distributeStrokesToHoles(
    courseHandicap: number,
    holeHandicapIndexes: number[],
  ): number[] {
    const strokes = new Array<number>(18).fill(0);

    if (courseHandicap <= 0) return strokes;

    const absoluteHandicap = Math.abs(courseHandicap);
    const sign = courseHandicap > 0 ? 1 : -1;

    const sortedHoles = holeHandicapIndexes
      .map((hcpIndex, arrayIndex) => ({ hcpIndex, arrayIndex }))
      .sort((a, b) => a.hcpIndex - b.hcpIndex);

    let remaining = absoluteHandicap;
    let round = 0;

    while (remaining > 0) {
      const startPos = round * 18;
      const endPos = Math.min(startPos + 18, startPos + remaining);
      const holesThisRound = sortedHoles.slice(0, endPos - startPos);

      for (const { arrayIndex } of holesThisRound) {
        strokes[arrayIndex] += sign;
        remaining--;
        if (remaining <= 0) break;
      }

      round++;
    }

    return strokes;
  }

  private collectHoleScores(
    match: NonNullable<Awaited<ReturnType<IGolfMatchRepository['findByIdWithScores']>>>,
  ): HoleScoreData[] {
    const holeScores: HoleScoreData[] = [];

    for (const ms of match.golfmatchscores) {
      const score = ms.golfscore;
      const contact = ms.golfer.contact;
      const teamName = ms.teamsseason.name;

      HOLE_FIELDS.forEach((field, index) => {
        const holeScore = score[field as keyof typeof score] as number;
        if (holeScore > 0) {
          holeScores.push({
            contactId: contact.id,
            firstName: contact.firstname,
            lastName: contact.lastname,
            teamName,
            hole: index + 1,
            score: holeScore,
          });
        }
      });
    }

    return holeScores;
  }

  async regenerateStats(
    leagueSeasonId: bigint,
    options: {
      regenerateGir: boolean;
      regenerateWeekNumbers: boolean;
      weekBoundary: string;
      timeZone: string;
      recalculateMatchPoints: boolean;
    },
  ): Promise<RegenerateStatsResultType> {
    const girScoresUpdated = options.regenerateGir
      ? await this.regenerateGirForLeague(leagueSeasonId)
      : 0;

    const weekNumbersAssigned = options.regenerateWeekNumbers
      ? await this.assignWeekNumbers(leagueSeasonId, options.weekBoundary, options.timeZone)
      : 0;

    const matchPointsRecalculated = options.recalculateMatchPoints
      ? await this.recalculateMatchPoints(leagueSeasonId)
      : 0;

    return { girScoresUpdated, weekNumbersAssigned, matchPointsRecalculated };
  }

  private async regenerateGirForLeague(leagueSeasonId: bigint): Promise<number> {
    const matches = await this.matchRepository.findByLeagueSeasonId(leagueSeasonId);
    const completedMatches = matches.filter((m) => m.matchstatus === GolfMatchStatus.COMPLETED);

    let updatedCount = 0;

    const matchIds = completedMatches.map((m) => m.id);
    const scoresByMatchId = await this.scoreRepository.findByMatchIds(matchIds);

    for (const match of completedMatches) {
      const matchScores = scoresByMatchId.get(match.id) ?? [];

      for (const ms of matchScores) {
        const score = ms.golfscore;
        if (score.isabsent) continue;

        const hasPutts = PUTTS_FIELDS.some(
          (f) =>
            score[f as keyof typeof score] !== null && score[f as keyof typeof score] !== undefined,
        );
        if (!hasPutts) continue;

        const course = score.golfcourse;
        const gender = score.golfer?.gender ?? 'M';
        const parPrefix = gender === 'F' ? 'womanspar' : 'menspar';

        const girData: Partial<{
          gir1: boolean | null;
          gir2: boolean | null;
          gir3: boolean | null;
          gir4: boolean | null;
          gir5: boolean | null;
          gir6: boolean | null;
          gir7: boolean | null;
          gir8: boolean | null;
          gir9: boolean | null;
          gir10: boolean | null;
          gir11: boolean | null;
          gir12: boolean | null;
          gir13: boolean | null;
          gir14: boolean | null;
          gir15: boolean | null;
          gir16: boolean | null;
          gir17: boolean | null;
          gir18: boolean | null;
        }> = {};

        for (let i = 0; i < 18; i++) {
          const holeScore = score[HOLE_FIELDS[i] as keyof typeof score] as number;
          const putts = score[PUTTS_FIELDS[i] as keyof typeof score] as number | null;
          const par = course[`${parPrefix}${i + 1}` as keyof typeof course] as number;
          const girKey = `gir${i + 1}` as keyof typeof girData;

          if (putts === null || putts === undefined || !holeScore || !par) {
            girData[girKey] = null;
          } else {
            girData[girKey] = holeScore - putts <= par - 2;
          }
        }

        await this.scoreRepository.update(score.id, girData);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  private async assignWeekNumbers(
    leagueSeasonId: bigint,
    weekBoundary: string,
    timeZone: string,
  ): Promise<number> {
    const matches = await this.matchRepository.findByLeagueSeasonId(leagueSeasonId);
    if (matches.length === 0) return 0;

    const dayMap: Record<string, number> = {
      'sun-sat': 0,
      'mon-sun': 1,
      'tue-mon': 2,
      'wed-tue': 3,
      'thu-wed': 4,
      'fri-thu': 5,
      'sat-fri': 6,
    };
    const weekStartDay = dayMap[weekBoundary] ?? 1;

    const sorted = [...matches].sort((a, b) => a.matchdate.getTime() - b.matchdate.getTime());

    const getLocalDate = (
      date: Date,
    ): { year: number; month: number; day: number; dayOfWeek: number } => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      });
      const parts = formatter.formatToParts(date);
      const year = Number(parts.find((p) => p.type === 'year')!.value);
      const month = Number(parts.find((p) => p.type === 'month')!.value);
      const day = Number(parts.find((p) => p.type === 'day')!.value);
      const weekdayStr = parts.find((p) => p.type === 'weekday')!.value;
      const dayOfWeekMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      };
      return { year, month, day, dayOfWeek: dayOfWeekMap[weekdayStr] ?? 0 };
    };

    const getWeekStart = (date: Date): string => {
      const local = getLocalDate(date);
      const diff = (local.dayOfWeek - weekStartDay + 7) % 7;
      const d = new Date(Date.UTC(local.year, local.month - 1, local.day - diff));
      return d.toISOString().split('T')[0];
    };

    const weekStarts = new Set<string>();
    for (const match of sorted) {
      weekStarts.add(getWeekStart(match.matchdate));
    }

    const sortedWeekStarts = [...weekStarts].sort();
    const weekMap = new Map<string, number>();
    sortedWeekStarts.forEach((ws, i) => weekMap.set(ws, i + 1));

    let count = 0;
    for (const match of sorted) {
      const weekNum = weekMap.get(getWeekStart(match.matchdate))!;
      await this.matchRepository.update(match.id, { weeknumber: weekNum });
      count++;
    }

    return count;
  }

  private async recalculateMatchPoints(leagueSeasonId: bigint): Promise<number> {
    const matches = await this.matchRepository.findByLeagueSeasonId(leagueSeasonId);
    const completedMatches = matches.filter((m) => m.matchstatus === GolfMatchStatus.COMPLETED);

    const scoringService = ServiceFactory.getGolfLeagueMatchScoringService();

    let count = 0;
    for (const match of completedMatches) {
      await scoringService.calculateAndStoreMatchPoints(match.id);
      count++;
    }

    return count;
  }
}
