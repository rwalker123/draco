import { HandoutType } from '@draco/shared-schemas';
import { dbAccountHandout, dbTeamHandout } from '../repositories/types/index.js';

export class HandoutResponseFormatter {
  static formatAccountHandout(handout: dbAccountHandout): HandoutType {
    const id = handout.id.toString();
    const accountId = handout.accountid.toString();
    return {
      id,
      description: handout.description ?? '',
      fileName: handout.filename,
      accountId,
      downloadUrl: `/api/accounts/${accountId}/handouts/${id}/download`,
    } satisfies HandoutType;
  }

  static formatTeamHandout(handout: dbTeamHandout, accountId: bigint): HandoutType {
    const id = handout.id.toString();
    const teamId = handout.teamid.toString();
    const accountIdStr = accountId.toString();

    return {
      id,
      description: handout.description ?? '',
      fileName: handout.filename,
      accountId: accountIdStr,
      teamId,
      downloadUrl: `/api/accounts/${accountIdStr}/teams/${teamId}/handouts/${id}/download`,
    } satisfies HandoutType;
  }

  static formatAccountHandouts(handouts: dbAccountHandout[]): HandoutType[] {
    return handouts.map((handout) => HandoutResponseFormatter.formatAccountHandout(handout));
  }

  static formatTeamHandouts(handouts: dbTeamHandout[], accountId: bigint): HandoutType[] {
    return handouts.map((handout) => HandoutResponseFormatter.formatTeamHandout(handout, accountId));
  }
}
