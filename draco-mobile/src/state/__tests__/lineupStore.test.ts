import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLineupStore } from '../lineupStore';
import type { LineupTemplate, LineupMutation, GameLineupAssignment } from '../../types/lineups';

vi.mock('../../storage/lineupStorage', () => ({
  loadLineupCache: vi.fn(),
  saveLineupCache: vi.fn(),
  clearLineupCache: vi.fn()
}));

vi.mock('../../services/lineups/lineupApi', () => ({
  listLineupTemplates: vi.fn(),
  listLineupAssignments: vi.fn(),
  saveLineupTemplate: vi.fn(),
  updateLineupTemplate: vi.fn(),
  deleteLineupTemplate: vi.fn(),
  assignTemplateToGame: vi.fn()
}));

const lineupStorage = await import('../../storage/lineupStorage');
const lineupApi = await import('../../services/lineups/lineupApi');

const loadLineupCacheMock = lineupStorage.loadLineupCache as ReturnType<typeof vi.fn>;
const saveLineupCacheMock = lineupStorage.saveLineupCache as ReturnType<typeof vi.fn>;
const saveLineupTemplateMock = lineupApi.saveLineupTemplate as ReturnType<typeof vi.fn>;
const assignTemplateToGameMock = lineupApi.assignTemplateToGame as ReturnType<typeof vi.fn>;
const listLineupTemplatesMock = lineupApi.listLineupTemplates as ReturnType<typeof vi.fn>;
const listLineupAssignmentsMock = lineupApi.listLineupAssignments as ReturnType<typeof vi.fn>;

const baseTemplate: LineupTemplate = {
  id: 'template-1',
  name: 'Default',
  teamId: 'team-1',
  leagueId: 'league-1',
  scope: 'team',
  updatedAt: new Date().toISOString(),
  slots: [
    { id: 'slot-1', order: 1, playerName: 'Player One', position: 'P' },
    { id: 'slot-2', order: 2, playerName: 'Player Two', position: 'C' }
  ],
  status: 'synced'
};

describe('lineupStore', () => {
  beforeEach(() => {
    useLineupStore.setState({
      hydrated: false,
      status: 'idle',
      error: null,
      templatesById: {},
      templateOrder: [],
      assignmentsByGameId: {},
      pending: [],
      hydrate: useLineupStore.getState().hydrate,
      refresh: useLineupStore.getState().refresh,
      createTemplate: useLineupStore.getState().createTemplate,
      updateTemplate: useLineupStore.getState().updateTemplate,
      deleteTemplate: useLineupStore.getState().deleteTemplate,
      assignToGame: useLineupStore.getState().assignToGame,
      syncPending: useLineupStore.getState().syncPending,
      clear: useLineupStore.getState().clear
    });
    vi.clearAllMocks();
  });

  it('hydrates templates from cache', async () => {
    const pending: LineupMutation[] = [{
      type: 'create',
      clientId: 'pending-1',
      timestamp: Date.now(),
      payload: {
        id: baseTemplate.id,
        name: baseTemplate.name,
        teamId: baseTemplate.teamId,
        leagueId: baseTemplate.leagueId,
        scope: baseTemplate.scope,
        slots: baseTemplate.slots
      }
    }];

    loadLineupCacheMock.mockResolvedValue({
      templates: [baseTemplate],
      assignments: [],
      pending
    });

    await useLineupStore.getState().hydrate();

    const state = useLineupStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.templatesById[baseTemplate.id]).toBeDefined();
    expect(state.pending).toEqual(pending);
  });

  it('queues offline creations', async () => {
    loadLineupCacheMock.mockResolvedValue(null);
    saveLineupCacheMock.mockResolvedValue(undefined);

    await useLineupStore.getState().hydrate();

    await useLineupStore.getState().createTemplate(
      {
        id: 'temp-1',
        name: 'Offline',
        teamId: 'team-1',
        leagueId: 'league-1',
        scope: 'team',
        slots: baseTemplate.slots
      },
      { online: false, token: null }
    );

    const state = useLineupStore.getState();
    expect(state.pending.length).toBe(1);
    expect(state.templatesById['temp-1'].status).toBe('pending');
    expect(saveLineupTemplateMock).not.toHaveBeenCalled();
  });

  it('syncs pending mutations when online', async () => {
    loadLineupCacheMock.mockResolvedValue(null);
    saveLineupCacheMock.mockResolvedValue(undefined);
    const savedTemplate = { ...baseTemplate, name: 'Synced Template' };
    saveLineupTemplateMock.mockResolvedValue(savedTemplate);

    await useLineupStore.getState().hydrate();

    await useLineupStore.getState().createTemplate(
      {
        id: savedTemplate.id,
        name: savedTemplate.name,
        teamId: savedTemplate.teamId,
        leagueId: savedTemplate.leagueId,
        scope: savedTemplate.scope,
        slots: savedTemplate.slots
      },
      { online: false, token: null }
    );

    await useLineupStore.getState().syncPending('token-123');

    const state = useLineupStore.getState();
    expect(state.pending.length).toBe(0);
    expect(state.templatesById[savedTemplate.id].status).toBe('synced');
    expect(saveLineupTemplateMock).toHaveBeenCalledWith('token-123', expect.any(Object));
  });

  it('stores assignments locally when offline', async () => {
    loadLineupCacheMock.mockResolvedValue(null);
    saveLineupCacheMock.mockResolvedValue(undefined);

    await useLineupStore.getState().hydrate();

    const assignment = {
      gameId: 'game-2',
      templateId: 'template-2',
      updatedAt: new Date().toISOString()
    };

    await useLineupStore.getState().assignToGame(assignment, { online: false, token: null });

    const state = useLineupStore.getState();
    const storedAssignment = state.assignmentsByGameId[assignment.gameId];

    expect(storedAssignment).toMatchObject({
      gameId: assignment.gameId,
      templateId: assignment.templateId
    });
    expect(typeof storedAssignment.updatedAt).toBe('string');
    expect(new Date(storedAssignment.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(assignment.updatedAt).getTime()
    );
    expect(assignTemplateToGameMock).not.toHaveBeenCalled();
  });

  it('rolls back assignments when server rejects changes', async () => {
    loadLineupCacheMock.mockResolvedValue(null);
    saveLineupCacheMock.mockResolvedValue(undefined);
    assignTemplateToGameMock.mockRejectedValue(new Error('nope'));

    await useLineupStore.getState().hydrate();

    useLineupStore.setState((state) => ({
      ...state,
      assignmentsByGameId: {
        'game-1': { gameId: 'game-1', templateId: 'template-1', updatedAt: 'yesterday' }
      }
    }));

    await expect(
      useLineupStore.getState().assignToGame(
        { gameId: 'game-2', templateId: 'template-1', updatedAt: new Date().toISOString() },
        { online: true, token: 'token-1' },
      ),
    ).rejects.toThrow('nope');

    const state = useLineupStore.getState();
    expect(state.assignmentsByGameId).toEqual({
      'game-1': { gameId: 'game-1', templateId: 'template-1', updatedAt: 'yesterday' }
    });
    expect(state.pending).toHaveLength(0);
  });

  it('persists latest pending mutations after refresh completes', async () => {
    loadLineupCacheMock.mockResolvedValue(null);
    saveLineupCacheMock.mockResolvedValue(undefined);

    await useLineupStore.getState().hydrate();

    let resolveTemplates: (value: LineupTemplate[]) => void = () => {};
    let resolveAssignments: (value: GameLineupAssignment[]) => void = () => {};

    listLineupTemplatesMock.mockImplementation(
      () =>
        new Promise<LineupTemplate[]>((resolve) => {
          resolveTemplates = resolve;
        }),
    );
    listLineupAssignmentsMock.mockImplementation(
      () =>
        new Promise<GameLineupAssignment[]>((resolve) => {
          resolveAssignments = resolve;
        }),
    );

    const refreshPromise = useLineupStore.getState().refresh('token-refresh');

    const offlineMutation: LineupMutation = {
      type: 'create',
      clientId: 'pending-refresh',
      timestamp: Date.now(),
      payload: {
        id: 'template-offline',
        name: 'Offline Template',
        teamId: 'team-1',
        leagueId: 'league-1',
        scope: 'team',
        slots: baseTemplate.slots
      }
    };

    useLineupStore.setState((state) => ({
      ...state,
      pending: [...state.pending, offlineMutation]
    }));

    resolveTemplates([]);
    resolveAssignments([]);

    await refreshPromise;

    const savedSnapshot = saveLineupCacheMock.mock.calls.at(-1)?.[0];
    expect(savedSnapshot?.pending).toContainEqual(offlineMutation);
  });
});
