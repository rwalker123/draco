'use client';

import React from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { HandoutType } from '@draco/shared-schemas';
import {
  listAccountHandouts as apiListAccountHandouts,
  listTeamHandouts as apiListTeamHandouts,
} from '@draco/shared-api-client';
import HandoutList, { HandoutListVariant } from './HandoutList';
import HandoutFormDialog from './HandoutFormDialog';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { HandoutScope, useHandoutOperations } from '../../hooks/useHandoutOperations';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import NextLink from 'next/link';
import WidgetShell from '../ui/WidgetShell';

interface HandoutSectionProps {
  scope: HandoutScope;
  title: string;
  description?: string;
  allowManage?: boolean;
  maxItems?: number;
  viewAllHref?: string;
  variant?: HandoutListVariant;
  emptyMessage?: string;
  renderCreateTrigger?: (options: { openCreate: () => void; disabled: boolean }) => React.ReactNode;
  hideWhenEmpty?: boolean;
}

type DialogState = {
  open: boolean;
  mode: 'create' | 'edit';
  handout: HandoutType | null;
};

type ConfirmState = {
  open: boolean;
  handout: HandoutType | null;
};

const HandoutSection: React.FC<HandoutSectionProps> = ({
  scope,
  title: sectionTitle,
  description,
  allowManage = false,
  maxItems,
  viewAllHref,
  variant = 'panel',
  emptyMessage,
  renderCreateTrigger,
  hideWhenEmpty = false,
}) => {
  const {
    listHandouts,
    deleteHandout,
    loading: mutationLoading,
    error: mutationError,
    clearError,
  } = useHandoutOperations(scope);
  const apiClient = useApiClient();
  const [handouts, setHandouts] = React.useState<HandoutType[]>([]);
  const [fetching, setFetching] = React.useState<boolean>(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [dialogState, setDialogState] = React.useState<DialogState>({
    open: false,
    mode: 'create',
    handout: null,
  });
  const [confirmState, setConfirmState] = React.useState<ConfirmState>({
    open: false,
    handout: null,
  });

  const teamId = scope.type === 'team' ? scope.teamId : undefined;

  React.useEffect(() => {
    const controller = new AbortController();

    const loadHandouts = async () => {
      try {
        setFetching(true);
        setFetchError(null);

        let data: HandoutType[];
        if (scope.type === 'team' && teamId) {
          const result = await apiListTeamHandouts({
            client: apiClient,
            path: { accountId: scope.accountId, teamId },
            signal: controller.signal,
            throwOnError: false,
          });
          if (controller.signal.aborted) return;
          const wrapped = unwrapApiResult(result, 'Failed to load team handouts');
          data = wrapped.handouts ?? [];
        } else {
          const result = await apiListAccountHandouts({
            client: apiClient,
            path: { accountId: scope.accountId },
            signal: controller.signal,
            throwOnError: false,
          });
          if (controller.signal.aborted) return;
          const wrapped = unwrapApiResult(result, 'Failed to load account handouts');
          data = wrapped.handouts ?? [];
        }

        if (controller.signal.aborted) return;
        setHandouts(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load handouts';
        setFetchError(message);
        setHandouts([]);
      } finally {
        if (!controller.signal.aborted) {
          setFetching(false);
        }
      }
    };

    void loadHandouts();
    return () => {
      controller.abort();
    };
  }, [scope.type, scope.accountId, teamId, apiClient]);

  const refreshHandouts = async () => {
    try {
      setFetching(true);
      setFetchError(null);
      const data = await listHandouts();
      setHandouts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load handouts';
      setFetchError(message);
      setHandouts([]);
    } finally {
      setFetching(false);
    }
  };

  const handleOpenCreate = () => {
    setDialogState({ open: true, mode: 'create', handout: null });
  };

  const handleOpenEdit = (handout: HandoutType) => {
    setDialogState({ open: true, mode: 'edit', handout });
  };

  const handleDialogClose = () => {
    setDialogState({ open: false, mode: 'create', handout: null });
  };

  const handleDialogSuccess = async ({ message }: { handout: HandoutType; message: string }) => {
    setSuccessMessage(message);
    setLocalError(null);
    handleDialogClose();
    await refreshHandouts();
  };

  const handleDeleteRequest = (handout: HandoutType) => {
    setConfirmState({ open: true, handout });
  };

  const handleDeleteCancel = () => {
    setConfirmState({ open: false, handout: null });
  };

  const handleDeleteConfirm = async () => {
    const target = confirmState.handout;
    if (!target) {
      return;
    }

    try {
      setLocalError(null);
      setSuccessMessage(null);
      clearError();
      await deleteHandout(target.id);
      setSuccessMessage('Handout deleted successfully');
      setConfirmState({ open: false, handout: null });
      await refreshHandouts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete handout';
      setLocalError(message);
    }
  };

  const handleAlertClose = () => {
    setSuccessMessage(null);
  };

  const handleErrorAlertClose = () => {
    setLocalError(null);
    clearError();
  };

  const content = (
    <Stack spacing={2.5}>
      {successMessage && (
        <Alert severity="success" onClose={handleAlertClose}>
          {successMessage}
        </Alert>
      )}
      {(localError || mutationError) && (
        <Alert severity="error" onClose={handleErrorAlertClose}>
          {localError || mutationError}
        </Alert>
      )}
      <HandoutList
        handouts={handouts}
        loading={fetching}
        error={fetchError}
        onRetry={refreshHandouts}
        onEdit={allowManage ? handleOpenEdit : undefined}
        onDelete={allowManage ? handleDeleteRequest : undefined}
        maxItems={maxItems}
        emptyMessage={emptyMessage}
        variant={variant}
        actionsDisabled={mutationLoading}
      />
      {viewAllHref && handouts.length > (maxItems ?? handouts.length) && (
        <Box textAlign="right">
          <Button component={NextLink} href={viewAllHref} variant="text">
            View all handouts
          </Button>
        </Box>
      )}
    </Stack>
  );

  const widgetSx: SxProps<Theme> = [
    variant === 'card'
      ? {
          alignSelf: 'flex-start',
          width: '100%',
          maxWidth: { xs: '100%', md: 420 },
        }
      : {
          width: '100%',
        },
  ];

  const shouldHideForEmpty =
    hideWhenEmpty && !fetching && !fetchError && handouts.length === 0 && !mutationError;

  if (shouldHideForEmpty) {
    return null;
  }

  const triggerDisabled = mutationLoading || fetching;

  const customCreateTrigger =
    allowManage && renderCreateTrigger
      ? renderCreateTrigger({ openCreate: handleOpenCreate, disabled: triggerDisabled })
      : null;

  const headerActions =
    allowManage && !customCreateTrigger ? (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpenCreate}
        disabled={triggerDisabled}
      >
        Add Handout
      </Button>
    ) : null;

  const titleNode = (
    <Typography
      variant={variant === 'card' ? 'h6' : 'h5'}
      fontWeight={variant === 'card' ? 600 : 700}
      color="text.primary"
    >
      {sectionTitle}
    </Typography>
  );

  const subtitleNode = description ? (
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  ) : undefined;

  return (
    <>
      <WidgetShell
        title={titleNode}
        subtitle={subtitleNode}
        actions={headerActions}
        accent="primary"
        sx={widgetSx}
      >
        {content}
      </WidgetShell>
      {customCreateTrigger}
      <HandoutFormDialog
        open={dialogState.open}
        onClose={handleDialogClose}
        scope={scope}
        mode={dialogState.mode}
        initialHandout={dialogState.handout}
        onSuccess={handleDialogSuccess}
        onError={setLocalError}
      />
      <ConfirmationDialog
        open={confirmState.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Handout"
        message="Are you sure you want to delete this handout? This action cannot be undone."
        confirmText="Delete"
        confirmButtonColor="error"
      />
    </>
  );
};

export default HandoutSection;
