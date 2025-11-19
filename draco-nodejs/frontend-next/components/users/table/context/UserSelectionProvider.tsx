'use client';

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import {
  EnhancedUser,
  UserSelectionState,
  UserSelectionActions,
  UserSelectionConfig,
  UserSelectionProviderProps,
} from '../../../../types/userTable';

interface UserSelectionContextValue {
  state: UserSelectionState;
  actions: UserSelectionActions;
  config: UserSelectionConfig;
}

const UserSelectionContext = createContext<UserSelectionContextValue | null>(null);

const EMPTY_SET = new Set<string>();

const DISABLED_STATE: UserSelectionState = {
  selectedIds: EMPTY_SET,
  selectAll: false,
  indeterminate: false,
  totalSelected: 0,
  lastSelectedId: undefined,
};

const DISABLED_ACTIONS: UserSelectionActions = {
  selectUser: () => {},
  deselectUser: () => {},
  toggleUser: () => {},
  selectAll: () => {},
  deselectAll: () => {},
  toggleSelectAll: () => {},
  selectRange: () => {},
  isSelected: () => false,
  getSelectedUsers: () => [],
  canSelectUser: () => false,
};

const DisabledSelectionProvider: React.FC<UserSelectionProviderProps> = ({ children, config }) => {
  const contextValue = useMemo<UserSelectionContextValue>(
    () => ({ state: DISABLED_STATE, actions: DISABLED_ACTIONS, config }),
    [config],
  );

  return (
    <UserSelectionContext.Provider value={contextValue}>{children}</UserSelectionContext.Provider>
  );
};

const ActiveUserSelectionProvider: React.FC<UserSelectionProviderProps> = ({
  children,
  users,
  config,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | undefined>();

  const selectableUsers = useMemo(
    () => users.filter((user) => !config.disabled?.(user)),
    [users, config],
  );
  const selectableIds = useMemo(() => new Set(selectableUsers.map((u) => u.id)), [selectableUsers]);

  const normalizedSelectedIds = useMemo(() => {
    let differs = false;
    const next = new Set<string>();
    selectedIds.forEach((id) => {
      if (selectableIds.has(id)) {
        next.add(id);
      } else {
        differs = true;
      }
    });
    return differs ? next : selectedIds;
  }, [selectedIds, selectableIds]);

  const baseState = useMemo<UserSelectionState>(() => {
    const validLastSelectedId =
      lastSelectedId && normalizedSelectedIds.has(lastSelectedId) ? lastSelectedId : undefined;
    const totalSelected = normalizedSelectedIds.size;

    return {
      selectedIds: normalizedSelectedIds,
      selectAll: totalSelected > 0 && totalSelected === selectableUsers.length,
      indeterminate: totalSelected > 0 && totalSelected < selectableUsers.length,
      totalSelected,
      lastSelectedId: validLastSelectedId,
    };
  }, [normalizedSelectedIds, selectableUsers.length, lastSelectedId]);

  const selectedUsers = useMemo(
    () => users.filter((user) => baseState.selectedIds.has(user.id)),
    [users, baseState.selectedIds],
  );

  const selectionIsValid = useMemo(() => {
    if (!config.validateSelection) {
      return true;
    }
    return config.validateSelection(selectedUsers);
  }, [config, selectedUsers]);

  const state = useMemo<UserSelectionState>(() => {
    if (selectionIsValid) {
      return baseState;
    }
    return DISABLED_STATE;
  }, [baseState, selectionIsValid]);

  const effectiveSelectedUsers = useMemo(() => {
    return selectionIsValid ? selectedUsers : [];
  }, [selectionIsValid, selectedUsers]);

  const applySelectionChange = useCallback(
    (nextIds: Set<string>, nextLastId?: string) => {
      const filteredNextIds = new Set<string>();
      nextIds.forEach((id) => {
        if (selectableIds.has(id)) {
          filteredNextIds.add(id);
        }
      });

      const nextSelectedUsers = users.filter((user) => filteredNextIds.has(user.id));
      if (config.validateSelection && !config.validateSelection(nextSelectedUsers)) {
        setSelectedIds(new Set());
        setLastSelectedId(undefined);
        return;
      }

      setSelectedIds(filteredNextIds);
      setLastSelectedId(nextLastId);
    },
    [users, config, selectableIds],
  );

  const selectUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user || config.disabled?.(user)) return;

      if (config.mode === 'single') {
        applySelectionChange(new Set([userId]), userId);
        return;
      }

      if (config.mode === 'multiple') {
        const newSelection = new Set(state.selectedIds);
        if (
          config.maxSelection &&
          newSelection.size >= config.maxSelection &&
          !newSelection.has(userId)
        ) {
          return;
        }
        newSelection.add(userId);
        applySelectionChange(newSelection, userId);
      }
    },
    [users, config, state.selectedIds, applySelectionChange],
  );

  const deselectUser = useCallback(
    (userId: string) => {
      if (!state.selectedIds.has(userId)) {
        return;
      }
      const newSelection = new Set(state.selectedIds);
      newSelection.delete(userId);
      const nextLastSelectedId = state.lastSelectedId === userId ? undefined : state.lastSelectedId;
      applySelectionChange(newSelection, nextLastSelectedId);
    },
    [state.selectedIds, state.lastSelectedId, applySelectionChange],
  );

  const toggleUser = useCallback(
    (userId: string) => {
      if (state.selectedIds.has(userId)) {
        deselectUser(userId);
      } else {
        selectUser(userId);
      }
    },
    [state.selectedIds, selectUser, deselectUser],
  );

  const selectAll = useCallback(() => {
    if (config.mode !== 'multiple') return;

    let usersToSelect = selectableUsers;
    if (config.maxSelection && selectableUsers.length > config.maxSelection) {
      usersToSelect = selectableUsers.slice(0, config.maxSelection);
    }

    applySelectionChange(new Set(usersToSelect.map((u) => u.id)), undefined);
  }, [config, selectableUsers, applySelectionChange]);

  const deselectAll = useCallback(() => {
    applySelectionChange(new Set(), undefined);
  }, [applySelectionChange]);

  const toggleSelectAll = useCallback(() => {
    if (state.selectAll || state.indeterminate) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [state.selectAll, state.indeterminate, selectAll, deselectAll]);

  const selectRange = useCallback(
    (fromId: string, toId: string) => {
      if (config.mode !== 'multiple') return;

      const fromIndex = users.findIndex((u) => u.id === fromId);
      const toIndex = users.findIndex((u) => u.id === toId);

      if (fromIndex === -1 || toIndex === -1) return;

      const startIndex = Math.min(fromIndex, toIndex);
      const endIndex = Math.max(fromIndex, toIndex);
      const rangeUsers = users
        .slice(startIndex, endIndex + 1)
        .filter((user) => !config.disabled?.(user));

      const newSelection = new Set(state.selectedIds);
      rangeUsers.forEach((user) => {
        if (!config.maxSelection || newSelection.size < config.maxSelection) {
          newSelection.add(user.id);
        }
      });

      applySelectionChange(newSelection, toId);
    },
    [users, config, state.selectedIds, applySelectionChange],
  );

  const isSelected = useCallback(
    (userId: string) => state.selectedIds.has(userId),
    [state.selectedIds],
  );

  const getSelectedUsers = useCallback(() => effectiveSelectedUsers, [effectiveSelectedUsers]);

  const canSelectUser = useCallback(
    (user: EnhancedUser) => {
      if (config.mode === 'none') return false;
      if (config.disabled?.(user)) return false;
      if (config.mode === 'single') return true;
      if (
        config.maxSelection &&
        state.selectedIds.size >= config.maxSelection &&
        !state.selectedIds.has(user.id)
      ) {
        return false;
      }
      return true;
    },
    [config, state.selectedIds],
  );

  const actions = useMemo<UserSelectionActions>(
    () => ({
      selectUser,
      deselectUser,
      toggleUser,
      selectAll,
      deselectAll,
      toggleSelectAll,
      selectRange,
      isSelected,
      getSelectedUsers,
      canSelectUser,
    }),
    [
      selectUser,
      deselectUser,
      toggleUser,
      selectAll,
      deselectAll,
      toggleSelectAll,
      selectRange,
      isSelected,
      getSelectedUsers,
      canSelectUser,
    ],
  );

  useEffect(() => {
    config.onSelectionChange?.(state, effectiveSelectedUsers);
  }, [config, state, effectiveSelectedUsers]);

  const contextValue = useMemo<UserSelectionContextValue>(
    () => ({
      state,
      actions,
      config,
    }),
    [state, actions, config],
  );

  return (
    <UserSelectionContext.Provider value={contextValue}>{children}</UserSelectionContext.Provider>
  );
};

export const UserSelectionProvider: React.FC<UserSelectionProviderProps> = (props) => {
  if (props.config.mode === 'none') {
    return <DisabledSelectionProvider {...props} />;
  }
  return <ActiveUserSelectionProvider {...props} />;
};

export const useUserSelection = (): UserSelectionContextValue => {
  const context = useContext(UserSelectionContext);
  if (!context) {
    throw new Error('useUserSelection must be used within a UserSelectionProvider');
  }
  return context;
};

// Safe version that returns null if context is not available
export const useUserSelectionSafe = (): UserSelectionContextValue | null => {
  const context = useContext(UserSelectionContext);
  return context;
};

// Helper hook for components that need only specific selection functionality
export const useUserSelectionActions = () => {
  const { actions } = useUserSelection();
  return actions;
};

export const useUserSelectionState = () => {
  const { state } = useUserSelection();
  return state;
};

export const useUserSelectionConfig = () => {
  const { config } = useUserSelection();
  return config;
};
