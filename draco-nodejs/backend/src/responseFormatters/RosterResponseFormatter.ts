import {
  AccountHeaderType,
  BaseContactType,
  PublicRosterMemberType,
  PublicTeamRosterResponseType,
  RosterCardPlayerType,
  RosterMemberType,
  RosterMemberWaiverSummaryType,
  TeamRosterCardType,
  TeamRosterMembersType,
  TeamRosterWaiverSummariesType,
} from '@draco/shared-schemas';
import {
  dbBaseContact,
  dbContactSeasonTeamWaiver,
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
        contactId: contact.id.toString(),
        playerNumber: member.playernumber,
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

  static formatTeamRosterWaiverSummariesResponse(
    dbTeamSeason: dbTeamSeason,
    dbRosterMembers: dbRosterMember[],
    waiverRows: dbContactSeasonTeamWaiver[],
    gamesPlayedMap?: Map<string, number>,
  ): TeamRosterWaiverSummariesType {
    const waiverByContact = new Map<string, dbContactSeasonTeamWaiver[]>();
    for (const row of waiverRows) {
      const key = row.contactId.toString();
      const list = waiverByContact.get(key);
      if (list) {
        list.push(row);
      } else {
        waiverByContact.set(key, [row]);
      }
    }

    const members: RosterMemberWaiverSummaryType[] = dbRosterMembers.map((member) => {
      const rosterMember = this.formatRosterMemberResponse(member, gamesPlayedMap);
      const contactKey = member.roster.contacts.id.toString();
      const teams = waiverByContact.get(contactKey) ?? [];
      return {
        rosterMember,
        seasonTeams: teams.map((row) => ({
          teamSeasonId: row.teamSeasonId.toString(),
          teamId: row.teamId.toString(),
          teamName: row.teamName,
          leagueSeasonId: row.leagueSeasonId.toString(),
          leagueName: row.leagueName,
          submittedWaiver: row.submittedWaiver,
        })),
      };
    });

    return {
      teamSeason: {
        id: dbTeamSeason.id.toString(),
        name: dbTeamSeason.name,
      },
      members,
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
        playerNumber: member.playernumber,
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
