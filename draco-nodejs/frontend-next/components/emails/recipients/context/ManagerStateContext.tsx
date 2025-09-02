import React, { createContext, useContext, ReactNode } from 'react';
import { useManagerState } from '../../../../hooks/useManagerState';

// Context interface
export interface ManagerStateContextValue {
  state: ReturnType<typeof useManagerState>['state'];
  actions: ReturnType<typeof useManagerState>['actions'];
}

// Create context
const ManagerStateContext = createContext<ManagerStateContextValue | null>(null);

// Provider props
export interface ManagerStateProviderProps {
  children: ReactNode;
  accountId: string;
  seasonId: string;
}

// Provider component
export const ManagerStateProvider: React.FC<ManagerStateProviderProps> = ({
  children,
  accountId,
  seasonId,
}) => {
  // Use the manager state hook
  const managerStateHook = useManagerState({
    accountId,
    seasonId,
    pageSize: 100,
    debounceMs: 300,
    enabled: true, // Always enabled when provider is mounted
  });

  const contextValue: ManagerStateContextValue = {
    state: managerStateHook.state,
    actions: managerStateHook.actions,
  };

  return (
    <ManagerStateContext.Provider value={contextValue}>{children}</ManagerStateContext.Provider>
  );
};

// Hook to use the context
export const useManagerStateContext = (): ManagerStateContextValue => {
  const context = useContext(ManagerStateContext);
  if (!context) {
    throw new Error('useManagerStateContext must be used within a ManagerStateProvider');
  }
  return context;
};
