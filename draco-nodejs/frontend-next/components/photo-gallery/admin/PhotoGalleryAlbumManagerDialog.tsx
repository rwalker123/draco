import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { PhotoGalleryAdminAlbumType } from '@draco/shared-schemas';
import {
  createGalleryAlbumAdmin,
  deleteGalleryAlbumAdmin,
  updateGalleryAlbumAdmin,
} from '../../../services/photoGalleryAdminService';
import { ApiClientError } from '../../../utils/apiResult';
import ConfirmationDialog from '../../common/ConfirmationDialog';

interface PhotoGalleryAlbumManagerDialogProps {
  accountId: string;
  open: boolean;
  albums: PhotoGalleryAdminAlbumType[];
  token?: string | null;
  onClose: () => void;
  onSuccess?: (payload: { message: string }) => void;
  onError?: (message: string) => void;
}

interface EditableAlbum extends PhotoGalleryAdminAlbumType {
  photoCount: number;
  isDefault: boolean;
}

const normalizeAlbums = (albums: PhotoGalleryAdminAlbumType[]): EditableAlbum[] => {
  return albums
    .filter((album): album is PhotoGalleryAdminAlbumType & { id: string } => Boolean(album.id))
    .map((album) => ({
      ...album,
      photoCount: album.photoCount ?? 0,
      isDefault: (album.accountId ?? '') === '0',
    }));
};

export const PhotoGalleryAlbumManagerDialog: React.FC<PhotoGalleryAlbumManagerDialogProps> = ({
  accountId,
  open,
  albums,
  token,
  onClose,
  onSuccess,
  onError,
}) => {
  const [localAlbums, setLocalAlbums] = useState<EditableAlbum[]>([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [pendingDelete, setPendingDelete] = useState<EditableAlbum | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLocalAlbums(normalizeAlbums(albums));
      setNewAlbumTitle('');
      setEditingAlbumId(null);
      setEditingTitle('');
      setOperationMessage(null);
    }
  }, [open, albums]);

  const sortedAlbums = useMemo(() => {
    return [...localAlbums].sort((a, b) => {
      if (a.isDefault && !b.isDefault) {
        return -1;
      }
      if (!a.isDefault && b.isDefault) {
        return 1;
      }
      return a.title.localeCompare(b.title);
    });
  }, [localAlbums]);

  const handleCreate = useCallback(async () => {
    const title = newAlbumTitle.trim();
    if (!title) {
      setOperationMessage('Album title is required');
      return;
    }

    setSubmitting(true);
    setOperationMessage(null);

    try {
      const payload = {
        title,
        teamId: null,
        parentAlbumId: null,
      };
      const created = await createGalleryAlbumAdmin(accountId, payload, token);
      const normalized: EditableAlbum = {
        ...created,
        id: created.id ?? '',
        photoCount: created.photoCount ?? 0,
        isDefault: (created.accountId ?? '') === '0',
      };

      setLocalAlbums((current) => [...current, normalized]);
      setNewAlbumTitle('');
      onSuccess?.({ message: 'Album created successfully' });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to create album';
      onError?.(message);
      setOperationMessage(message);
    } finally {
      setSubmitting(false);
    }
  }, [accountId, newAlbumTitle, onError, onSuccess, token]);

  const handleStartEdit = useCallback((album: EditableAlbum) => {
    if (album.isDefault) {
      setOperationMessage('The default album cannot be renamed.');
      return;
    }

    setEditingAlbumId(album.id);
    setEditingTitle(album.title);
    setOperationMessage(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingAlbumId(null);
    setEditingTitle('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingAlbumId) {
      return;
    }

    const title = editingTitle.trim();
    if (!title) {
      setOperationMessage('Album title is required');
      return;
    }

    setSubmitting(true);
    setOperationMessage(null);

    try {
      const updated = await updateGalleryAlbumAdmin(accountId, editingAlbumId, { title }, token);

      setLocalAlbums((current) =>
        current.map((album) =>
          album.id === editingAlbumId
            ? {
                ...album,
                title: updated.title,
                photoCount: updated.photoCount ?? album.photoCount,
                isDefault: album.isDefault,
              }
            : album,
        ),
      );
      setEditingAlbumId(null);
      setEditingTitle('');
      onSuccess?.({ message: 'Album updated successfully' });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to update album';
      onError?.(message);
      setOperationMessage(message);
    } finally {
      setSubmitting(false);
    }
  }, [accountId, editingAlbumId, editingTitle, onError, onSuccess, token]);

  const handleConfirmDelete = useCallback((album: EditableAlbum) => {
    if (album.isDefault) {
      setOperationMessage('The default album cannot be deleted.');
      return;
    }

    if (album.photoCount > 0) {
      setOperationMessage('Albums containing photos cannot be deleted');
      return;
    }
    setPendingDelete(album);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    setSubmitting(true);
    setOperationMessage(null);

    try {
      await deleteGalleryAlbumAdmin(accountId, pendingDelete.id, token);
      setLocalAlbums((current) => current.filter((album) => album.id !== pendingDelete.id));
      setPendingDelete(null);
      onSuccess?.({ message: 'Album deleted successfully' });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to delete album';
      onError?.(message);
      setOperationMessage(message);
    } finally {
      setSubmitting(false);
    }
  }, [accountId, onError, onSuccess, pendingDelete, token]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Manage Photo Albums</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="New album title"
              value={newAlbumTitle}
              onChange={(event) => setNewAlbumTitle(event.target.value)}
              fullWidth
              disabled={submitting}
              inputProps={{ maxLength: 25 }}
            />
            <Tooltip title="Create album">
              <span>
                <IconButton
                  color="primary"
                  onClick={handleCreate}
                  disabled={submitting}
                  sx={{ alignSelf: 'center' }}
                >
                  <AddIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {operationMessage ? (
            <Typography
              variant="body2"
              color="error"
              sx={{ mb: 2 }}
              data-testid="album-manager-feedback"
            >
              {operationMessage}
            </Typography>
          ) : null}

          <List dense disablePadding>
            {sortedAlbums.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No custom albums yet. Create one to organize your gallery.
              </Typography>
            ) : (
              sortedAlbums.map((album) => {
                const isEditing = editingAlbumId === album.id;
                const isDefault = album.isDefault;

                return (
                  <ListItem key={album.id} divider disableGutters>
                    {isEditing && !isDefault ? (
                      <TextField
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        fullWidth
                        disabled={submitting}
                        inputProps={{ maxLength: 25 }}
                      />
                    ) : (
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle2" fontWeight={600}>
                              {album.title}
                            </Typography>
                            {isDefault ? (
                              <Chip label="Default" size="small" color="primary" />
                            ) : null}
                          </Stack>
                        }
                        secondary={`${album.photoCount} photo${album.photoCount === 1 ? '' : 's'}`}
                      />
                    )}
                    <ListItemSecondaryAction>
                      {isDefault ? (
                        <Tooltip title="Default album">
                          <span>
                            <IconButton size="small" disabled>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : isEditing ? (
                        <>
                          <Tooltip title="Save">
                            <span>
                              <IconButton
                                color="primary"
                                onClick={handleSaveEdit}
                                disabled={submitting}
                              >
                                <SaveIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton onClick={handleCancelEdit} disabled={submitting}>
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Rename">
                            <IconButton
                              onClick={() => handleStartEdit(album)}
                              disabled={submitting}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              album.photoCount > 0
                                ? 'Albums containing photos cannot be deleted'
                                : 'Delete album'
                            }
                          >
                            <span>
                              <IconButton
                                color="error"
                                onClick={() => handleConfirmDelete(album)}
                                disabled={submitting || album.photoCount > 0}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete Album"
        message={
          pendingDelete
            ? `Are you sure you want to delete “${pendingDelete.title}”? This cannot be undone.`
            : ''
        }
        confirmText="Delete Album"
        confirmButtonColor="error"
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default PhotoGalleryAlbumManagerDialog;
