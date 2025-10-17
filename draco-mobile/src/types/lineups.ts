import type { ScorekeeperScope } from './schedule';

export type LineupSlot = {
  id: string;
  order: number;
  playerName: string;
  position: string;
  rosterMemberId?: string | null;
  playerId?: string | null;
  contactId?: string | null;
};

export type LineupTemplate = {
  id: string;
  name: string;
  teamId: string;
  leagueId?: string | null;
  scope: ScorekeeperScope;
  updatedAt: string;
  slots: LineupSlot[];
  status: 'synced' | 'pending' | 'failed';
  pendingAction?: 'create' | 'update' | 'delete';
};

export type GameLineupAssignment = {
  gameId: string;
  templateId: string;
  updatedAt: string;
};

export type LineupMutation =
  | { type: 'create'; payload: LineupTemplatePayload; clientId: string; timestamp: number }
  | { type: 'update'; payload: LineupTemplatePayload; clientId: string; timestamp: number }
  | { type: 'delete'; templateId: string; clientId: string; timestamp: number }
  | { type: 'assign'; assignment: GameLineupAssignment; clientId: string; timestamp: number };

export type LineupTemplatePayload = {
  id: string;
  name: string;
  teamId: string;
  leagueId?: string | null;
  scope: ScorekeeperScope;
  slots: LineupSlotPayload[];
};
export type LineupSlotPayload = Pick<LineupSlot, 'id' | 'order' | 'playerName' | 'position' | 'rosterMemberId' | 'playerId' | 'contactId'>;

export type TeamRosterPlayer = {
  rosterMemberId: string;
  playerId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  playerNumber?: number;
  inactive?: boolean;
};
