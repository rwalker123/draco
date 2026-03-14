'use client';

import React, { useEffect } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationSnackbar from '../common/NotificationSnackbar';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type {
  AnnouncementListType,
  AnnouncementType,
  UpsertAnnouncementType,
} from '@draco/shared-schemas';
import type { WidgetAccent } from '../ui/WidgetShell';
import WidgetShell from '../ui/WidgetShell';
import RichTextContent from '../common/RichTextContent';
import AnnouncementFormDialog from './AnnouncementFormDialog';
import {
  AnnouncementScope,
  useAnnouncementOperations,
} from '../../hooks/useAnnouncementOperations';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { formatDateTime } from '../../utils/dateUtils';
import { sanitizeHandoutContent } from '../../utils/sanitization';
import {
  listAccountAnnouncements as apiListAccountAnnouncements,
  listTeamAnnouncements as apiListTeamAnnouncements,
} from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';

interface AnnouncementsManagerProps {
  scope: AnnouncementScope;
  title?: string;
  description?: string;
  accent?: WidgetAccent;
  emptyMessage?: string;
}

type DialogState =
  | { open: false }
  | { open: true; mode: 'create'; announcement: null }
  | { open: true; mode: 'edit'; announcement: AnnouncementType };

interface ConfirmState {
  open: boolean;
  announcement: AnnouncementType | null;
}

const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({
  scope,
  title = 'Announcements',
  description = 'Share timely updates with your organization.',
  accent = 'secondary',
  emptyMessage = 'No announcements have been posted yet.',
}) => {
  const {
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    loading: mutationLoading,
    error: mutationError,
    clearError,
  } = useAnnouncementOperations(scope);

  const apiClient = useApiClient();
  const [announcements, setAnnouncements] = React.useState<AnnouncementType[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [dialogState, setDialogState] = React.useState<DialogState>({ open: false });
  const [confirmState, setConfirmState] = React.useState<ConfirmState>({
    open: false,
    announcement: null,
  });
  const { notification, showNotification, hideNotification } = useNotifications();

  const teamSeasonId = 'teamSeasonId' in scope ? scope.teamSeasonId : null;
  const teamId = 'teamId' in scope ? scope.teamId : null;

  useEffect(() => {
    const controller = new AbortController();

    const loadAnnouncements = async () => {
      try {
        setLoading(true);

        const result =
          scope.type === 'team' && teamId
            ? await apiListTeamAnnouncements({
                client: apiClient,
                path: { accountId: scope.accountId, teamId },
                signal: controller.signal,
                throwOnError: false,
              })
            : await apiListAccountAnnouncements({
                client: apiClient,
                path: { accountId: scope.accountId },
                signal: controller.signal,
                throwOnError: false,
              });

        if (controller.signal.aborted) return;
        const payload = unwrapApiResult<AnnouncementListType>(
          result,
          'Failed to load announcements',
        );
        setAnnouncements(payload.announcements);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load announcements';
        showNotification(message, 'error');
        setAnnouncements([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadAnnouncements();

    return () => {
      controller.abort();
    };
  }, [scope.type, scope.accountId, teamId, teamSeasonId, refreshKey, showNotification, apiClient]);

  const handleCreate = () => {
    clearError();
    setLocalError(null);
    setDialogState({ open: true, mode: 'create', announcement: null });
  };

  const handleEdit = (announcement: AnnouncementType) => {
    clearError();
    setLocalError(null);
    setDialogState({ open: true, mode: 'edit', announcement });
  };

  const handleDialogClose = () => {
    setDialogState({ open: false });
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (payload: UpsertAnnouncementType) => {
    try {
      setLocalError(null);
      clearError();
      if (!dialogState.open) {
        return;
      }

      if (dialogState.mode === 'create') {
        await createAnnouncement(payload);
        showNotification('Announcement created successfully.', 'success');
      } else if (dialogState.mode === 'edit' && dialogState.announcement) {
        await updateAnnouncement(dialogState.announcement.id, payload);
        showNotification('Announcement updated successfully.', 'success');
      }

      setDialogState({ open: false });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save announcement';
      setLocalError(message);
      throw err;
    }
  };

  const handleDeletePrompt = (announcement: AnnouncementType) => {
    setConfirmState({ open: true, announcement });
    setLocalError(null);
    clearError();
  };

  const handleDeleteCancel = () => {
    setConfirmState({ open: false, announcement: null });
  };

  const handleDeleteConfirm = async () => {
    const target = confirmState.announcement;
    if (!target) {
      return;
    }

    try {
      setLocalError(null);
      clearError();
      await deleteAnnouncement(target.id);
      showNotification('Announcement deleted successfully.', 'success');
      setConfirmState({ open: false, announcement: null });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete announcement';
      showNotification(message, 'error');
    }
  };

  const hasAnnouncements = announcements.length > 0;

  return (
    <>
      <WidgetShell title={title} subtitle={description} accent={accent}>
        <Stack spacing={2.5}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : hasAnnouncements ? (
            <List disablePadding>
              {announcements.map((announcement) => {
                const sanitizedBody = sanitizeHandoutContent(announcement.body ?? '');
                const publishedLabel = formatDateTime(announcement.publishedAt);
                return (
                  <ListItem
                    key={announcement.id}
                    alignItems="flex-start"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 2,
                      paddingRight: 8,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {announcement.title}
                          </Typography>
                          {announcement.isSpecial ? (
                            <Chip label="Special" color="warning" size="small" />
                          ) : null}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={1} mt={1}>
                          <Typography variant="body2" color="text.secondary" component="span">
                            Published {publishedLabel}
                          </Typography>
                          <RichTextContent
                            html={sanitizedBody}
                            sanitize={false}
                            sx={{ '& p': { mb: 1.5 } }}
                          />
                        </Stack>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Edit announcement">
                        <span>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEdit(announcement)}
                            disabled={mutationLoading}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete announcement">
                        <span>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeletePrompt(announcement)}
                            disabled={mutationLoading}
                            sx={{ ml: 1 }}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Alert severity="info">{emptyMessage}</Alert>
          )}
        </Stack>
      </WidgetShell>

      <Fab
        color="primary"
        aria-label="Add announcement"
        onClick={handleCreate}
        disabled={mutationLoading}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, md: 32 },
          right: { xs: 24, md: 32 },
          zIndex: (theme) => theme.zIndex.tooltip,
        }}
      >
        <AddIcon />
      </Fab>

      {dialogState.open ? (
        <AnnouncementFormDialog
          open
          mode={dialogState.mode}
          initialAnnouncement={dialogState.mode === 'edit' ? dialogState.announcement : null}
          onClose={handleDialogClose}
          onSubmit={handleSubmit}
          submitting={mutationLoading}
          submitError={localError || mutationError}
        />
      ) : null}

      <ConfirmationDialog
        open={confirmState.open}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
        confirmText="Delete"
        confirmButtonColor="error"
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </>
  );
};

export default AnnouncementsManager;
