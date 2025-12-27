import {
  GolfRosterEntryType,
  GolfSubstituteType,
  AvailablePlayerType,
  CreateGolfPlayerType,
  UpdateGolfPlayerType,
  SignPlayerType,
  ReleasePlayerType,
} from '@draco/shared-schemas';
import { IGolfRosterRepository } from '../repositories/interfaces/IGolfRosterRepository.js';
import { IGolfTeamRepository } from '../repositories/interfaces/IGolfTeamRepository.js';
import { IGolfFlightRepository } from '../repositories/interfaces/IGolfFlightRepository.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { GolfRosterResponseFormatter } from '../responseFormatters/golfRosterResponseFormatter.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

export class GolfRosterService {
  private readonly rosterRepository: IGolfRosterRepository;
  private readonly teamRepository: IGolfTeamRepository;
  private readonly flightRepository: IGolfFlightRepository;

  constructor(
    rosterRepository?: IGolfRosterRepository,
    teamRepository?: IGolfTeamRepository,
    flightRepository?: IGolfFlightRepository,
  ) {
    this.rosterRepository = rosterRepository ?? RepositoryFactory.getGolfRosterRepository();
    this.teamRepository = teamRepository ?? RepositoryFactory.getGolfTeamRepository();
    this.flightRepository = flightRepository ?? RepositoryFactory.getGolfFlightRepository();
  }

  async getRoster(teamSeasonId: bigint): Promise<GolfRosterEntryType[]> {
    const team = await this.teamRepository.findById(teamSeasonId);
    if (!team) {
      throw new NotFoundError('Golf team not found');
    }
    const roster = await this.rosterRepository.findByTeamSeasonId(teamSeasonId);
    return GolfRosterResponseFormatter.formatMany(roster);
  }

  async getRosterEntry(rosterId: bigint): Promise<GolfRosterEntryType> {
    const entry = await this.rosterRepository.findById(rosterId);
    if (!entry) {
      throw new NotFoundError('Roster entry not found');
    }
    return GolfRosterResponseFormatter.format(entry);
  }

  async getSubstitutesForSeason(seasonId: bigint): Promise<GolfSubstituteType[]> {
    const seasonExists = await this.flightRepository.leagueSeasonExists(seasonId);
    if (!seasonExists) {
      throw new NotFoundError('League season not found');
    }
    const subs = await this.rosterRepository.findSubstitutesForSeason(seasonId);
    return GolfRosterResponseFormatter.formatSubstitutes(subs);
  }

  async getSubstitutesForFlight(flightId: bigint): Promise<GolfSubstituteType[]> {
    const flight = await this.flightRepository.findById(flightId);
    if (!flight) {
      throw new NotFoundError('Golf flight not found');
    }
    const subs = await this.rosterRepository.findSubstitutesForFlight(flightId);
    return GolfRosterResponseFormatter.formatSubstitutes(subs);
  }

  async getAvailablePlayers(accountId: bigint, seasonId: bigint): Promise<AvailablePlayerType[]> {
    const seasonExists = await this.flightRepository.leagueSeasonExists(seasonId);
    if (!seasonExists) {
      throw new NotFoundError('League season not found');
    }
    const contacts = await this.rosterRepository.findAvailableContacts(accountId, seasonId);
    return GolfRosterResponseFormatter.formatAvailablePlayers(contacts);
  }

  async createAndSignPlayer(
    teamSeasonId: bigint,
    accountId: bigint,
    seasonId: bigint,
    data: CreateGolfPlayerType,
  ): Promise<GolfRosterEntryType> {
    const team = await this.teamRepository.findById(teamSeasonId);
    if (!team) {
      throw new NotFoundError('Golf team not found');
    }

    const contact = await this.rosterRepository.createContact(accountId, {
      firstname: data.firstName.trim(),
      lastname: data.lastName.trim(),
      middlename: data.middleName?.trim() ?? null,
      email: data.email?.trim() ?? null,
    });

    const rosterEntry = await this.rosterRepository.create({
      contactid: contact.id,
      teamseasonid: teamSeasonId,
      isactive: true,
      issub: data.isSub ?? false,
      initialdifferential: data.initialDifferential ?? null,
      subseasonid: data.isSub ? seasonId : null,
    });

    const createdEntry = await this.rosterRepository.findById(rosterEntry.id);
    if (!createdEntry) {
      throw new NotFoundError('Created roster entry not found');
    }
    return GolfRosterResponseFormatter.format(createdEntry);
  }

  async signPlayer(
    teamSeasonId: bigint,
    accountId: bigint,
    seasonId: bigint,
    data: SignPlayerType,
  ): Promise<GolfRosterEntryType> {
    const team = await this.teamRepository.findById(teamSeasonId);
    if (!team) {
      throw new NotFoundError('Golf team not found');
    }

    const contactId = BigInt(data.contactId);
    const contactExists = await this.rosterRepository.contactExistsInAccount(contactId, accountId);
    if (!contactExists) {
      throw new NotFoundError('Contact not found in this account');
    }

    const existingRoster = await this.rosterRepository.findByContactAndTeam(
      contactId,
      teamSeasonId,
    );
    if (existingRoster) {
      throw new ValidationError('This player is already on this team');
    }

    const rosterEntry = await this.rosterRepository.create({
      contactid: contactId,
      teamseasonid: teamSeasonId,
      isactive: true,
      issub: data.isSub ?? false,
      initialdifferential: data.initialDifferential ?? null,
      subseasonid: data.isSub ? seasonId : null,
    });

    const createdEntry = await this.rosterRepository.findById(rosterEntry.id);
    if (!createdEntry) {
      throw new NotFoundError('Created roster entry not found');
    }
    return GolfRosterResponseFormatter.format(createdEntry);
  }

  async updatePlayer(rosterId: bigint, data: UpdateGolfPlayerType): Promise<GolfRosterEntryType> {
    const entry = await this.rosterRepository.findById(rosterId);
    if (!entry) {
      throw new NotFoundError('Roster entry not found');
    }

    const updateData: Partial<{
      isactive: boolean;
      issub: boolean;
      initialdifferential: number | null;
    }> = {};

    if (data.isActive !== undefined) {
      updateData.isactive = data.isActive;
    }
    if (data.isSub !== undefined) {
      updateData.issub = data.isSub;
    }
    if (data.initialDifferential !== undefined) {
      updateData.initialdifferential = data.initialDifferential ?? null;
    }

    if (Object.keys(updateData).length > 0) {
      await this.rosterRepository.update(rosterId, updateData);
    }

    const updatedEntry = await this.rosterRepository.findById(rosterId);
    if (!updatedEntry) {
      throw new NotFoundError('Updated roster entry not found');
    }
    return GolfRosterResponseFormatter.format(updatedEntry);
  }

  async releasePlayer(rosterId: bigint, seasonId: bigint, data: ReleasePlayerType): Promise<void> {
    const entry = await this.rosterRepository.findById(rosterId);
    if (!entry) {
      throw new NotFoundError('Roster entry not found');
    }

    await this.rosterRepository.releasePlayer(rosterId, data.releaseAsSub ?? false, seasonId);
  }

  async deletePlayer(rosterId: bigint): Promise<void> {
    const entry = await this.rosterRepository.findById(rosterId);
    if (!entry) {
      throw new NotFoundError('Roster entry not found');
    }

    const hasScores = await this.rosterRepository.hasScores(rosterId);
    if (hasScores) {
      throw new ValidationError(
        'Cannot delete player because they have recorded scores. Use release instead.',
      );
    }

    await this.rosterRepository.delete(rosterId);
  }
}
