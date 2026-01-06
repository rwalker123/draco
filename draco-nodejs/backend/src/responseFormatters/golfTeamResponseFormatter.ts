import {
  GolfTeamType,
  GolfTeamWithPlayerCountType,
  GolfTeamWithRosterType,
  GolfFlightType,
} from '@draco/shared-schemas';
import {
  GolfTeamWithFlight,
  GolfTeamWithRoster,
} from '../repositories/interfaces/IGolfTeamRepository.js';
import { GolfRosterResponseFormatter } from './golfRosterResponseFormatter.js';

export class GolfTeamResponseFormatter {
  private static formatFlight(
    leagueseason: GolfTeamWithFlight['leagueseason'],
  ): GolfFlightType | undefined {
    if (!leagueseason) {
      return undefined;
    }
    return {
      id: leagueseason.id.toString(),
      name: leagueseason.league.name,
    };
  }

  static format(team: GolfTeamWithFlight): GolfTeamType {
    return {
      id: team.id.toString(),
      name: team.name,
      flight: this.formatFlight(team.leagueseason),
    };
  }

  static formatMany(teams: GolfTeamWithFlight[]): GolfTeamType[] {
    return teams.map((team) => this.format(team));
  }

  static formatWithPlayerCount(team: GolfTeamWithFlight): GolfTeamWithPlayerCountType {
    return {
      id: team.id.toString(),
      name: team.name,
      flight: this.formatFlight(team.leagueseason),
      playerCount: team._count.golfroster,
    };
  }

  static formatManyWithPlayerCount(teams: GolfTeamWithFlight[]): GolfTeamWithPlayerCountType[] {
    return teams.map((team) => this.formatWithPlayerCount(team));
  }

  static formatWithRoster(team: GolfTeamWithRoster): GolfTeamWithRosterType {
    return {
      id: team.id.toString(),
      name: team.name,
      flight: this.formatFlight(team.leagueseason),
      roster: GolfRosterResponseFormatter.formatMany(team.golfroster),
      playerCount: team.golfroster.filter((r) => r.isactive).length,
    };
  }
}
