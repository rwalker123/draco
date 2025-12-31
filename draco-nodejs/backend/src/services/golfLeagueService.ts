import { NotFoundError } from '../utils/customErrors.js';
import { IGolfLeagueRepository, RepositoryFactory } from '../repositories/index.js';
import {
  GolfLeagueResponseFormatter,
  GolfAccountInfoResponse,
} from '../responseFormatters/golfLeagueResponseFormatter.js';
import { GolfLeagueSetupType, UpdateGolfLeagueSetupType } from '@draco/shared-schemas';
import { DateUtils } from '../utils/dateUtils.js';

export class GolfLeagueService {
  private readonly leagueRepository: IGolfLeagueRepository;

  constructor(leagueRepository?: IGolfLeagueRepository) {
    this.leagueRepository = leagueRepository ?? RepositoryFactory.getGolfLeagueRepository();
  }

  async getLeagueSetup(
    accountId: bigint,
    leagueSeasonId: bigint,
  ): Promise<GolfLeagueSetupType> {
    const setup = await this.leagueRepository.findByLeagueSeasonId(leagueSeasonId);
    if (!setup) {
      throw new NotFoundError('Golf league setup not found');
    }
    return GolfLeagueResponseFormatter.format(setup, accountId);
  }

  async updateLeagueSetup(
    accountId: bigint,
    leagueSeasonId: bigint,
    data: UpdateGolfLeagueSetupType,
  ): Promise<GolfLeagueSetupType> {
    const existingSetup = await this.leagueRepository.findByLeagueSeasonId(leagueSeasonId);

    if (!existingSetup) {
      return this.createLeagueSetup(accountId, leagueSeasonId, data);
    }

    const updateData: Record<string, unknown> = {};

    if (data.leagueDay !== undefined) {
      updateData.leagueday = data.leagueDay;
    }
    if (data.firstTeeTime !== undefined) {
      updateData.firstteetime = DateUtils.parseTimeToUtcEpochDate(data.firstTeeTime);
    }
    if (data.timeBetweenTeeTimes !== undefined) {
      updateData.timebetweenteetimes = data.timeBetweenTeeTimes;
    }
    if (data.holesPerMatch !== undefined) {
      updateData.holespermatch = data.holesPerMatch;
    }
    if (data.teeOffFormat !== undefined) {
      updateData.teeoffformat = data.teeOffFormat;
    }

    if (data.presidentId !== undefined) {
      updateData.presidentid = data.presidentId ? BigInt(data.presidentId) : null;
    }
    if (data.vicePresidentId !== undefined) {
      updateData.vicepresidentid = data.vicePresidentId ? BigInt(data.vicePresidentId) : null;
    }
    if (data.secretaryId !== undefined) {
      updateData.secretaryid = data.secretaryId ? BigInt(data.secretaryId) : null;
    }
    if (data.treasurerId !== undefined) {
      updateData.treasurerid = data.treasurerId ? BigInt(data.treasurerId) : null;
    }

    if (data.scoringType !== undefined) {
      updateData.scoringtype = data.scoringType;
    }
    if (data.useBestBall !== undefined) {
      updateData.usebestball = data.useBestBall;
    }
    if (data.useHandicapScoring !== undefined) {
      updateData.usehandicapscoring = data.useHandicapScoring;
    }
    if (data.perHolePoints !== undefined) {
      updateData.perholepoints = data.perHolePoints;
    }
    if (data.perNinePoints !== undefined) {
      updateData.perninepoints = data.perNinePoints;
    }
    if (data.perMatchPoints !== undefined) {
      updateData.permatchpoints = data.perMatchPoints;
    }
    if (data.totalHolesPoints !== undefined) {
      updateData.totalholespoints = data.totalHolesPoints;
    }
    if (data.againstFieldPoints !== undefined) {
      updateData.againstfieldpoints = data.againstFieldPoints;
    }
    if (data.againstFieldDescPoints !== undefined) {
      updateData.againstfielddescpoints = data.againstFieldDescPoints;
    }

    if (Object.keys(updateData).length > 0) {
      await this.leagueRepository.update(leagueSeasonId, updateData);
    }

    if (data.teamSize !== undefined) {
      await this.leagueRepository.upsertSeasonConfig(leagueSeasonId, data.teamSize);
    }

    const updated = await this.leagueRepository.findByLeagueSeasonId(leagueSeasonId);
    if (!updated) {
      throw new NotFoundError('Golf league setup not found after update');
    }
    return GolfLeagueResponseFormatter.format(updated, accountId);
  }

  private async createLeagueSetup(
    accountId: bigint,
    leagueSeasonId: bigint,
    data: UpdateGolfLeagueSetupType,
  ): Promise<GolfLeagueSetupType> {
    const createData: Record<string, unknown> = {
      accountid: accountId,
      leagueseasonid: leagueSeasonId,
      leagueday: data.leagueDay ?? 2,
      firstteetime: data.firstTeeTime
        ? DateUtils.parseTimeToUtcEpochDate(data.firstTeeTime)
        : new Date(Date.UTC(1970, 0, 1, 8, 0, 0)),
      timebetweenteetimes: data.timeBetweenTeeTimes ?? 10,
      holespermatch: data.holesPerMatch ?? 9,
      teeoffformat: data.teeOffFormat ?? 0,
      presidentid: data.presidentId ? BigInt(data.presidentId) : null,
      vicepresidentid: data.vicePresidentId ? BigInt(data.vicePresidentId) : null,
      secretaryid: data.secretaryId ? BigInt(data.secretaryId) : null,
      treasurerid: data.treasurerId ? BigInt(data.treasurerId) : null,
      scoringtype: data.scoringType ?? 'team',
      usebestball: data.useBestBall ?? false,
      usehandicapscoring: data.useHandicapScoring ?? true,
      perholepoints: data.perHolePoints ?? 0,
      perninepoints: data.perNinePoints ?? 0,
      permatchpoints: data.perMatchPoints ?? 0,
      totalholespoints: data.totalHolesPoints ?? 0,
      againstfieldpoints: data.againstFieldPoints ?? 0,
      againstfielddescpoints: data.againstFieldDescPoints ?? 0,
    };

    await this.leagueRepository.create(createData);

    const teamSize = data.teamSize ?? 2;
    await this.leagueRepository.upsertSeasonConfig(leagueSeasonId, teamSize);

    const created = await this.leagueRepository.findByLeagueSeasonId(leagueSeasonId);
    if (!created) {
      throw new NotFoundError('Golf league setup not found after creation');
    }
    return GolfLeagueResponseFormatter.format(created, accountId);
  }

  async getGolfAccounts(): Promise<GolfAccountInfoResponse[]> {
    const accounts = await this.leagueRepository.getGolfAccounts();
    return GolfLeagueResponseFormatter.formatGolfAccounts(accounts);
  }
}
