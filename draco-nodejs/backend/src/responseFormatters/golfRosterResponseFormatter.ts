import {
  GolfRosterEntryType,
  GolfPlayerType,
  GolfSubstituteType,
  AvailablePlayerType,
} from '@draco/shared-schemas';
import {
  GolfRosterWithGolfer,
  GolfLeagueSubWithGolfer,
  AvailableContact,
} from '../repositories/interfaces/IGolfRosterRepository.js';

export class GolfRosterResponseFormatter {
  private static formatPlayer(contact: GolfRosterWithGolfer['golfer']['contact']): GolfPlayerType {
    return {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename || undefined,
    };
  }

  static format(entry: GolfRosterWithGolfer): GolfRosterEntryType {
    return {
      id: entry.id.toString(),
      golferId: entry.golferid.toString(),
      teamSeasonId: entry.teamseasonid.toString(),
      isActive: entry.isactive,
      initialDifferential: entry.golfer.initialdifferential ?? undefined,
      player: this.formatPlayer(entry.golfer.contact),
    };
  }

  static formatMany(entries: GolfRosterWithGolfer[]): GolfRosterEntryType[] {
    return entries.map((entry) => this.format(entry));
  }

  static formatSubstitute(entry: GolfLeagueSubWithGolfer): GolfSubstituteType {
    return {
      id: entry.id.toString(),
      golferId: entry.golferid.toString(),
      seasonId: entry.seasonid.toString(),
      isActive: entry.isactive,
      initialDifferential: entry.golfer.initialdifferential ?? undefined,
      player: this.formatPlayer(entry.golfer.contact),
    };
  }

  static formatSubstitutes(entries: GolfLeagueSubWithGolfer[]): GolfSubstituteType[] {
    return entries.map((entry) => this.formatSubstitute(entry));
  }

  static formatAvailablePlayer(contact: AvailableContact): AvailablePlayerType {
    return {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename || undefined,
      email: contact.email ?? undefined,
    };
  }

  static formatAvailablePlayers(contacts: AvailableContact[]): AvailablePlayerType[] {
    return contacts
      .filter((contact) => {
        if (!contact.golfer) return true;
        return contact.golfer.rosters.length === 0 && contact.golfer.leaguesubs.length === 0;
      })
      .map((contact) => this.formatAvailablePlayer(contact));
  }
}
