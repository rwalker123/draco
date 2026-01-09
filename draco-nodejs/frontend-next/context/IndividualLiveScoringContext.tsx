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
import { useApiClient } from '../hooks/useApiClient';
import { getIndividualLiveScoringTicket } from '@draco/shared-api-client';

export interface IndividualLiveHoleScore {
  id: string;
  holeNumber: number;
  score: number;
  enteredBy: string;
  enteredAt: string;
}

export interface IndividualLiveScoringState {
  sessionId: string;
  accountId: string;
  status: 'active' | 'paused' | 'finalized' | 'stopped';
  currentHole: number;
  holesPlayed: number;
  courseId: string;
  courseName: string;
  teeId: string;
  teeName: string;
  datePlayed: string;
  startedAt: string;
  startedBy: string;
  viewerCount?: number;
  scores: IndividualLiveHoleScore[];
}

interface ScoreUpdateEvent {
  holeNumber: number;
  score: number;
  enteredBy: string;
  timestamp: string;
}

interface SessionStartedEvent {
  sessionId: string;
  accountId: string;
  startedBy: string;
  startedAt: string;
}

interface SessionFinalizedEvent {
  sessionId: string;
  accountId: string;
  finalizedBy: string;
  finalizedAt: string;
}

interface SessionStoppedEvent {
  sessionId: string;
  accountId: string;
  stoppedBy: string;
  stoppedAt: string;
}

interface HoleAdvancedEvent {
  holeNumber: number;
  advancedBy: string;
  timestamp: string;
}

interface IndividualLiveScoringContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  sessionState: IndividualLiveScoringState | null;
  viewerCount: number;
  connect: (accountId: string) => void;
  disconnect: () => void;
  onScoreUpdate: (callback: (event: ScoreUpdateEvent) => void) => () => void;
  onSessionStarted: (callback: (event: SessionStartedEvent) => void) => () => void;
  onSessionFinalized: (callback: (event: SessionFinalizedEvent) => void) => () => void;
  onSessionStopped: (callback: (event: SessionStoppedEvent) => void) => () => void;
  onHoleAdvanced: (callback: (event: HoleAdvancedEvent) => void) => () => void;
}

const IndividualLiveScoringContext = createContext<IndividualLiveScoringContextValue | undefined>(
  undefined,
);

interface IndividualLiveScoringProviderProps {
  children: ReactNode;
}

export function IndividualLiveScoringProvider({ children }: IndividualLiveScoringProviderProps) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<IndividualLiveScoringState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentAccountIdRef = useRef<string | null>(null);
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
  const connectRef = useRef<((accountId: string) => void) | null>(null);
  const isConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);

  const disconnect = useCallback(() => {
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

    currentAccountIdRef.current = null;
    reconnectAttempts.current = 0;
    isConnectedRef.current = false;
    isConnectingRef.current = false;
    setIsConnected(false);
    setIsConnecting(false);
    setSessionState(null);
    setViewerCount(0);
  }, []);

  const connectWithTicket = useCallback((accountId: string, ticket: string) => {
    const sseBaseUrl = process.env.NEXT_PUBLIC_SSE_URL || '';
    const baseSseUrl = `${sseBaseUrl}/api/accounts/${accountId}/golfer/live/subscribe`;
    const sseUrl = `${baseSseUrl}?ticket=${encodeURIComponent(ticket)}`;

    console.log('[SSE] connectWithTicket called', {
      sseBaseUrl,
      baseSseUrl,
      sseUrl,
      accountId,
    });

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    console.log('[SSE] EventSource created, setting 30s timeout');

    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      console.log('[SSE] Connection timeout fired after 30s', {
        isConnectedRef: isConnectedRef.current,
        hasEventSource: !!eventSourceRef.current,
      });
      if (!isConnectedRef.current && eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        isConnectingRef.current = false;
        setIsConnecting(false);
        setConnectionError('Connection timed out. Please try again.');
      }
    }, connectionTimeoutMs);

    eventSource.onopen = () => {
      console.log('[SSE] onopen fired - connection successful');
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

    eventSource.onerror = (error) => {
      console.log('[SSE] onerror fired', {
        error,
        readyState: eventSource.readyState,
        reconnectAttempts: reconnectAttempts.current,
      });
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      isConnectedRef.current = false;
      isConnectingRef.current = false;
      setIsConnected(false);
      setIsConnecting(false);

      if (currentAccountIdRef.current !== accountId) {
        console.log('[SSE] Account changed, closing connection');
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
          if (currentAccountIdRef.current === accountId && connectRef.current) {
            connectRef.current(accountId);
          }
        }, delay);
      } else {
        eventSource.close();
        eventSourceRef.current = null;
        currentAccountIdRef.current = null;
        setConnectionError(
          'Unable to connect to live scoring. Please check your connection and try again.',
        );
      }
    };

    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      console.log('Individual SSE connected:', data);
    });

    eventSource.addEventListener('state', (event) => {
      const state = JSON.parse(event.data) as IndividualLiveScoringState;
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

        const existingScoreIndex = prev.scores.findIndex((s) => s.holeNumber === data.holeNumber);

        let updatedScores: IndividualLiveHoleScore[];
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
      eventSource.close();
      eventSourceRef.current = null;
      currentAccountIdRef.current = null;
      isConnectedRef.current = false;
      setIsConnected(false);
    });

    eventSource.addEventListener('session_stopped', (event) => {
      const data = JSON.parse(event.data) as SessionStoppedEvent;
      setSessionState((prev) => (prev ? { ...prev, status: 'stopped' } : prev));
      sessionStoppedCallbacks.current.forEach((cb) => cb(data));
      eventSource.close();
      eventSourceRef.current = null;
      currentAccountIdRef.current = null;
      isConnectedRef.current = false;
      setIsConnected(false);
    });

    eventSource.addEventListener('ping', () => {
      // Keep-alive ping received - no action needed
    });

    eventSource.addEventListener('viewer_count', (event) => {
      const data = JSON.parse(event.data) as { viewerCount: number };
      setViewerCount(data.viewerCount);
    });

    eventSource.addEventListener('no_session', () => {
      setConnectionError('No active live scoring session found. The session may have ended.');
      eventSource.close();
      eventSourceRef.current = null;
      currentAccountIdRef.current = null;
    });
  }, []);

  const connect = useCallback(
    (accountId: string) => {
      console.log('[SSE] connect called', { accountId, hasToken: !!token });

      if (!token) {
        console.log('[SSE] No token, aborting');
        setConnectionError('Authentication required');
        return;
      }

      if (
        currentAccountIdRef.current === accountId &&
        (isConnectedRef.current || isConnectingRef.current)
      ) {
        console.log('[SSE] Already connected/connecting, skipping');
        return;
      }

      disconnect();

      currentAccountIdRef.current = accountId;
      isConnectingRef.current = true;
      setIsConnecting(true);
      setConnectionError(null);

      console.log('[SSE] Requesting ticket...');

      getIndividualLiveScoringTicket({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      })
        .then((result) => {
          console.log('[SSE] Ticket response received', {
            hasError: !!result.error,
            hasTicket: !!result.data?.ticket,
          });

          if (currentAccountIdRef.current !== accountId) {
            console.log('[SSE] Account changed during ticket request, aborting');
            return;
          }

          if (result.error || !result.data?.ticket) {
            isConnectingRef.current = false;
            setIsConnecting(false);
            setConnectionError('Failed to get connection ticket');
            return;
          }

          connectWithTicket(accountId, result.data.ticket);
        })
        .catch(() => {
          if (currentAccountIdRef.current !== accountId) {
            return;
          }
          isConnectingRef.current = false;
          setIsConnecting(false);
          setConnectionError('Failed to get connection ticket');
        });
    },
    [token, apiClient, disconnect, connectWithTicket],
  );

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const stableConnect = useCallback((accountId: string) => {
    connectRef.current?.(accountId);
  }, []);

  const stableDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

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

  const value: IndividualLiveScoringContextValue = {
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    connect: stableConnect,
    disconnect: stableDisconnect,
    onScoreUpdate,
    onSessionStarted,
    onSessionFinalized,
    onSessionStopped,
    onHoleAdvanced,
  };

  return (
    <IndividualLiveScoringContext.Provider value={value}>
      {children}
    </IndividualLiveScoringContext.Provider>
  );
}

export function useIndividualLiveScoring() {
  const context = useContext(IndividualLiveScoringContext);
  if (context === undefined) {
    throw new Error(
      'useIndividualLiveScoring must be used within an IndividualLiveScoringProvider',
    );
  }
  return context;
}
