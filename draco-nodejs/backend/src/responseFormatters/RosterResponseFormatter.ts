import {
  AccountHeaderType,
  BaseContactType,
  PublicRosterMemberType,
  PublicTeamRosterResponseType,
  RosterCardPlayerType,
  RosterMemberType,
  TeamRosterCardType,
  TeamRosterMembersType,
} from '@draco/shared-schemas';
import {
  dbBaseContact,
  dbRosterMember,
  dbRosterSeason,
  dbTeamSeason,
  dbTeamSeasonLeague,
} from '../repositories/index.js';
import { ContactResponseFormatter } from './responseFormatters.js';
import { getContactPhotoUrl } from '../config/logo.js';

export class RosterResponseFormatter {
  static formatRosterMembersResponse(
    dbTeamSeason: dbTeamSeason,
    dbRosterMembers: dbRosterSeason[],
    gamesPlayedMap?: Map<string, number>,
  ): TeamRosterMembersType {
    const rosterMembers: RosterMemberType[] = dbRosterMembers.map((member) =>
      this.formatRosterMemberResponse(member, gamesPlayedMap),
    );

    const teamRosterMembers: TeamRosterMembersType = {
      teamSeason: {
        id: dbTeamSeason.id.toString(),
        name: dbTeamSeason.name,
      },
      rosterMembers,
    };

    return teamRosterMembers;
  }

  static formatRosterMemberResponse(
    member: dbRosterMember,
    gamesPlayedMap?: Map<string, number>,
  ): RosterMemberType {
    const contact: dbBaseContact = member.roster.contacts;

    const contactEntry: BaseContactType = ContactResponseFormatter.formatContactResponse(contact);
    const gamesPlayed =
      gamesPlayedMap !== undefined ? (gamesPlayedMap.get(member.id.toString()) ?? 0) : undefined;

    return {
      id: member.id.toString(),
      playerNumber: member.playernumber,
      inactive: member.inactive,
      submittedWaiver: member.submittedwaiver,
      dateAdded: member.dateadded ? member.dateadded.toISOString() : null,
      player: {
        id: member.roster.id.toString(),
        submittedDriversLicense: member.roster.submitteddriverslicense,
        firstYear: member.roster.firstyear,
        contact: contactEntry,
      },
      gamesPlayed,
    };
  }

  static formatPublicRosterMembersResponse(
    dbTeamSeason: dbTeamSeason,
    dbRosterMembers: dbRosterSeason[],
    accountId: bigint,
    gamesPlayedMap?: Map<string, number>,
  ): PublicTeamRosterResponseType {
    const rosterMembers: PublicRosterMemberType[] = dbRosterMembers.map((member) => {
      const contact = member.roster.contacts;
      const gamesPlayed =
        gamesPlayedMap !== undefined ? (gamesPlayedMap.get(member.id.toString()) ?? 0) : null;
      return {
        id: member.id.toString(),
        playerNumber: member.playernumber ?? null,
        firstName: contact.firstname ?? null,
        lastName: contact.lastname ?? null,
        middleName: contact.middlename ?? null,
        photoUrl: getContactPhotoUrl(accountId.toString(), contact.id.toString()),
        gamesPlayed,
      };
    });

    return {
      teamSeason: {
        id: dbTeamSeason.id.toString(),
        name: dbTeamSeason.name,
      },
      rosterMembers,
    };
  }

  static formatRosterCardResponse(
    account: Partial<AccountHeaderType> | undefined,
    teamSeason: dbTeamSeason,
    leagueInfo: dbTeamSeasonLeague | null,
    rosterMembers: dbRosterSeason[],
  ): TeamRosterCardType {
    const players: RosterCardPlayerType[] = rosterMembers
      .filter((member) => !member.inactive)
      .map((member) => ({
        id: member.id.toString(),
        playerNumber: member.playernumber ?? null,
        firstName: member.roster.contacts.firstname ?? '',
        lastName: member.roster.contacts.lastname ?? '',
      }))
      .sort((a, b) => {
        const lastComparison = (a.lastName || '').localeCompare(b.lastName || '');
        if (lastComparison !== 0) {
          return lastComparison;
        }
        return (a.firstName || '').localeCompare(b.firstName || '');
      });

    return {
      account: {
        id: account?.id,
        name: account?.name,
        accountLogoUrl: account?.accountLogoUrl,
      },
      teamSeason: {
        id: teamSeason.id.toString(),
        name: teamSeason.name,
        leagueName: leagueInfo?.leagueseason?.league?.name ?? undefined,
        seasonName: leagueInfo?.leagueseason?.season?.name ?? undefined,
      },
      players,
    };
  }
}
