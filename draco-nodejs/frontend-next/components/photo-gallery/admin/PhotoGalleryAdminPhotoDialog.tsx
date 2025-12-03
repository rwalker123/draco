import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import type { PhotoGalleryAdminAlbumType, PhotoGalleryPhotoType } from '@draco/shared-schemas';
import {
  createGalleryPhotoAdmin,
  updateGalleryPhotoAdmin,
  type CreateGalleryPhotoInput,
  type UpdateGalleryPhotoInput,
} from '../../../services/photoGalleryAdminService';
import { ApiClientError } from '../../../utils/apiResult';
import { normalizeEntityId } from '../utils';

type PhotoDialogMode = 'create' | 'edit';

interface PhotoGalleryAdminPhotoDialogProps {
  accountId: string;
  open: boolean;
  mode: PhotoDialogMode;
  albums: PhotoGalleryAdminAlbumType[];
  photo?: PhotoGalleryPhotoType;
  token?: string | null;
  onClose: () => void;
  onSuccess?: (payload: { message: string; photo: PhotoGalleryPhotoType }) => void;
  onError?: (message: string) => void;
}

const getDefaultAlbumValue = (photo?: PhotoGalleryPhotoType): string => {
  if (!photo || !photo.albumId) {
    return '';
  }
  return String(photo.albumId);
};

export const PhotoGalleryAdminPhotoDialog: React.FC<PhotoGalleryAdminPhotoDialogProps> = ({
  accountId,
  open,
  mode,
  albums,
  photo,
  token,
  onClose,
  onSuccess,
  onError,
}) => {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [albumId, setAlbumId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  const albumSections = useMemo(() => {
    const accountAlbums: Array<{ id: string; title: string }> = [];
    const teamAlbums: Array<{ id: string; title: string }> = [];

    albums.forEach((album) => {
      if (!album.id) {
        return;
      }

      const normalizedTeamId = normalizeEntityId(album.teamId ?? null);
      const albumAccountId = album.accountId ?? null;
      const title = album.title?.trim() || 'Untitled Album';

      const belongsToAccount = normalizedTeamId === null && albumAccountId === accountId;
      const belongsToTeam = normalizedTeamId !== null && albumAccountId === accountId;

      // Skip the global default album (accountId === '0'); the explicit default option maps to null.
      const isGlobalDefault = albumAccountId === '0';

      if (belongsToAccount && !isGlobalDefault) {
        accountAlbums.push({ id: String(album.id), title });
        return;
      }

      if (belongsToTeam) {
        teamAlbums.push({ id: String(album.id), title });
      }
    });

    accountAlbums.sort((a, b) => a.title.localeCompare(b.title));
    teamAlbums.sort((a, b) => a.title.localeCompare(b.title));

    return { accountAlbums, teamAlbums };
  }, [accountId, albums]);

  const albumTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    albumSections.accountAlbums.forEach((album) => map.set(album.id, album.title));
    albumSections.teamAlbums.forEach((album) => map.set(album.id, album.title));
    return map;
  }, [albumSections]);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setCaption('');
      setAlbumId('');
      setFile(null);
      setPreviewSrc(null);
      setSubmitting(false);
      return;
    }

    if (mode === 'edit' && photo) {
      setTitle(photo.title);
      setCaption(photo.caption ?? '');
      setAlbumId(getDefaultAlbumValue(photo));
      setPreviewSrc(photo.thumbnailUrl ?? null);
    } else {
      setTitle('');
      setCaption('');
      setAlbumId('');
      setFile(null);
      setPreviewSrc(null);
    }
  }, [open, mode, photo]);

  useEffect(() => {
    previewUrlRef.current = previewSrc;
  }, [previewSrc]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
      const objectUrl = URL.createObjectURL(selected);
      setPreviewSrc((previous) => {
        if (previous?.startsWith('blob:')) {
          URL.revokeObjectURL(previous);
        }
        return objectUrl;
      });
    } else {
      setFile(null);
      setPreviewSrc((previous) => {
        if (previous?.startsWith('blob:')) {
          URL.revokeObjectURL(previous);
        }
        return null;
      });
    }
  }, []);

  const handleAlbumChange = useCallback((event: SelectChangeEvent<string>) => {
    setAlbumId(event.target.value);
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      const url = previewUrlRef.current;
      if (url?.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      onError?.('Title is required');
      return;
    }

    if (mode === 'create' && !file) {
      onError?.('A photo file is required');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'create') {
        const payload: CreateGalleryPhotoInput = {
          title: title.trim(),
          caption: caption.trim() ? caption.trim() : null,
          albumId: albumId ? albumId : null,
          file: file as File,
        };

        const created = await createGalleryPhotoAdmin(accountId, payload, token);
        onSuccess?.({
          message: 'Photo added to gallery',
          photo: created,
        });
      } else if (mode === 'edit' && photo) {
        const payload: UpdateGalleryPhotoInput = {
          title: title.trim(),
          caption: caption.trim() ? caption.trim() : null,
          albumId: albumId ? albumId : null,
        };

        const updated = await updateGalleryPhotoAdmin(accountId, photo.id, payload, token);
        onSuccess?.({
          message: 'Photo updated successfully',
          photo: updated,
        });
      }
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'An unexpected error occurred';
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  }, [accountId, albumId, caption, file, mode, onClose, onError, onSuccess, photo, title, token]);

  const dialogTitle = mode === 'create' ? 'Add Photo to Gallery' : 'Edit Photo';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <TextField
            label="Photo Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            fullWidth
            required
            disabled={submitting}
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            label="Caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            disabled={submitting}
            inputProps={{ maxLength: 255 }}
            helperText={`${caption.length}/255`}
          />
          <FormControl fullWidth disabled={submitting}>
            <InputLabel id="photo-album-select-label" shrink>
              Album
            </InputLabel>
            <Select
              labelId="photo-album-select-label"
              value={albumId}
              label="Album"
              onChange={handleAlbumChange}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <em>Account Album (default)</em>;
                }
                return albumTitleMap.get(String(selected)) ?? '';
              }}
            >
              <MenuItem value="">
                <em>Account Album (default)</em>
              </MenuItem>
              {albumSections.accountAlbums.length > 0 ? (
                <ListSubheader
                  component="div"
                  disableSticky
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  Account Albums
                </ListSubheader>
              ) : null}
              {albumSections.accountAlbums.map((album) => (
                <MenuItem key={album.id} value={album.id}>
                  {album.title}
                </MenuItem>
              ))}
              {albumSections.teamAlbums.length > 0 ? (
                <ListSubheader
                  component="div"
                  disableSticky
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  Team Albums
                </ListSubheader>
              ) : null}
              {albumSections.teamAlbums.map((album) => (
                <MenuItem key={album.id} value={album.id}>
                  {album.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {mode === 'create' ? (
            <Box>
              <Button
                variant="outlined"
                component="label"
                disabled={submitting}
                sx={{ width: '100%' }}
              >
                {file ? 'Replace Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" hidden onChange={handleFileChange} />
              </Button>
              {previewSrc ? (
                <Box
                  component="img"
                  src={previewSrc}
                  alt={file?.name ?? 'Selected photo preview'}
                  sx={{
                    mt: 1.5,
                    width: '100%',
                    maxHeight: 240,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              ) : null}
              {file ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  {file.name}
                </Typography>
              ) : null}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              To replace the photo image, delete this entry and upload a new photo.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {mode === 'create' ? 'Add Photo' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoGalleryAdminPhotoDialog;
