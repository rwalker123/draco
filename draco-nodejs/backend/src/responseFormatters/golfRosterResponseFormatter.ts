import {
  GolfRosterEntryType,
  GolfPlayerType,
  GolfSubstituteType,
  AvailablePlayerType,
} from '@draco/shared-schemas';
import {
  GolfRosterWithContact,
  GolfSubstituteEntry,
  AvailableContact,
} from '../repositories/interfaces/IGolfRosterRepository.js';

export class GolfRosterResponseFormatter {
  private static formatPlayer(contact: GolfRosterWithContact['contacts']): GolfPlayerType {
    return {
      id: contact.id.toString(),
      firstName: contact.firstname,
      lastName: contact.lastname,
      middleName: contact.middlename || undefined,
    };
  }

  static format(entry: GolfRosterWithContact): GolfRosterEntryType {
    return {
      id: entry.id.toString(),
      contactId: entry.contactid.toString(),
      teamSeasonId: entry.teamseasonid.toString(),
      isActive: entry.isactive,
      isSub: entry.issub,
      initialDifferential: entry.initialdifferential ?? undefined,
      player: this.formatPlayer(entry.contacts),
    };
  }

  static formatMany(entries: GolfRosterWithContact[]): GolfRosterEntryType[] {
    return entries.map((entry) => this.format(entry));
  }

  static formatSubstitute(entry: GolfSubstituteEntry): GolfSubstituteType {
    return {
      id: entry.id.toString(),
      contactId: entry.contactid.toString(),
      teamSeasonId: entry.teamseasonid.toString(),
      isActive: entry.isactive,
      isSub: entry.issub,
      initialDifferential: entry.initialdifferential ?? undefined,
      subSeasonId: entry.subseasonid?.toString() ?? undefined,
      player: this.formatPlayer(entry.contacts),
    };
  }

  static formatSubstitutes(entries: GolfSubstituteEntry[]): GolfSubstituteType[] {
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
      .filter((contact) => contact.golfroster.length === 0)
      .map((contact) => this.formatAvailablePlayer(contact));
  }
}
