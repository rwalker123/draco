import { useCallback, useState } from 'react';
import { useCurrentSeason } from '../../../hooks/useCurrentSeason';
import { useApiClient } from '../../../hooks/useApiClient';
import { formatGameDateTime } from '../../../utils/dateUtils';
import { createGame, updateGame } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../../utils/apiResult';
import type { UpsertGameType } from '@draco/shared-schemas';
import type { Game } from '@/types/schedule';
import { GameStatus } from '@/types/schedule';
import { mapGameResponseToScheduleGame } from '../../../utils/gameTransformers';

export interface BuildGamePayloadOptions {
  leagueSeasonId: string;
  gameDate: string;
  homeTeamId: string;
  visitorTeamId: string;
  fieldId?: string;
  comment?: string;
  gameType: number;
  gameStatus: number;
  umpire1?: string;
  umpire2?: string;
  umpire3?: string;
  umpire4?: string;
}

export interface CreateGameOptions {
  accountId: string;
  seasonId: string;
  payload: UpsertGameType;
}

export interface UseGameOperationsArgs {
  accountId: string;
  timeZone: string;
}

export interface GameFormValues {
  leagueSeasonId: string;
  gameDate: Date;
  gameTime: Date;
  homeTeamId: string;
  visitorTeamId: string;
  fieldId?: string;
  comment?: string;
  gameType: number;
  umpire1?: string;
  umpire2?: string;
  umpire3?: string;
  umpire4?: string;
}

export interface GameOperationResult {
  message: string;
  game?: Game;
}

export const buildUpsertGamePayload = ({
  leagueSeasonId,
  gameDate,
  homeTeamId,
  visitorTeamId,
  fieldId,
  comment,
  gameType,
  gameStatus,
  umpire1,
  umpire2,
  umpire3,
  umpire4,
}: BuildGamePayloadOptions): UpsertGameType => {
  return {
    leagueSeasonId,
    gameDate,
    homeTeam: { id: homeTeamId },
    visitorTeam: { id: visitorTeamId },
    field: fieldId ? { id: fieldId } : null,
    comment: comment ?? '',
    gameStatus,
    gameType: Number(gameType),
    umpire1: umpire1 ? { id: umpire1 } : null,
    umpire2: umpire2 ? { id: umpire2 } : null,
    umpire3: umpire3 ? { id: umpire3 } : null,
    umpire4: umpire4 ? { id: umpire4 } : null,
  };
};

export const useGameOperations = ({ accountId, timeZone }: UseGameOperationsArgs) => {
  const { fetchCurrentSeason } = useCurrentSeason(accountId);
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);

  const createGameOperation = useCallback(
    async (values: GameFormValues): Promise<GameOperationResult> => {
      setLoading(true);
      try {
        const currentSeasonId = await fetchCurrentSeason();
        const formattedDate = formatGameDateTime(values.gameDate, values.gameTime, timeZone);

        const payload = buildUpsertGamePayload({
          leagueSeasonId: values.leagueSeasonId,
          gameDate: formattedDate,
          homeTeamId: values.homeTeamId,
          visitorTeamId: values.visitorTeamId,
          fieldId: values.fieldId,
          comment: values.comment,
          gameType: values.gameType,
          gameStatus: GameStatus.Scheduled,
          umpire1: values.umpire1,
          umpire2: values.umpire2,
          umpire3: values.umpire3,
          umpire4: values.umpire4,
        });

        const result = await createGame({
          client: apiClient,
          path: { accountId, seasonId: currentSeasonId },
          body: payload,
          throwOnError: false,
        });

        const createdGame = unwrapApiResult(result, 'Failed to create game');

        return {
          message: 'Game created successfully',
          game: mapGameResponseToScheduleGame(createdGame),
        };
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient, fetchCurrentSeason, timeZone],
  );

  const updateGameOperation = useCallback(
    async (game: Game, values: GameFormValues): Promise<GameOperationResult> => {
      setLoading(true);
      try {
        const formattedDate = formatGameDateTime(values.gameDate, values.gameTime, timeZone);
        const leagueSeasonId = values.leagueSeasonId || game.league.id;

        const payload = buildUpsertGamePayload({
          leagueSeasonId,
          gameDate: formattedDate,
          homeTeamId: values.homeTeamId,
          visitorTeamId: values.visitorTeamId,
          fieldId: values.fieldId,
          comment: values.comment,
          gameType: values.gameType,
          gameStatus: game.gameStatus,
          umpire1: values.umpire1,
          umpire2: values.umpire2,
          umpire3: values.umpire3,
          umpire4: values.umpire4,
        });

        const result = await updateGame({
          client: apiClient,
          path: {
            accountId,
            seasonId: game.season.id,
            gameId: game.id,
          },
          body: payload,
          throwOnError: false,
        });

        const updatedGame = unwrapApiResult(result, 'Failed to update game');

        return {
          message: 'Game updated successfully',
          game: mapGameResponseToScheduleGame(updatedGame),
        };
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient, timeZone],
  );

  return {
    createGame: createGameOperation,
    updateGame: updateGameOperation,
    loading,
  };
};
