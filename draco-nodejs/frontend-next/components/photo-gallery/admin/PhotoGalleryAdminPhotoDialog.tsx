import React, { useCallback, useEffect, useState } from 'react';
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
import PhotoGalleryAlbumSections from './PhotoGalleryAlbumSections';

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
  return photo.albumId;
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setCaption('');
      setAlbumId('');
      setFile(null);
      setSubmitting(false);
      return;
    }

    if (mode === 'edit' && photo) {
      setTitle(photo.title);
      setCaption(photo.caption ?? '');
      setAlbumId(getDefaultAlbumValue(photo));
    } else {
      setTitle('');
      setCaption('');
      setAlbumId('');
      setFile(null);
    }
  }, [open, mode, photo]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
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
            <InputLabel id="photo-album-select-label">Album</InputLabel>
            <Select
              labelId="photo-album-select-label"
              value={albumId}
              label="Album"
              onChange={(event) => setAlbumId(event.target.value)}
            >
              <MenuItem value="">
                <em>Account Album (default)</em>
              </MenuItem>
              <PhotoGalleryAlbumSections
                accountId={accountId}
                albums={albums}
                renderSectionHeader={(section) => (
                  <ListSubheader
                    component="div"
                    disableSticky
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'text.secondary',
                    }}
                  >
                    {section.title}
                  </ListSubheader>
                )}
                renderAlbum={(albumEntry) => (
                  <MenuItem value={albumEntry.id}>{albumEntry.title}</MenuItem>
                )}
              />
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
