// Email compose components
export { EmailComposePage } from './EmailComposePage';
export { EmailComposeProvider, useEmailCompose } from './EmailComposeProvider';
export { ComposeHeader } from './ComposeHeader';
export { ComposeActions } from './ComposeActions';
export { default as ComposeSidebar } from './ComposeSidebar';
export { ScheduleDialog } from './ScheduleDialog';

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

export {
  DEFAULT_COMPOSE_CONFIG,
  DEFAULT_KEYBOARD_SHORTCUTS,
  extractTemplateVariables,
  processTemplate,
  validateComposeData,
} from '../../../types/emails/compose';
