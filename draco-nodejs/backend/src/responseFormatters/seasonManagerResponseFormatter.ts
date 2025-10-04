import validator from 'validator';
import {
  LeagueNameType,
  SeasonManagerListType,
  SeasonManagerType,
  TeamSeasonNameType,
} from '@draco/shared-schemas';
import { dbSeasonManagerWithRelations } from '../repositories/index.js';

export class SeasonManagerResponseFormatter {
  static formatSeasonManagerList(
    rawManagers: dbSeasonManagerWithRelations[],
  ): SeasonManagerListType {
    const managersMap = new Map<string, SeasonManagerType>();
    const leagueNamesMap = new Map<string, LeagueNameType>();
    const teamNamesMap = new Map<string, TeamSeasonNameType>();

    for (const manager of rawManagers) {
      const contact = manager.contacts;
      const contactId = contact.id.toString();
      const teamSeason = manager.teamsseason;
      const leagueSeason = teamSeason.leagueseason;
      const leagueId = leagueSeason.id.toString();
      const teamSeasonId = teamSeason.id.toString();

      leagueNamesMap.set(leagueId, {
        id: leagueId,
        name: leagueSeason.league.name,
      });

      teamNamesMap.set(teamSeasonId, {
        id: teamSeasonId,
        name: teamSeason.name,
      });

      const teamAssignment = {
        id: teamSeasonId,
        name: teamSeason.name,
        league: {
          id: leagueId,
          name: leagueSeason.league.name,
        },
      };

      if (!managersMap.has(contactId)) {
        managersMap.set(contactId, {
          contact: {
            id: contactId,
            firstName: contact.firstname,
            lastName: contact.lastname,
            email: contact.email ?? undefined,
            contactDetails: {
              phone1: contact.phone1 ?? null,
              phone2: contact.phone2 ?? null,
              phone3: contact.phone3 ?? null,
            },
          },
          hasValidEmail: this.hasValidEmail(contact.email),
          allTeams: [teamAssignment],
        });
        continue;
      }

      managersMap.get(contactId)?.allTeams.push(teamAssignment);
    }

    return {
      managers: Array.from(managersMap.values()),
      leagueNames: Array.from(leagueNamesMap.values()),
      teamNames: Array.from(teamNamesMap.values()),
    };
  }

  private static hasValidEmail(email: string | null): boolean {
    return Boolean(email) && validator.isEmail(email);
  }
}
