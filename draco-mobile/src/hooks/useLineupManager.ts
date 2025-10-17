import { useCallback, useEffect, useMemo } from 'react';
import { useLineupStore, selectAssignmentsByGame, selectLineupTemplates } from '../state/lineupStore';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import type { GameLineupAssignment, LineupTemplatePayload } from '../types/lineups';

export function useLineupManager() {
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const sessionToken = session?.token;

  const hydrated = useLineupStore((state) => state.hydrated);
  const status = useLineupStore((state) => state.status);
  const error = useLineupStore((state) => state.error);
  const hydrate = useLineupStore((state) => state.hydrate);
  const refresh = useLineupStore((state) => state.refresh);
  const createTemplate = useLineupStore((state) => state.createTemplate);
  const updateTemplate = useLineupStore((state) => state.updateTemplate);
  const deleteTemplate = useLineupStore((state) => state.deleteTemplate);
  const assignToGame = useLineupStore((state) => state.assignToGame);
  const syncPending = useLineupStore((state) => state.syncPending);
  const pendingCount = useLineupStore((state) => state.pending.length);

  const templates = useLineupStore(selectLineupTemplates);
  const assignments = useLineupStore(selectAssignmentsByGame);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!sessionToken || !isOnline) {
      return;
    }

    void refresh(sessionToken).catch(() => {
      // handled via store error state
    });
  }, [refresh, sessionToken, isOnline]);

  useEffect(() => {
    if (!sessionToken || !isOnline) {
      return;
    }

    void syncPending(sessionToken).catch(() => {
      // failures reflected via template status flags
    });
  }, [sessionToken, isOnline, syncPending]);

  const mutationContext = useMemo(
    () => ({ token: sessionToken, online: isOnline }),
    [sessionToken, isOnline],
  );

  const handleCreate = useCallback(
    (payload: LineupTemplatePayload) => createTemplate(payload, mutationContext),
    [createTemplate, mutationContext],
  );

  const handleUpdate = useCallback(
    (payload: LineupTemplatePayload) => updateTemplate(payload, mutationContext),
    [mutationContext, updateTemplate],
  );

  const handleDelete = useCallback(
    (templateId: string) => deleteTemplate(templateId, mutationContext),
    [deleteTemplate, mutationContext],
  );

  const handleAssign = useCallback(
    (assignment: GameLineupAssignment) => assignToGame(assignment, mutationContext),
    [assignToGame, mutationContext],
  );

  const manualRefresh = useCallback(() => {
    if (!sessionToken) {
      return Promise.resolve();
    }

    return refresh(sessionToken);
  }, [refresh, sessionToken]);

  return {
    templates,
    assignments,
    hydrated,
    status,
    error,
    isOnline,
    pendingCount,
    refresh: manualRefresh,
    createTemplate: handleCreate,
    updateTemplate: handleUpdate,
    deleteTemplate: handleDelete,
    assignToGame: handleAssign
  };
}
