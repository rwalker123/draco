import React from 'react';
import BaseTemplateDialog from './BaseTemplateDialog';

interface TemplateCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
}

export default function TemplateCreateDialog({
  open,
  onClose,
  onSuccess,
  accountId,
}: TemplateCreateDialogProps) {
  return (
    <BaseTemplateDialog
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      accountId={accountId}
      mode="create"
    />
  );
}
