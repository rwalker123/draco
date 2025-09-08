// Email attachment components
export { AttachmentPreview } from './AttachmentPreview';

// Re-export types for convenience
export type {
  EmailAttachment,
  AttachmentConfig,
  AttachmentUploadState,
  AttachmentUploadActions,
  AttachmentValidationResult,
} from '../../../types/emails/attachments';

export {
  DEFAULT_ATTACHMENT_CONFIG,
  FILE_TYPE_CATEGORIES,
  formatFileSize,
  getFileExtension,
  getFileCategory,
  isFileTypeAllowed,
  validateAttachments,
} from '../../../types/emails/attachments';
