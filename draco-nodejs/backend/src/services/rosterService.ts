import {
  BaseContactType,
  CreateContactType,
  PublicTeamRosterResponseType,
  RosterMemberType,
  SignRosterMemberType,
  TeamRosterMembersType,
  UpdateRosterMemberType,
} from '@draco/shared-schemas';
import { RosterResponseFormatter, ContactResponseFormatter } from '../responseFormatters/index.js';
import { DateUtils } from '../utils/dateUtils.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import {
  IContactRepository,
  IRosterRepository,
  ITeamRepository,
  dbRosterMember,
  dbRosterPlayer,
  dbRosterSeasonContactReference,
  dbTeamSeason,
} from '../repositories/index.js';

export class RosterService {
  constructor(
    private rosterRepository: IRosterRepository,
    private teamRepository: ITeamRepository,
    private contactRepository: IContactRepository,
  ) {}

  async getTeamRosterMembers(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    includeGamesPlayed = false,
  ): Promise<TeamRosterMembersType> {
    const teamSeason: dbTeamSeason | null = await this.teamRepository.findTeamSeasonSummary(
      teamSeasonId,
      seasonId,
      accountId,
    );

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    const rosterMembers = await this.rosterRepository.findRosterMembersByTeamSeason(teamSeasonId);

    let gamesPlayedMap: Map<string, number> | undefined;
    if (includeGamesPlayed) {
      const gamesPlayedCounts =
        await this.rosterRepository.countGamesPlayedByTeamSeason(teamSeasonId);
      gamesPlayedMap = new Map(
        gamesPlayedCounts.map((row) => [row.rosterSeasonId.toString(), row.gamesPlayed]),
      );
    }

    return RosterResponseFormatter.formatRosterMembersResponse(
      teamSeason,
      rosterMembers,
      gamesPlayedMap,
    );
  }

  async getPublicTeamRoster(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    includeGamesPlayed = false,
  ): Promise<PublicTeamRosterResponseType> {
    const teamSeason: dbTeamSeason | null = await this.teamRepository.findTeamSeasonSummary(
      teamSeasonId,
      seasonId,
      accountId,
    );

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    const rosterMembers = await this.rosterRepository.findRosterMembersByTeamSeason(teamSeasonId);
    const activeRosterMembers = rosterMembers.filter((member) => !member.inactive);

    let gamesPlayedMap: Map<string, number> | undefined;
    if (includeGamesPlayed) {
      const gamesPlayedCounts =
        await this.rosterRepository.countGamesPlayedByTeamSeason(teamSeasonId);
      gamesPlayedMap = new Map(
        gamesPlayedCounts.map((row) => [row.rosterSeasonId.toString(), row.gamesPlayed]),
      );
    }

    return RosterResponseFormatter.formatPublicRosterMembersResponse(
      teamSeason,
      activeRosterMembers,
      accountId,
      gamesPlayedMap,
    );
  }

  async getAvailablePlayers(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    page: number = 1,
    limit: number = 50,
    firstName?: string,
    lastName?: string,
  ): Promise<BaseContactType[]> {
    const teamSeason = await this.teamRepository.findTeamSeason(teamSeasonId, seasonId, accountId);

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    const assignedRosterMembers: dbRosterSeasonContactReference[] =
      await this.rosterRepository.findActiveRosterContactsByLeagueSeason(teamSeason.leagueseasonid);

    const assignedContactIds = assignedRosterMembers.map((member) => member.roster.contactid);
    const skip = (page - 1) * limit;

    const contacts = await this.contactRepository.findAvailableContacts(
      accountId,
      assignedContactIds,
      firstName,
      lastName,
      skip,
      limit + 1,
    );

    const hasNext = contacts.length > limit;
    const paginatedContacts = hasNext ? contacts.slice(0, limit) : contacts;

    return ContactResponseFormatter.formatManyContactsResponse(paginatedContacts);
  }

  async addPlayerToRoster(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    addPlayerData: SignRosterMemberType,
  ): Promise<RosterMemberType> {
    const teamSeason = await this.teamRepository.findTeamSeason(teamSeasonId, seasonId, accountId);

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    const { playerNumber, submittedWaiver } = addPlayerData;
    const { submittedDriversLicense, firstYear, contact } = addPlayerData.player;

    if (!contact) {
      throw new ValidationError('Contact is required');
    }

    const contactId = await this.resolveContact(contact, accountId);

    let rosterPlayer: dbRosterPlayer | null =
      await this.rosterRepository.findRosterPlayerByContactId(contactId);

    if (!rosterPlayer) {
      rosterPlayer = await this.rosterRepository.createRosterPlayer(
        contactId,
        submittedDriversLicense ?? false,
        firstYear ?? 0,
      );
    }

    const existingRosterMember = await this.rosterRepository.findRosterMemberInLeagueSeason(
      rosterPlayer.id,
      teamSeason.leagueseasonid,
    );

    if (existingRosterMember) {
      throw new ConflictError('Player is already on a team in this season');
    }

    if (submittedDriversLicense !== undefined || firstYear !== undefined) {
      await this.rosterRepository.updateRosterPlayer(
        rosterPlayer.id,
        submittedDriversLicense,
        firstYear,
      );
    }

    const rosterMember = await this.rosterRepository.createRosterSeasonEntry(
      rosterPlayer.id,
      teamSeasonId,
      playerNumber ?? 0,
      submittedWaiver ?? false,
    );

    return RosterResponseFormatter.formatRosterMemberResponse(rosterMember);
  }

  async updateRosterMember(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    updateData: UpdateRosterMemberType,
  ): Promise<RosterMemberType> {
    const existingRosterMember = await this.getRosterMemberForAccount(
      rosterMemberId,
      teamSeasonId,
      seasonId,
      accountId,
    );

    const { playerNumber, submittedWaiver, player } = updateData;
    const { submittedDriversLicense, firstYear } = player ?? {};

    const hasPlayerUpdates = submittedDriversLicense !== undefined || firstYear !== undefined;
    const hasRosterEntryUpdates = playerNumber !== undefined || submittedWaiver !== undefined;

    if (!hasPlayerUpdates && !hasRosterEntryUpdates) {
      throw new ValidationError('No roster updates were provided');
    }

    if (hasPlayerUpdates) {
      await this.rosterRepository.updateRosterPlayer(
        existingRosterMember.playerid,
        submittedDriversLicense,
        firstYear,
      );
    }

    const updatedRosterMember = hasRosterEntryUpdates
      ? await this.rosterRepository.updateRosterSeasonEntry(
          rosterMemberId,
          playerNumber,
          submittedWaiver,
        )
      : await this.getRosterMemberForAccount(rosterMemberId, teamSeasonId, seasonId, accountId);

    return RosterResponseFormatter.formatRosterMemberResponse(updatedRosterMember);
  }

  async releaseOrActivatePlayer(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    inactive: boolean,
  ): Promise<RosterMemberType> {
    const rosterMember = await this.getRosterMemberForAccount(
      rosterMemberId,
      teamSeasonId,
      seasonId,
      accountId,
    );

    if (inactive && rosterMember.inactive) {
      throw new ConflictError('Player is already released');
    }

    if (!inactive && !rosterMember.inactive) {
      throw new ConflictError('Player is already active');
    }

    const updatedRosterMember = await this.rosterRepository.updateRosterSeasonEntry(
      rosterMemberId,
      undefined,
      undefined,
      inactive,
    );

    return RosterResponseFormatter.formatRosterMemberResponse(updatedRosterMember);
  }

  async deleteRosterMember(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<{ playerName: string }> {
    const rosterMember = await this.getRosterMemberForAccount(
      rosterMemberId,
      teamSeasonId,
      seasonId,
      accountId,
    );

    const playerName = `${rosterMember.roster.contacts.firstname} ${rosterMember.roster.contacts.lastname}`;

    await this.rosterRepository.deleteRosterMember(rosterMemberId);

    return { playerName };
  }

  private async resolveContact(
    contact: CreateContactType | { id?: string },
    accountId: bigint,
  ): Promise<bigint> {
    if ('id' in contact && contact.id !== undefined) {
      const contactId = BigInt(contact.id);
      const existingContact = await this.contactRepository.findContactInAccount(
        contactId,
        accountId,
      );

      if (!existingContact) {
        throw new NotFoundError('Contact not found');
      }

      return contactId;
    }

    const contactData = contact as CreateContactType;

    if (!contactData.firstName || !contactData.lastName) {
      throw new ValidationError('First name and last name are required for contact creation');
    }

    const newContact = await this.contactRepository.create({
      firstname: contactData.firstName,
      lastname: contactData.lastName,
      middlename: contactData.middleName || '',
      email: contactData.email || null,
      phone1: contactData.contactDetails?.phone1 || null,
      phone2: contactData.contactDetails?.phone2 || null,
      phone3: contactData.contactDetails?.phone3 || null,
      streetaddress: contactData.contactDetails?.streetAddress || null,
      city: contactData.contactDetails?.city || null,
      state: contactData.contactDetails?.state || null,
      zip: contactData.contactDetails?.zip || null,
      creatoraccountid: accountId,
      dateofbirth: contactData.contactDetails?.dateOfBirth
        ? DateUtils.parseDateOfBirthForDatabase(contactData.contactDetails.dateOfBirth)
        : new Date('1900-01-01'),
    });

    return newContact.id;
  }

  private async getRosterMemberForAccount(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbRosterMember> {
    const rosterMember = await this.rosterRepository.findRosterMemberForAccount(
      rosterMemberId,
      teamSeasonId,
      seasonId,
      accountId,
    );

    if (!rosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    return rosterMember;
  }
}
