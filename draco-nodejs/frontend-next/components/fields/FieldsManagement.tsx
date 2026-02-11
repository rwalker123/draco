'use client';

import React, { useRef, useState } from 'react';
import { Alert, Fab, Snackbar, Stack } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { FieldType } from '@draco/shared-schemas';
import { useRole } from '../../context/RoleContext';
import { useDialog } from '../../hooks/useDialog';
import FieldFormDialog from './FieldFormDialog';
import FieldDeleteDialog from './FieldDeleteDialog';
import { FieldsView, type FieldsViewRef } from './FieldsView';
import { EditIconButton, DeleteIconButton } from '../common/ActionIconButtons';
import { AdminBreadcrumbs } from '../admin';

interface FieldsManagementProps {
  accountId: string;
}

interface FormDialogData {
  mode: 'create' | 'edit';
  field: FieldType | null;
}

export const FieldsManagement: React.FC<FieldsManagementProps> = ({ accountId }) => {
  const viewRef = useRef<FieldsViewRef>(null);
  const { hasPermission } = useRole();
  const canManage = hasPermission('account.manage', { accountId });

  const formDialog = useDialog<FormDialogData>();
  const deleteDialog = useDialog<FieldType>();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDialogSuccess = (result: { message: string; field: FieldType }) => {
    setSuccessMessage(result.message);
    viewRef.current?.refresh();
  };

  const handleSnackbarClose = () => {
    setSuccessMessage(null);
  };

  return (
    <>
      <FieldsView
        ref={viewRef}
        accountId={accountId}
        breadcrumbs={
          <AdminBreadcrumbs
            accountId={accountId}
            category={{ name: 'Season', href: `/account/${accountId}/admin/season` }}
            currentPage="Field Management"
          />
        }
        renderRowActions={
          canManage
            ? (field) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <EditIconButton
                    tooltipTitle="Edit field"
                    aria-label="Edit field"
                    onClick={() => formDialog.open({ mode: 'edit', field })}
                  />
                  <DeleteIconButton
                    tooltipTitle="Delete field"
                    aria-label="Delete field"
                    onClick={() => deleteDialog.open(field)}
                  />
                </Stack>
              )
            : undefined
        }
      />

      <FieldFormDialog
        accountId={accountId}
        open={formDialog.isOpen}
        mode={formDialog.data?.mode ?? 'create'}
        field={formDialog.data?.field ?? null}
        onClose={formDialog.close}
        onSuccess={handleDialogSuccess}
      />
      <FieldDeleteDialog
        accountId={accountId}
        open={deleteDialog.isOpen}
        field={deleteDialog.data ?? null}
        onClose={deleteDialog.close}
        onSuccess={handleDialogSuccess}
      />

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {canManage ? (
        <Fab
          color="primary"
          aria-label="Add field"
          onClick={() => formDialog.open({ mode: 'create', field: null })}
          sx={{
            position: 'fixed',
            bottom: { xs: 24, sm: 32 },
            right: { xs: 24, sm: 32 },
            zIndex: (theme) => theme.zIndex.snackbar + 1,
          }}
        >
          <AddIcon />
        </Fab>
      ) : null}
    </>
  );
};

export default FieldsManagement;
