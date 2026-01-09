import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type {
  IndividualLiveScoringState,
  IndividualLiveHoleScore,
} from '../context/IndividualLiveScoringContext';

export interface IndividualLiveSessionStatus {
  hasActiveSession: boolean;
  sessionId?: string;
  viewerCount?: number;
}

export interface StartIndividualLiveScoring {
  courseId: string;
  teeId: string;
  datePlayed: string;
  startingHole?: number;
  holesPlayed?: 9 | 18;
}

export interface SubmitIndividualLiveHoleScore {
  holeNumber: number;
  score: number;
}

export interface UseIndividualLiveScoringOperationsReturn {
  isLoading: boolean;
  error: string | null;
  checkSessionStatus: (accountId: string) => Promise<IndividualLiveSessionStatus | null>;
  getSessionState: (accountId: string) => Promise<IndividualLiveScoringState | null>;
  startSession: (
    accountId: string,
    options: StartIndividualLiveScoring,
  ) => Promise<IndividualLiveScoringState | null>;
  submitScore: (
    accountId: string,
    data: SubmitIndividualLiveHoleScore,
  ) => Promise<IndividualLiveHoleScore | null>;
  advanceHole: (accountId: string, holeNumber: number) => Promise<boolean>;
  finalizeSession: (accountId: string) => Promise<boolean>;
  stopSession: (accountId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useIndividualLiveScoringOperations(): UseIndividualLiveScoringOperationsReturn {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getApiUrl = useCallback(() => {
    return process.env.NEXT_PUBLIC_API_URL || '';
  }, []);

  const makeRequest = useCallback(
    async <T>(
      url: string,
      options: RequestInit = {},
    ): Promise<{ data: T | null; error: string | null }> => {
      if (!token) {
        return { data: null, error: 'Authentication required' };
      }

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData?.error || errorData?.message || `Request failed`;
          return { data: null, error: errorMessage };
        }

        const data = await response.json();
        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Request failed';
        return { data: null, error: message };
      }
    },
    [token],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkSessionStatus = useCallback(
    async (accountId: string): Promise<IndividualLiveSessionStatus | null> => {
      setIsLoading(true);
      setError(null);

      const url = `${getApiUrl()}/api/accounts/${accountId}/golfer/live/status`;
      const { data, error: requestError } = await makeRequest<IndividualLiveSessionStatus>(url);

      setIsLoading(false);
      if (requestError) {
        setError(requestError);
        return null;
      }
      return data;
    },
    [getApiUrl, makeRequest],
  );

  const getSessionState = useCallback(
    async (accountId: string): Promise<IndividualLiveScoringState | null> => {
      setIsLoading(true);
      setError(null);

      const url = `${getApiUrl()}/api/accounts/${accountId}/golfer/live`;
      const { data, error: requestError } = await makeRequest<IndividualLiveScoringState>(url);

      setIsLoading(false);
      if (requestError) {
        setError(requestError);
        return null;
      }
      return data;
    },
    [getApiUrl, makeRequest],
  );

  const startSession = useCallback(
    async (
      accountId: string,
      options: StartIndividualLiveScoring,
    ): Promise<IndividualLiveScoringState | null> => {
      setIsLoading(true);
      setError(null);

      const url = `${getApiUrl()}/api/accounts/${accountId}/golfer/live/start`;
      const { data, error: requestError } = await makeRequest<IndividualLiveScoringState>(url, {
        method: 'POST',
        body: JSON.stringify(options),
      });

      setIsLoading(false);
      if (requestError) {
        setError(requestError);
        return null;
      }
      return data;
    },
    [getApiUrl, makeRequest],
  );

  const submitScore = useCallback(
    async (
      accountId: string,
      data: SubmitIndividualLiveHoleScore,
    ): Promise<IndividualLiveHoleScore | null> => {
      setIsLoading(true);
      setError(null);

      const url = `${getApiUrl()}/api/accounts/${accountId}/golfer/live/scores`;
      const { data: responseData, error: requestError } =
        await makeRequest<IndividualLiveHoleScore>(url, {
          method: 'POST',
          body: JSON.stringify(data),
        });

      setIsLoading(false);
      if (requestError) {
        setError(requestError);
        return null;
      }
      return responseData;
    },
    [getApiUrl, makeRequest],
  );

  const advanceHole = useCallback(
    async (accountId: string, holeNumber: number): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const url = `${getApiUrl()}/api/accounts/${accountId}/golfer/live/advance`;
      const { error: requestError } = await makeRequest<{ success: boolean }>(url, {
        method: 'POST',
        body: JSON.stringify({ holeNumber }),
      });

      setIsLoading(false);
      if (requestError) {
        setError(requestError);
        return false;
      }
      return true;
    },
    [getApiUrl, makeRequest],
  );

  const finalizeSession = useCallback(
    async (accountId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const url = `${getApiUrl()}/api/accounts/${accountId}/golfer/live/finalize`;
      const { error: requestError } = await makeRequest<{ success: boolean }>(url, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      setIsLoading(false);
      if (requestError) {
        setError(requestError);
        return false;
      }
      return true;
    },
    [getApiUrl, makeRequest],
  );

  const stopSession = useCallback(
    async (accountId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const url = `${getApiUrl()}/api/accounts/${accountId}/golfer/live/stop`;
      const { error: requestError } = await makeRequest<{ success: boolean }>(url, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      setIsLoading(false);
      if (requestError) {
        setError(requestError);
        return false;
      }
      return true;
    },
    [getApiUrl, makeRequest],
  );

  return {
    isLoading,
    error,
    checkSessionStatus,
    getSessionState,
    startSession,
    submitScore,
    advanceHole,
    finalizeSession,
    stopSession,
    clearError,
  };
}
