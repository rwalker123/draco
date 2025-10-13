import { useCallback } from 'react';
import {
  BaseContactType,
  RosterMemberType,
  RosterPlayerType,
  SignRosterMemberType,
  UpdateRosterMemberType,
} from '@draco/shared-schemas';
import {
  getContactRoster as apiGetContactRoster,
  listAvailableRosterPlayers as apiListAvailableRosterPlayers,
  signPlayer as apiSignPlayer,
  updateRosterMember as apiUpdateRosterMember,
} from '@draco/shared-api-client';
import { ContactTransformationService } from '../../services/contactTransformationService';
import { useApiClient } from '../useApiClient';
import { ApiClientError, getApiErrorMessage, unwrapApiResult } from '../../utils/apiResult';

interface UseRosterPlayerOptions {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

export type RosterPlayerMutationResult =
  | { type: 'sign'; member: RosterMemberType }
  | { type: 'update'; member: RosterMemberType };

const transformContact = (contact: unknown): BaseContactType => {
  if (!contact || typeof contact !== 'object') {
    return contact as BaseContactType;
  }

  return ContactTransformationService.transformBackendContact(
    contact as Record<string, unknown>,
  ) as BaseContactType;
};

const transformRosterMember = (member: RosterMemberType): RosterMemberType => {
  if (!member?.player?.contact) {
    return member;
  }

  return {
    ...member,
    player: {
      ...member.player,
      contact: transformContact(member.player.contact),
    },
  };
};

const transformRosterPlayer = (player?: RosterPlayerType | null): RosterPlayerType | undefined => {
  if (!player) {
    return undefined;
  }

  return {
    ...player,
    contact: transformContact(player.contact),
  };
};

export const useRosterPlayer = ({ accountId, seasonId, teamSeasonId }: UseRosterPlayerOptions) => {
  const apiClient = useApiClient();

  const searchAvailablePlayers = useCallback(
    async (firstName?: string, lastName?: string): Promise<BaseContactType[]> => {
      if (!accountId || !seasonId || !teamSeasonId) {
        return [];
      }

      try {
        const result = await apiListAvailableRosterPlayers({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          query: {
            firstName: firstName?.trim() || undefined,
            lastName: lastName?.trim() || undefined,
          },
          throwOnError: false,
        });

        const contacts = unwrapApiResult(result, 'Failed to fetch available players') ?? [];
        return (contacts as BaseContactType[]).map((contact) => transformContact(contact));
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? getApiErrorMessage(error.details ?? error, 'Failed to fetch available players')
            : getApiErrorMessage(error, 'Failed to fetch available players');
        throw new Error(message);
      }
    },
    [accountId, seasonId, teamSeasonId, apiClient],
  );

  const loadContactRoster = useCallback(
    async (contactId: string): Promise<RosterPlayerType | undefined> => {
      if (!accountId || !contactId) {
        return undefined;
      }

      try {
        const result = await apiGetContactRoster({
          path: { accountId, contactId },
          client: apiClient,
          throwOnError: false,
        });

        const rosterPlayer = unwrapApiResult(result, 'Failed to fetch contact roster') as
          | RosterPlayerType
          | undefined;
        return transformRosterPlayer(rosterPlayer) ?? undefined;
      } catch (error) {
        const message = getApiErrorMessage(error, 'Failed to fetch contact roster');
        throw new Error(message);
      }
    },
    [accountId, apiClient],
  );

  const signRosterPlayer = useCallback(
    async (contactId: string, rosterData: SignRosterMemberType): Promise<RosterMemberType> => {
      if (!accountId || !seasonId || !teamSeasonId) {
        throw new Error('Missing roster context for signing player');
      }

      const result = await apiSignPlayer({
        path: { accountId, seasonId, teamSeasonId },
        body: { ...rosterData, player: { ...rosterData.player, contact: { id: contactId } } },
        client: apiClient,
        throwOnError: false,
      });

      const member = unwrapApiResult(result, 'Failed to sign player') as RosterMemberType;
      return transformRosterMember(member);
    },
    [accountId, seasonId, teamSeasonId, apiClient],
  );

  const updateRosterPlayer = useCallback(
    async (rosterMemberId: string, updates: UpdateRosterMemberType): Promise<RosterMemberType> => {
      if (!accountId || !seasonId || !teamSeasonId) {
        throw new Error('Missing roster context for roster update');
      }

      const sanitizedUpdates: UpdateRosterMemberType = {};

      if (updates.playerNumber !== undefined) {
        sanitizedUpdates.playerNumber = updates.playerNumber;
      }

      if (updates.submittedWaiver !== undefined) {
        sanitizedUpdates.submittedWaiver = updates.submittedWaiver;
      }

      if (updates.player) {
        const playerUpdates: NonNullable<UpdateRosterMemberType['player']> = {};

        if (updates.player.submittedDriversLicense !== undefined) {
          playerUpdates.submittedDriversLicense = updates.player.submittedDriversLicense;
        }

        if (updates.player.firstYear !== undefined) {
          playerUpdates.firstYear = updates.player.firstYear;
        }

        if (Object.keys(playerUpdates).length > 0) {
          sanitizedUpdates.player = playerUpdates;
        }
      }

      const result = await apiUpdateRosterMember({
        path: { accountId, seasonId, teamSeasonId, rosterMemberId },
        body: sanitizedUpdates,
        client: apiClient,
        throwOnError: false,
      });

      const member = unwrapApiResult(
        result,
        'Failed to update roster information',
      ) as RosterMemberType;
      return transformRosterMember(member);
    },
    [accountId, seasonId, teamSeasonId, apiClient],
  );

  return {
    searchAvailablePlayers,
    loadContactRoster,
    signRosterPlayer,
    updateRosterPlayer,
  };
};
