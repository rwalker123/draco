'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { useAccount } from './AccountContext';
import { useApiClient } from '../hooks/useApiClient';
import { getBaseballLiveScoringTicket } from '@draco/shared-api-client';
import type { BaseballLiveScoringState, BaseballLiveInningScore } from '@draco/shared-api-client';
import { safeJsonParse } from '../utils/sseUtils';

interface ScoreUpdateEvent {
  inningNumber: number;
  isHomeTeam: boolean;
  runs: number;
  enteredBy: string;
  timestamp: string;
}

interface SessionStartedEvent {
  sessionId: string;
  gameId: string;
  startedBy: string;
  startedAt: string;
}

interface SessionFinalizedEvent {
  sessionId: string;
  gameId: string;
  finalizedBy: string;
  finalizedAt: string;
  homeTeamTotal: number;
  visitorTeamTotal: number;
}

interface SessionStoppedEvent {
  sessionId: string;
  gameId: string;
  stoppedBy: string;
  stoppedAt: string;
}

interface InningAdvancedEvent {
  inningNumber: number;
  advancedBy: string;
  timestamp: string;
}

type SseRole = 'scorer' | 'watcher';

interface BaseballLiveScoringContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  sessionState: BaseballLiveScoringState | null;
  viewerCount: number;
  scorerCount: number;
  connect: (gameId: string, role?: SseRole) => void;
  disconnect: () => void;
  onScoreUpdate: (callback: (event: ScoreUpdateEvent) => void) => () => void;
  onSessionStarted: (callback: (event: SessionStartedEvent) => void) => () => void;
  onSessionFinalized: (callback: (event: SessionFinalizedEvent) => void) => () => void;
  onSessionStopped: (callback: (event: SessionStoppedEvent) => void) => () => void;
  onInningAdvanced: (callback: (event: InningAdvancedEvent) => void) => () => void;
}

const BaseballLiveScoringContext = createContext<BaseballLiveScoringContextValue | undefined>(
  undefined,
);

interface BaseballLiveScoringProviderProps {
  children: ReactNode;
}

export function BaseballLiveScoringProvider({ children }: BaseballLiveScoringProviderProps) {
  const { token } = useAuth();
  const { currentAccount } = useAccount();
  const apiClient = useApiClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<BaseballLiveScoringState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [scorerCount, setScorerCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentGameIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const scoreUpdateCallbacks = useRef<Set<(event: ScoreUpdateEvent) => void>>(new Set());
  const sessionStartedCallbacks = useRef<Set<(event: SessionStartedEvent) => void>>(new Set());
  const sessionFinalizedCallbacks = useRef<Set<(event: SessionFinalizedEvent) => void>>(new Set());
  const sessionStoppedCallbacks = useRef<Set<(event: SessionStoppedEvent) => void>>(new Set());
  const inningAdvancedCallbacks = useRef<Set<(event: InningAdvancedEvent) => void>>(new Set());
  const connectRef = useRef<((gameId: string, role?: SseRole) => void) | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);
  const isConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    currentGameIdRef.current = null;
    reconnectAttempts.current = 0;
    isConnectedRef.current = false;
    isConnectingRef.current = false;
    setIsConnected(false);
    setIsConnecting(false);
    setSessionState(null);
    setViewerCount(0);
    setScorerCount(0);
  }, []);

  const connectWithTicket = useCallback(
    async (gameId: string, ticket: string) => {
      if (!currentAccount?.id) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const baseSseUrl = apiUrl
        ? `${apiUrl}/api/accounts/${currentAccount.id}/games/${gameId}/live/subscribe`
        : `${window.location.origin}/api/accounts/${currentAccount.id}/games/${gameId}/live/subscribe`;
      const sseUrl = `${baseSseUrl}?ticket=${encodeURIComponent(ticket)}`;

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        isConnectingRef.current = false;
        isConnectedRef.current = true;
        setIsConnecting(false);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onerror = () => {
        isConnectedRef.current = false;
        isConnectingRef.current = false;
        setIsConnected(false);
        setIsConnecting(false);

        if (currentGameIdRef.current !== gameId) {
          eventSource.close();
          return;
        }

        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
          reconnectAttempts.current++;
          setConnectionError(`Connection lost. Reconnecting in ${delay / 1000}s...`);

          eventSource.close();
          eventSourceRef.current = null;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (currentGameIdRef.current === gameId && connectRef.current) {
              connectRef.current(gameId);
            }
          }, delay);
        } else {
          eventSource.close();
          eventSourceRef.current = null;
          currentGameIdRef.current = null;
          setConnectionError(
            'Unable to connect to live scoring. Please check your connection and try again.',
          );
        }
      };

      eventSource.addEventListener('connected', (event) => {
        const data = safeJsonParse<{ message: string }>(event.data, 'connected');
        if (!data) return;
        console.log('Baseball SSE connected:', data);
      });

      eventSource.addEventListener('state', (event) => {
        const state = safeJsonParse<BaseballLiveScoringState>(event.data, 'state');
        if (!state) return;
        setSessionState(state);
        if (state.viewerCount !== undefined) {
          setViewerCount(state.viewerCount);
        }
        if (state.scorerCount !== undefined) {
          setScorerCount(state.scorerCount);
        }
      });

      eventSource.addEventListener('session_started', (event) => {
        const data = safeJsonParse<SessionStartedEvent>(event.data, 'session_started');
        if (!data) return;
        sessionStartedCallbacks.current.forEach((cb) => cb(data));
      });

      eventSource.addEventListener('score_update', (event) => {
        const data = safeJsonParse<ScoreUpdateEvent>(event.data, 'score_update');
        if (!data) return;

        setSessionState((prev) => {
          if (!prev) return prev;

          const existingScoreIndex = prev.scores.findIndex(
            (s) => s.inningNumber === data.inningNumber && s.isHomeTeam === data.isHomeTeam,
          );

          let updatedScores: BaseballLiveInningScore[];
          if (existingScoreIndex >= 0) {
            updatedScores = [...prev.scores];
            updatedScores[existingScoreIndex] = {
              ...updatedScores[existingScoreIndex],
              runs: data.runs,
              enteredBy: data.enteredBy,
              enteredAt: data.timestamp,
            };
          } else {
            updatedScores = [
              ...prev.scores,
              {
                id: `temp-${Date.now()}`,
                inningNumber: data.inningNumber,
                isHomeTeam: data.isHomeTeam,
                runs: data.runs,
                enteredBy: data.enteredBy,
                enteredAt: data.timestamp,
              },
            ];
          }

          // Recalculate totals
          let homeTeamTotal = 0;
          let visitorTeamTotal = 0;
          for (const score of updatedScores) {
            if (score.isHomeTeam) {
              homeTeamTotal += score.runs;
            } else {
              visitorTeamTotal += score.runs;
            }
          }

          return { ...prev, scores: updatedScores, homeTeamTotal, visitorTeamTotal };
        });

        scoreUpdateCallbacks.current.forEach((cb) => cb(data));
      });

      eventSource.addEventListener('inning_advanced', (event) => {
        const data = safeJsonParse<InningAdvancedEvent>(event.data, 'inning_advanced');
        if (!data) return;
        setSessionState((prev) => (prev ? { ...prev, currentInning: data.inningNumber } : prev));
        inningAdvancedCallbacks.current.forEach((cb) => cb(data));
      });

      eventSource.addEventListener('session_finalized', (event) => {
        const data = safeJsonParse<SessionFinalizedEvent>(event.data, 'session_finalized');
        if (!data) return;
        setSessionState((prev) =>
          prev
            ? {
                ...prev,
                status: 'finalized',
                homeTeamTotal: data.homeTeamTotal,
                visitorTeamTotal: data.visitorTeamTotal,
              }
            : prev,
        );
        sessionFinalizedCallbacks.current.forEach((cb) => cb(data));
        eventSource.close();
        eventSourceRef.current = null;
        currentGameIdRef.current = null;
        isConnectedRef.current = false;
        setIsConnected(false);
      });

      eventSource.addEventListener('session_stopped', (event) => {
        const data = safeJsonParse<SessionStoppedEvent>(event.data, 'session_stopped');
        if (!data) return;
        setSessionState((prev) => (prev ? { ...prev, status: 'stopped' } : prev));
        sessionStoppedCallbacks.current.forEach((cb) => cb(data));
        eventSource.close();
        eventSourceRef.current = null;
        currentGameIdRef.current = null;
        isConnectedRef.current = false;
        setIsConnected(false);
      });

      eventSource.addEventListener('ping', () => {
        // Keep-alive ping received - no action needed
      });

      eventSource.addEventListener('viewer_count', (event) => {
        const data = safeJsonParse<{ viewerCount: number }>(event.data, 'viewer_count');
        if (!data) return;
        setViewerCount(data.viewerCount);
      });

      eventSource.addEventListener('scorer_count', (event) => {
        const data = safeJsonParse<{ scorerCount: number }>(event.data, 'scorer_count');
        if (!data) return;
        setScorerCount(data.scorerCount);
      });

      eventSource.addEventListener('no_session', () => {
        setConnectionError('No active live scoring session found. The session may have ended.');
        eventSource.close();
        eventSourceRef.current = null;
        currentGameIdRef.current = null;
      });
    },
    [currentAccount],
  );

  const connect = useCallback(
    (gameId: string, role: SseRole = 'watcher') => {
      if (!token || !currentAccount?.id) {
        setConnectionError('Authentication required');
        return;
      }

      if (
        currentGameIdRef.current === gameId &&
        (isConnectedRef.current || isConnectingRef.current)
      ) {
        return;
      }

      disconnect();

      currentGameIdRef.current = gameId;
      isConnectingRef.current = true;
      setIsConnecting(true);
      setConnectionError(null);

      getBaseballLiveScoringTicket({
        client: apiClient,
        path: { accountId: currentAccount.id, gameId },
        body: { role },
        throwOnError: false,
      })
        .then((result) => {
          if (currentGameIdRef.current !== gameId) {
            return;
          }

          if (result.error || !result.data?.ticket) {
            isConnectingRef.current = false;
            setIsConnecting(false);
            setConnectionError('Failed to get connection ticket');
            return;
          }

          connectWithTicket(gameId, result.data.ticket);
        })
        .catch(() => {
          if (currentGameIdRef.current !== gameId) {
            return;
          }
          isConnectingRef.current = false;
          setIsConnecting(false);
          setConnectionError('Failed to get connection ticket');
        });
    },
    [token, currentAccount, apiClient, disconnect, connectWithTicket],
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  const stableConnect = useCallback((gameId: string, role?: SseRole) => {
    connectRef.current?.(gameId, role);
  }, []);

  const stableDisconnect = useCallback(() => {
    disconnectRef.current?.();
  }, []);

  const onScoreUpdate = useCallback((callback: (event: ScoreUpdateEvent) => void) => {
    scoreUpdateCallbacks.current.add(callback);
    return () => {
      scoreUpdateCallbacks.current.delete(callback);
    };
  }, []);

  const onSessionStarted = useCallback((callback: (event: SessionStartedEvent) => void) => {
    sessionStartedCallbacks.current.add(callback);
    return () => {
      sessionStartedCallbacks.current.delete(callback);
    };
  }, []);

  const onSessionFinalized = useCallback((callback: (event: SessionFinalizedEvent) => void) => {
    sessionFinalizedCallbacks.current.add(callback);
    return () => {
      sessionFinalizedCallbacks.current.delete(callback);
    };
  }, []);

  const onSessionStopped = useCallback((callback: (event: SessionStoppedEvent) => void) => {
    sessionStoppedCallbacks.current.add(callback);
    return () => {
      sessionStoppedCallbacks.current.delete(callback);
    };
  }, []);

  const onInningAdvanced = useCallback((callback: (event: InningAdvancedEvent) => void) => {
    inningAdvancedCallbacks.current.add(callback);
    return () => {
      inningAdvancedCallbacks.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: BaseballLiveScoringContextValue = {
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    scorerCount,
    connect: stableConnect,
    disconnect: stableDisconnect,
    onScoreUpdate,
    onSessionStarted,
    onSessionFinalized,
    onSessionStopped,
    onInningAdvanced,
  };

  return (
    <BaseballLiveScoringContext.Provider value={value}>
      {children}
    </BaseballLiveScoringContext.Provider>
  );
}

export function useBaseballLiveScoring() {
  const context = useContext(BaseballLiveScoringContext);
  if (context === undefined) {
    throw new Error('useBaseballLiveScoring must be used within a BaseballLiveScoringProvider');
  }
  return context;
}
