import { Response } from 'express';
import { type SseRole } from './sseTicketManager.js';

interface SSEClient {
  id: string;
  res: Response;
  userId: string;
  matchId?: bigint;
  accountId?: bigint;
  gameId?: bigint;
  role?: SseRole;
  lastPing: number;
}

/**
 * Manages Server-Sent Events (SSE) connections for live scoring.
 * Handles client subscriptions, broadcasting, and connection lifecycle.
 */
export class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private matchSubscriptions: Map<string, Set<string>> = new Map(); // matchId -> clientIds
  private accountSubscriptions: Map<string, Set<string>> = new Map(); // accountId -> clientIds
  private gameSubscriptions: Map<string, Set<string>> = new Map(); // gameId -> clientIds (baseball)
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL_MS = 30000; // 30 seconds (Railway has 60s timeout)
  private readonly STALE_THRESHOLD_MS = 120000; // 2 minutes

  constructor() {
    this.startPingInterval();
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.pingAllClients();
      this.cleanupStaleClients();
    }, this.PING_INTERVAL_MS);
  }

  /**
   * Adds a new SSE client connection for a specific match.
   */
  addClient(
    clientId: string,
    res: Response,
    userId: string,
    matchId: bigint,
    role: SseRole = 'watcher',
  ): void {
    const client: SSEClient = {
      id: clientId,
      res,
      userId,
      matchId,
      role,
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);

    const matchKey = matchId.toString();
    if (!this.matchSubscriptions.has(matchKey)) {
      this.matchSubscriptions.set(matchKey, new Set());
    }
    this.matchSubscriptions.get(matchKey)!.add(clientId);

    console.log(
      `📡 SSE client ${clientId} (${role}) connected to match ${matchKey}. Total clients: ${this.clients.size}`,
    );

    // Send initial connection event
    this.sendEvent(clientId, 'connected', { clientId, matchId: matchKey });

    // Broadcast updated viewer and scorer counts to all clients watching this match
    this.broadcastViewerCount(matchId);
    this.broadcastMatchScorerCount(matchId);
  }

  /**
   * Removes a client connection and cleans up subscriptions.
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      if (client.matchId) {
        const matchKey = client.matchId.toString();
        const wasScorer = client.role === 'scorer';
        this.matchSubscriptions.get(matchKey)?.delete(clientId);
        const remainingClients = this.matchSubscriptions.get(matchKey)?.size ?? 0;
        if (remainingClients === 0) {
          this.matchSubscriptions.delete(matchKey);
        }
        this.clients.delete(clientId);
        console.log(`📡 SSE client ${clientId} disconnected. Total clients: ${this.clients.size}`);

        if (remainingClients > 0) {
          this.broadcastViewerCount(client.matchId);
          if (wasScorer) {
            this.broadcastMatchScorerCount(client.matchId);
          }
        }
      } else if (client.accountId) {
        const accountKey = client.accountId.toString();
        this.accountSubscriptions.get(accountKey)?.delete(clientId);
        const remainingClients = this.accountSubscriptions.get(accountKey)?.size ?? 0;
        if (remainingClients === 0) {
          this.accountSubscriptions.delete(accountKey);
        }
        this.clients.delete(clientId);
        console.log(`📡 SSE client ${clientId} disconnected. Total clients: ${this.clients.size}`);

        if (remainingClients > 0) {
          this.broadcastAccountViewerCount(client.accountId);
        }
      } else if (client.gameId) {
        const gameKey = client.gameId.toString();
        const wasScorer = client.role === 'scorer';
        this.gameSubscriptions.get(gameKey)?.delete(clientId);
        const remainingClients = this.gameSubscriptions.get(gameKey)?.size ?? 0;
        if (remainingClients === 0) {
          this.gameSubscriptions.delete(gameKey);
        }
        this.clients.delete(clientId);
        console.log(`📡 SSE client ${clientId} disconnected. Total clients: ${this.clients.size}`);

        if (remainingClients > 0) {
          this.broadcastGameViewerCount(client.gameId);
          if (wasScorer) {
            this.broadcastGameScorerCount(client.gameId);
          }
        }
      } else {
        this.clients.delete(clientId);
        console.log(`📡 SSE client ${clientId} disconnected. Total clients: ${this.clients.size}`);
      }
    }
  }

  /**
   * Broadcasts the current viewer count to all clients watching a match.
   */
  broadcastViewerCount(matchId: bigint): void {
    const viewerCount = this.getMatchViewerCount(matchId);
    this.broadcastToMatch(matchId, 'viewer_count', { viewerCount });
  }

  /**
   * Broadcasts an event to all clients subscribed to a specific match.
   */
  broadcastToMatch(matchId: bigint, event: string, data: unknown): void {
    const matchKey = matchId.toString();
    const clientIds = this.matchSubscriptions.get(matchKey);

    if (clientIds) {
      const serializedData = JSON.stringify(data);
      for (const clientId of clientIds) {
        this.sendEventRaw(clientId, event, serializedData);
      }
    }
  }

  /**
   * Adds a new SSE client connection for a specific account (individual live scoring).
   */
  addAccountClient(clientId: string, res: Response, userId: string, accountId: bigint): void {
    const client: SSEClient = {
      id: clientId,
      res,
      userId,
      accountId,
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);

    const accountKey = accountId.toString();
    if (!this.accountSubscriptions.has(accountKey)) {
      this.accountSubscriptions.set(accountKey, new Set());
    }
    this.accountSubscriptions.get(accountKey)!.add(clientId);

    console.log(
      `📡 SSE client ${clientId} connected to account ${accountKey}. Total clients: ${this.clients.size}`,
    );

    this.sendEvent(clientId, 'connected', { clientId, accountId: accountKey });

    this.broadcastAccountViewerCount(accountId);
  }

  /**
   * Broadcasts the current viewer count to all clients watching an account.
   */
  broadcastAccountViewerCount(accountId: bigint): void {
    const viewerCount = this.getAccountViewerCount(accountId);
    this.broadcastToAccount(accountId, 'viewer_count', { viewerCount });
  }

  /**
   * Broadcasts an event to all clients subscribed to a specific account.
   */
  broadcastToAccount(accountId: bigint, event: string, data: unknown): void {
    const accountKey = accountId.toString();
    const clientIds = this.accountSubscriptions.get(accountKey);

    if (clientIds) {
      const serializedData = JSON.stringify(data);
      for (const clientId of clientIds) {
        this.sendEventRaw(clientId, event, serializedData);
      }
    }
  }

  /**
   * Gets the number of viewers for a specific account.
   */
  getAccountViewerCount(accountId: bigint): number {
    return this.accountSubscriptions.get(accountId.toString())?.size ?? 0;
  }

  /**
   * Adds a new SSE client connection for a specific game (baseball live scoring).
   */
  addGameClient(
    clientId: string,
    res: Response,
    userId: string,
    gameId: bigint,
    role: SseRole = 'watcher',
  ): void {
    const client: SSEClient = {
      id: clientId,
      res,
      userId,
      gameId,
      role,
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);

    const gameKey = gameId.toString();
    if (!this.gameSubscriptions.has(gameKey)) {
      this.gameSubscriptions.set(gameKey, new Set());
    }
    this.gameSubscriptions.get(gameKey)!.add(clientId);

    console.log(
      `📡 SSE client ${clientId} (${role}) connected to game ${gameKey}. Total clients: ${this.clients.size}`,
    );

    this.sendEvent(clientId, 'connected', { clientId, gameId: gameKey });

    this.broadcastGameViewerCount(gameId);
    this.broadcastGameScorerCount(gameId);
  }

  /**
   * Broadcasts the current viewer count to all clients watching a game.
   */
  broadcastGameViewerCount(gameId: bigint): void {
    const viewerCount = this.getGameViewerCount(gameId);
    this.broadcastToGame(gameId, 'viewer_count', { viewerCount });
  }

  /**
   * Broadcasts an event to all clients subscribed to a specific game.
   */
  broadcastToGame(gameId: bigint, event: string, data: unknown): void {
    const gameKey = gameId.toString();
    const clientIds = this.gameSubscriptions.get(gameKey);

    if (clientIds) {
      const serializedData = JSON.stringify(data);
      for (const clientId of clientIds) {
        this.sendEventRaw(clientId, event, serializedData);
      }
    }
  }

  /**
   * Gets the number of viewers for a specific game.
   */
  getGameViewerCount(gameId: bigint): number {
    return this.gameSubscriptions.get(gameId.toString())?.size ?? 0;
  }

  /**
   * Gets the number of scorers (not watchers) for a specific game.
   */
  getGameScorerCount(gameId: bigint): number {
    const gameKey = gameId.toString();
    const clientIds = this.gameSubscriptions.get(gameKey);
    if (!clientIds) return 0;

    let count = 0;
    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client?.role === 'scorer') count++;
    }
    return count;
  }

  /**
   * Broadcasts the current scorer count to all clients watching a game.
   */
  broadcastGameScorerCount(gameId: bigint): void {
    const scorerCount = this.getGameScorerCount(gameId);
    this.broadcastToGame(gameId, 'scorer_count', { scorerCount });
  }

  /**
   * Sends an event to a specific client.
   * Returns true if successful, false if the client was removed due to error.
   */
  private sendEvent(clientId: string, event: string, data: unknown): boolean {
    return this.sendEventRaw(clientId, event, JSON.stringify(data));
  }

  private sendEventRaw(clientId: string, event: string, serializedData: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    try {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${serializedData}\n\n`);
      client.lastPing = Date.now();
      return true;
    } catch {
      console.warn(`📡 Failed to send SSE event to client ${clientId}, removing client`);
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Sends a ping event to all connected clients to keep connections alive.
   */
  private pingAllClients(): void {
    const timestamp = Date.now();
    for (const [clientId] of this.clients) {
      this.sendEvent(clientId, 'ping', { timestamp });
    }
  }

  /**
   * Removes clients that haven't received a successful ping recently.
   */
  private cleanupStaleClients(): void {
    const staleThreshold = Date.now() - this.STALE_THRESHOLD_MS;
    const staleClients: string[] = [];

    for (const [clientId, client] of this.clients) {
      if (client.lastPing < staleThreshold) {
        staleClients.push(clientId);
      }
    }

    for (const clientId of staleClients) {
      console.log(`📡 Removing stale SSE client ${clientId}`);
      this.removeClient(clientId);
    }
  }

  /**
   * Gets the number of viewers for a specific match.
   */
  getMatchViewerCount(matchId: bigint): number {
    return this.matchSubscriptions.get(matchId.toString())?.size ?? 0;
  }

  /**
   * Gets the number of scorers (not watchers) for a specific match.
   */
  getMatchScorerCount(matchId: bigint): number {
    const matchKey = matchId.toString();
    const clientIds = this.matchSubscriptions.get(matchKey);
    if (!clientIds) return 0;

    let count = 0;
    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client?.role === 'scorer') count++;
    }
    return count;
  }

  /**
   * Broadcasts the current scorer count to all clients watching a match.
   */
  broadcastMatchScorerCount(matchId: bigint): void {
    const scorerCount = this.getMatchScorerCount(matchId);
    this.broadcastToMatch(matchId, 'scorer_count', { scorerCount });
  }

  /**
   * Gets total number of connected clients across all matches.
   */
  getTotalClientCount(): number {
    return this.clients.size;
  }

  /**
   * Gets list of match IDs that have active viewers.
   */
  getActiveMatchIds(): bigint[] {
    return Array.from(this.matchSubscriptions.keys()).map((id) => BigInt(id));
  }

  /**
   * Checks if a specific user is connected to a match.
   */
  isUserConnectedToMatch(matchId: bigint, userId: string): boolean {
    const matchKey = matchId.toString();
    const clientIds = this.matchSubscriptions.get(matchKey);
    if (!clientIds) return false;

    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client && client.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gracefully shuts down the SSE manager.
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close all client connections
    for (const [clientId, client] of this.clients) {
      try {
        this.sendEvent(clientId, 'shutdown', { message: 'Server shutting down' });
        client.res.end();
      } catch {
        // Ignore errors during shutdown
      }
    }

    this.clients.clear();
    this.matchSubscriptions.clear();
    this.accountSubscriptions.clear();
    this.gameSubscriptions.clear();
    console.log('📡 SSE Manager shutdown complete');
  }
}

// Singleton instance
let sseManagerInstance: SSEManager | null = null;

export function getSSEManager(): SSEManager {
  if (!sseManagerInstance) {
    sseManagerInstance = new SSEManager();
  }
  return sseManagerInstance;
}

export function shutdownSSEManager(): void {
  if (sseManagerInstance) {
    sseManagerInstance.shutdown();
    sseManagerInstance = null;
  }
}
