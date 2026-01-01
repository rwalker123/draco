import { GolfFlightType, GolfFlightWithTeamCountType } from '@draco/shared-schemas';
import {
  GolfFlightWithDetails,
  GolfFlightWithCounts,
} from '../repositories/interfaces/IGolfFlightRepository.js';

export class GolfFlightResponseFormatter {
  static format(flight: GolfFlightWithDetails): GolfFlightType {
    return {
      id: flight.id.toString(),
      name: flight.divisiondefs.name,
      season: {
        id: flight.leagueseason.id.toString(),
        name: flight.leagueseason.season.name,
      },
    };
  }

  static formatMany(flights: GolfFlightWithDetails[]): GolfFlightType[] {
    return flights.map((flight) => this.format(flight));
  }

  static formatWithCounts(flight: GolfFlightWithCounts): GolfFlightWithTeamCountType {
    return {
      ...this.format(flight),
      teamCount: flight._count.teamsseason,
      playerCount: flight.playerCount,
    };
  }

  static formatManyWithCounts(flights: GolfFlightWithCounts[]): GolfFlightWithTeamCountType[] {
    return flights.map((flight) => this.formatWithCounts(flight));
  }
}
