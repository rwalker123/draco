import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors';

export interface ContactInfo {
  id: bigint;
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
  dateofbirth: Date | null;
}

export interface RosterPlayer {
  id: bigint;
  contactId: bigint;
  submittedDriversLicense: boolean | null;
  firstYear: number | null;
  contact: ContactInfo;
}

export interface RosterMember {
  id: bigint;
  playerNumber: number;
  inactive: boolean;
  submittedWaiver: boolean;
  dateAdded: Date | null;
  player: RosterPlayer;
}

export interface AvailablePlayer {
  id: bigint;
  contactId: bigint;
  firstYear: number | null;
  submittedDriversLicense: boolean | null;
  contact: {
    id: bigint;
    firstname: string;
    lastname: string;
    middlename: string | null;
  };
}

export interface AddPlayerRequest {
  playerId: string;
  playerNumber?: number;
  submittedWaiver?: boolean;
  submittedDriversLicense?: boolean;
  firstYear?: number;
}

export interface UpdateRosterMemberRequest {
  playerNumber?: number;
  submittedWaiver?: boolean;
  submittedDriversLicense?: boolean;
  firstYear?: number;
}

export class RosterService {
  constructor(private prisma: PrismaClient) {}

  async getRosterMembers(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<RosterMember[]> {
    // Verify the team season exists and belongs to this account and season
    const teamSeason = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    // Get all roster members for this team season
    const rosterMembers = await this.prisma.rosterseason.findMany({
      where: {
        teamseasonid: teamSeasonId,
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                middlename: true,
                email: true,
                phone1: true,
                phone2: true,
                phone3: true,
                streetaddress: true,
                city: true,
                state: true,
                zip: true,
                dateofbirth: true,
              },
            },
          },
        },
      },
      orderBy: [{ inactive: 'asc' }, { playernumber: 'asc' }],
    });

    return rosterMembers.map((member) => ({
      id: member.id,
      playerNumber: member.playernumber,
      inactive: member.inactive,
      submittedWaiver: member.submittedwaiver,
      dateAdded: member.dateadded,
      player: {
        id: member.roster.id,
        contactId: member.roster.contactid,
        submittedDriversLicense: member.roster.submitteddriverslicense,
        firstYear: member.roster.firstyear,
        contact: member.roster.contacts,
      },
    }));
  }

  async getAvailablePlayers(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    _includeFull: boolean = false,
  ): Promise<AvailablePlayer[]> {
    // Verify the team season exists and belongs to this account and season
    const teamSeason = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    // Get the leagueseasonid for this team
    const leagueSeasonId = teamSeason.leagueseasonid;

    // Get all roster players for this account
    const allRosterPlayers = await this.prisma.roster.findMany({
      where: {
        contacts: {
          creatoraccountid: accountId,
        },
      },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            middlename: true,
            email: true,
            phone1: true,
            phone2: true,
            phone3: true,
            streetaddress: true,
            city: true,
            state: true,
            zip: true,
            dateofbirth: true,
          },
        },
      },
      orderBy: [
        { contacts: { lastname: 'asc' } },
        { contacts: { firstname: 'asc' } },
        { contacts: { middlename: 'asc' } },
      ],
    });

    // Get all players already on teams in this league season
    const assignedPlayers = await this.prisma.rosterseason.findMany({
      where: {
        teamsseason: {
          leagueseasonid: leagueSeasonId,
        },
      },
      select: {
        playerid: true,
      },
    });

    const assignedPlayerIds = new Set(assignedPlayers.map((p) => p.playerid));

    // Filter out players already assigned to teams in this league season
    const availablePlayers = allRosterPlayers.filter((player) => !assignedPlayerIds.has(player.id));

    return availablePlayers.map((player) => ({
      id: player.id,
      contactId: player.contactid,
      firstYear: player.firstyear,
      submittedDriversLicense: player.submitteddriverslicense,
      contact: {
        id: player.contacts.id,
        firstname: player.contacts.firstname,
        lastname: player.contacts.lastname,
        middlename: player.contacts.middlename,
      },
    }));
  }

  async addPlayerToRoster(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    addPlayerData: AddPlayerRequest,
  ): Promise<RosterMember> {
    const { playerId, playerNumber, submittedWaiver, submittedDriversLicense, firstYear } =
      addPlayerData;

    if (!playerId) {
      throw new ValidationError('PlayerId is required');
    }

    // Validate player number
    if (playerNumber !== undefined && playerNumber < 0) {
      throw new ValidationError('Player number must be 0 or greater');
    }

    // Verify the team season exists and belongs to this account and season
    const teamSeason = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    // Verify the player exists and belongs to this account
    const player = await this.prisma.roster.findFirst({
      where: {
        id: BigInt(playerId),
        contacts: {
          creatoraccountid: accountId,
        },
      },
      include: {
        contacts: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Get the leagueseasonid for this team
    const leagueSeasonId = teamSeason.leagueseasonid;

    // Check if player is already on a team in this league season
    const existingRosterMember = await this.prisma.rosterseason.findFirst({
      where: {
        playerid: BigInt(playerId),
        teamsseason: {
          leagueseasonid: leagueSeasonId,
        },
      },
    });

    if (existingRosterMember) {
      throw new ConflictError('Player is already on a team in this season');
    }

    // Update player's roster information if provided
    if (submittedDriversLicense !== undefined || firstYear !== undefined) {
      await this.prisma.roster.update({
        where: { id: BigInt(playerId) },
        data: {
          submitteddriverslicense:
            submittedDriversLicense !== undefined
              ? submittedDriversLicense
              : player.submitteddriverslicense,
          firstyear: firstYear !== undefined ? firstYear : player.firstyear,
        },
      });
    }

    // Add player to roster
    const newRosterMember = await this.prisma.rosterseason.create({
      data: {
        playerid: BigInt(playerId),
        teamseasonid: teamSeasonId,
        playernumber: playerNumber || 0,
        inactive: false,
        submittedwaiver: submittedWaiver || false,
        dateadded: new Date(),
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                middlename: true,
                email: true,
                phone1: true,
                phone2: true,
                phone3: true,
                streetaddress: true,
                city: true,
                state: true,
                zip: true,
                dateofbirth: true,
              },
            },
          },
        },
      },
    });

    return {
      id: newRosterMember.id,
      playerNumber: newRosterMember.playernumber,
      inactive: newRosterMember.inactive,
      submittedWaiver: newRosterMember.submittedwaiver,
      dateAdded: newRosterMember.dateadded,
      player: {
        id: newRosterMember.roster.id,
        contactId: newRosterMember.roster.contactid,
        submittedDriversLicense: newRosterMember.roster.submitteddriverslicense,
        firstYear: newRosterMember.roster.firstyear,
        contact: newRosterMember.roster.contacts,
      },
    };
  }

  async updateRosterMember(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    updateData: UpdateRosterMemberRequest,
  ): Promise<RosterMember> {
    const { playerNumber, submittedWaiver, submittedDriversLicense, firstYear } = updateData;

    // Validate player number
    if (playerNumber !== undefined && playerNumber < 0) {
      throw new ValidationError('Player number must be 0 or greater');
    }

    // Verify the roster member exists and belongs to this team season
    const rosterMember = await this.prisma.rosterseason.findFirst({
      where: {
        id: rosterMemberId,
        teamseasonid: teamSeasonId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                middlename: true,
                email: true,
                phone1: true,
                phone2: true,
                phone3: true,
                streetaddress: true,
                city: true,
                state: true,
                zip: true,
                dateofbirth: true,
              },
            },
          },
        },
      },
    });

    if (!rosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    // Update roster season data
    const updatedRosterMember = await this.prisma.rosterseason.update({
      where: { id: rosterMemberId },
      data: {
        playernumber: playerNumber !== undefined ? playerNumber : rosterMember.playernumber,
        submittedwaiver:
          submittedWaiver !== undefined ? submittedWaiver : rosterMember.submittedwaiver,
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                middlename: true,
                email: true,
                phone1: true,
                phone2: true,
                phone3: true,
                streetaddress: true,
                city: true,
                state: true,
                zip: true,
                dateofbirth: true,
              },
            },
          },
        },
      },
    });

    // Update roster data (player-specific data)
    const updatedRoster = await this.prisma.roster.update({
      where: { id: rosterMember.playerid },
      data: {
        submitteddriverslicense:
          submittedDriversLicense !== undefined
            ? submittedDriversLicense
            : rosterMember.roster.submitteddriverslicense,
        firstyear: firstYear !== undefined ? firstYear : rosterMember.roster.firstyear,
      },
    });

    return {
      id: updatedRosterMember.id,
      playerNumber: updatedRosterMember.playernumber,
      inactive: updatedRosterMember.inactive,
      submittedWaiver: updatedRosterMember.submittedwaiver,
      dateAdded: updatedRosterMember.dateadded,
      player: {
        id: updatedRosterMember.roster.id,
        contactId: updatedRosterMember.roster.contactid,
        submittedDriversLicense: updatedRoster.submitteddriverslicense,
        firstYear: updatedRoster.firstyear,
        contact: updatedRosterMember.roster.contacts,
      },
    };
  }

  async releasePlayer(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<RosterMember> {
    // Verify the roster member exists and belongs to this team season
    const rosterMember = await this.prisma.rosterseason.findFirst({
      where: {
        id: rosterMemberId,
        teamseasonid: teamSeasonId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                middlename: true,
                email: true,
                phone1: true,
                phone2: true,
                phone3: true,
                streetaddress: true,
                city: true,
                state: true,
                zip: true,
                dateofbirth: true,
              },
            },
          },
        },
      },
    });

    if (!rosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    if (rosterMember.inactive) {
      throw new ConflictError('Player is already released');
    }

    // Release the player
    const updatedRosterMember = await this.prisma.rosterseason.update({
      where: { id: rosterMemberId },
      data: { inactive: true },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                middlename: true,
                email: true,
                phone1: true,
                phone2: true,
                phone3: true,
                streetaddress: true,
                city: true,
                state: true,
                zip: true,
                dateofbirth: true,
              },
            },
          },
        },
      },
    });

    return {
      id: updatedRosterMember.id,
      playerNumber: updatedRosterMember.playernumber,
      inactive: updatedRosterMember.inactive,
      submittedWaiver: updatedRosterMember.submittedwaiver,
      dateAdded: updatedRosterMember.dateadded,
      player: {
        id: updatedRosterMember.roster.id,
        contactId: updatedRosterMember.roster.contactid,
        submittedDriversLicense: updatedRosterMember.roster.submitteddriverslicense,
        firstYear: updatedRosterMember.roster.firstyear,
        contact: updatedRosterMember.roster.contacts,
      },
    };
  }

  async activatePlayer(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<RosterMember> {
    // Verify the roster member exists and belongs to this team season
    const rosterMember = await this.prisma.rosterseason.findFirst({
      where: {
        id: rosterMemberId,
        teamseasonid: teamSeasonId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                middlename: true,
                email: true,
                phone1: true,
                phone2: true,
                phone3: true,
                streetaddress: true,
                city: true,
                state: true,
                zip: true,
                dateofbirth: true,
              },
            },
          },
        },
      },
    });

    if (!rosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    if (!rosterMember.inactive) {
      throw new ConflictError('Player is already active');
    }

    // Activate the player
    const updatedRosterMember = await this.prisma.rosterseason.update({
      where: { id: rosterMemberId },
      data: { inactive: false },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                middlename: true,
                email: true,
                phone1: true,
                phone2: true,
                phone3: true,
                streetaddress: true,
                city: true,
                state: true,
                zip: true,
                dateofbirth: true,
              },
            },
          },
        },
      },
    });

    return {
      id: updatedRosterMember.id,
      playerNumber: updatedRosterMember.playernumber,
      inactive: updatedRosterMember.inactive,
      submittedWaiver: updatedRosterMember.submittedwaiver,
      dateAdded: updatedRosterMember.dateadded,
      player: {
        id: updatedRosterMember.roster.id,
        contactId: updatedRosterMember.roster.contactid,
        submittedDriversLicense: updatedRosterMember.roster.submitteddriverslicense,
        firstYear: updatedRosterMember.roster.firstyear,
        contact: updatedRosterMember.roster.contacts,
      },
    };
  }

  async deleteRosterMember(
    rosterMemberId: bigint,
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<{ playerName: string }> {
    // Verify the roster member exists and belongs to this team season
    const rosterMember = await this.prisma.rosterseason.findFirst({
      where: {
        id: rosterMemberId,
        teamseasonid: teamSeasonId,
        teamsseason: {
          leagueseason: {
            seasonid: seasonId,
            league: {
              accountid: accountId,
            },
          },
        },
      },
      include: {
        roster: {
          include: {
            contacts: {
              select: {
                firstname: true,
                lastname: true,
              },
            },
          },
        },
      },
    });

    if (!rosterMember) {
      throw new NotFoundError('Roster member not found');
    }

    const playerName = `${rosterMember.roster.contacts.firstname} ${rosterMember.roster.contacts.lastname}`;

    // Permanently delete the roster member
    await this.prisma.rosterseason.delete({
      where: { id: rosterMemberId },
    });

    return { playerName };
  }
}
