import type { Server } from 'node:http';
import { URL } from 'node:url';
import { WebSocketServer, type WebSocket } from 'ws';
import type { AuthService } from './authService.js';

export type BroadcastEvent = Record<string, unknown>;

export class ScorekeepingGateway {
  private readonly channels = new Map<string, Set<WebSocket>>();
  private server: WebSocketServer | null = null;

  constructor(private readonly authService: AuthService) {}

  attach(server: Server): void {
    if (this.server) {
      return;
    }

    this.server = new WebSocketServer({ server, path: '/ws/score-events' });
    this.server.on('connection', (socket, request) => {
      void this.handleConnection(socket, request.url ?? '');
    });
  }

  broadcast(accountId: string, gameId: string, event: BroadcastEvent): void {
    const channel = this.channels.get(this.channelKey(accountId, gameId));
    if (!channel?.size) {
      return;
    }

    const payload = JSON.stringify({ type: 'score-event', payload: event });
    for (const socket of channel) {
      if (socket.readyState === socket.OPEN) {
        socket.send(payload);
      }
    }
  }

  private async handleConnection(socket: WebSocket, url: string): Promise<void> {
    try {
      const parsed = new URL(url, 'http://localhost');
      const token = parsed.searchParams.get('token');
      const accountId = parsed.searchParams.get('accountId');
      const gameId = parsed.searchParams.get('gameId');

      if (!token || !accountId || !gameId) {
        socket.close(4001, 'Missing authentication');
        return;
      }

      await this.authService.verifyToken(token);

      const channelKey = this.channelKey(accountId, gameId);
      const clients = this.channels.get(channelKey) ?? new Set<WebSocket>();
      clients.add(socket);
      this.channels.set(channelKey, clients);

      socket.on('close', () => {
        clients.delete(socket);
        if (clients.size === 0) {
          this.channels.delete(channelKey);
        }
      });
    } catch (error) {
      console.warn('Scorekeeping WebSocket rejected', error);
      socket.close(4001, 'Unauthorized');
    }
  }

  private channelKey(accountId: string, gameId: string): string {
    return `${accountId}:${gameId}`;
  }
}
