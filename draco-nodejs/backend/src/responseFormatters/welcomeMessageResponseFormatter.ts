import { WelcomeMessageType } from '@draco/shared-schemas';
import { dbWelcomeMessage } from '../repositories/types/dbTypes.js';

export class WelcomeMessageResponseFormatter {
  static format(record: dbWelcomeMessage): WelcomeMessageType {
    const isTeamScoped = Boolean(record.teamid && record.teamid !== BigInt(0));

    return {
      id: record.id.toString(),
      accountId: record.accountid.toString(),
      teamId: isTeamScoped ? record.teamid?.toString() : undefined,
      isTeamScoped,
      scope: isTeamScoped ? 'team' : 'account',
      caption: record.captionmenu,
      order: record.orderno,
      bodyHtml: record.welcometext ?? '',
    } satisfies WelcomeMessageType;
  }

  static formatMany(records: dbWelcomeMessage[]): WelcomeMessageType[] {
    return records.map((record) => this.format(record));
  }
}
