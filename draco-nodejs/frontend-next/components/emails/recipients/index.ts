// Email recipient selection components
export { RecipientSelectionProvider, useRecipientSelection } from './RecipientSelectionProvider';
export { RecipientSelector } from './RecipientSelector';
export { ContactPicker } from './ContactPicker';
export { GroupSelector } from './GroupSelector';
export { SelectedRecipientsList } from './SelectedRecipientsList';
export * from './recipientUtils';

// Re-export types for convenience
export type {
  RecipientContact,
  TeamGroup,
  RoleGroup,
  RecipientSelectionState,
  RecipientSelectionActions,
  RecipientSelectionConfig,
  RecipientSelectionTab,
  RecipientValidationResult,
} from '../../../types/emails/recipients';
