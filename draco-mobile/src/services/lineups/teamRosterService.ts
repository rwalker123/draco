import {
  getTeamRosterMembers,
  type TeamRosterMembers
} from '@draco/shared-api-client';

import { createApiClient } from '../api/apiClient';
import { unwrapApiResult } from '../api/apiResult';
import type { TeamRosterPlayer } from '../../types/lineups';

export type FetchTeamRosterParams = {
  token: string;
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
};

export async function fetchTeamRoster({ token, accountId, seasonId, teamSeasonId }: FetchTeamRosterParams): Promise<TeamRosterPlayer[]> {
  const client = createApiClient({ token });

  const result = await getTeamRosterMembers({
    client,
    path: { accountId, seasonId, teamSeasonId },
    throwOnError: false
  });

  const data = unwrapApiResult<TeamRosterMembers>(result, 'Failed to load team roster.');

  const rosterMembers = data.rosterMembers ?? [];

  return rosterMembers
    .filter((member) => !member.inactive)
    .map((member) => ({
      rosterMemberId: member.id,
      playerId: member.player.id,
      contactId: member.player.contact.id,
      firstName: member.player.contact.firstName,
      lastName: member.player.contact.lastName,
      displayName: buildDisplayName(member.player.contact.firstName, member.player.contact.lastName, member.playerNumber),
      playerNumber: member.playerNumber,
      inactive: member.inactive ?? false
    }));
}

function buildDisplayName(firstName: string, lastName: string, playerNumber?: number): string {
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  if (!fullName) {
    return playerNumber ? `#${playerNumber}` : 'Unnamed Player';
  }

  if (playerNumber === undefined || playerNumber === null) {
    return fullName;
  }

  return `#${playerNumber} ${fullName}`;
}
