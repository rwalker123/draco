'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const contextValue: UserSelectionContextValue = {
    state: DISABLED_STATE,
    actions: DISABLED_ACTIONS,
    config,
  };

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

  const selectableUsers = users.filter((user) => !config.disabled?.(user));
  const selectableIds = new Set(selectableUsers.map((u) => u.id));

  const normalizedSelectedIds = ((): Set<string> => {
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
  })();

  const baseState = ((): UserSelectionState => {
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
  })();

  const selectedUsers = users.filter((user) => baseState.selectedIds.has(user.id));

  const selectionIsValid = ((): boolean => {
    if (!config.validateSelection) {
      return true;
    }
    return config.validateSelection(selectedUsers);
  })();

  const state: UserSelectionState = selectionIsValid ? baseState : DISABLED_STATE;

  const effectiveSelectedUsers = selectionIsValid ? selectedUsers : [];

  const applySelectionChange = (nextIds: Set<string>, nextLastId?: string) => {
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
  };

  const selectUser = (userId: string) => {
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
  };

  const deselectUser = (userId: string) => {
    if (!state.selectedIds.has(userId)) {
      return;
    }
    const newSelection = new Set(state.selectedIds);
    newSelection.delete(userId);
    const nextLastSelectedId = state.lastSelectedId === userId ? undefined : state.lastSelectedId;
    applySelectionChange(newSelection, nextLastSelectedId);
  };

  const toggleUser = (userId: string) => {
    if (state.selectedIds.has(userId)) {
      deselectUser(userId);
    } else {
      selectUser(userId);
    }
  };

  const selectAll = () => {
    if (config.mode !== 'multiple') return;

    let usersToSelect = selectableUsers;
    if (config.maxSelection && selectableUsers.length > config.maxSelection) {
      usersToSelect = selectableUsers.slice(0, config.maxSelection);
    }

    applySelectionChange(new Set(usersToSelect.map((u) => u.id)), undefined);
  };

  const deselectAll = () => {
    applySelectionChange(new Set(), undefined);
  };

  const toggleSelectAll = () => {
    if (state.selectAll || state.indeterminate) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const selectRange = (fromId: string, toId: string) => {
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
  };

  const isSelected = (userId: string) => state.selectedIds.has(userId);

  const getSelectedUsers = () => effectiveSelectedUsers;

  const canSelectUser = (user: EnhancedUser) => {
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
  };

  const actions: UserSelectionActions = {
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
  };

  useEffect(() => {
    const effectiveUsers = selectionIsValid ? selectedUsers : [];
    config.onSelectionChange?.(state, effectiveUsers);
  }, [config, state, selectionIsValid, selectedUsers]);

  const contextValue: UserSelectionContextValue = {
    state,
    actions,
    config,
  };

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
