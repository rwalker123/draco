import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import { ScorekeepingGateway } from './scorekeepingGateway.js';

export type RunnerState = {
  id: string;
  name: string;
};

export type BasesState = {
  first: RunnerState | null;
  second: RunnerState | null;
  third: RunnerState | null;
};

export type ScoreEventPayload = {
  id: string;
  clientEventId?: string;
  serverId?: string;
  sequence: number;
  gameId: string;
  createdAt: string;
  createdBy: string;
  deviceId: string;
  notation: string;
  summary: string;
  input: unknown;
  inning: number;
  half: 'top' | 'bottom';
  outsBefore: number;
  outsAfter: number;
  scoreAfter: { home: number; away: number };
  basesAfter: BasesState;
};

export type ScoreMutationAudit = {
  userName: string;
  deviceId: string;
  timestamp: string;
};

export type ScoreMutationRequest = {
  type: 'create' | 'update' | 'delete';
  clientEventId: string;
  serverEventId?: string;
  sequence: number;
  event?: ScoreEventPayload;
  audit: ScoreMutationAudit;
};

export type ScoreMutationResult = {
  serverEventId: string;
  sequence: number;
  event: (ScoreEventPayload & { clientEventId: string; serverId: string; syncStatus: 'synced'; syncError: null }) | null;
};

type StoredScoreEvent = ScoreEventPayload & {
  clientEventId: string;
  serverId: string;
};

type StoredGame = {
  events: StoredScoreEvent[];
};

export class ScorekeepingService {
  private readonly games = new Map<string, StoredGame>();

  constructor(private readonly gateway: ScorekeepingGateway) {}

  ingestMutation(accountId: string, gameId: string, mutation: ScoreMutationRequest): ScoreMutationResult {
    const store = this.ensureGame(accountId, gameId);

    switch (mutation.type) {
      case 'create':
        return this.handleCreate(accountId, gameId, store, mutation);
      case 'update':
        return this.handleUpdate(accountId, gameId, store, mutation);
      case 'delete':
        return this.handleDelete(accountId, gameId, store, mutation);
      default:
        throw new ValidationError('Unsupported mutation type');
    }
  }

  listEvents(accountId: string, gameId: string): ScoreEventPayload[] {
    const game = this.games.get(this.key(accountId, gameId));
    if (!game) {
      return [];
    }

    return game.events.map((event) => this.toResponseEvent(event));
  }

  private handleCreate(
    accountId: string,
    gameId: string,
    store: StoredGame,
    mutation: ScoreMutationRequest,
  ): ScoreMutationResult {
    if (!mutation.event) {
      throw new ValidationError('Missing event payload');
    }

    const clientEventId = mutation.event.clientEventId ?? mutation.clientEventId;
    const existingByClient = store.events.find((event) => event.clientEventId === clientEventId);
    if (existingByClient) {
      return {
        serverEventId: existingByClient.serverId,
        sequence: existingByClient.sequence,
        event: this.toResponseEvent(existingByClient),
      };
    }

    const conflict = store.events.find(
      (event) => event.sequence === mutation.sequence && event.clientEventId !== clientEventId,
    );
    if (conflict) {
      throw new ConflictError('Another device has already recorded a play for this sequence');
    }

    const stored: StoredScoreEvent = {
      ...mutation.event,
      clientEventId,
      serverId: randomUUID(),
      sequence: mutation.sequence,
    };

    store.events.push(stored);
    store.events.sort((a, b) => a.sequence - b.sequence);

    const response = this.toResponseEvent(stored);
    this.gateway.broadcast(accountId, gameId, response);

    return {
      serverEventId: stored.serverId,
      sequence: stored.sequence,
      event: response,
    };
  }

  private handleUpdate(
    accountId: string,
    gameId: string,
    store: StoredGame,
    mutation: ScoreMutationRequest,
  ): ScoreMutationResult {
    if (!mutation.event) {
      throw new ValidationError('Missing event payload');
    }

    const target = this.findEvent(store, mutation);
    if (!target) {
      throw new NotFoundError('Score event not found');
    }

    target.sequence = mutation.sequence;
    target.createdAt = mutation.event.createdAt;
    target.createdBy = mutation.event.createdBy;
    target.deviceId = mutation.event.deviceId;
    target.notation = mutation.event.notation;
    target.summary = mutation.event.summary;
    target.input = mutation.event.input;
    target.inning = mutation.event.inning;
    target.half = mutation.event.half;
    target.outsBefore = mutation.event.outsBefore;
    target.outsAfter = mutation.event.outsAfter;
    target.scoreAfter = mutation.event.scoreAfter;
    target.basesAfter = mutation.event.basesAfter;

    store.events.sort((a, b) => a.sequence - b.sequence);

    const response = this.toResponseEvent(target);
    this.gateway.broadcast(accountId, gameId, response);

    return {
      serverEventId: target.serverId,
      sequence: target.sequence,
      event: response,
    };
  }

  private handleDelete(
    accountId: string,
    gameId: string,
    store: StoredGame,
    mutation: ScoreMutationRequest,
  ): ScoreMutationResult {
    const target = this.findEvent(store, mutation);
    if (!target) {
      throw new NotFoundError('Score event not found');
    }

    store.events = store.events.filter((event) => event.serverId !== target.serverId);

    const response = { ...this.toResponseEvent(target), deleted: true };
    this.gateway.broadcast(accountId, gameId, response);

    return {
      serverEventId: target.serverId,
      sequence: target.sequence,
      event: null,
    };
  }

  private findEvent(store: StoredGame, mutation: ScoreMutationRequest): StoredScoreEvent | undefined {
    if (mutation.serverEventId) {
      return store.events.find((event) => event.serverId === mutation.serverEventId);
    }

    return store.events.find((event) => event.clientEventId === mutation.clientEventId);
  }

  private ensureGame(accountId: string, gameId: string): StoredGame {
    const key = this.key(accountId, gameId);
    const existing = this.games.get(key);
    if (existing) {
      return existing;
    }

    const created: StoredGame = { events: [] };
    this.games.set(key, created);
    return created;
  }

  private key(accountId: string, gameId: string): string {
    return `${accountId}:${gameId}`;
  }

  private toResponseEvent(event: StoredScoreEvent): ScoreMutationResult['event'] {
    return {
      id: event.clientEventId,
      clientEventId: event.clientEventId,
      serverId: event.serverId,
      sequence: event.sequence,
      gameId: event.gameId,
      createdAt: event.createdAt,
      createdBy: event.createdBy,
      deviceId: event.deviceId,
      notation: event.notation,
      summary: event.summary,
      input: event.input,
      inning: event.inning,
      half: event.half,
      outsBefore: event.outsBefore,
      outsAfter: event.outsAfter,
      scoreAfter: event.scoreAfter,
      basesAfter: event.basesAfter,
      syncStatus: 'synced',
      syncError: null,
    };
  }
}
