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
import type { LiveScoringState, LiveHoleScore } from '@draco/shared-api-client';

interface ScoreUpdateEvent {
  golferId: string;
  golferName: string;
  teamId?: string;
  holeNumber: number;
  score: number;
  enteredBy: string;
  timestamp: string;
}

interface SessionStartedEvent {
  sessionId: string;
  matchId: string;
  startedBy: string;
  startedAt: string;
}

interface SessionFinalizedEvent {
  sessionId: string;
  matchId: string;
  finalizedBy: string;
  finalizedAt: string;
}

interface HoleAdvancedEvent {
  holeNumber: number;
  advancedBy: string;
  timestamp: string;
}

interface LiveScoringContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  sessionState: LiveScoringState | null;
  viewerCount: number;
  connect: (matchId: string) => void;
  disconnect: () => void;
  onScoreUpdate: (callback: (event: ScoreUpdateEvent) => void) => () => void;
  onSessionStarted: (callback: (event: SessionStartedEvent) => void) => () => void;
  onSessionFinalized: (callback: (event: SessionFinalizedEvent) => void) => () => void;
  onHoleAdvanced: (callback: (event: HoleAdvancedEvent) => void) => () => void;
}

const LiveScoringContext = createContext<LiveScoringContextValue | undefined>(undefined);

interface LiveScoringProviderProps {
  children: ReactNode;
}

export function LiveScoringProvider({ children }: LiveScoringProviderProps) {
  const { token } = useAuth();
  const { currentAccount } = useAccount();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<LiveScoringState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMatchIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const scoreUpdateCallbacks = useRef<Set<(event: ScoreUpdateEvent) => void>>(new Set());
  const sessionStartedCallbacks = useRef<Set<(event: SessionStartedEvent) => void>>(new Set());
  const sessionFinalizedCallbacks = useRef<Set<(event: SessionFinalizedEvent) => void>>(new Set());
  const holeAdvancedCallbacks = useRef<Set<(event: HoleAdvancedEvent) => void>>(new Set());
  const connectRef = useRef<((matchId: string) => void) | null>(null);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    currentMatchIdRef.current = null;
    reconnectAttempts.current = 0;
    setIsConnected(false);
    setIsConnecting(false);
    setSessionState(null);
    setViewerCount(0);
  }, []);

  const connect = useCallback(
    (matchId: string) => {
      if (!token || !currentAccount?.id) {
        setConnectionError('Authentication required');
        return;
      }

      if (currentMatchIdRef.current === matchId && (isConnected || isConnecting)) {
        return;
      }

      disconnect();

      currentMatchIdRef.current = matchId;
      setIsConnecting(true);
      setConnectionError(null);

      const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
      const sseUrl = `${baseUrl}/accounts/${currentAccount.id}/golf/matches/${matchId}/live/subscribe`;

      const eventSource = new EventSource(sseUrl, {
        withCredentials: true,
      });

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnecting(false);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setIsConnecting(false);

        if (eventSource.readyState === EventSource.CLOSED) {
          if (
            currentMatchIdRef.current === matchId &&
            reconnectAttempts.current < maxReconnectAttempts
          ) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
            reconnectAttempts.current++;
            setConnectionError(`Connection lost. Reconnecting in ${delay / 1000}s...`);

            reconnectTimeoutRef.current = setTimeout(() => {
              if (currentMatchIdRef.current === matchId && connectRef.current) {
                connectRef.current(matchId);
              }
            }, delay);
          } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            setConnectionError('Failed to connect after multiple attempts');
          }
        }
      };

      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE connected:', data);
      });

      eventSource.addEventListener('state', (event) => {
        const state = JSON.parse(event.data) as LiveScoringState;
        setSessionState(state);
        if (state.viewerCount !== undefined) {
          setViewerCount(state.viewerCount);
        }
      });

      eventSource.addEventListener('session_started', (event) => {
        const data = JSON.parse(event.data) as SessionStartedEvent;
        sessionStartedCallbacks.current.forEach((cb) => cb(data));
      });

      eventSource.addEventListener('score_update', (event) => {
        const data = JSON.parse(event.data) as ScoreUpdateEvent;

        setSessionState((prev) => {
          if (!prev) return prev;

          const existingScoreIndex = prev.scores.findIndex(
            (s) => s.golferId === data.golferId && s.holeNumber === data.holeNumber,
          );

          let updatedScores: LiveHoleScore[];
          if (existingScoreIndex >= 0) {
            updatedScores = [...prev.scores];
            updatedScores[existingScoreIndex] = {
              ...updatedScores[existingScoreIndex],
              score: data.score,
              enteredBy: data.enteredBy,
              enteredAt: data.timestamp,
            };
          } else {
            updatedScores = [
              ...prev.scores,
              {
                id: `temp-${Date.now()}`,
                golferId: data.golferId,
                golferName: data.golferName,
                teamId: data.teamId,
                holeNumber: data.holeNumber,
                score: data.score,
                enteredBy: data.enteredBy,
                enteredAt: data.timestamp,
              },
            ];
          }

          return { ...prev, scores: updatedScores };
        });

        scoreUpdateCallbacks.current.forEach((cb) => cb(data));
      });

      eventSource.addEventListener('hole_advanced', (event) => {
        const data = JSON.parse(event.data) as HoleAdvancedEvent;
        setSessionState((prev) => (prev ? { ...prev, currentHole: data.holeNumber } : prev));
        holeAdvancedCallbacks.current.forEach((cb) => cb(data));
      });

      eventSource.addEventListener('session_finalized', (event) => {
        const data = JSON.parse(event.data) as SessionFinalizedEvent;
        setSessionState((prev) => (prev ? { ...prev, status: 'finalized' } : prev));
        sessionFinalizedCallbacks.current.forEach((cb) => cb(data));
      });

      eventSource.addEventListener('ping', () => {
        // Keep-alive ping received - no action needed
      });
    },
    [token, currentAccount, isConnected, isConnecting, disconnect],
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

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

  const onHoleAdvanced = useCallback((callback: (event: HoleAdvancedEvent) => void) => {
    holeAdvancedCallbacks.current.add(callback);
    return () => {
      holeAdvancedCallbacks.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: LiveScoringContextValue = {
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    connect,
    disconnect,
    onScoreUpdate,
    onSessionStarted,
    onSessionFinalized,
    onHoleAdvanced,
  };

  return <LiveScoringContext.Provider value={value}>{children}</LiveScoringContext.Provider>;
}

export function useLiveScoring() {
  const context = useContext(LiveScoringContext);
  if (context === undefined) {
    throw new Error('useLiveScoring must be used within a LiveScoringProvider');
  }
  return context;
}
