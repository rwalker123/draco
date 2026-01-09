import { useCallback, useState } from 'react';
import { useCurrentSeason } from '../../../hooks/useCurrentSeason';
import { useApiClient } from '../../../hooks/useApiClient';
import { formatGameDateTime } from '../../../utils/dateUtils';
import { createGolfMatch, updateGolfMatch } from '@draco/shared-api-client';
import type { GolfMatch } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../../utils/apiResult';
import type { Game } from '@/types/schedule';

export interface GolfMatchFormValues {
  leagueSeasonId: string;
  matchDate: Date;
  matchTime: Date;
  team1Id: string;
  team2Id: string;
  courseId?: string | null;
  teeId?: string | null;
  comment?: string;
  matchType: number;
}

export interface GolfMatchOperationResult {
  message: string;
  game?: Game;
}

export interface UseGolfMatchOperationsArgs {
  accountId: string;
  timeZone: string;
}

function getGameStatusText(status: number): string {
  switch (status) {
    case 0:
      return 'Scheduled';
    case 1:
      return 'Completed';
    case 2:
      return 'Rainout';
    case 3:
      return 'Postponed';
    case 4:
      return 'Forfeit';
    default:
      return 'Unknown';
  }
}

function getGameStatusShortText(status: number): string {
  switch (status) {
    case 0:
      return 'Sched';
    case 1:
      return 'Final';
    case 2:
      return 'Rain';
    case 3:
      return 'Ppd';
    case 4:
      return 'Forf';
    default:
      return '?';
  }
}

function mapGolfMatchToGame(match: GolfMatch): Game {
  return {
    id: match.id,
    gameDate: match.matchDateTime,
    homeTeamId: match.team1.id,
    visitorTeamId: match.team2.id,
    homeScore: 0,
    visitorScore: 0,
    comment: match.comment ?? '',
    fieldId: match.course?.id,
    field: match.course
      ? {
          id: match.course.id,
          name: match.course.name,
          shortName: match.course.name,
          address: match.course.address ?? '',
          city: match.course.city ?? '',
          state: match.course.state ?? '',
        }
      : undefined,
    teeId: match.tee?.id,
    tee: match.tee
      ? {
          id: match.tee.id,
          teeName: match.tee.teeName,
          teeColor: match.tee.teeColor,
        }
      : undefined,
    gameStatus: match.matchStatus,
    gameStatusText: getGameStatusText(match.matchStatus),
    gameStatusShortText: getGameStatusShortText(match.matchStatus),
    gameType: match.matchType,
    league: {
      id: match.leagueSeasonId,
      name: '',
    },
    season: {
      id: match.leagueSeasonId,
      name: '',
    },
  };
}

export const useGolfMatchOperations = ({ accountId, timeZone }: UseGolfMatchOperationsArgs) => {
  const { fetchCurrentSeason } = useCurrentSeason(accountId);
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);

  const createMatch = useCallback(
    async (values: GolfMatchFormValues): Promise<GolfMatchOperationResult> => {
      setLoading(true);
      try {
        const currentSeasonId = await fetchCurrentSeason();
        const matchDateTime = formatGameDateTime(values.matchDate, values.matchTime, timeZone);

        const result = await createGolfMatch({
          client: apiClient,
          path: { accountId, seasonId: currentSeasonId },
          body: {
            leagueSeasonId: values.leagueSeasonId,
            team1Id: values.team1Id,
            team2Id: values.team2Id,
            matchDateTime,
            courseId: values.courseId || undefined,
            teeId: values.teeId || undefined,
            matchType: values.matchType,
            comment: values.comment ?? '',
          },
          throwOnError: false,
        });

        const createdMatch = unwrapApiResult(result, 'Failed to create match');

        return {
          message: 'Match created successfully',
          game: mapGolfMatchToGame(createdMatch),
        };
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient, fetchCurrentSeason, timeZone],
  );

  const updateMatch = useCallback(
    async (matchId: string, values: GolfMatchFormValues): Promise<GolfMatchOperationResult> => {
      setLoading(true);
      try {
        const matchDateTime = formatGameDateTime(values.matchDate, values.matchTime, timeZone);

        const result = await updateGolfMatch({
          client: apiClient,
          path: { accountId, matchId },
          body: {
            team1Id: values.team1Id,
            team2Id: values.team2Id,
            matchDateTime,
            courseId: values.courseId || undefined,
            teeId: values.teeId || undefined,
            matchType: values.matchType,
            comment: values.comment ?? '',
          },
          throwOnError: false,
        });

        const updatedMatch = unwrapApiResult(result, 'Failed to update match');

        return {
          message: 'Match updated successfully',
          game: mapGolfMatchToGame(updatedMatch),
        };
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient, timeZone],
  );

  return {
    createMatch,
    updateMatch,
    loading,
  };
};
