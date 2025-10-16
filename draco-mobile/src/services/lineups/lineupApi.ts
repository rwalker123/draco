import { requestJson } from '../api/httpClient';
import type {
  GameLineupAssignment,
  LineupTemplate,
  LineupTemplatePayload,
  LineupSlot,
} from '../../types/lineups';

type TemplatesResponse = {
  templates: Array<LineupTemplatePayload & { updatedAt?: string }>;
};

type AssignmentsResponse = {
  assignments: GameLineupAssignment[];
};

const LINEUPS_BASE_PATH = '/api/mobile/lineups/templates';
const LINEUP_ASSIGNMENTS_PATH = '/api/mobile/lineups/assignments';

export async function listLineupTemplates(token: string): Promise<LineupTemplate[]> {
  const response = await requestJson<TemplatesResponse>(LINEUPS_BASE_PATH, {
    token
  });

  return (response.templates ?? []).map((template) => ({
    id: template.id,
    name: template.name,
    teamId: template.teamId,
    leagueId: template.leagueId,
    scope: template.scope,
    updatedAt: template.updatedAt ?? new Date().toISOString(),
    slots: normalizeSlots(template.slots),
    status: 'synced'
  }));
}

export async function saveLineupTemplate(token: string, payload: LineupTemplatePayload): Promise<LineupTemplate> {
  const response = await requestJson<LineupTemplatePayload & { updatedAt?: string }>(LINEUPS_BASE_PATH, {
    method: 'POST',
    token,
    body: payload
  });

  return {
    id: response.id,
    name: response.name,
    teamId: response.teamId,
    leagueId: response.leagueId,
    scope: response.scope,
    updatedAt: response.updatedAt ?? new Date().toISOString(),
    slots: normalizeSlots(response.slots),
    status: 'synced'
  };
}

export async function updateLineupTemplate(
  token: string,
  payload: LineupTemplatePayload,
): Promise<LineupTemplate> {
  const response = await requestJson<LineupTemplatePayload & { updatedAt?: string }>(`${LINEUPS_BASE_PATH}/${payload.id}`, {
    method: 'PUT',
    token,
    body: payload
  });

  return {
    id: response.id,
    name: response.name,
    teamId: response.teamId,
    leagueId: response.leagueId,
    scope: response.scope,
    updatedAt: response.updatedAt ?? new Date().toISOString(),
    slots: normalizeSlots(response.slots),
    status: 'synced'
  };
}

export async function deleteLineupTemplate(token: string, templateId: string): Promise<void> {
  await requestJson<void>(`${LINEUPS_BASE_PATH}/${templateId}`, {
    method: 'DELETE',
    token
  });
}

export async function assignTemplateToGame(
  token: string,
  assignment: GameLineupAssignment,
): Promise<GameLineupAssignment> {
  const response = await requestJson<GameLineupAssignment>(LINEUP_ASSIGNMENTS_PATH, {
    method: 'POST',
    token,
    body: assignment
  });

  return {
    ...assignment,
    updatedAt: response?.updatedAt ?? new Date().toISOString()
  };
}

export async function listLineupAssignments(token: string): Promise<GameLineupAssignment[]> {
  const response = await requestJson<AssignmentsResponse>(LINEUP_ASSIGNMENTS_PATH, {
    token
  });

  return (response.assignments ?? []).map((assignment) => ({
    ...assignment,
    updatedAt: assignment.updatedAt ?? new Date().toISOString()
  }));
}

function normalizeSlots(slots: LineupTemplatePayload['slots']): LineupSlot[] {
  return (slots ?? [])
    .map((slot) => ({
      id: slot.id,
      order: slot.order,
      playerName: slot.playerName,
      position: slot.position
    }))
    .sort((a, b) => a.order - b.order);
}
