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

export const UserSelectionProvider: React.FC<UserSelectionProviderProps> = ({
  children,
  users,
  config,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | undefined>();

  // Reset selection when users change or mode changes
  useEffect(() => {
    if (config.mode === 'none') {
      setSelectedIds(new Set());
      setLastSelectedId(undefined);
    }
  }, [config.mode, users.length]);

  // Compute selection state
  const state = useMemo<UserSelectionState>(() => {
    const selectableUsers = users.filter((user) => !config.disabled?.(user));
    const selectableIds = new Set(selectableUsers.map((u) => u.id));
    const validSelectedIds = new Set([...selectedIds].filter((id) => selectableIds.has(id)));

    return {
      selectedIds: validSelectedIds,
      selectAll: validSelectedIds.size > 0 && validSelectedIds.size === selectableUsers.length,
      indeterminate: validSelectedIds.size > 0 && validSelectedIds.size < selectableUsers.length,
      totalSelected: validSelectedIds.size,
      lastSelectedId,
    };
  }, [selectedIds, users, config, lastSelectedId]);

  // Action handlers
  const selectUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user || config.disabled?.(user)) return;

      if (config.mode === 'single') {
        setSelectedIds(new Set([userId]));
      } else if (config.mode === 'multiple') {
        const newSelection = new Set(selectedIds);
        if (
          config.maxSelection &&
          newSelection.size >= config.maxSelection &&
          !newSelection.has(userId)
        ) {
          return; // Max selection reached
        }
        newSelection.add(userId);
        setSelectedIds(newSelection);
      }
      setLastSelectedId(userId);
    },
    [users, config, selectedIds],
  );

  const deselectUser = useCallback(
    (userId: string) => {
      const newSelection = new Set(selectedIds);
      newSelection.delete(userId);
      setSelectedIds(newSelection);
      if (lastSelectedId === userId) {
        setLastSelectedId(undefined);
      }
    },
    [selectedIds, lastSelectedId],
  );

  const toggleUser = useCallback(
    (userId: string) => {
      if (selectedIds.has(userId)) {
        deselectUser(userId);
      } else {
        selectUser(userId);
      }
    },
    [selectedIds, selectUser, deselectUser],
  );

  const selectAll = useCallback(() => {
    if (config.mode !== 'multiple') return;

    const selectableUsers = users.filter((user) => !config.disabled?.(user));
    let usersToSelect = selectableUsers;

    if (config.maxSelection && selectableUsers.length > config.maxSelection) {
      usersToSelect = selectableUsers.slice(0, config.maxSelection);
    }

    setSelectedIds(new Set(usersToSelect.map((u) => u.id)));
  }, [users, config]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(undefined);
  }, []);

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

      const newSelection = new Set(selectedIds);
      rangeUsers.forEach((user) => {
        if (!config.maxSelection || newSelection.size < config.maxSelection) {
          newSelection.add(user.id);
        }
      });

      setSelectedIds(newSelection);
    },
    [users, config, selectedIds],
  );

  const isSelected = useCallback(
    (userId: string) => {
      return selectedIds.has(userId);
    },
    [selectedIds],
  );

  const getSelectedUsers = useCallback(() => {
    return users.filter((user) => selectedIds.has(user.id));
  }, [users, selectedIds]);

  const canSelectUser = useCallback(
    (user: EnhancedUser) => {
      if (config.mode === 'none') return false;
      if (config.disabled?.(user)) return false;
      if (config.mode === 'single') return true;
      if (
        config.maxSelection &&
        selectedIds.size >= config.maxSelection &&
        !selectedIds.has(user.id)
      ) {
        return false;
      }
      return true;
    },
    [config, selectedIds],
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

  // Notify parent of selection changes
  useEffect(() => {
    const selectedUsers = getSelectedUsers();
    if (config.validateSelection && !config.validateSelection(selectedUsers)) {
      deselectAll();
      return;
    }
    config.onSelectionChange?.(state, selectedUsers);
  }, [state, config, getSelectedUsers, deselectAll]);

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
