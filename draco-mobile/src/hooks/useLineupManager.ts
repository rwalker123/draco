import { useCallback, useEffect, useMemo } from 'react';
import { useLineupStore, selectAssignmentsByGame, selectLineupTemplates } from '../state/lineupStore';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import type { GameLineupAssignment, LineupTemplatePayload } from '../types/lineups';
import { LINEUP_SYNC_ENABLED } from '../config/env';

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

  const canSync = LINEUP_SYNC_ENABLED && Boolean(sessionToken) && isOnline;

  useEffect(() => {
    if (!canSync || !sessionToken) {
      return;
    }

    void refresh(sessionToken).catch(() => {
      // handled via store error state
    });
  }, [refresh, sessionToken, canSync]);

  useEffect(() => {
    if (!canSync || !sessionToken) {
      return;
    }

    void syncPending(sessionToken).catch(() => {
      // failures reflected via template status flags
    });
  }, [sessionToken, canSync, syncPending]);

  const mutationContext = useMemo(
    () => ({ token: canSync && sessionToken ? sessionToken : null, online: canSync }),
    [canSync, sessionToken],
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
    if (!canSync || !sessionToken) {
      return Promise.resolve();
    }

    return refresh(sessionToken);
  }, [canSync, refresh, sessionToken]);

  return {
    templates,
    assignments,
    hydrated,
    status,
    error,
    isOnline,
    syncEnabled: LINEUP_SYNC_ENABLED,
    pendingCount,
    refresh: manualRefresh,
    createTemplate: handleCreate,
    updateTemplate: handleUpdate,
    deleteTemplate: handleDelete,
    assignToGame: handleAssign
  };
}
