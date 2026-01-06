import { GolfFlightType, GolfFlightWithTeamCountType } from '@draco/shared-schemas';
import {
  GolfFlightWithDetails,
  GolfFlightWithCounts,
} from '../repositories/interfaces/IGolfFlightRepository.js';

export class GolfFlightResponseFormatter {
  static format(flight: GolfFlightWithDetails): GolfFlightType {
    return {
      id: flight.id.toString(),
      name: flight.league.name,
      season: {
        id: flight.seasonid.toString(),
        name: flight.season.name,
      },
    };
  }

  static formatMany(flights: GolfFlightWithDetails[]): GolfFlightType[] {
    return flights.map((flight) => this.format(flight));
  }

  static formatWithCounts(flight: GolfFlightWithCounts): GolfFlightWithTeamCountType {
    return {
      ...this.format(flight),
      teamCount: flight.teamCount,
      playerCount: flight.playerCount,
    };
  }

  static formatManyWithCounts(flights: GolfFlightWithCounts[]): GolfFlightWithTeamCountType[] {
    return flights.map((flight) => this.formatWithCounts(flight));
  }
}
