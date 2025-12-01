'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  type ButtonProps,
  type DialogContentProps,
  type DialogProps,
} from '@mui/material';

interface ConfirmDeleteDialogProps {
  open: boolean;
  title?: React.ReactNode;
  message?: React.ReactNode;
  content?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  dialogProps?: Omit<DialogProps, 'open' | 'onClose'>;
  dialogContentProps?: DialogContentProps;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  title = 'Confirm delete',
  message,
  content,
  onConfirm,
  onClose,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmButtonProps,
  cancelButtonProps,
  dialogProps,
  dialogContentProps,
}) => {
  const mergedConfirmButtonProps: ButtonProps = {
    color: 'error',
    variant: 'contained',
    ...confirmButtonProps,
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth {...dialogProps}>
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      {message || content ? (
        <DialogContent {...dialogContentProps}>
          {message ? <DialogContentText>{message}</DialogContentText> : null}
          {content}
        </DialogContent>
      ) : null}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} {...cancelButtonProps}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} {...mergedConfirmButtonProps}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
