'use client';

import React, { useRef, useEffect } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Fab,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { type UpsertWelcomeMessageType, type WelcomeMessageType } from '@draco/shared-schemas';

import WidgetShell, { type WidgetAccent } from '../ui/WidgetShell';
import {
  useWelcomeMessageOperations,
  type WelcomeMessageScope,
} from '../../hooks/useWelcomeMessageOperations';
import InformationMessageFormDialog, {
  type InformationMessageTeamOption,
} from './InformationMessageFormDialog';
import ConfirmationDialog from '../common/ConfirmationDialog';
import RichTextContent from '../common/RichTextContent';
import { sanitizeRichContent } from '../../utils/sanitization';

type ManagerScope =
  | {
      type: 'account';
      accountId: string;
      teamOptions: InformationMessageTeamOption[];
      defaultTeamSeasonId?: string | null;
    }
  | {
      type: 'team';
      accountId: string;
      teamSeasonId: string;
      teamId?: string | null;
      teamLabel?: string;
    };

interface InformationMessagesManagerProps {
  scope: ManagerScope;
  title?: string;
  description?: string;
  accent?: WidgetAccent;
  emptyMessage?: string;
}

type DialogState =
  | { open: false }
  | {
      open: true;
      mode: 'create' | 'edit';
      message: WelcomeMessageType | null;
      scope: 'account' | 'team';
    };

interface ConfirmState {
  open: boolean;
  message: WelcomeMessageType | null;
}

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
} | null;

const sortMessages = (entries: WelcomeMessageType[]): WelcomeMessageType[] =>
  [...entries].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return Number.parseInt(a.id, 10) - Number.parseInt(b.id, 10);
  });

const InformationMessagesManager: React.FC<InformationMessagesManagerProps> = ({
  scope,
  title = '',
  description = '',
  accent = 'info',
  emptyMessage = 'No information messages have been created yet.',
}) => {
  const [messages, setMessages] = React.useState<WelcomeMessageType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<FeedbackState>(null);
  const [dialogState, setDialogState] = React.useState<DialogState>({ open: false });
  const [confirmState, setConfirmState] = React.useState<ConfirmState>({
    open: false,
    message: null,
  });
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [activeScope, setActiveScope] = React.useState<'account' | 'team'>(
    scope.type === 'team' ? 'team' : 'account',
  );
  const [selectedTeamSeasonId, setSelectedTeamSeasonId] = React.useState<string | ''>(() => {
    if (scope.type === 'team') {
      return scope.teamSeasonId;
    }
    return scope.defaultTeamSeasonId ?? scope.teamOptions[0]?.teamSeasonId ?? '';
  });

  const availableTeams: InformationMessageTeamOption[] =
    scope.type === 'team'
      ? scope.teamId
        ? [
            {
              teamSeasonId: scope.teamSeasonId,
              teamId: scope.teamId,
              label: scope.teamLabel ?? 'Team',
            },
          ]
        : []
      : scope.teamOptions;

  const operationsScope: WelcomeMessageScope =
    scope.type === 'team'
      ? { type: 'team', accountId: scope.accountId, teamSeasonId: scope.teamSeasonId }
      : activeScope === 'team' && selectedTeamSeasonId
        ? { type: 'team', accountId: scope.accountId, teamSeasonId: selectedTeamSeasonId }
        : { type: 'account', accountId: scope.accountId };

  const {
    listMessages,
    createMessage,
    updateMessage,
    deleteMessage,
    loading: mutationLoading,
    error: mutationError,
    clearError,
  } = useWelcomeMessageOperations(operationsScope);

  const listMessagesRef = useRef(listMessages);
  const createMessageRef = useRef(createMessage);
  const updateMessageRef = useRef(updateMessage);
  const deleteMessageRef = useRef(deleteMessage);
  const clearErrorRef = useRef(clearError);

  useEffect(() => {
    listMessagesRef.current = listMessages;
    createMessageRef.current = createMessage;
    updateMessageRef.current = updateMessage;
    deleteMessageRef.current = deleteMessage;
    clearErrorRef.current = clearError;
  }, [listMessages, createMessage, updateMessage, deleteMessage, clearError]);

  React.useEffect(() => {
    if (scope.type === 'team') {
      setActiveScope('team');
      setSelectedTeamSeasonId(scope.teamSeasonId);
      return;
    }

    if (scope.teamOptions.length === 0) {
      setActiveScope((previous) => (previous === 'team' ? 'account' : previous));
    }

    setSelectedTeamSeasonId((previous) => {
      if (scope.teamOptions.length === 0) {
        return '';
      }

      if (scope.teamOptions.some((team) => team.teamSeasonId === previous)) {
        return previous;
      }

      return scope.defaultTeamSeasonId ?? scope.teamOptions[0]?.teamSeasonId ?? '';
    });
  }, [scope]);

  const refreshMessages = async () => {
    setLoading(true);

    try {
      const data = await listMessagesRef.current();
      const sanitized = sortMessages(
        data.map((message) => ({
          ...message,
          bodyHtml: sanitizeRichContent(message.bodyHtml ?? ''),
        })),
      );
      setMessages(sanitized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load information messages';
      setFeedback({ severity: 'error', message });
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const operationsScopeKey =
    operationsScope.type === 'team'
      ? `team-${operationsScope.teamSeasonId}`
      : `account-${operationsScope.accountId}`;

  useEffect(() => {
    void refreshMessages();
  }, [operationsScopeKey]);

  useEffect(() => {
    setFeedback(null);
    clearErrorRef.current();
  }, [operationsScopeKey]);

  const handleCreate = () => {
    clearErrorRef.current();
    setDialogError(null);
    const scopeForDialog = scope.type === 'team' ? 'team' : activeScope;
    setDialogState({ open: true, mode: 'create', message: null, scope: scopeForDialog });
  };

  const handleEdit = (message: WelcomeMessageType) => {
    clearErrorRef.current();
    setDialogError(null);
    const scopeForDialog = message.isTeamScoped ? 'team' : 'account';
    setDialogState({ open: true, mode: 'edit', message, scope: scopeForDialog });
  };

  const handleDialogClose = () => {
    setDialogState({ open: false });
    setDialogError(null);
    clearErrorRef.current();
  };

  const handleDeletePrompt = (message: WelcomeMessageType) => {
    clearErrorRef.current();
    setConfirmState({ open: true, message });
  };

  const handleConfirmClose = () => {
    setConfirmState({ open: false, message: null });
  };

  const effectiveScope = scope.type === 'team' ? 'team' : activeScope;
  const hasTeams = availableTeams.length > 0;

  const resolveTargetScope = (
    submitScope: 'account' | 'team',
    teamSeasonId?: string,
  ): WelcomeMessageScope => {
    if (submitScope === 'team') {
      if (scope.type === 'team') {
        return { type: 'team', accountId: scope.accountId, teamSeasonId: scope.teamSeasonId };
      }

      const desiredTeamSeasonId =
        teamSeasonId || selectedTeamSeasonId || availableTeams[0]?.teamSeasonId;

      if (!desiredTeamSeasonId) {
        throw new Error('Select a team before saving the information message.');
      }

      return { type: 'team', accountId: scope.accountId, teamSeasonId: desiredTeamSeasonId };
    }

    return { type: 'account', accountId: scope.accountId };
  };

  const resolveMessageScope = (message: WelcomeMessageType): WelcomeMessageScope => {
    if (message.isTeamScoped) {
      if (scope.type === 'team') {
        return { type: 'team', accountId: scope.accountId, teamSeasonId: scope.teamSeasonId };
      }

      const matchingOption = availableTeams.find((team) => team.teamId === message.teamId);
      const teamSeasonId = matchingOption?.teamSeasonId ?? selectedTeamSeasonId;

      if (!teamSeasonId) {
        throw new Error('Unable to resolve team for this information message.');
      }

      return { type: 'team', accountId: scope.accountId, teamSeasonId };
    }

    return { type: 'account', accountId: scope.accountId };
  };

  const handleDialogSubmit = async ({
    scope: submitScope,
    teamSeasonId,
    payload,
  }: {
    scope: 'account' | 'team';
    teamSeasonId?: string;
    payload: UpsertWelcomeMessageType;
  }) => {
    try {
      const targetScope = resolveTargetScope(submitScope, teamSeasonId);
      setDialogError(null);

      if (targetScope.type === 'team' && scope.type === 'account') {
        setActiveScope('team');
        setSelectedTeamSeasonId(targetScope.teamSeasonId);
      }

      if (dialogState.open && dialogState.mode === 'edit' && dialogState.message) {
        await updateMessageRef.current(dialogState.message.id, payload, targetScope);
        setFeedback({ severity: 'success', message: 'Information message updated successfully.' });
      } else {
        await createMessageRef.current(payload, targetScope);
        setFeedback({ severity: 'success', message: 'Information message created successfully.' });
      }
      setDialogState({ open: false });
      await refreshMessages();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save information message';
      setDialogError(message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmState.message) {
      return;
    }

    try {
      const targetScope = resolveMessageScope(confirmState.message);
      await deleteMessageRef.current(confirmState.message.id, targetScope);
      setFeedback({ severity: 'success', message: 'Information message deleted successfully.' });
      setConfirmState({ open: false, message: null });
      await refreshMessages();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete information message';
      setFeedback({ severity: 'error', message });
    }
  };

  const handleFeedbackClose = () => {
    setFeedback(null);
    clearErrorRef.current();
  };

  const disabledCreateButton = mutationLoading || (effectiveScope === 'team' && !hasTeams);

  const resolveManagerTitle = (): string => {
    if (scope.type === 'team') {
      return scope.teamLabel ? `${scope.teamLabel} Information Messages` : title;
    }
    if (activeScope === 'team') {
      const selectedTeam = availableTeams.find(
        (team) => team.teamSeasonId === selectedTeamSeasonId,
      );
      if (selectedTeam) {
        return `${selectedTeam.label} Information Messages`;
      }
    }
    return title;
  };

  const managerTitle = resolveManagerTitle();

  const resolveDialogTeamSeasonId = (): string | undefined => {
    if (!dialogState.open) {
      return scope.type === 'team' ? scope.teamSeasonId : selectedTeamSeasonId;
    }

    if (dialogState.scope === 'team') {
      if (dialogState.message?.teamId) {
        const mapped = availableTeams.find((team) => team.teamId === dialogState.message?.teamId);
        if (mapped) {
          return mapped.teamSeasonId;
        }
      }

      if (scope.type === 'team') {
        return scope.teamSeasonId;
      }

      return selectedTeamSeasonId || availableTeams[0]?.teamSeasonId;
    }

    return scope.type === 'team' ? scope.teamSeasonId : selectedTeamSeasonId;
  };

  return (
    <>
      <WidgetShell title={managerTitle} subtitle={description} accent={accent}>
        <Stack spacing={3}>
          {loading ? (
            <Alert severity="info">Loading information messages...</Alert>
          ) : messages.length === 0 ? (
            <Alert severity="info">{emptyMessage}</Alert>
          ) : (
            <Stack spacing={2}>
              {messages.map((message) => (
                <Card
                  key={message.id}
                  sx={{
                    backgroundColor: (theme) => theme.palette.background.paper,
                    borderColor: (theme) => theme.palette.widget.border,
                    borderRadius: 2,
                  }}
                  variant="outlined"
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {message.caption}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Display order {message.order}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            aria-label="Edit information message"
                            onClick={() => handleEdit(message)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            aria-label="Delete information message"
                            onClick={() => handleDeletePrompt(message)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <RichTextContent html={message.bodyHtml ?? ''} />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>

        <Fab
          color="primary"
          aria-label="Add information message"
          onClick={handleCreate}
          disabled={disabledCreateButton}
          sx={{
            position: 'fixed',
            bottom: { xs: 24, md: 32 },
            right: { xs: 24, md: 32 },
            zIndex: (theme) => theme.zIndex.tooltip,
          }}
        >
          <AddIcon />
        </Fab>

        <InformationMessageFormDialog
          open={dialogState.open}
          mode={dialogState.open ? dialogState.mode : 'create'}
          initialMessage={dialogState.open ? (dialogState.message ?? undefined) : undefined}
          initialScope={dialogState.open ? dialogState.scope : effectiveScope}
          initialTeamSeasonId={resolveDialogTeamSeasonId()}
          availableTeams={availableTeams}
          onClose={handleDialogClose}
          onSubmit={handleDialogSubmit}
          loading={mutationLoading}
          submitError={dialogError ?? mutationError ?? undefined}
        />

        <ConfirmationDialog
          open={confirmState.open}
          title="Delete Information Message"
          message="Are you sure you want to delete this information message? This action cannot be undone."
          confirmText="Delete"
          confirmButtonColor="error"
          onClose={handleConfirmClose}
          onConfirm={handleDeleteConfirm}
        />
      </WidgetShell>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={6000}
        onClose={handleFeedbackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert onClose={handleFeedbackClose} severity={feedback.severity} variant="filled">
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
};

export default InformationMessagesManager;
