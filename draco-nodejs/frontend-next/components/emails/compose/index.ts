// Email compose components
export { EmailComposePage } from './EmailComposePage';

// Re-export types for convenience
export type {
  EmailComposeState,
  EmailComposeActions,
  EmailComposeConfig,
  EmailComposeContextValue,
  EmailComposeProviderProps,
  ComposeValidationError,
  ComposeValidationResult,
  TemplateVariableContext,
  EmailSendOptions,
  ComposeMode,
  ComposeStep,
  ComposeKeyboardShortcuts,
} from '../../../types/emails/compose';
