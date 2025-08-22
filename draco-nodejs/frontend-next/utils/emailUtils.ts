// Email utility functions for frontend
import type { EmailRecipientStatus, EmailStatus, Contact } from '../types/emails/email';
import {
  EMAIL_VALIDATION,
  TEMPLATE_PATTERNS,
  isAllowedFileType,
  getFileIcon,
} from '../constants/emailConstants';

/**
 * Validates an email address using the standard pattern
 */
export const validateEmail = (email: string): boolean => {
  return EMAIL_VALIDATION.PATTERN.test(email) && email.length <= EMAIL_VALIDATION.MAX_LENGTH;
};

/**
 * Validates multiple email addresses
 */
export const validateEmails = (emails: string[]): { valid: string[]; invalid: string[] } => {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach((email) => {
    if (validateEmail(email.trim())) {
      valid.push(email.trim());
    } else {
      invalid.push(email.trim());
    }
  });

  return { valid, invalid };
};

/**
 * Formats contact display name for email recipient lists
 */
export const formatContactDisplayName = (contact: Contact): string => {
  const name = `${contact.firstname} ${contact.lastname}`.trim();
  if (contact.email) {
    return `${name} <${contact.email}>`;
  }
  return name;
};

/**
 * Extracts email addresses from formatted contact strings
 */
export const extractEmailFromContact = (contactString: string): string | null => {
  const emailMatch = contactString.match(/<(.+?)>/);
  return emailMatch ? emailMatch[1] : null;
};

/**
 * Get human-readable email status
 */
export const getEmailStatusLabel = (status: EmailStatus): string => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'sending':
      return 'Sending';
    case 'sent':
      return 'Sent';
    case 'failed':
      return 'Failed';
    case 'scheduled':
      return 'Scheduled';
    case 'partial':
      return 'Partially Sent';
    default:
      return status;
  }
};

/**
 * Get human-readable recipient status
 */
export const getRecipientStatusLabel = (status: EmailRecipientStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'bounced':
      return 'Bounced';
    case 'failed':
      return 'Failed';
    case 'opened':
      return 'Opened';
    case 'clicked':
      return 'Clicked';
    default:
      return status;
  }
};

/**
 * Get color for email status indicators
 */
export const getEmailStatusColor = (
  status: EmailStatus,
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'sending':
      return 'info';
    case 'sent':
      return 'success';
    case 'failed':
      return 'error';
    case 'scheduled':
      return 'warning';
    case 'partial':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Get color for recipient status indicators
 */
export const getRecipientStatusColor = (
  status: EmailRecipientStatus,
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'sent':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'bounced':
      return 'error';
    case 'failed':
      return 'error';
    case 'opened':
      return 'info';
    case 'clicked':
      return 'secondary';
    default:
      return 'default';
  }
};

/**
 * Calculate email delivery metrics
 */
export const calculateEmailMetrics = (
  totalRecipients: number,
  successfulDeliveries: number,
  failedDeliveries: number,
  bounceCount: number,
  openCount: number,
  clickCount: number,
) => {
  const deliveryRate = totalRecipients > 0 ? (successfulDeliveries / totalRecipients) * 100 : 0;
  const bounceRate = totalRecipients > 0 ? (bounceCount / totalRecipients) * 100 : 0;
  const openRate = successfulDeliveries > 0 ? (openCount / successfulDeliveries) * 100 : 0;
  const clickRate = successfulDeliveries > 0 ? (clickCount / successfulDeliveries) * 100 : 0;

  return {
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    bounceRate: Math.round(bounceRate * 100) / 100,
    openRate: Math.round(openRate * 100) / 100,
    clickRate: Math.round(clickRate * 100) / 100,
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file type for email attachments (uses constants)
 */
export const isValidAttachmentType = isAllowedFileType;

/**
 * Get file type icon name for Material-UI icons (uses constants)
 */
export const getFileTypeIcon = getFileIcon;

/**
 * Process template variables in text
 */
export const processTemplateVariables = (
  template: string,
  variables: Record<string, string>,
): string => {
  let processed = template;

  Object.entries(variables).forEach(([key, value]) => {
    // Support both {{variable}} and {variable} syntax using constants
    const regex1 = new RegExp(`{{${key}}}`, 'g');
    const regex2 = new RegExp(`{${key}}`, 'g');
    processed = processed.replace(regex1, value).replace(regex2, value);
  });

  return processed;
};

/**
 * Extract template variables from text
 */
export const extractTemplateVariables = (template: string): string[] => {
  const variables: string[] = [];

  // Use patterns from constants
  const matches1 = template.match(TEMPLATE_PATTERNS.DOUBLE_BRACE);
  if (matches1) {
    matches1.forEach((match) => {
      const variable = match.replace(/{{\s*/, '').replace(/\s*}}/, '');
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    });
  }

  const matches2 = template.match(TEMPLATE_PATTERNS.SINGLE_BRACE);
  if (matches2) {
    matches2.forEach((match) => {
      const variable = match.replace(/{\s*/, '').replace(/\s*}/, '');
      if (!variable.includes('{') && !variables.includes(variable)) {
        variables.push(variable);
      }
    });
  }

  return variables;
};

/**
 * Truncate text for display purposes
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Strip HTML tags from text
 */
export const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

/**
 * Generate mailto URL for quick emails
 */
export const generateMailtoUrl = (to: string[], subject?: string, body?: string): string => {
  const params = new URLSearchParams();

  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);

  const queryString = params.toString();
  const toList = to.join(',');

  return `mailto:${toList}${queryString ? '?' + queryString : ''}`;
};

/**
 * Upload email attachment to server
 */
export const uploadEmailAttachment = async (
  file: File,
  token: string,
  onProgress?: (progress: number) => void,
): Promise<{ url: string; previewUrl?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    xhr.open('POST', '/api/emails/attachments/upload');

    // Add authorization header
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.send(formData);
  });
};
