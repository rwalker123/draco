'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { GolfScoreWithDetails } from '@draco/shared-api-client';
import { getContributingDifferentialIndices } from '@draco/shared-schemas';
import { useGolfScores } from './useGolfScores';

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

export function useLeaguePlayerProfile(
  accountId: string,
  seasonId: string,
  contactId: string,
): UseLeaguePlayerProfileResult {
  const [scores, setScores] = useState<GolfScoreWithDetails[]>([]);
  const [handicapIndex, setHandicapIndex] = useState<number | null>(null);
  const [isInitialIndex, setIsInitialIndex] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getPlayerSeasonScores } = useGolfScores(accountId);

  const fetchData = useCallback(async () => {
    if (!accountId || !seasonId || !contactId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scoresResult = await getPlayerSeasonScores(contactId, seasonId);

      if (scoresResult.success) {
        setScores(scoresResult.data.scores);
        setHandicapIndex(scoresResult.data.handicapIndex);
        setIsInitialIndex(scoresResult.data.isInitialIndex);
      } else {
        setError(scoresResult.error);
      }
    } catch (err) {
      console.error('Failed to fetch league player profile:', err);
      setError('Failed to load player profile');
    } finally {
      setLoading(false);
    }
  }, [accountId, seasonId, contactId, getPlayerSeasonScores]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const contributingIndices = useMemo(() => {
    const indexedDifferentials = scores
      .map((score, idx) => ({ idx, diff: score.differential }))
      .filter((item): item is { idx: number; diff: number } => item.diff != null);

    if (indexedDifferentials.length < 3) {
      return new Set<number>();
    }

    const differentialValues = indexedDifferentials.map((item) => item.diff);
    const contributingSet = getContributingDifferentialIndices(differentialValues);

    return new Set([...contributingSet].map((diffIndex) => indexedDifferentials[diffIndex].idx));
  }, [scores]);

  const data = useMemo<LeaguePlayerProfileData | null>(() => {
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
  }, [scores, loading, error, contributingIndices, handicapIndex, isInitialIndex]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
