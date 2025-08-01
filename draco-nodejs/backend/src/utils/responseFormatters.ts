import { TeamSeasonSummary, TeamSeasonDetails } from '../services/teamService';
import { RosterMember, AvailablePlayer } from '../services/rosterService';
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
      middlename: string | null;
      email: string | null;
      phone1: string | null;
      phone2: string | null;
      phone3: string | null;
      streetaddress: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      dateofbirth: string | null;
      phones: Array<{ type: string; number: string }>;
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

  static formatTeamDetailsResponse(
    teamSeason: TeamSeasonDetails,
  ): ApiResponse<{
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
              ...member.player.contact,
              id: member.player.contact.id.toString(),
              dateofbirth: member.player.contact.dateofbirth
                ? member.player.contact.dateofbirth.toISOString()
                : null,
              phones: [
                ...(member.player.contact.phone1
                  ? [{ type: 'home', number: member.player.contact.phone1 }]
                  : []),
                ...(member.player.contact.phone2
                  ? [{ type: 'work', number: member.player.contact.phone2 }]
                  : []),
                ...(member.player.contact.phone3
                  ? [{ type: 'cell', number: member.player.contact.phone3 }]
                  : []),
              ],
            },
          },
        })),
      },
    };
  }

  static formatAvailablePlayersResponse(
    availablePlayers: AvailablePlayer[],
  ): ApiResponse<{
    availablePlayers: Array<{
      id: string;
      contactId: string;
      firstYear: number | null;
      submittedDriversLicense: boolean | null;
      contact: { id: string; firstname: string; lastname: string; middlename: string | null };
    }>;
  }> {
    return {
      success: true,
      data: {
        availablePlayers: availablePlayers.map((player) => ({
          id: player.id.toString(),
          contactId: player.contactId.toString(),
          firstYear: player.firstYear,
          submittedDriversLicense: player.submittedDriversLicense,
          contact: {
            id: player.contact.id.toString(),
            firstname: player.contact.firstname,
            lastname: player.contact.lastname,
            middlename: player.contact.middlename,
          },
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
        contact: { id: string; firstname: string; lastname: string };
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
            contact: {
              id: rosterMember.player.contact.id.toString(),
              firstname: rosterMember.player.contact.firstname,
              lastname: rosterMember.player.contact.lastname,
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
              firstname: rosterMember.player.contact.firstname,
              lastname: rosterMember.player.contact.lastname,
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
              firstname: rosterMember.player.contact.firstname,
              lastname: rosterMember.player.contact.lastname,
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
              firstname: rosterMember.player.contact.firstname,
              lastname: rosterMember.player.contact.lastname,
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
