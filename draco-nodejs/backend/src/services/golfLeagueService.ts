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

  async getLeagueSetup(accountId: bigint): Promise<GolfLeagueSetupType> {
    const setup = await this.leagueRepository.findByAccountId(accountId);
    if (!setup) {
      throw new NotFoundError('Golf league setup not found');
    }
    return GolfLeagueResponseFormatter.format(setup);
  }

  async updateLeagueSetup(
    accountId: bigint,
    data: UpdateGolfLeagueSetupType,
  ): Promise<GolfLeagueSetupType> {
    const existingSetup = await this.leagueRepository.findByAccountId(accountId);
    if (!existingSetup) {
      throw new NotFoundError('Golf league setup not found');
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
      updateData.presidentid = data.presidentId ? BigInt(data.presidentId) : 0n;
    }
    if (data.vicePresidentId !== undefined) {
      updateData.vicepresidentid = data.vicePresidentId ? BigInt(data.vicePresidentId) : 0n;
    }
    if (data.secretaryId !== undefined) {
      updateData.secretaryid = data.secretaryId ? BigInt(data.secretaryId) : 0n;
    }
    if (data.treasurerId !== undefined) {
      updateData.treasurerid = data.treasurerId ? BigInt(data.treasurerId) : 0n;
    }

    if (data.indNetPerHolePts !== undefined) {
      updateData.indnetperholepts = data.indNetPerHolePts;
    }
    if (data.indNetPerNinePts !== undefined) {
      updateData.indnetperninepts = data.indNetPerNinePts;
    }
    if (data.indNetPerMatchPts !== undefined) {
      updateData.indnetpermatchpts = data.indNetPerMatchPts;
    }
    if (data.indNetTotalHolesPts !== undefined) {
      updateData.indnettotalholespts = data.indNetTotalHolesPts;
    }
    if (data.indNetAgainstFieldPts !== undefined) {
      updateData.indnetagainstfieldpts = data.indNetAgainstFieldPts;
    }
    if (data.indNetAgainstFieldDescPts !== undefined) {
      updateData.indnetagainstfielddescpts = data.indNetAgainstFieldDescPts;
    }
    if (data.indActPerHolePts !== undefined) {
      updateData.indactperholepts = data.indActPerHolePts;
    }
    if (data.indActPerNinePts !== undefined) {
      updateData.indactperninepts = data.indActPerNinePts;
    }
    if (data.indActPerMatchPts !== undefined) {
      updateData.indactpermatchpts = data.indActPerMatchPts;
    }
    if (data.indActTotalHolesPts !== undefined) {
      updateData.indacttotalholespts = data.indActTotalHolesPts;
    }
    if (data.indActAgainstFieldPts !== undefined) {
      updateData.indactagainstfieldpts = data.indActAgainstFieldPts;
    }
    if (data.indActAgainstFieldDescPts !== undefined) {
      updateData.indactagainstfielddescpts = data.indActAgainstFieldDescPts;
    }
    if (data.teamNetPerHolePts !== undefined) {
      updateData.teamnetperholepts = data.teamNetPerHolePts;
    }
    if (data.teamNetPerNinePts !== undefined) {
      updateData.teamnetperninepts = data.teamNetPerNinePts;
    }
    if (data.teamNetPerMatchPts !== undefined) {
      updateData.teamnetpermatchpts = data.teamNetPerMatchPts;
    }
    if (data.teamNetTotalHolesPts !== undefined) {
      updateData.teamnettotalholespts = data.teamNetTotalHolesPts;
    }
    if (data.teamNetAgainstFieldPts !== undefined) {
      updateData.teamnetagainstfieldpts = data.teamNetAgainstFieldPts;
    }
    if (data.teamActPerHolePts !== undefined) {
      updateData.teamactperholepts = data.teamActPerHolePts;
    }
    if (data.teamActPerNinePts !== undefined) {
      updateData.teamactperninepts = data.teamActPerNinePts;
    }
    if (data.teamActPerMatchPts !== undefined) {
      updateData.teamactpermatchpts = data.teamActPerMatchPts;
    }
    if (data.teamActTotalHolesPts !== undefined) {
      updateData.teamacttotalholespts = data.teamActTotalHolesPts;
    }
    if (data.teamActAgainstFieldPts !== undefined) {
      updateData.teamactagainstfieldpts = data.teamActAgainstFieldPts;
    }
    if (data.teamAgainstFieldDescPts !== undefined) {
      updateData.teamagainstfielddescpts = data.teamAgainstFieldDescPts;
    }
    if (data.teamNetBestBallPerHolePts !== undefined) {
      updateData.teamnetbestballperholepts = data.teamNetBestBallPerHolePts;
    }
    if (data.teamActBestBallPerHolePts !== undefined) {
      updateData.teamactbestballperholepts = data.teamActBestBallPerHolePts;
    }
    if (data.useTeamScoring !== undefined) {
      updateData.useteamscoring = data.useTeamScoring;
    }
    if (data.useIndividualScoring !== undefined) {
      updateData.useindividualscoring = data.useIndividualScoring;
    }

    await this.leagueRepository.update(accountId, updateData);

    const updated = await this.leagueRepository.findByAccountId(accountId);
    if (!updated) {
      throw new NotFoundError('Golf league setup not found after update');
    }
    return GolfLeagueResponseFormatter.format(updated);
  }

  async getGolfAccounts(): Promise<GolfAccountInfoResponse[]> {
    const accounts = await this.leagueRepository.getGolfAccounts();
    return GolfLeagueResponseFormatter.formatGolfAccounts(accounts);
  }
}
