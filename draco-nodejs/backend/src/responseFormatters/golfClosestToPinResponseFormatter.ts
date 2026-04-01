import { GolfClosestToPinEntryType } from '@draco/shared-schemas';
import { GolfClosestToPinWithDetails } from '../repositories/interfaces/IGolfClosestToPinRepository.js';

export class GolfClosestToPinResponseFormatter {
  static format(entry: GolfClosestToPinWithDetails): GolfClosestToPinEntryType {
    return {
      id: entry.id.toString(),
      matchId: entry.matchid.toString(),
      holeNumber: entry.holeno,
      contactId: entry.contacts.id.toString(),
      firstName: entry.contacts.firstname,
      lastName: entry.contacts.lastname,
      distance: entry.distance,
      unit: entry.unit,
      matchDate: entry.golfmatch.matchdate.toISOString(),
      weekNumber: entry.golfmatch.weeknumber ?? undefined,
    };
  }

  static formatMany(entries: GolfClosestToPinWithDetails[]): GolfClosestToPinEntryType[] {
    return entries.map((entry) => this.format(entry));
  }
}
