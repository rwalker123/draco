import {
  GolfMatchType,
  GolfMatchWithScoresType,
  CreateGolfMatchType,
  UpdateGolfMatchType,
} from '@draco/shared-schemas';
import { IGolfMatchRepository } from '../repositories/interfaces/IGolfMatchRepository.js';
import { IGolfFlightRepository } from '../repositories/interfaces/IGolfFlightRepository.js';
import { IGolfTeamRepository } from '../repositories/interfaces/IGolfTeamRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { GolfMatchResponseFormatter } from '../responseFormatters/golfMatchResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { GolfMatchStatus } from '../utils/golfConstants.js';

export class GolfMatchService {
  private readonly matchRepository: IGolfMatchRepository;
  private readonly flightRepository: IGolfFlightRepository;
  private readonly teamRepository: IGolfTeamRepository;

  constructor(
    matchRepository?: IGolfMatchRepository,
    flightRepository?: IGolfFlightRepository,
    teamRepository?: IGolfTeamRepository,
  ) {
    this.matchRepository = matchRepository ?? RepositoryFactory.getGolfMatchRepository();
    this.flightRepository = flightRepository ?? RepositoryFactory.getGolfFlightRepository();
    this.teamRepository = teamRepository ?? RepositoryFactory.getGolfTeamRepository();
  }

  async getMatchesForSeason(
    seasonId: bigint,
    startDate?: Date,
    endDate?: Date,
  ): Promise<GolfMatchType[]> {
    const hasLeagueSeasons = await this.matchRepository.seasonHasLeagueSeasons(seasonId);
    if (!hasLeagueSeasons) {
      throw new NotFoundError('Season not found or has no league seasons');
    }
    const matches = await this.matchRepository.findBySeasonIdWithDateRange(
      seasonId,
      startDate,
      endDate,
    );
    return GolfMatchResponseFormatter.formatMany(matches);
  }

  async getMatchesForFlight(flightId: bigint): Promise<GolfMatchType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Golf flight not found');
    }
    const matches = await this.matchRepository.findByFlightId(flightId);
    return GolfMatchResponseFormatter.formatMany(matches);
  }

  async getMatchById(matchId: bigint): Promise<GolfMatchType> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }
    return GolfMatchResponseFormatter.format(match);
  }

  async getMatchWithScores(matchId: bigint): Promise<GolfMatchWithScoresType> {
    const match = await this.matchRepository.findByIdWithScores(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }
    return GolfMatchResponseFormatter.formatWithScores(match);
  }

  async getUpcomingMatches(seasonId: bigint, limit = 10): Promise<GolfMatchType[]> {
    const hasLeagueSeasons = await this.matchRepository.seasonHasLeagueSeasons(seasonId);
    if (!hasLeagueSeasons) {
      throw new NotFoundError('Season not found or has no league seasons');
    }
    const matches = await this.matchRepository.findUpcoming(seasonId, limit);
    return GolfMatchResponseFormatter.formatMany(matches);
  }

  async getCompletedMatches(seasonId: bigint, limit = 10): Promise<GolfMatchType[]> {
    const hasLeagueSeasons = await this.matchRepository.seasonHasLeagueSeasons(seasonId);
    if (!hasLeagueSeasons) {
      throw new NotFoundError('Season not found or has no league seasons');
    }
    const matches = await this.matchRepository.findCompleted(seasonId, limit);
    return GolfMatchResponseFormatter.formatMany(matches);
  }

  async getMatchesForTeam(teamSeasonId: bigint): Promise<GolfMatchType[]> {
    const team = await this.teamRepository.findById(teamSeasonId);
    if (!team) {
      throw new NotFoundError('Golf team not found');
    }
    const matches = await this.matchRepository.findByTeam(teamSeasonId);
    return GolfMatchResponseFormatter.formatMany(matches);
  }

  async getMatchesByDate(seasonId: bigint, date: string): Promise<GolfMatchType[]> {
    const hasLeagueSeasons = await this.matchRepository.seasonHasLeagueSeasons(seasonId);
    if (!hasLeagueSeasons) {
      throw new NotFoundError('Season not found or has no league seasons');
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new ValidationError('Invalid date format');
    }
    const matches = await this.matchRepository.findByDate(seasonId, parsedDate);
    return GolfMatchResponseFormatter.formatMany(matches);
  }

  async createMatch(seasonId: bigint, data: CreateGolfMatchType): Promise<GolfMatchType> {
    const flightId = BigInt(data.leagueSeasonId);

    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Flight not found');
    }

    if (flight.seasonid !== seasonId) {
      throw new ValidationError('Flight does not belong to the specified season');
    }

    const team1Id = BigInt(data.team1Id);
    const team2Id = BigInt(data.team2Id);

    if (team1Id === team2Id) {
      throw new ValidationError('A team cannot play against itself');
    }

    const [team1, team2] = await Promise.all([
      this.teamRepository.findById(team1Id),
      this.teamRepository.findById(team2Id),
    ]);

    if (!team1) {
      throw new NotFoundError('Team 1 not found');
    }
    if (!team2) {
      throw new NotFoundError('Team 2 not found');
    }

    const matchDateTime = this.parseDateTime(data.matchDateTime);

    const match = await this.matchRepository.create({
      team1: team1Id,
      team2: team2Id,
      leagueid: flightId,
      matchdate: matchDateTime,
      courseid: data.courseId ? BigInt(data.courseId) : null,
      teeid: data.teeId ? BigInt(data.teeId) : null,
      matchstatus: 0,
      matchtype: data.matchType ?? 0,
      comment: data.comment ?? '',
    });

    const createdMatch = await this.matchRepository.findById(match.id);
    if (!createdMatch) {
      throw new NotFoundError('Created match not found');
    }
    return GolfMatchResponseFormatter.format(createdMatch);
  }

  async updateMatch(matchId: bigint, data: UpdateGolfMatchType): Promise<GolfMatchType> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    if (match.matchstatus === GolfMatchStatus.COMPLETED) {
      const hasDefinitionChanges =
        data.team1Id !== undefined ||
        data.team2Id !== undefined ||
        data.matchDateTime !== undefined ||
        data.courseId !== undefined ||
        data.teeId !== undefined ||
        data.matchType !== undefined ||
        data.comment !== undefined;

      if (hasDefinitionChanges) {
        throw new ValidationError(
          'Cannot edit a completed match. Clear the scores first to make changes.',
        );
      }
    }

    const updateData: Parameters<IGolfMatchRepository['update']>[1] = {};

    if (data.team1Id !== undefined) {
      const team1Id = BigInt(data.team1Id);
      const team1 = await this.teamRepository.findById(team1Id);
      if (!team1) {
        throw new NotFoundError('Team 1 not found');
      }
      updateData.team1 = team1Id;
    }

    if (data.team2Id !== undefined) {
      const team2Id = BigInt(data.team2Id);
      const team2 = await this.teamRepository.findById(team2Id);
      if (!team2) {
        throw new NotFoundError('Team 2 not found');
      }
      updateData.team2 = team2Id;
    }

    if (data.matchDateTime !== undefined) {
      const matchDateTime = this.parseDateTime(data.matchDateTime);
      updateData.matchdate = matchDateTime;
    }

    if (data.courseId !== undefined) {
      updateData.courseid = data.courseId ? BigInt(data.courseId) : null;
    }

    if (data.teeId !== undefined) {
      updateData.teeid = data.teeId ? BigInt(data.teeId) : null;
    }

    if (data.matchType !== undefined) {
      updateData.matchtype = data.matchType;
    }

    if (data.matchStatus !== undefined) {
      updateData.matchstatus = data.matchStatus;
    }

    if (data.comment !== undefined) {
      updateData.comment = data.comment;
    }

    if (Object.keys(updateData).length > 0) {
      await this.matchRepository.update(matchId, updateData);
    }

    const updatedMatch = await this.matchRepository.findById(matchId);
    if (!updatedMatch) {
      throw new NotFoundError('Updated match not found');
    }
    return GolfMatchResponseFormatter.format(updatedMatch);
  }

  async deleteMatch(matchId: bigint, force = false): Promise<void> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    if (!force) {
      const hasScores = await this.matchRepository.hasScores(matchId);
      if (hasScores) {
        throw new ValidationError('Cannot delete match because it has recorded scores');
      }
    }

    await this.matchRepository.delete(matchId);
  }

  async updateMatchStatus(matchId: bigint, status: number): Promise<GolfMatchType> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundError('Golf match not found');
    }

    if (status < 0 || status > 3) {
      throw new ValidationError('Invalid match status');
    }

    await this.matchRepository.updateStatus(matchId, status);

    const updatedMatch = await this.matchRepository.findById(matchId);
    if (!updatedMatch) {
      throw new NotFoundError('Updated match not found');
    }
    return GolfMatchResponseFormatter.format(updatedMatch);
  }

  private parseDateTime(dateString: string): Date {
    const parsed = new Date(dateString);
    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(dateString);
    if (Number.isNaN(parsed.getTime()) || !hasTimezone) {
      throw new ValidationError('Invalid date format. Expected ISO 8601 datetime with timezone');
    }
    return parsed;
  }
}
