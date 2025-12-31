import { GolfTeamType, GolfTeamWithRosterType, GolfFlightType } from '@draco/shared-schemas';
import {
  GolfTeamWithFlight,
  GolfTeamWithRoster,
} from '../repositories/interfaces/IGolfTeamRepository.js';
import { GolfRosterResponseFormatter } from './golfRosterResponseFormatter.js';

export class GolfTeamResponseFormatter {
  private static formatFlight(
    divisionseason: GolfTeamWithFlight['divisionseason'],
  ): GolfFlightType | undefined {
    if (!divisionseason) {
      return undefined;
    }
    return {
      id: divisionseason.id.toString(),
      name: divisionseason.divisiondefs.name,
    };
  }

  static format(team: GolfTeamWithFlight): GolfTeamType {
    return {
      id: team.id.toString(),
      name: team.name,
      flight: this.formatFlight(team.divisionseason),
    };
  }

  static formatMany(teams: GolfTeamWithFlight[]): GolfTeamType[] {
    return teams.map((team) => this.format(team));
  }

  static formatWithRoster(team: GolfTeamWithRoster): GolfTeamWithRosterType {
    return {
      id: team.id.toString(),
      name: team.name,
      flight: this.formatFlight(team.divisionseason),
      roster: GolfRosterResponseFormatter.formatMany(team.golfroster),
      playerCount: team.golfroster.filter((r) => r.isactive).length,
    };
  }
}
