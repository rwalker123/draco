// Main components
export { default as UserTableContainer } from './UserTableContainer';
export { default as UserTableEnhanced } from '../UserTableEnhanced';

// Sub-components
export { default as UserTableHeader } from './components/UserTableHeader';
export { default as UserTableToolbar } from './components/UserTableToolbar';

export { default as UserDisplayCard } from './components/UserDisplayCard';
export { default as UserCardGrid } from './components/UserCardGrid';

// Context and hooks
export {
  UserSelectionProvider,
  useUserSelection,
  useUserSelectionActions,
  useUserSelectionState,
  useUserSelectionConfig,
} from './context/UserSelectionProvider';

export {
  enhanceUser,
  useEnhancedUsers,
  useSelectionConfig,
  usePermissionBasedSelection,
  sortEnhancedUsers,
} from './hooks/useUserSelection';

// Re-export types for convenience
export type {
  EnhancedUser,
  UserTableContainerProps,
  UserTableEnhancedProps,
  ViewMode,
  SelectionMode,
  CardSize,
  SortDirection,
  UserSelectionState,
  UserSelectionActions,
  UserSelectionConfig,
  UserTableAction,
  TableColumn,
} from '../../../types/userTable';
