'use client';

import React, { useRef, useEffect } from 'react';
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
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { AnnouncementType, UpsertAnnouncementType } from '@draco/shared-schemas';
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
import { UI_TIMEOUTS } from '../../constants/timeoutConstants';

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
    listAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    loading: mutationLoading,
    error: mutationError,
    clearError,
  } = useAnnouncementOperations(scope);

  const listAnnouncementsRef = useRef(listAnnouncements);
  const createAnnouncementRef = useRef(createAnnouncement);
  const updateAnnouncementRef = useRef(updateAnnouncement);
  const deleteAnnouncementRef = useRef(deleteAnnouncement);
  const clearErrorRef = useRef(clearError);

  useEffect(() => {
    listAnnouncementsRef.current = listAnnouncements;
    createAnnouncementRef.current = createAnnouncement;
    updateAnnouncementRef.current = updateAnnouncement;
    deleteAnnouncementRef.current = deleteAnnouncement;
    clearErrorRef.current = clearError;
  }, [listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, clearError]);

  const [announcements, setAnnouncements] = React.useState<AnnouncementType[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [dialogState, setDialogState] = React.useState<DialogState>({ open: false });
  const [confirmState, setConfirmState] = React.useState<ConfirmState>({
    open: false,
    announcement: null,
  });
  const [snackbar, setSnackbar] = React.useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);

  const refreshAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await listAnnouncementsRef.current();
      setAnnouncements(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load announcements';
      setSnackbar({ severity: 'error', message });
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const teamSeasonId = 'teamSeasonId' in scope ? scope.teamSeasonId : null;

  useEffect(() => {
    void refreshAnnouncements();
  }, [scope.type, scope.accountId, teamSeasonId]);

  const handleCreate = () => {
    clearErrorRef.current();
    setLocalError(null);
    setDialogState({ open: true, mode: 'create', announcement: null });
  };

  const handleEdit = (announcement: AnnouncementType) => {
    clearErrorRef.current();
    setLocalError(null);
    setDialogState({ open: true, mode: 'edit', announcement });
  };

  const handleDialogClose = () => {
    setDialogState({ open: false });
    setLocalError(null);
    clearErrorRef.current();
  };

  const handleSubmit = async (payload: UpsertAnnouncementType) => {
    try {
      setLocalError(null);
      clearErrorRef.current();
      if (!dialogState.open) {
        return;
      }

      if (dialogState.mode === 'create') {
        await createAnnouncementRef.current(payload);
        setSnackbar({ severity: 'success', message: 'Announcement created successfully.' });
      } else if (dialogState.mode === 'edit' && dialogState.announcement) {
        await updateAnnouncementRef.current(dialogState.announcement.id, payload);
        setSnackbar({ severity: 'success', message: 'Announcement updated successfully.' });
      }

      setDialogState({ open: false });
      await refreshAnnouncements();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save announcement';
      setLocalError(message);
      setSnackbar({ severity: 'error', message });
      throw err;
    }
  };

  const handleDeletePrompt = (announcement: AnnouncementType) => {
    setConfirmState({ open: true, announcement });
    setLocalError(null);
    clearErrorRef.current();
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
      clearErrorRef.current();
      await deleteAnnouncementRef.current(target.id);
      setSnackbar({ severity: 'success', message: 'Announcement deleted successfully.' });
      setConfirmState({ open: false, announcement: null });
      await refreshAnnouncements();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete announcement';
      setLocalError(message);
      setSnackbar({ severity: 'error', message });
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

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={
          snackbar?.severity === 'error'
            ? UI_TIMEOUTS.ERROR_MESSAGE_TIMEOUT_MS
            : UI_TIMEOUTS.SUCCESS_MESSAGE_TIMEOUT_MS
        }
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert
            onClose={() => setSnackbar(null)}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
};

export default AnnouncementsManager;
