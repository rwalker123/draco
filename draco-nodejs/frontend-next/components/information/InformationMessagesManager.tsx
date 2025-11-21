'use client';

import React from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Fab,
  IconButton,
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
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
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

  const availableTeams: InformationMessageTeamOption[] = React.useMemo(() => {
    if (scope.type === 'team') {
      if (scope.teamId) {
        return [
          {
            teamSeasonId: scope.teamSeasonId,
            teamId: scope.teamId,
            label: scope.teamLabel ?? 'Team',
          },
        ];
      }
      return [];
    }
    return scope.teamOptions;
  }, [scope]);

  const operationsScope: WelcomeMessageScope = React.useMemo(() => {
    if (scope.type === 'team') {
      return { type: 'team', accountId: scope.accountId, teamSeasonId: scope.teamSeasonId };
    }

    if (activeScope === 'team' && selectedTeamSeasonId) {
      return { type: 'team', accountId: scope.accountId, teamSeasonId: selectedTeamSeasonId };
    }

    return { type: 'account', accountId: scope.accountId };
  }, [scope, activeScope, selectedTeamSeasonId]);

  const {
    listMessages,
    createMessage,
    updateMessage,
    deleteMessage,
    loading: mutationLoading,
    error: mutationError,
    clearError,
  } = useWelcomeMessageOperations(operationsScope);

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

  const refreshMessages = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listMessages();
      const sanitized = sortMessages(
        data.map((message) => ({
          ...message,
          bodyHtml: sanitizeRichContent(message.bodyHtml ?? ''),
        })),
      );
      setMessages(sanitized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load information messages';
      setError(message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [listMessages]);

  React.useEffect(() => {
    void refreshMessages();
  }, [refreshMessages, operationsScope]);

  React.useEffect(() => {
    setSuccessMessage(null);
    setError(null);
    clearError();
  }, [operationsScope, clearError]);

  const handleCreate = () => {
    clearError();
    setDialogError(null);
    const scopeForDialog = scope.type === 'team' ? 'team' : activeScope;
    setDialogState({ open: true, mode: 'create', message: null, scope: scopeForDialog });
  };

  const handleEdit = (message: WelcomeMessageType) => {
    clearError();
    setDialogError(null);
    const scopeForDialog = message.isTeamScoped ? 'team' : 'account';
    setDialogState({ open: true, mode: 'edit', message, scope: scopeForDialog });
  };

  const handleDialogClose = () => {
    setDialogState({ open: false });
    setDialogError(null);
    clearError();
  };

  const handleDeletePrompt = (message: WelcomeMessageType) => {
    clearError();
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
        await updateMessage(dialogState.message.id, payload, targetScope);
        setSuccessMessage('Information message updated successfully.');
      } else {
        await createMessage(payload, targetScope);
        setSuccessMessage('Information message created successfully.');
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
      await deleteMessage(confirmState.message.id, targetScope);
      setSuccessMessage('Information message deleted successfully.');
      setConfirmState({ open: false, message: null });
      await refreshMessages();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete information message';
      setError(message);
    }
  };

  const handleDismissSuccess = () => {
    setSuccessMessage(null);
  };

  const handleDismissError = () => {
    setError(null);
    clearError();
  };

  const disabledCreateButton = mutationLoading || (effectiveScope === 'team' && !hasTeams);

  const managerTitle = React.useMemo(() => {
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
  }, [scope, title, activeScope, availableTeams, selectedTeamSeasonId]);

  return (
    <WidgetShell title={managerTitle} subtitle={description} accent={accent}>
      <Stack spacing={3}>
        {successMessage ? (
          <Alert severity="success" onClose={handleDismissSuccess}>
            {successMessage}
          </Alert>
        ) : null}

        {error ? (
          <Alert severity="error" onClose={handleDismissError}>
            {error}
          </Alert>
        ) : null}

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
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
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
        initialTeamSeasonId={(() => {
          if (!dialogState.open) {
            return scope.type === 'team' ? scope.teamSeasonId : selectedTeamSeasonId;
          }

          if (dialogState.scope === 'team') {
            if (dialogState.message?.teamId) {
              const mapped = availableTeams.find(
                (team) => team.teamId === dialogState.message?.teamId,
              );
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
        })()}
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
  );
};

export default InformationMessagesManager;
