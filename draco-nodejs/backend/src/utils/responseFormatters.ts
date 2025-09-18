import { TeamSeasonSummary, TeamSeasonDetails } from '../services/teamService.js';
import { RosterMember, TeamRosterMembersType, RosterPlayerType } from '@draco/shared-schemas';
import { BaseContactType, TeamManagerType } from '@draco/shared-schemas';
import { BattingStat, PitchingStat, GameInfo } from '../services/teamStatsService.js';
import { getContactPhotoUrl } from '../config/logo.js';
import { DateUtils } from '../utils/dateUtils.js';
import {
  dbBaseContact,
  dbRosterPlayer,
  dbRosterMember,
  dbTeamSeason,
  dbRosterSeason,
  dbTeamManagerWithContact,
} from '../repositories/index.js';

// todo: delete this once the shared api client is used more widely
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class ContactResponseFormatter {
  static formatContactResponse(contact: dbBaseContact): BaseContactType {
    const contactEntry: BaseContactType = {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename,
      email: contact.email || undefined,
      userId: contact.userid || undefined, // Roster contacts don't have userId
      photoUrl: getContactPhotoUrl(contact.creatoraccountid.toString(), contact.id.toString()),
      contactDetails: {
        phone1: contact.phone1,
        phone2: contact.phone2,
        phone3: contact.phone3,
        streetaddress: contact.streetaddress,
        city: contact.city,
        state: contact.state,
        zip: contact.zip,
        dateofbirth: DateUtils.formatDateOfBirthForResponse(contact.dateofbirth),
      },
    };
    return contactEntry;
  }

  static formatManyContactsResponse(contacts: dbBaseContact[]): BaseContactType[] {
    return contacts.map((contact) => this.formatContactResponse(contact));
  }

  static formatRosterPlayerResponse(dbRoster: dbRosterPlayer): RosterPlayerType {
    const contact: dbBaseContact = dbRoster.contacts;
    const contactEntry: BaseContactType = ContactResponseFormatter.formatContactResponse(contact);
    const rosterPlayer: RosterPlayerType = {
      id: dbRoster.id.toString(),
      submittedDriversLicense: dbRoster.submitteddriverslicense,
      firstYear: dbRoster.firstyear,
      contact: contactEntry,
    };
    return rosterPlayer;
  }
}

export class TeamResponseFormatter {
  static formatTeamsListResponse(
    teams: TeamSeasonSummary[],
  ): ApiResponse<{ teams: TeamSeasonSummary[] }> {
    return {
      success: true,
      data: {
        teams,
      },
    };
  }

  static formatTeamDetailsResponse(teamSeason: TeamSeasonDetails): ApiResponse<{
    teamSeason: TeamSeasonDetails;
    season: { id: string; name: string } | null;
    record: { wins: number; losses: number; ties: number };
  }> {
    return {
      success: true,
      data: {
        teamSeason: teamSeason,
        season: teamSeason.season,
        record: teamSeason.record,
      },
    };
  }

  static formatTeamUpdateResponse(
    team: TeamSeasonSummary,
    logoUrl?: string | null,
  ): ApiResponse<{ team: TeamSeasonSummary & { logoUrl?: string | null } }> {
    return {
      success: true,
      data: {
        team: {
          ...team,
          logoUrl,
        },
      },
      message: `Team "${team.name}" has been updated successfully`,
    };
  }

  static formatLeagueInfoResponse(leagueInfo: {
    id: bigint;
    name: string;
  }): ApiResponse<{ id: string; name: string }> {
    return {
      success: true,
      data: {
        id: leagueInfo.id.toString(),
        name: leagueInfo.name,
      },
    };
  }

  static formatTeamRecordResponse(
    teamSeasonId: string,
    record: { wins: number; losses: number; ties: number },
  ): ApiResponse<{ teamSeasonId: string; record: { wins: number; losses: number; ties: number } }> {
    return {
      success: true,
      data: {
        teamSeasonId,
        record,
      },
    };
  }
}

export class RosterResponseFormatter {
  static formatRosterMembersResponse(
    dbTeamSeason: dbTeamSeason,
    dbRosterMembers: dbRosterSeason[],
  ): TeamRosterMembersType {
    const rosterMembers: RosterMember[] = dbRosterMembers.map((member) => {
      return this.formatRosterMemberResponse(member);
    });

    const teamRosterMembers: TeamRosterMembersType = {
      teamSeason: {
        id: dbTeamSeason.id.toString(),
        name: dbTeamSeason.name,
      },
      rosterMembers: rosterMembers,
    };

    return teamRosterMembers;
  }

  static formatRosterMemberResponse(member: dbRosterMember): RosterMember {
    const contact: dbBaseContact = member.roster.contacts;

    const contactEntry: BaseContactType = ContactResponseFormatter.formatContactResponse(contact);

    const player: RosterPlayerType = {
      id: member.roster.id.toString(),
      submittedDriversLicense: member.roster.submitteddriverslicense,
      firstYear: member.roster.firstyear,
      contact: contactEntry,
    };

    const rosterMember: RosterMember = {
      id: member.id.toString(),
      playerNumber: member.playernumber,
      inactive: member.inactive,
      submittedWaiver: member.submittedwaiver,
      dateAdded: member.dateadded,
      player: player,
    };

    return rosterMember;
  }

  static formatUpdateRosterMemberResponse(
    rosterMember: RosterMember,
    playerName: string,
  ): ApiResponse<{
    message: string;
    rosterMember: RosterMember;
  }> {
    return {
      success: true,
      data: {
        message: `Roster information updated for "${playerName}"`,
        rosterMember,
      },
    };
  }

  static formatActivatePlayerResponse(
    rosterMember: RosterMember,
    playerName: string,
  ): ApiResponse<{
    message: string;
    rosterMember: RosterMember;
  }> {
    return {
      success: true,
      data: {
        message: `Player "${playerName}" has been reactivated`,
        rosterMember,
      },
    };
  }

  static formatDeletePlayerResponse(playerName: string): ApiResponse<{ message: string }> {
    return {
      success: true,
      data: {
        message: `Player "${playerName}" has been permanently removed from the roster`,
      },
    };
  }
}

export class StatsResponseFormatter {
  static formatTeamGamesResponse(gamesData: {
    upcoming?: GameInfo[];
    recent?: GameInfo[];
  }): ApiResponse<{ upcoming?: GameInfo[]; recent?: GameInfo[] }> {
    return {
      success: true,
      data: gamesData,
    };
  }

  static formatBattingStatsResponse(battingStats: BattingStat[]): ApiResponse<BattingStat[]> {
    return {
      success: true,
      data: battingStats,
    };
  }

  static formatPitchingStatsResponse(pitchingStats: PitchingStat[]): ApiResponse<PitchingStat[]> {
    return {
      success: true,
      data: pitchingStats,
    };
  }
}

export class ManagerResponseFormatter {
  static formatManagersListResponse(rawManagers: dbTeamManagerWithContact[]): TeamManagerType[] {
    return rawManagers.map((manager) => ({
      id: manager.id.toString(),
      teamSeasonId: manager.teamseasonid.toString(),
      contact: {
        id: manager.contacts.id.toString(),
        creatoraccountid: '', // Placeholder, as creatoraccountid is not in RawManager
        userId: manager.contacts.userid || undefined,
        firstName: manager.contacts.firstname,
        lastName: manager.contacts.lastname,
        middleName: manager.contacts.middlename || '',
        email: manager.contacts.email || undefined,
        contactroles: [],
      },
    }));
  }

  static formatAddManagerResponse(rawManager: dbTeamManagerWithContact): TeamManagerType {
    return {
      id: rawManager.id.toString(),
      teamSeasonId: rawManager.teamseasonid.toString(),
      contact: {
        id: rawManager.contacts.id.toString(),
        userId: rawManager.contacts.userid || undefined,
        firstName: rawManager.contacts.firstname,
        lastName: rawManager.contacts.lastname,
        middleName: rawManager.contacts.middlename || '',
        email: rawManager.contacts.email || undefined,
      },
    };
  }
}
