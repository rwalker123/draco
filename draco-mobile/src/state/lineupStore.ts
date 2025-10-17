import { createStore } from './createStore';
import {
  assignTemplateToGame,
  deleteLineupTemplate,
  listLineupAssignments,
  listLineupTemplates,
  saveLineupTemplate,
  updateLineupTemplate
} from '../services/lineups/lineupApi';
import type {
  GameLineupAssignment,
  LineupMutation,
  LineupTemplate,
  LineupTemplatePayload
} from '../types/lineups';
import { clearLineupCache, loadLineupCache, saveLineupCache } from '../storage/lineupStorage';

type LineupStatus = 'idle' | 'loading' | 'error';

type MutationContext = {
  token?: string | null;
  online: boolean;
};

type LineupState = {
  hydrated: boolean;
  status: LineupStatus;
  error: string | null;
  templatesById: Record<string, LineupTemplate>;
  templateOrder: string[];
  assignmentsByGameId: Record<string, GameLineupAssignment>;
  pending: LineupMutation[];
  hydrate: () => Promise<void>;
  refresh: (token: string) => Promise<void>;
  createTemplate: (payload: LineupTemplatePayload, context: MutationContext) => Promise<LineupTemplate>;
  updateTemplate: (payload: LineupTemplatePayload, context: MutationContext) => Promise<LineupTemplate>;
  deleteTemplate: (templateId: string, context: MutationContext) => Promise<void>;
  assignToGame: (assignment: GameLineupAssignment, context: MutationContext) => Promise<void>;
  syncPending: (token: string) => Promise<void>;
  clear: () => Promise<void>;
};

const toMap = <T extends { id: string }>(items: T[]): Record<string, T> =>
  items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

const mergeTemplateOrder = (
  existingOrder: string[],
  templatesById: Record<string, LineupTemplate>,
): string[] => {
  const knownIds = new Set(existingOrder.filter((id) => Boolean(templatesById[id])));
  const remainingIds = Object.keys(templatesById).filter((id) => !knownIds.has(id));
  return [...knownIds, ...remainingIds];
};

export const useLineupStore = createStore<LineupState>((set, get) => ({
  hydrated: false,
  status: 'idle',
  error: null,
  templatesById: {},
  templateOrder: [],
  assignmentsByGameId: {},
  pending: [],
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    const cached = await loadLineupCache();
    if (!cached) {
      set({ hydrated: true });
      return;
    }

    const templatesById = toMap(cached.templates);
    set({
      hydrated: true,
      status: 'idle',
      error: null,
      templatesById,
      templateOrder: mergeTemplateOrder(
        cached.templates.map((template) => template.id),
        templatesById,
      ),
      assignmentsByGameId: cached.assignments.reduce<Record<string, GameLineupAssignment>>((acc, assignment) => {
        acc[assignment.gameId] = assignment;
        return acc;
      }, {}),
      pending: cached.pending ?? []
    });
  },
  refresh: async (token: string) => {
    set({ status: 'loading', error: null });
    try {
      const [templates, assignments] = await Promise.all([
        listLineupTemplates(token),
        listLineupAssignments(token)
      ]);

      const currentState = get();
      const templatesById = {
        ...toMap(templates),
        ...Object.fromEntries(
          Object.entries(currentState.templatesById).filter(
            ([, template]) => template.status !== 'synced' || template.pendingAction,
          ),
        )
      };

      const templateOrder = mergeTemplateOrder(currentState.templateOrder, templatesById);

      const assignmentsByGameId = assignments.reduce<Record<string, GameLineupAssignment>>((acc, assignment) => {
        acc[assignment.gameId] = assignment;
        return acc;
      }, {});

      set({
        status: 'idle',
        error: null,
        hydrated: true,
        templatesById,
        templateOrder,
        assignmentsByGameId
      });

      const latestState = get();
      await saveLineupCache({
        templates: Object.values(latestState.templatesById),
        assignments: Object.values(latestState.assignmentsByGameId),
        pending: latestState.pending
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh lineups';
      set({ status: 'error', error: message, hydrated: true });
      throw error;
    }
  },
  createTemplate: async (payload, context) => {
    const clientId = generateClientId();
    const optimisticTemplate: LineupTemplate = {
      id: payload.id,
      name: payload.name,
      teamId: payload.teamId,
      leagueId: payload.leagueId,
      scope: payload.scope,
      updatedAt: new Date().toISOString(),
      slots: payload.slots.map((slot) => ({ ...slot })),
      status: context.online && context.token ? 'pending' : 'pending',
      pendingAction: 'create'
    };

    set((state) => ({
      templatesById: { ...state.templatesById, [optimisticTemplate.id]: optimisticTemplate },
      templateOrder: mergeTemplateOrder([...state.templateOrder, optimisticTemplate.id], {
        ...state.templatesById,
        [optimisticTemplate.id]: optimisticTemplate
      }),
      pending: [...state.pending, { type: 'create', payload, clientId, timestamp: Date.now() }]
    }));

    await persistLineupState();

    if (!context.online || !context.token) {
      return optimisticTemplate;
    }

    try {
      const saved = await saveLineupTemplate(context.token, payload);
      set((state) => ({
        templatesById: {
          ...state.templatesById,
          [saved.id]: { ...saved, status: 'synced' }
        },
        pending: state.pending.filter((mutation) => mutation.clientId !== clientId)
      }));
      await persistLineupState();
      return { ...saved, status: 'synced' };
    } catch (error) {
      markTemplateAsFailed(optimisticTemplate.id, 'create');
      await persistLineupState();
      throw error;
    }
  },
  updateTemplate: async (payload, context) => {
    const clientId = generateClientId();
    const prevTemplate = get().templatesById[payload.id];
    const optimistic: LineupTemplate = {
      ...prevTemplate,
      id: payload.id,
      name: payload.name,
      teamId: payload.teamId,
      leagueId: payload.leagueId,
      scope: payload.scope,
      slots: payload.slots.map((slot) => ({ ...slot })),
      updatedAt: new Date().toISOString(),
      status: context.online && context.token ? 'pending' : 'pending',
      pendingAction: 'update'
    };

    set((state) => ({
      templatesById: { ...state.templatesById, [payload.id]: optimistic },
      pending: [...state.pending, { type: 'update', payload, clientId, timestamp: Date.now() }]
    }));

    await persistLineupState();

    if (!context.online || !context.token) {
      return optimistic;
    }

    try {
      const updated = await updateLineupTemplate(context.token, payload);
      set((state) => ({
        templatesById: {
          ...state.templatesById,
          [updated.id]: { ...updated, status: 'synced' }
        },
        pending: state.pending.filter((mutation) => mutation.clientId !== clientId)
      }));
      await persistLineupState();
      return { ...updated, status: 'synced' };
    } catch (error) {
      markTemplateAsFailed(payload.id, 'update');
      await persistLineupState();
      if (prevTemplate) {
        set((state) => ({
          templatesById: { ...state.templatesById, [prevTemplate.id]: prevTemplate }
        }));
      }
      throw error;
    }
  },
  deleteTemplate: async (templateId, context) => {
    const clientId = generateClientId();
    const existing = get().templatesById[templateId];
    if (!existing) {
      return;
    }

    const pendingTemplate: LineupTemplate = {
      ...existing,
      status: 'pending',
      pendingAction: 'delete'
    };

    set((state) => ({
      templatesById: { ...state.templatesById, [templateId]: pendingTemplate },
      pending: [...state.pending, { type: 'delete', templateId, clientId, timestamp: Date.now() }]
    }));

    await persistLineupState();

    if (!context.online || !context.token) {
      return;
    }

    try {
      await deleteLineupTemplate(context.token, templateId);
      set((state) => {
        const { [templateId]: _removed, ...rest } = state.templatesById;
        return {
          templatesById: rest,
          templateOrder: state.templateOrder.filter((id) => id !== templateId),
          pending: state.pending.filter((mutation) => mutation.clientId !== clientId)
        };
      });
      await persistLineupState();
    } catch (error) {
      markTemplateAsFailed(templateId, 'delete');
      await persistLineupState();
      set((state) => ({
        templatesById: { ...state.templatesById, [templateId]: existing }
      }));
      throw error;
    }
  },
  assignToGame: async (assignment, context) => {
    const clientId = generateClientId();
    const optimisticAssignment: GameLineupAssignment = {
      ...assignment,
      updatedAt: new Date().toISOString()
    };
    const previousAssignments = { ...get().assignmentsByGameId };

    set((state) => ({
      assignmentsByGameId: setAssignment(state.assignmentsByGameId, optimisticAssignment),
      pending: [...state.pending, { type: 'assign', assignment: optimisticAssignment, clientId, timestamp: Date.now() }]
    }));

    await persistLineupState();

    if (!context.online || !context.token) {
      return;
    }

    try {
      const saved = await assignTemplateToGame(context.token, assignment);
      set((state) => ({
        assignmentsByGameId: setAssignment(state.assignmentsByGameId, { ...saved }),
        pending: state.pending.filter((mutation) => mutation.clientId !== clientId)
      }));
      await persistLineupState();
    } catch (error) {
      set((state) => ({
        assignmentsByGameId: previousAssignments,
        pending: state.pending.filter((mutation) => mutation.clientId !== clientId)
      }));
      await persistLineupState();
      throw error;
    }
  },
  syncPending: async (token: string) => {
    const pending = [...get().pending];
    if (pending.length === 0) {
      return;
    }

    for (const mutation of pending) {
      try {
        if (mutation.type === 'create') {
          const saved = await saveLineupTemplate(token, mutation.payload);
          set((state) => ({
            templatesById: {
              ...state.templatesById,
              [saved.id]: { ...saved, status: 'synced' }
            }
          }));
        } else if (mutation.type === 'update') {
          const updated = await updateLineupTemplate(token, mutation.payload);
          set((state) => ({
            templatesById: {
              ...state.templatesById,
              [updated.id]: { ...updated, status: 'synced' }
            }
          }));
        } else if (mutation.type === 'delete') {
          await deleteLineupTemplate(token, mutation.templateId);
          set((state) => {
            const { [mutation.templateId]: _removed, ...rest } = state.templatesById;
            return {
              templatesById: rest,
              templateOrder: state.templateOrder.filter((id) => id !== mutation.templateId)
            };
          });
        } else if (mutation.type === 'assign') {
          const saved = await assignTemplateToGame(token, mutation.assignment);
          set((state) => ({
            assignmentsByGameId: setAssignment(state.assignmentsByGameId, saved)
          }));
        }

        set((state) => ({
          pending: state.pending.filter((item) => item.clientId !== mutation.clientId)
        }));
        await persistLineupState();
      } catch (error) {
        if (mutation.type === 'create' || mutation.type === 'update' || mutation.type === 'delete') {
          markTemplateAsFailed(
            mutation.type === 'delete' ? mutation.templateId : mutation.payload.id,
            mutation.type,
          );
        }
        throw error;
      }
    }
  },
  clear: async () => {
    set({
      templatesById: {},
      templateOrder: [],
      assignmentsByGameId: {},
      pending: [],
      status: 'idle',
      error: null,
      hydrated: false
    });
    await clearLineupCache();
  }
}));

function generateClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mutation_${Math.random().toString(36).slice(2, 10)}`;
}

async function persistLineupState(): Promise<void> {
  const state = useLineupStore.getState();
  await saveLineupCache({
    templates: Object.values(state.templatesById),
    assignments: Object.values(state.assignmentsByGameId),
    pending: state.pending
  });
}

function markTemplateAsFailed(templateId: string, action: 'create' | 'update' | 'delete'): void {
  useLineupStore.setState((state) => {
    const template = state.templatesById[templateId];
    if (!template) {
      return {};
    }

    return {
      templatesById: {
        ...state.templatesById,
        [templateId]: {
          ...template,
          status: 'failed',
          pendingAction: action
        }
      }
    };
  });
  void persistLineupState();
}

function setAssignment(
  assignments: Record<string, GameLineupAssignment>,
  assignment: GameLineupAssignment,
): Record<string, GameLineupAssignment> {
  const next: Record<string, GameLineupAssignment> = {};
  Object.entries(assignments).forEach(([gameId, existing]) => {
    if (existing.templateId !== assignment.templateId) {
      next[gameId] = existing;
    }
  });
  next[assignment.gameId] = assignment;
  return next;
}

export const selectLineupTemplates = (state: LineupState): LineupTemplate[] =>
  state.templateOrder.map((id) => state.templatesById[id]).filter(Boolean);

export const selectAssignmentsByGame = (state: LineupState): Record<string, GameLineupAssignment> =>
  state.assignmentsByGameId;
