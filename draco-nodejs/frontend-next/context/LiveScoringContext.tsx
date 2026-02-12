'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAccount } from './AccountContext';
import { useApiClient } from '../hooks/useApiClient';
import { getLiveScoringTicket } from '@draco/shared-api-client';
import type { LiveScoringState, LiveHoleScore } from '@draco/shared-api-client';
import type { GolfSseRoleType } from '@draco/shared-schemas';
import { safeJsonParse } from '../utils/sseUtils';

interface TeamPoints {
  team1Name: string;
  team1Points: number;
  team2Name: string;
  team2Points: number;
}

interface ScoreUpdateEvent {
  golferId: string;
  golferName: string;
  teamId?: string;
  holeNumber: number;
  score: number;
  enteredBy: string;
  timestamp: string;
  teamPoints?: TeamPoints;
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

interface SessionStoppedEvent {
  sessionId: string;
  matchId: string;
  stoppedBy: string;
  stoppedAt: string;
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
  scorerCount: number;
  connect: (matchId: string, role?: GolfSseRoleType) => void;
  disconnect: () => void;
  onScoreUpdate: (callback: (event: ScoreUpdateEvent) => void) => () => void;
  onSessionStarted: (callback: (event: SessionStartedEvent) => void) => () => void;
  onSessionFinalized: (callback: (event: SessionFinalizedEvent) => void) => () => void;
  onSessionStopped: (callback: (event: SessionStoppedEvent) => void) => () => void;
  onHoleAdvanced: (callback: (event: HoleAdvancedEvent) => void) => () => void;
}

const LiveScoringContext = createContext<LiveScoringContextValue | undefined>(undefined);

interface LiveScoringProviderProps {
  children: ReactNode;
}

export function LiveScoringProvider({ children }: LiveScoringProviderProps) {
  const { token } = useAuth();
  const { currentAccount } = useAccount();
  const apiClient = useApiClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<LiveScoringState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [scorerCount, setScorerCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMatchIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;
  const connectionTimeoutMs = 30000;

  const scoreUpdateCallbacks = useRef<Set<(event: ScoreUpdateEvent) => void>>(new Set());
  const sessionStartedCallbacks = useRef<Set<(event: SessionStartedEvent) => void>>(new Set());
  const sessionFinalizedCallbacks = useRef<Set<(event: SessionFinalizedEvent) => void>>(new Set());
  const sessionStoppedCallbacks = useRef<Set<(event: SessionStoppedEvent) => void>>(new Set());
  const holeAdvancedCallbacks = useRef<Set<(event: HoleAdvancedEvent) => void>>(new Set());
  const connectRef = useRef<((matchId: string, role?: GolfSseRoleType) => void) | null>(null);
  const currentRoleRef = useRef<GolfSseRoleType>('watcher');
  const disconnectRef = useRef<(() => void) | null>(null);
  const isConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    currentMatchIdRef.current = null;
    reconnectAttempts.current = 0;
    isConnectedRef.current = false;
    isConnectingRef.current = false;
    setIsConnected(false);
    setIsConnecting(false);
    setSessionState(null);
    setViewerCount(0);
    setScorerCount(0);
  };

  const connectWithTicket = async (matchId: string, ticket: string) => {
    if (!currentAccount?.id) return;

    const sseBaseUrl = process.env.NEXT_PUBLIC_SSE_URL || '';
    const baseSseUrl = `${sseBaseUrl}/api/accounts/${currentAccount.id}/golf/matches/${matchId}/live/subscribe`;
    const sseUrl = `${baseSseUrl}?ticket=${encodeURIComponent(ticket)}`;

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    connectionTimeoutRef.current = setTimeout(() => {
      if (!isConnectedRef.current && eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        isConnectingRef.current = false;
        setIsConnecting(false);
        setConnectionError('Connection timed out. Please try again.');
      }
    }, connectionTimeoutMs);

    eventSource.onopen = () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      isConnectingRef.current = false;
      isConnectedRef.current = true;
      setIsConnecting(false);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
    };

    eventSource.onerror = () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      isConnectedRef.current = false;
      isConnectingRef.current = false;
      setIsConnected(false);
      setIsConnecting(false);

      if (currentMatchIdRef.current !== matchId) {
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
          if (currentMatchIdRef.current === matchId && connectRef.current) {
            connectRef.current(matchId, currentRoleRef.current);
          }
        }, delay);
      } else {
        eventSource.close();
        eventSourceRef.current = null;
        currentMatchIdRef.current = null;
        setConnectionError(
          'Unable to connect to live scoring. Please check your connection and try again.',
        );
      }
    };

    eventSource.addEventListener('connected', (event) => {
      const data = safeJsonParse<{ message: string }>(event.data, 'connected');
      if (!data) return;
      console.log('SSE connected:', data);
    });

    eventSource.addEventListener('state', (event) => {
      const state = safeJsonParse<LiveScoringState>(event.data, 'state');
      if (!state) return;
      setSessionState(state);
      if (state.viewerCount !== undefined) {
        setViewerCount(state.viewerCount);
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

        return {
          ...prev,
          scores: updatedScores,
          teamPoints: data.teamPoints ?? prev.teamPoints,
        };
      });

      scoreUpdateCallbacks.current.forEach((cb) => cb(data));
    });

    eventSource.addEventListener('hole_advanced', (event) => {
      const data = safeJsonParse<HoleAdvancedEvent>(event.data, 'hole_advanced');
      if (!data) return;
      setSessionState((prev) => (prev ? { ...prev, currentHole: data.holeNumber } : prev));
      holeAdvancedCallbacks.current.forEach((cb) => cb(data));
    });

    eventSource.addEventListener('session_finalized', (event) => {
      const data = safeJsonParse<SessionFinalizedEvent>(event.data, 'session_finalized');
      if (!data) return;
      setSessionState((prev) => (prev ? { ...prev, status: 'finalized' } : prev));
      sessionFinalizedCallbacks.current.forEach((cb) => cb(data));
      eventSource.close();
      eventSourceRef.current = null;
      currentMatchIdRef.current = null;
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
      currentMatchIdRef.current = null;
      isConnectedRef.current = false;
      setIsConnected(false);
    });

    eventSource.addEventListener('ping', () => {});

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
      currentMatchIdRef.current = null;
    });
  };

  const connect = (matchId: string, role: GolfSseRoleType = 'watcher') => {
    if (!token || !currentAccount?.id) {
      setConnectionError('Authentication required');
      return;
    }

    if (
      currentMatchIdRef.current === matchId &&
      (isConnectedRef.current || isConnectingRef.current)
    ) {
      return;
    }

    disconnect();

    currentMatchIdRef.current = matchId;
    currentRoleRef.current = role;
    isConnectingRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);

    getLiveScoringTicket({
      client: apiClient,
      path: { accountId: currentAccount.id, matchId },
      body: { role },
      throwOnError: false,
    })
      .then((result) => {
        if (currentMatchIdRef.current !== matchId) {
          return;
        }

        if (result.error || !result.data?.ticket) {
          isConnectingRef.current = false;
          setIsConnecting(false);
          setConnectionError('Failed to get connection ticket');
          return;
        }

        connectWithTicket(matchId, result.data.ticket);
      })
      .catch(() => {
        if (currentMatchIdRef.current !== matchId) {
          return;
        }
        isConnectingRef.current = false;
        setIsConnecting(false);
        setConnectionError('Failed to get connection ticket');
      });
  };

  useEffect(() => {
    connectRef.current = connect;
  });

  useEffect(() => {
    disconnectRef.current = disconnect;
  });

  const stableConnect = (matchId: string, role?: GolfSseRoleType) => {
    connectRef.current?.(matchId, role);
  };

  const stableDisconnect = () => {
    disconnectRef.current?.();
  };

  const onScoreUpdate = (callback: (event: ScoreUpdateEvent) => void) => {
    scoreUpdateCallbacks.current.add(callback);
    return () => {
      scoreUpdateCallbacks.current.delete(callback);
    };
  };

  const onSessionStarted = (callback: (event: SessionStartedEvent) => void) => {
    sessionStartedCallbacks.current.add(callback);
    return () => {
      sessionStartedCallbacks.current.delete(callback);
    };
  };

  const onSessionFinalized = (callback: (event: SessionFinalizedEvent) => void) => {
    sessionFinalizedCallbacks.current.add(callback);
    return () => {
      sessionFinalizedCallbacks.current.delete(callback);
    };
  };

  const onSessionStopped = (callback: (event: SessionStoppedEvent) => void) => {
    sessionStoppedCallbacks.current.add(callback);
    return () => {
      sessionStoppedCallbacks.current.delete(callback);
    };
  };

  const onHoleAdvanced = (callback: (event: HoleAdvancedEvent) => void) => {
    holeAdvancedCallbacks.current.add(callback);
    return () => {
      holeAdvancedCallbacks.current.delete(callback);
    };
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: LiveScoringContextValue = {
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
