import { PrismaClient } from '#prisma/client';
import {
  dbContactEmailOnly,
  dbLeagueSeasonBasic,
  dbSeason,
  dbSeasonCopySource,
  dbSeasonWithLeagues,
} from '../types/dbTypes.js';
import { ISeasonsRepository } from '../interfaces/ISeasonsRepository.js';

export class PrismaSeasonsRepository implements ISeasonsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAccountSeasons(
    accountId: bigint,
    includeDivisions: boolean,
  ): Promise<dbSeasonWithLeagues[]> {
    const seasons = await this.prisma.season.findMany({
      where: { accountid: accountId },
      select: {
        id: true,
        name: true,
        accountid: true,
        leagueseason: {
          select: {
            id: true,
            leagueid: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
            divisionseason: {
              select: {
                id: true,
                priority: true,
                divisiondefs: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'desc' },
    });

    return seasons.map((season) => ({
      ...season,
      leagueseason: season.leagueseason.map((leagueSeason) => ({
        ...leagueSeason,
        divisionseason: includeDivisions ? leagueSeason.divisionseason : undefined,
      })),
    }));
  }

  async findSeasonWithLeagues(
    accountId: bigint,
    seasonId: bigint,
    includeDivisions: boolean,
  ): Promise<dbSeasonWithLeagues | null> {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, accountid: accountId },
      select: {
        id: true,
        name: true,
        accountid: true,
        leagueseason: {
          select: {
            id: true,
            leagueid: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
            divisionseason: {
              select: {
                id: true,
                priority: true,
                divisiondefs: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!season) {
      return null;
    }

    return {
      ...season,
      leagueseason: season.leagueseason.map((leagueSeason) => ({
        ...leagueSeason,
        divisionseason: includeDivisions ? leagueSeason.divisionseason : undefined,
      })),
    };
  }

  async findSeasonById(accountId: bigint, seasonId: bigint): Promise<dbSeason | null> {
    return this.prisma.season.findFirst({
      where: { id: seasonId, accountid: accountId },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async findSeasonByName(
    accountId: bigint,
    name: string,
    excludeSeasonId?: bigint,
  ): Promise<dbSeason | null> {
    return this.prisma.season.findFirst({
      where: {
        accountid: accountId,
        name,
        ...(excludeSeasonId ? { id: { not: excludeSeasonId } } : {}),
      },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async createSeason(data: { name: string; accountid: bigint }): Promise<dbSeason> {
    return this.prisma.season.create({
      data,
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async updateSeasonName(seasonId: bigint, name: string): Promise<dbSeason> {
    return this.prisma.season.update({
      where: { id: seasonId },
      data: { name },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async deleteSeason(seasonId: bigint): Promise<dbSeason> {
    return this.prisma.season.delete({
      where: { id: seasonId },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async findCurrentSeason(accountId: bigint): Promise<dbSeason | null> {
    const currentSeason = await this.prisma.currentseason.findFirst({
      where: { accountid: accountId },
    });
    if (!currentSeason) {
      return null;
    }
    return await this.prisma.season.findUnique({
      where: { id: currentSeason.seasonid },
    });
  }

  async upsertCurrentSeason(accountId: bigint, seasonId: bigint): Promise<void> {
    await this.prisma.currentseason.upsert({
      where: { accountid: accountId },
      update: { seasonid: seasonId },
      create: { accountid: accountId, seasonid: seasonId },
    });
  }

  async createLeagueSeason(seasonId: bigint, leagueId: bigint): Promise<dbLeagueSeasonBasic> {
    return this.prisma.leagueseason.create({
      data: {
        seasonid: seasonId,
        leagueid: leagueId,
      },
      select: {
        id: true,
        seasonid: true,
        leagueid: true,
        league: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findSeasonForCopy(accountId: bigint, seasonId: bigint): Promise<dbSeasonCopySource | null> {
    return this.prisma.season.findFirst({
      where: { id: seasonId, accountid: accountId },
      select: {
        id: true,
        name: true,
        accountid: true,
        accounts: {
          select: {
            accounttypes: {
              select: {
                name: true,
              },
            },
          },
        },
        leagueseason: {
          select: {
            id: true,
            leagueid: true,
            divisionseason: {
              select: {
                id: true,
                divisionid: true,
                priority: true,
              },
            },
            teamsseason: {
              select: {
                id: true,
                teamid: true,
                name: true,
                divisionseasonid: true,
                rosterseason: {
                  where: { inactive: false },
                  select: {
                    playerid: true,
                    playernumber: true,
                    dateadded: true,
                  },
                },
                golfroster: {
                  where: { isactive: true },
                  select: {
                    golferid: true,
                    isactive: true,
                  },
                },
                teamseasonmanager: {
                  select: {
                    contactid: true,
                  },
                },
              },
            },
            golfleaguesetup: {
              select: {
                leagueday: true,
                firstteetime: true,
                timebetweenteetimes: true,
                holespermatch: true,
                teeoffformat: true,
                scoringtype: true,
                usebestball: true,
                usehandicapscoring: true,
                perholepoints: true,
                perninepoints: true,
                permatchpoints: true,
                totalholespoints: true,
                againstfieldpoints: true,
                againstfielddescpoints: true,
              },
            },
            golfseasonconfig: {
              select: {
                teamsize: true,
              },
            },
          },
        },
      },
    });
  }

  async copySeasonStructure(
    accountId: bigint,
    sourceSeason: dbSeasonCopySource,
    newSeasonName: string,
  ): Promise<dbSeasonWithLeagues> {
    const accountTypeName = sourceSeason.accounts.accounttypes.name;
    const isGolfAccount = accountTypeName.toLowerCase().includes('golf');

    return this.prisma.$transaction(async (tx) => {
      const createdSeason = await tx.season.create({
        data: {
          accountid: accountId,
          name: newSeasonName,
        },
        select: { id: true },
      });

      for (const leagueSeason of sourceSeason.leagueseason) {
        const createdLeagueSeason = await tx.leagueseason.create({
          data: {
            seasonid: createdSeason.id,
            leagueid: leagueSeason.leagueid,
          },
          select: { id: true },
        });

        const divisionSeasonIdMap = new Map<bigint, bigint>();

        for (const division of leagueSeason.divisionseason) {
          const createdDivisionSeason = await tx.divisionseason.create({
            data: {
              divisionid: division.divisionid,
              leagueseasonid: createdLeagueSeason.id,
              priority: division.priority,
            },
            select: { id: true },
          });
          divisionSeasonIdMap.set(division.id, createdDivisionSeason.id);
        }

        for (const teamSeason of leagueSeason.teamsseason) {
          let divisionSeasonId: bigint | null = null;
          if (teamSeason.divisionseasonid !== null) {
            const mappedDivisionSeasonId = divisionSeasonIdMap.get(teamSeason.divisionseasonid);
            if (mappedDivisionSeasonId === undefined) {
              throw new Error(
                `DivisionSeason mapping missing for teamSeason.divisionseasonid=${teamSeason.divisionseasonid}`,
              );
            }
            divisionSeasonId = mappedDivisionSeasonId;
          }

          const createdTeamSeason = await tx.teamsseason.create({
            data: {
              leagueseasonid: createdLeagueSeason.id,
              teamid: teamSeason.teamid,
              name: teamSeason.name,
              divisionseasonid: divisionSeasonId,
            },
            select: { id: true },
          });

          if (isGolfAccount) {
            if (teamSeason.golfroster.length > 0) {
              await tx.golfroster.createMany({
                data: teamSeason.golfroster.map((roster) => ({
                  golferid: roster.golferid,
                  teamseasonid: createdTeamSeason.id,
                  isactive: true,
                })),
              });
            }
          } else {
            if (teamSeason.rosterseason.length > 0) {
              await tx.rosterseason.createMany({
                data: teamSeason.rosterseason.map((roster) => ({
                  playerid: roster.playerid,
                  playernumber: roster.playernumber,
                  dateadded: roster.dateadded,
                  teamseasonid: createdTeamSeason.id,
                  inactive: false,
                  submittedwaiver: false,
                })),
              });
            }
          }

          if (teamSeason.teamseasonmanager.length > 0) {
            await tx.teamseasonmanager.createMany({
              data: teamSeason.teamseasonmanager.map((manager) => ({
                contactid: manager.contactid,
                teamseasonid: createdTeamSeason.id,
              })),
            });
          }
        }

        if (isGolfAccount && leagueSeason.golfleaguesetup) {
          await tx.golfleaguesetup.create({
            data: {
              accountid: accountId,
              leagueseasonid: createdLeagueSeason.id,
              leagueday: leagueSeason.golfleaguesetup.leagueday,
              firstteetime: leagueSeason.golfleaguesetup.firstteetime,
              timebetweenteetimes: leagueSeason.golfleaguesetup.timebetweenteetimes,
              holespermatch: leagueSeason.golfleaguesetup.holespermatch,
              teeoffformat: leagueSeason.golfleaguesetup.teeoffformat,
              scoringtype: leagueSeason.golfleaguesetup.scoringtype,
              usebestball: leagueSeason.golfleaguesetup.usebestball,
              usehandicapscoring: leagueSeason.golfleaguesetup.usehandicapscoring,
              perholepoints: leagueSeason.golfleaguesetup.perholepoints,
              perninepoints: leagueSeason.golfleaguesetup.perninepoints,
              permatchpoints: leagueSeason.golfleaguesetup.permatchpoints,
              totalholespoints: leagueSeason.golfleaguesetup.totalholespoints,
              againstfieldpoints: leagueSeason.golfleaguesetup.againstfieldpoints,
              againstfielddescpoints: leagueSeason.golfleaguesetup.againstfielddescpoints,
            },
          });
        }

        if (isGolfAccount && leagueSeason.golfseasonconfig) {
          await tx.golfseasonconfig.create({
            data: {
              leagueseasonid: createdLeagueSeason.id,
              teamsize: leagueSeason.golfseasonconfig.teamsize,
            },
          });
        }
      }

      const copiedSeason = await tx.season.findFirst({
        where: { id: createdSeason.id, accountid: accountId },
        select: {
          id: true,
          name: true,
          accountid: true,
          leagueseason: {
            select: {
              id: true,
              leagueid: true,
              league: {
                select: {
                  id: true,
                  name: true,
                },
              },
              divisionseason: {
                select: {
                  id: true,
                  priority: true,
                  divisiondefs: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!copiedSeason) {
        throw new Error('Copied season not found after creation');
      }

      return copiedSeason;
    });
  }

  async countSeasonParticipants(accountId: bigint, seasonId: bigint): Promise<number> {
    return this.prisma.contacts.count({
      where: {
        roster: {
          rosterseason: {
            some: {
              teamsseason: {
                leagueseason: {
                  seasonid: seasonId,
                },
              },
            },
          },
        },
        creatoraccountid: accountId,
      },
    });
  }

  async findSeasonParticipants(accountId: bigint, seasonId: bigint): Promise<dbContactEmailOnly[]> {
    return this.prisma.contacts.findMany({
      where: {
        roster: {
          rosterseason: {
            some: {
              teamsseason: {
                leagueseason: {
                  seasonid: seasonId,
                },
              },
            },
          },
        },
        creatoraccountid: accountId,
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
      },
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
    });
  }
}
