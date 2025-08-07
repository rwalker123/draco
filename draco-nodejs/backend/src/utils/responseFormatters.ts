import { TeamSeasonSummary, TeamSeasonDetails } from '../services/teamService';
import { RosterMember } from '../services/rosterService';
import { ContactEntry } from '../interfaces/contactInterfaces';
import { BattingStat, PitchingStat, GameInfo } from '../services/teamStatsService';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface FormattedRosterMember {
  id: string;
  playerNumber: number;
  inactive: boolean;
  submittedWaiver: boolean;
  dateAdded: string | null;
  player: {
    id: string;
    contactId: string;
    submittedDriversLicense: boolean | null;
    firstYear: number | null;
    contact: {
      id: string;
      firstname: string;
      lastname: string;
      middlename: string;
      email: string | null;
      phone1: string;
      phone2: string;
      phone3: string;
      photoUrl?: string;
      streetaddress: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      dateofbirth: string | null;
    };
  };
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
    teamSeason: { id: bigint; name: string },
    rosterMembers: RosterMember[],
  ): ApiResponse<{
    teamSeason: { id: string; name: string };
    rosterMembers: FormattedRosterMember[];
  }> {
    return {
      success: true,
      data: {
        teamSeason: {
          id: teamSeason.id.toString(),
          name: teamSeason.name,
        },
        rosterMembers: rosterMembers.map((member) => ({
          id: member.id.toString(),
          playerNumber: member.playerNumber,
          inactive: member.inactive,
          submittedWaiver: member.submittedWaiver,
          dateAdded: member.dateAdded ? member.dateAdded.toISOString() : null,
          player: {
            id: member.player.id.toString(),
            contactId: member.player.contactId.toString(),
            submittedDriversLicense: member.player.submittedDriversLicense,
            firstYear: member.player.firstYear,
            contact: {
              id: member.player.contact.id,
              firstname: member.player.contact.firstName,
              lastname: member.player.contact.lastName,
              middlename: member.player.contact.contactDetails?.middlename ?? '',
              email: member.player.contact.email,
              phone1: member.player.contact.contactDetails?.phone1 ?? '',
              phone2: member.player.contact.contactDetails?.phone2 ?? '',
              phone3: member.player.contact.contactDetails?.phone3 ?? '',
              photoUrl: member.player.contact.photoUrl,
              streetaddress: member.player.contact.contactDetails?.streetaddress ?? null,
              city: member.player.contact.contactDetails?.city ?? null,
              state: member.player.contact.contactDetails?.state ?? null,
              zip: member.player.contact.contactDetails?.zip ?? null,
              dateofbirth: member.player.contact.contactDetails?.dateofbirth ?? null,
            },
          },
        })),
      },
    };
  }

  static formatAvailablePlayersResponse(availablePlayers: ContactEntry[]): ApiResponse<{
    availablePlayers: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      photoUrl?: string;
      contactDetails?: {
        phone1: string | null;
        phone2: string | null;
        phone3: string | null;
        streetaddress: string | null;
        city: string | null;
        state: string | null;
        zip: string | null;
        dateofbirth: string | null;
        middlename: string | null;
      };
    }>;
  }> {
    return {
      success: true,
      data: {
        availablePlayers: availablePlayers.map((contact) => ({
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          photoUrl: contact.photoUrl,
          contactDetails: contact.contactDetails,
        })),
      },
    };
  }

  static formatAddPlayerResponse(
    rosterMember: RosterMember,
    playerName: string,
  ): ApiResponse<{
    message: string;
    rosterMember: {
      id: string;
      playerNumber: number;
      inactive: boolean;
      submittedWaiver: boolean;
      dateAdded: string | null;
      player: {
        id: string;
        contactId: string;
        submittedDriversLicense: boolean | null;
        firstYear: number | null;
        contact: {
          id: string;
          firstName: string;
          lastName: string;
          email: string | null;
          userId: string | null;
          photoUrl?: string;
          contactDetails?: {
            phone1: string | null;
            phone2: string | null;
            phone3: string | null;
            streetaddress: string | null;
            city: string | null;
            state: string | null;
            zip: string | null;
            dateofbirth: string | null;
            middlename: string | null;
          };
          contactroles: Array<{
            id: string;
            roleId: string;
            roleName: string;
            roleData: string;
            contextName?: string;
          }>;
        };
      };
    };
  }> {
    return {
      success: true,
      data: {
        message: `Player "${playerName}" signed to team roster`,
        rosterMember: {
          id: rosterMember.id.toString(),
          playerNumber: rosterMember.playerNumber,
          inactive: rosterMember.inactive,
          submittedWaiver: rosterMember.submittedWaiver,
          dateAdded: rosterMember.dateAdded ? rosterMember.dateAdded.toISOString() : null,
          player: {
            id: rosterMember.player.id.toString(),
            contactId: rosterMember.player.contactId.toString(),
            submittedDriversLicense: rosterMember.player.submittedDriversLicense,
            firstYear: rosterMember.player.firstYear,
            contact: {
              id: rosterMember.player.contact.id,
              firstName: rosterMember.player.contact.firstName,
              lastName: rosterMember.player.contact.lastName,
              email: rosterMember.player.contact.email,
              userId: rosterMember.player.contact.userId,
              photoUrl: rosterMember.player.contact.photoUrl,
              contactDetails: rosterMember.player.contact.contactDetails,
              contactroles: rosterMember.player.contact.contactroles,
            },
          },
        },
      },
    };
  }

  static formatUpdateRosterMemberResponse(
    rosterMember: RosterMember,
    playerName: string,
  ): ApiResponse<{
    message: string;
    rosterMember: {
      id: string;
      playerNumber: number;
      inactive: boolean;
      submittedWaiver: boolean;
      dateAdded: string | null;
      player: {
        id: string;
        contactId: string;
        submittedDriversLicense: boolean | null;
        firstYear: number | null;
        contact: { firstname: string; lastname: string };
      };
    };
  }> {
    return {
      success: true,
      data: {
        message: `Roster information updated for "${playerName}"`,
        rosterMember: {
          id: rosterMember.id.toString(),
          playerNumber: rosterMember.playerNumber,
          inactive: rosterMember.inactive,
          submittedWaiver: rosterMember.submittedWaiver,
          dateAdded: rosterMember.dateAdded ? rosterMember.dateAdded.toISOString() : null,
          player: {
            id: rosterMember.player.id.toString(),
            contactId: rosterMember.player.contactId.toString(),
            submittedDriversLicense: rosterMember.player.submittedDriversLicense,
            firstYear: rosterMember.player.firstYear,
            contact: {
              firstname: rosterMember.player.contact.firstName,
              lastname: rosterMember.player.contact.lastName,
            },
          },
        },
      },
    };
  }

  static formatReleasePlayerResponse(
    rosterMember: RosterMember,
    playerName: string,
  ): ApiResponse<{
    message: string;
    rosterMember: {
      id: string;
      playerNumber: number;
      inactive: boolean;
      submittedWaiver: boolean;
      dateAdded: string | null;
      player: { id: string; contactId: string; contact: { firstname: string; lastname: string } };
    };
  }> {
    return {
      success: true,
      data: {
        message: `Player "${playerName}" has been released from the team`,
        rosterMember: {
          id: rosterMember.id.toString(),
          playerNumber: rosterMember.playerNumber,
          inactive: rosterMember.inactive,
          submittedWaiver: rosterMember.submittedWaiver,
          dateAdded: rosterMember.dateAdded ? rosterMember.dateAdded.toISOString() : null,
          player: {
            id: rosterMember.player.id.toString(),
            contactId: rosterMember.player.contactId.toString(),
            contact: {
              firstname: rosterMember.player.contact.firstName,
              lastname: rosterMember.player.contact.lastName,
            },
          },
        },
      },
    };
  }

  static formatActivatePlayerResponse(
    rosterMember: RosterMember,
    playerName: string,
  ): ApiResponse<{
    message: string;
    rosterMember: {
      id: string;
      playerNumber: number;
      inactive: boolean;
      submittedWaiver: boolean;
      dateAdded: string | null;
      player: { id: string; contactId: string; contact: { firstname: string; lastname: string } };
    };
  }> {
    return {
      success: true,
      data: {
        message: `Player "${playerName}" has been reactivated`,
        rosterMember: {
          id: rosterMember.id.toString(),
          playerNumber: rosterMember.playerNumber,
          inactive: rosterMember.inactive,
          submittedWaiver: rosterMember.submittedWaiver,
          dateAdded: rosterMember.dateAdded ? rosterMember.dateAdded.toISOString() : null,
          player: {
            id: rosterMember.player.id.toString(),
            contactId: rosterMember.player.contactId.toString(),
            contact: {
              firstname: rosterMember.player.contact.firstName,
              lastname: rosterMember.player.contact.lastName,
            },
          },
        },
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
