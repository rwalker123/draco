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
    const hasFlights = await this.flightRepository.seasonHasFlights(seasonId);
    if (!hasFlights) {
      throw new NotFoundError('Season has no golf flights');
    }
    const subs = await this.rosterRepository.findSubstitutesForSeason(seasonId);
    return GolfRosterResponseFormatter.formatSubstitutes(subs);
  }

  async getAvailablePlayers(accountId: bigint, seasonId: bigint): Promise<AvailablePlayerType[]> {
    const hasFlights = await this.flightRepository.seasonHasFlights(seasonId);
    if (!hasFlights) {
      throw new NotFoundError('Season has no golf flights');
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

    const golfer = await this.rosterRepository.findOrCreateGolfer(
      contact.id,
      data.initialDifferential ?? null,
    );

    if (data.isSub) {
      const sub = await this.rosterRepository.createLeagueSub({
        golferid: golfer.id,
        seasonid: seasonId,
        isactive: true,
      });
      const subEntry = await this.rosterRepository.findLeagueSubById(sub.id);
      if (!subEntry) {
        throw new NotFoundError('Created substitute entry not found');
      }
      const formatted = GolfRosterResponseFormatter.formatSubstitute(subEntry);
      return {
        id: formatted.id,
        golferId: formatted.golferId,
        teamSeasonId: teamSeasonId.toString(),
        isActive: formatted.isActive,
        initialDifferential: formatted.initialDifferential,
        player: formatted.player,
      };
    }

    const rosterEntry = await this.rosterRepository.createRosterEntry({
      golferid: golfer.id,
      teamseasonid: teamSeasonId,
      isactive: true,
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

    const golfer = await this.rosterRepository.findOrCreateGolfer(
      contactId,
      data.initialDifferential ?? null,
    );

    const existingRoster = await this.rosterRepository.findByGolferAndTeam(golfer.id, teamSeasonId);
    if (existingRoster) {
      throw new ValidationError('This player is already on this team');
    }

    const existingSub = await this.rosterRepository.findLeagueSubByGolferAndSeason(
      golfer.id,
      seasonId,
    );
    if (existingSub) {
      throw new ValidationError('This player is already in the substitute pool for this season');
    }

    if (data.isSub) {
      const sub = await this.rosterRepository.createLeagueSub({
        golferid: golfer.id,
        seasonid: seasonId,
        isactive: true,
      });
      const subEntry = await this.rosterRepository.findLeagueSubById(sub.id);
      if (!subEntry) {
        throw new NotFoundError('Created substitute entry not found');
      }
      const formatted = GolfRosterResponseFormatter.formatSubstitute(subEntry);
      return {
        id: formatted.id,
        golferId: formatted.golferId,
        teamSeasonId: teamSeasonId.toString(),
        isActive: formatted.isActive,
        initialDifferential: formatted.initialDifferential,
        player: formatted.player,
      };
    }

    const rosterEntry = await this.rosterRepository.createRosterEntry({
      golferid: golfer.id,
      teamseasonid: teamSeasonId,
      isactive: true,
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

    if (data.isActive !== undefined) {
      await this.rosterRepository.updateRosterEntry(rosterId, {
        isactive: data.isActive,
      });
    }

    if (data.initialDifferential !== undefined) {
      await this.rosterRepository.updateGolfer(entry.golferid, {
        initialdifferential: data.initialDifferential ?? null,
      });
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

    if (data.releaseAsSub) {
      const hasFlights = await this.flightRepository.seasonHasFlights(seasonId);
      if (!hasFlights) {
        throw new NotFoundError('Season has no golf flights');
      }

      const existingSub = await this.rosterRepository.findLeagueSubByGolferAndSeason(
        entry.golferid,
        seasonId,
      );

      if (existingSub) {
        await this.rosterRepository.updateLeagueSub(existingSub.id, { isactive: true });
      } else {
        await this.rosterRepository.createLeagueSub({
          golferid: entry.golferid,
          seasonid: seasonId,
          isactive: true,
        });
      }

      await this.rosterRepository.deleteRosterEntry(rosterId);
    } else {
      await this.rosterRepository.deleteRosterEntry(rosterId);
    }
  }

  async deletePlayer(rosterId: bigint): Promise<void> {
    const entry = await this.rosterRepository.findById(rosterId);
    if (!entry) {
      throw new NotFoundError('Roster entry not found');
    }

    await this.validateGolferCanBeDeleted(entry.golferid);
    await this.rosterRepository.deleteRosterEntry(rosterId);
  }

  async signSubToTeam(subId: bigint, teamSeasonId: bigint): Promise<GolfRosterEntryType> {
    const team = await this.teamRepository.findById(teamSeasonId);
    if (!team) {
      throw new NotFoundError('Golf team not found');
    }

    const sub = await this.rosterRepository.findLeagueSubById(subId);
    if (!sub) {
      throw new NotFoundError('Substitute not found');
    }

    const existingRoster = await this.rosterRepository.findByGolferAndTeam(
      sub.golferid,
      teamSeasonId,
    );
    if (existingRoster) {
      throw new ValidationError('Golfer is already on this team');
    }

    const rosterEntry = await this.rosterRepository.createRosterEntry({
      golferid: sub.golferid,
      teamseasonid: teamSeasonId,
      isactive: true,
    });

    await this.rosterRepository.deleteLeagueSub(subId);

    const createdEntry = await this.rosterRepository.findById(rosterEntry.id);
    if (!createdEntry) {
      throw new NotFoundError('Created roster entry not found');
    }
    return GolfRosterResponseFormatter.format(createdEntry);
  }

  async updateSubstitute(subId: bigint, data: UpdateGolfPlayerType): Promise<GolfSubstituteType> {
    const sub = await this.rosterRepository.findLeagueSubById(subId);
    if (!sub) {
      throw new NotFoundError('Substitute not found');
    }

    if (data.isActive !== undefined) {
      await this.rosterRepository.updateLeagueSub(subId, {
        isactive: data.isActive,
      });
    }

    if (data.initialDifferential !== undefined) {
      await this.rosterRepository.updateGolfer(sub.golferid, {
        initialdifferential: data.initialDifferential ?? null,
      });
    }

    const updatedSub = await this.rosterRepository.findLeagueSubById(subId);
    if (!updatedSub) {
      throw new NotFoundError('Updated substitute not found');
    }
    return GolfRosterResponseFormatter.formatSubstitute(updatedSub);
  }

  async deleteSubstitute(subId: bigint): Promise<void> {
    const sub = await this.rosterRepository.findLeagueSubById(subId);
    if (!sub) {
      throw new NotFoundError('Substitute not found');
    }

    await this.validateGolferCanBeDeleted(sub.golferid);
    await this.rosterRepository.deleteLeagueSub(subId);
  }

  private async validateGolferCanBeDeleted(golferId: bigint): Promise<void> {
    const hasScores = await this.rosterRepository.hasMatchScores(golferId);
    if (hasScores) {
      throw new ValidationError(
        'Cannot delete because this golfer has recorded scores. Use release instead.',
      );
    }
  }
}
