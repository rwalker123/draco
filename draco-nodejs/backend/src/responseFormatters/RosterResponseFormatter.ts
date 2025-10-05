import { BaseContactType, RosterMemberType, TeamRosterMembersType } from '@draco/shared-schemas';
import {
  dbBaseContact,
  dbRosterMember,
  dbRosterSeason,
  dbTeamSeason,
} from '../repositories/index.js';
import { ContactResponseFormatter } from './responseFormatters.js';

export class RosterResponseFormatter {
  static formatRosterMembersResponse(
    dbTeamSeason: dbTeamSeason,
    dbRosterMembers: dbRosterSeason[],
  ): TeamRosterMembersType {
    const rosterMembers: RosterMemberType[] = dbRosterMembers.map((member) =>
      this.formatRosterMemberResponse(member),
    );

    const teamRosterMembers: TeamRosterMembersType = {
      teamSeason: {
        id: dbTeamSeason.id.toString(),
        name: dbTeamSeason.name,
      },
      rosterMembers,
    };

    return teamRosterMembers;
  }

  static formatRosterMemberResponse(member: dbRosterMember): RosterMemberType {
    const contact: dbBaseContact = member.roster.contacts;

    const contactEntry: BaseContactType = ContactResponseFormatter.formatContactResponse(contact);

    return {
      id: member.id.toString(),
      playerNumber: member.playernumber,
      inactive: member.inactive,
      submittedWaiver: member.submittedwaiver,
      dateAdded: member.dateadded,
      player: {
        id: member.roster.id.toString(),
        submittedDriversLicense: member.roster.submitteddriverslicense,
        firstYear: member.roster.firstyear,
        contact: contactEntry,
      },
    };
  }
}
