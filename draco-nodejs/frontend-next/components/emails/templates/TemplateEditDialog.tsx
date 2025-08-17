import React from 'react';
import { EmailTemplate } from '../../../types/emails/email';
import BaseTemplateDialog from './BaseTemplateDialog';

interface TemplateEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template: EmailTemplate;
  accountId: string;
}

export default function TemplateEditDialog({
  open,
  onClose,
  onSuccess,
  template,
  accountId,
}: TemplateEditDialogProps) {
  return (
    <BaseTemplateDialog
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      accountId={accountId}
      mode="edit"
      template={template}
    />
  );
}
