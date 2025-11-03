import { API_BASE_URL } from '../../config/env';
import type { ScoreEvent } from '../../types/scoring';

type GameStreamOptions = {
  accountId: string;
  gameId: string;
  token: string;
  onEvent: (event: ScoreEvent) => void;
  onClose?: () => void;
  onError?: (error: unknown) => void;
};

export type GameStreamConnection = {
  close: () => void;
};

const toWebSocketUrl = (baseUrl: string): string => {
  if (baseUrl.startsWith('https://')) {
    return `wss://${baseUrl.slice('https://'.length)}`;
  }

  if (baseUrl.startsWith('http://')) {
    return `ws://${baseUrl.slice('http://'.length)}`;
  }

  return baseUrl;
};

export function connectToGameStream(options: GameStreamOptions): GameStreamConnection {
  const { accountId, gameId, token, onEvent, onClose, onError } = options;
  const wsBase = toWebSocketUrl(API_BASE_URL);
  const url = `${wsBase}/ws/score-events?accountId=${encodeURIComponent(accountId)}&gameId=${encodeURIComponent(
    gameId,
  )}&token=${encodeURIComponent(token)}`;

  const socket = new WebSocket(url);

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data as string) as { type: string; payload?: unknown };
      if (parsed.type === 'score-event' && parsed.payload) {
        onEvent(parsed.payload as ScoreEvent);
      }
    } catch (error) {
      onError?.(error);
    }
  };

  socket.onerror = (event) => {
    onError?.(event);
  };

  socket.onclose = () => {
    onClose?.();
  };

  return {
    close: () => {
      socket.close();
    },
  };
}
