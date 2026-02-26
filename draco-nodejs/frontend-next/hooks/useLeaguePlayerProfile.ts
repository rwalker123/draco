'use client';

import { useState, useEffect } from 'react';
import type { GolfScoreWithDetails } from '@draco/shared-api-client';
import { getGolfPlayerLeagueScores } from '@draco/shared-api-client';
import type { PlayerSeasonScoresResponseType } from '@draco/shared-schemas';
import { getContributingDifferentialIndices } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export interface LeaguePlayerProfileData {
  firstName: string;
  lastName: string;
  scores: GolfScoreWithDetails[];
  roundsPlayed: number;
  handicapIndex: number | null;
  isInitialHandicap: boolean;
  averageScore: number | null;
  contributingIndices: Set<number>;
}

export interface UseLeaguePlayerProfileResult {
  data: LeaguePlayerProfileData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const computeContributingIndices = (scores: GolfScoreWithDetails[]): Set<number> => {
  const indexedDifferentials = scores
    .map((score, idx) => ({ idx, diff: score.differential }))
    .filter((item): item is { idx: number; diff: number } => item.diff != null);

  if (indexedDifferentials.length < 3) {
    return new Set<number>();
  }

  const differentialValues = indexedDifferentials.map((item) => item.diff);
  const contributingSet = getContributingDifferentialIndices(differentialValues);

  return new Set([...contributingSet].map((diffIndex) => indexedDifferentials[diffIndex].idx));
};

const buildProfileData = (
  scores: GolfScoreWithDetails[],
  loading: boolean,
  error: string | null,
  handicapIndex: number | null,
  isInitialIndex: boolean,
  contributingIndices: Set<number>,
): LeaguePlayerProfileData | null => {
  if (scores.length === 0 && !loading && !error) {
    return {
      firstName: '',
      lastName: '',
      scores: [],
      roundsPlayed: 0,
      handicapIndex,
      isInitialHandicap: isInitialIndex,
      averageScore: null,
      contributingIndices: new Set(),
    };
  }

  if (scores.length === 0) {
    return null;
  }

  const roundsPlayed = scores.length;

  const eighteenHoleScores = scores.filter((s) => s.holesPlayed === 18);
  const averageScore =
    eighteenHoleScores.length > 0
      ? eighteenHoleScores.reduce((sum, s) => sum + s.totalScore, 0) / eighteenHoleScores.length
      : null;

  return {
    firstName: '',
    lastName: '',
    scores,
    roundsPlayed,
    handicapIndex,
    isInitialHandicap: isInitialIndex,
    averageScore,
    contributingIndices,
  };
};

export function useLeaguePlayerProfile(
  accountId: string,
  contactId: string,
): UseLeaguePlayerProfileResult {
  const [scores, setScores] = useState<GolfScoreWithDetails[]>([]);
  const [handicapIndex, setHandicapIndex] = useState<number | null>(null);
  const [isInitialIndex, setIsInitialIndex] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiClient = useApiClient();

  useEffect(() => {
    if (!accountId || !contactId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getGolfPlayerLeagueScores({
          client: apiClient,
          path: { accountId, contactId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const response = unwrapApiResult(
          result,
          'Failed to load player league scores',
        ) as PlayerSeasonScoresResponseType;
        setScores(response.scores as GolfScoreWithDetails[]);
        setHandicapIndex(response.handicapIndex);
        setIsInitialIndex(response.isInitialIndex);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to fetch league player profile:', err);
        setError('Failed to load player profile');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [accountId, contactId, apiClient]);

  const refetch = async () => {
    if (!accountId || !contactId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getGolfPlayerLeagueScores({
        client: apiClient,
        path: { accountId, contactId },
        throwOnError: false,
      });

      const response = unwrapApiResult(
        result,
        'Failed to load player league scores',
      ) as PlayerSeasonScoresResponseType;
      setScores(response.scores as GolfScoreWithDetails[]);
      setHandicapIndex(response.handicapIndex);
      setIsInitialIndex(response.isInitialIndex);
    } catch (err) {
      console.error('Failed to fetch league player profile:', err);
      setError('Failed to load player profile');
    } finally {
      setLoading(false);
    }
  };

  const contributingIndices = computeContributingIndices(scores);

  const data = buildProfileData(
    scores,
    loading,
    error,
    handicapIndex,
    isInitialIndex,
    contributingIndices,
  );

  return {
    data,
    loading,
    error,
    refetch,
  };
}
