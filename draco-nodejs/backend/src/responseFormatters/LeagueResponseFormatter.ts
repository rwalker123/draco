import { LeagueType } from '@draco/shared-schemas';
import { dbLeague } from '../repositories/index.js';

export class LeagueResponseFormatter {
  static format(league: dbLeague): LeagueType {
    return {
      id: league.id.toString(),
      name: league.name,
      accountId: league.accountid.toString(),
    };
  }

  static formatMany(leagues: dbLeague[]): LeagueType[] {
    return leagues.map((league) => this.format(league));
  }
}
