import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Fab,
  Snackbar,
  Stack,
  Typography,
  Button,
  ButtonBase,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import type { PhotoGalleryAdminAlbumType, PhotoGalleryPhotoType } from '@draco/shared-schemas';
import AccountPageHeader from '../../AccountPageHeader';
import { AdminBreadcrumbs } from '../../admin';
import ConfirmationDialog from '../../common/ConfirmationDialog';
import {
  deleteGalleryPhotoAdmin,
  listGalleryAlbumsAdmin,
  listGalleryPhotosAdmin,
} from '../../../services/photoGalleryAdminService';
import { ApiClientError } from '../../../utils/apiResult';
import { PhotoGalleryAdminPhotoDialog } from './PhotoGalleryAdminPhotoDialog';
import { PhotoGalleryAlbumManagerDialog } from './PhotoGalleryAlbumManagerDialog';
import {
  formatDisplayDate,
  getPhotoThumbnailSrc,
  normalizeEntityId,
  PHOTO_GALLERY_THUMBNAIL_DIMENSIONS,
} from '../utils';
import TeamAlbumMenu from '../TeamAlbumMenu';
import type { TeamAlbumHierarchyGroup } from '../types';
import { EditIconButton, DeleteIconButton } from '../../common/ActionIconButtons';

interface PhotoGalleryAdminManagementProps {
  accountId: string;
}

type SnackbarState = {
  message: string;
  severity: 'success' | 'error';
} | null;

const encodeAlbumId = (value: string | null | undefined): string =>
  value === null || value === undefined ? '__null__' : value;

const decodeAlbumId = (value: string): string | null => (value === '__null__' ? null : value);

const AlbumPillButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  columnGap: theme.spacing(1),
  padding: theme.spacing(0.75, 1.5),
  borderRadius: 9999,
  transition: theme.transitions.create(['background-color', 'color'], {
    duration: theme.transitions.duration.shorter,
  }),
  color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
  fontWeight: selected ? 700 : 500,
  position: 'relative',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -4,
    height: 2,
    borderRadius: 9999,
    backgroundColor: selected ? theme.palette.primary.main : 'transparent',
    transition: theme.transitions.create('background-color', {
      duration: theme.transitions.duration.shorter,
    }),
  },
}));

const AlbumCountChip = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 28,
  padding: theme.spacing(0.35, 1.25),
  borderRadius: 9999,
  background: alpha(theme.palette.primary.main, 0.14),
  color: theme.palette.primary.main,
  fontWeight: 700,
  fontSize: '0.75rem',
}));

export const PhotoGalleryAdminManagement: React.FC<PhotoGalleryAdminManagementProps> = ({
  accountId,
}) => {
  const { token } = useAuth();
  const [photos, setPhotos] = useState<PhotoGalleryPhotoType[]>([]);
  const [albums, setAlbums] = useState<PhotoGalleryAdminAlbumType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [photoDialogState, setPhotoDialogState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    photo: PhotoGalleryPhotoType | null;
  }>({ open: false, mode: 'create', photo: null });

  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<SnackbarState>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<PhotoGalleryPhotoType | null>(null);
  const [selectedAccountAlbumId, setSelectedAccountAlbumId] = useState<string>('all-account');
  const [selectedTeamAlbumId, setSelectedTeamAlbumId] = useState<string>('');

  const adjustAlbumPhotoCounts = (updates: Array<{ albumId: string | null; delta: number }>) => {
    if (updates.length === 0) {
      return;
    }

    const deltaMap = new Map<string, number>();
    updates.forEach(({ albumId, delta }) => {
      const key = albumId ?? '__null__';
      deltaMap.set(key, (deltaMap.get(key) ?? 0) + delta);
    });

    setAlbums((previous) => {
      if (previous.length === 0) {
        return previous;
      }

      let changed = false;
      const nextAlbums = previous.map((album) => {
        const key = album.id ?? null;
        const mapKey = key ?? '__null__';
        const delta = deltaMap.get(mapKey);

        if (!delta) {
          return album;
        }

        changed = true;
        const currentCount = album.photoCount ?? 0;
        return {
          ...album,
          photoCount: Math.max(0, currentCount + delta),
        };
      });

      return changed ? nextAlbums : previous;
    });
  };

  const albumPhotoCounts = ((): Map<string, number> => {
    const counts = new Map<string, number>();
    photos.forEach((photo) => {
      const key = encodeAlbumId(photo.albumId ?? null);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  })();

  const defaultAlbumPhotoCount = photos.filter((photo) => {
    const normalizedTeamId = normalizeEntityId(photo.teamId ?? null);
    return !photo.albumId && normalizedTeamId === null;
  }).length;

  const accountAlbumOptions = albums
    .filter((album) => {
      const albumTeamId = normalizeEntityId(album.teamId ?? null);
      const albumAccountId = album.accountId ?? null;
      return albumTeamId === null && (albumAccountId === accountId || albumAccountId === '0');
    })
    .map((album) => {
      const albumAccountId = album.accountId ?? '';
      const isDefault = albumAccountId === '0';
      const albumKey = isDefault ? '__null__' : encodeAlbumId(album.id ?? null);
      const computedCount = isDefault
        ? defaultAlbumPhotoCount
        : (album.photoCount ?? albumPhotoCounts.get(albumKey) ?? 0);
      return {
        id: albumKey,
        title: isDefault ? 'Default Album' : album.title?.trim() || 'Account Album',
        photoCount: computedCount,
        accountId: albumAccountId,
        isDefault,
      };
    })
    .sort((a, b) => {
      if (a.isDefault && !b.isDefault) {
        return -1;
      }
      if (!a.isDefault && b.isDefault) {
        return 1;
      }
      return a.title.localeCompare(b.title);
    });

  const teamAlbumOptions = albums
    .filter((album) => {
      const normalizedTeamId = normalizeEntityId(album.teamId ?? null);
      const albumAccountId = album.accountId ?? null;
      return normalizedTeamId !== null && albumAccountId === accountId;
    })
    .map((album) => {
      const albumKey = encodeAlbumId(album.id ?? null);
      return {
        id: album.id ?? '',
        title: album.title?.trim() || 'Team Album',
        teamId: album.teamId ?? '',
        photoCount: album.photoCount ?? albumPhotoCounts.get(albumKey) ?? 0,
      };
    })
    .filter((album) => album.id !== '')
    .sort((a, b) => a.title.localeCompare(b.title));

  const { teamAlbumMenuHierarchy, teamAlbumMenuOptions } = ((): {
    teamAlbumMenuHierarchy: TeamAlbumHierarchyGroup[];
    teamAlbumMenuOptions: Array<{ label: string; albumId: string; photoCount: number }>;
  } => {
    if (teamAlbumOptions.length === 0) {
      return { teamAlbumMenuHierarchy: [] as TeamAlbumHierarchyGroup[], teamAlbumMenuOptions: [] };
    }

    const totalTeamPhotos = teamAlbumOptions.reduce((sum, album) => sum + album.photoCount, 0);

    const hierarchy: TeamAlbumHierarchyGroup[] = [
      {
        leagueId: 'team-albums',
        leagueName: 'Team Albums',
        divisions: [
          {
            id: 'team-albums-division',
            name: 'Team Albums',
            teams: teamAlbumOptions.map((album) => ({
              teamId: album.teamId || album.id,
              teamName: album.title,
              albumId: album.id,
              photoCount: album.photoCount,
            })),
          },
        ],
        unassignedTeams: [],
      },
    ];

    const options = [
      {
        label: 'All Team Albums',
        albumId: '',
        photoCount: totalTeamPhotos,
      },
    ];

    return { teamAlbumMenuHierarchy: hierarchy, teamAlbumMenuOptions: options };
  })();

  const selectedTeamMenuEntry = ((): {
    teamId: string;
    teamName: string;
    albumId: string;
    photoCount: number;
  } | null => {
    if (selectedTeamAlbumId === '') {
      return null;
    }

    for (const league of teamAlbumMenuHierarchy) {
      for (const division of league.divisions) {
        const match = division.teams.find((team) => team.albumId === selectedTeamAlbumId);
        if (match) {
          return match;
        }
      }
      const unassignedMatch = league.unassignedTeams.find(
        (team) => team.albumId === selectedTeamAlbumId,
      );
      if (unassignedMatch) {
        return unassignedMatch;
      }
    }

    return null;
  })();

  useEffect(() => {
    if (selectedAccountAlbumId !== 'all-account') {
      const exists = accountAlbumOptions.some((album) => album.id === selectedAccountAlbumId);
      if (!exists) {
        setSelectedAccountAlbumId('all-account');
      }
    }

    if (selectedTeamAlbumId) {
      const exists = teamAlbumOptions.some((album) => album.id === selectedTeamAlbumId);
      if (!exists) {
        setSelectedTeamAlbumId('');
      }
    }
  }, [accountAlbumOptions, teamAlbumOptions, selectedAccountAlbumId, selectedTeamAlbumId]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [galleryData, albumData] = await Promise.all([
          listGalleryPhotosAdmin(accountId, token, controller.signal),
          listGalleryAlbumsAdmin(accountId, token, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        setPhotos(Array.isArray(galleryData.photos) ? galleryData.photos : []);
        setAlbums(Array.isArray(albumData.albums) ? albumData.albums : []);
      } catch (err) {
        if (controller.signal.aborted) return;

        const message =
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load gallery management data';
        setError(message);
        setPhotos([]);
        setAlbums([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [accountId, token, refreshKey]);

  const handleOpenCreateDialog = () => {
    setPhotoDialogState({ open: true, mode: 'create', photo: null });
  };

  const handleOpenEditDialog = (photo: PhotoGalleryPhotoType) => {
    setPhotoDialogState({ open: true, mode: 'edit', photo });
  };

  const handleClosePhotoDialog = () => {
    setPhotoDialogState({ open: false, mode: 'create', photo: null });
  };

  const handlePhotoDialogSuccess = ({
    message,
    photo: updatedPhoto,
  }: {
    message: string;
    photo: PhotoGalleryPhotoType;
  }) => {
    const previousPhoto = photoDialogState.photo;

    setPhotos((previousPhotos) => {
      const existingIndex = previousPhotos.findIndex((photo) => photo.id === updatedPhoto.id);

      if (existingIndex === -1) {
        return [updatedPhoto, ...previousPhotos];
      }

      const nextPhotos = [...previousPhotos];
      nextPhotos[existingIndex] = updatedPhoto;
      return nextPhotos;
    });

    const previousAlbumId = previousPhoto?.albumId ?? null;
    const nextAlbumId = updatedPhoto.albumId ?? null;
    const adjustments: Array<{ albumId: string | null; delta: number }> = [];

    if (!previousPhoto) {
      adjustments.push({ albumId: nextAlbumId, delta: 1 });
    } else if (previousAlbumId !== nextAlbumId) {
      adjustments.push({ albumId: previousAlbumId, delta: -1 });
      adjustments.push({ albumId: nextAlbumId, delta: 1 });
    }

    adjustAlbumPhotoCounts(adjustments);
    setFeedback({ severity: 'success', message });
  };

  const handlePhotoDialogError = (message: string) => {
    setFeedback({ severity: 'error', message });
  };

  const handleOpenAlbumDialog = () => {
    setAlbumDialogOpen(true);
  };

  const handleAlbumDialogClose = () => {
    setAlbumDialogOpen(false);
  };

  const handleAlbumDialogSuccess = (payload: { message: string }) => {
    setFeedback({ severity: 'success', message: payload.message });
    setRefreshKey((k) => k + 1);
  };

  const handleAlbumDialogError = (message: string) => {
    setFeedback({ severity: 'error', message });
  };

  const handleConfirmDelete = (photo: PhotoGalleryPhotoType) => {
    setDeleteConfirmation(photo);
  };

  const handleDeletePhoto = async () => {
    if (!deleteConfirmation) {
      return;
    }

    const photoToDelete = deleteConfirmation;

    try {
      await deleteGalleryPhotoAdmin(accountId, photoToDelete.id, token);
      setPhotos((previous) => previous.filter((photo) => photo.id !== photoToDelete.id));
      adjustAlbumPhotoCounts([{ albumId: photoToDelete.albumId ?? null, delta: -1 }]);
      setFeedback({ severity: 'success', message: 'Photo deleted successfully' });
      setDeleteConfirmation(null);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to delete photo';
      setFeedback({ severity: 'error', message });
    }
  };

  const handleFeedbackClose = () => {
    setFeedback(null);
  };

  const handleSelectAccountAlbum = (albumId: string) => {
    setSelectedAccountAlbumId(albumId);
    setSelectedTeamAlbumId('');
  };

  const handleTeamAlbumChange = (albumId: string) => {
    setSelectedTeamAlbumId(albumId);
    if (!albumId) {
      setSelectedAccountAlbumId('all-account');
    }
  };

  const filteredPhotos = ((): PhotoGalleryPhotoType[] => {
    if (selectedTeamAlbumId) {
      return photos.filter((photo) => photo.albumId === selectedTeamAlbumId);
    }

    if (selectedAccountAlbumId === 'all-account') {
      return photos.filter((photo) => {
        const normalizedTeamId = normalizeEntityId(photo.teamId ?? null);
        const photoAccountId = photo.accountId ?? null;
        return (
          normalizedTeamId === null && (photoAccountId === accountId || photoAccountId === '0')
        );
      });
    }

    const targetAlbumId = decodeAlbumId(selectedAccountAlbumId);
    if (targetAlbumId === null) {
      return photos.filter((photo) => {
        const normalizedTeamId = normalizeEntityId(photo.teamId ?? null);
        return !photo.albumId && normalizedTeamId === null;
      });
    }

    return photos.filter((photo) => photo.albumId === targetAlbumId);
  })();

  const allAccountPhotosCount = photos.filter((photo) => {
    const normalizedTeamId = normalizeEntityId(photo.teamId ?? null);
    const photoAccountId = photo.accountId ?? null;
    return normalizedTeamId === null && (photoAccountId === accountId || photoAccountId === '0');
  }).length;

  const hasAnyPhotos = photos.length > 0;
  const hasSelectionPhotos = filteredPhotos.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Photo Gallery Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Upload photos, organize albums, and curate your gallery for members and visitors.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Community', href: `/account/${accountId}/admin/community` }}
          currentPage="Photo Gallery Management"
        />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={3} flexWrap="wrap" alignItems="center" sx={{ flex: 1 }}>
            <AlbumPillButton
              selected={selectedTeamAlbumId === '' && selectedAccountAlbumId === 'all-account'}
              onClick={() => handleSelectAccountAlbum('all-account')}
            >
              <Typography variant="body1">All Photos</Typography>
              <AlbumCountChip>{allAccountPhotosCount}</AlbumCountChip>
            </AlbumPillButton>

            {accountAlbumOptions.map((album) => {
              const isSelected = selectedTeamAlbumId === '' && selectedAccountAlbumId === album.id;
              return (
                <AlbumPillButton
                  key={album.id}
                  selected={isSelected}
                  onClick={() => handleSelectAccountAlbum(album.id)}
                >
                  <Typography variant="body1">{album.title}</Typography>
                  <AlbumCountChip>{album.photoCount}</AlbumCountChip>
                </AlbumPillButton>
              );
            })}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {teamAlbumMenuHierarchy.length > 0 ? (
              <TeamAlbumMenu
                teamAlbumHierarchy={teamAlbumMenuHierarchy}
                selectedAlbumKey={selectedTeamAlbumId}
                onSelect={handleTeamAlbumChange}
                selectedTeam={selectedTeamMenuEntry}
                buttonLabel="Team Albums"
                additionalOptions={teamAlbumMenuOptions}
              />
            ) : null}
            {teamAlbumOptions.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<CollectionsBookmarkIcon />}
                onClick={handleOpenAlbumDialog}
                sx={{
                  borderRadius: 9999,
                  px: 2,
                  fontWeight: 600,
                }}
              >
                Manage Albums
              </Button>
            )}
          </Stack>
        </Box>

        <Box sx={{ pb: 4 }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !hasAnyPhotos ? (
            <Alert severity="info">
              No photos have been published yet. Use the button below to add your first gallery
              photo.
            </Alert>
          ) : !hasSelectionPhotos ? (
            <Alert severity="info">No photos match the selected album.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 220 }}>Photo</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell align="right" sx={{ width: 160 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPhotos.map((photo) => {
                    const submittedOn = formatDisplayDate(photo.submittedAt);
                    const thumbnailSrc = getPhotoThumbnailSrc(photo);

                    return (
                      <TableRow key={photo.id} hover>
                        <TableCell>
                          <Box
                            component="img"
                            src={thumbnailSrc}
                            alt={photo.title}
                            loading="lazy"
                            sx={{
                              width: PHOTO_GALLERY_THUMBNAIL_DIMENSIONS.width,
                              height: PHOTO_GALLERY_THUMBNAIL_DIMENSIONS.height,
                              borderRadius: 2,
                              objectFit: 'cover',
                              display: 'block',
                              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.18)',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.75}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {photo.title}
                            </Typography>
                            {photo.caption ? (
                              <Typography variant="body2" color="text.secondary">
                                {photo.caption}
                              </Typography>
                            ) : null}
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                              sx={{ color: 'text.secondary', flexWrap: 'wrap' }}
                            >
                              {photo.albumTitle ? (
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  Album: {photo.albumTitle}
                                </Typography>
                              ) : null}
                              {submittedOn ? (
                                <Typography variant="caption">Published {submittedOn}</Typography>
                              ) : null}
                            </Stack>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <EditIconButton
                              tooltipTitle="Edit photo"
                              aria-label="Edit photo"
                              onClick={() => handleOpenEditDialog(photo)}
                            />
                            <DeleteIconButton
                              tooltipTitle="Delete photo"
                              aria-label="Delete photo"
                              onClick={() => handleConfirmDelete(photo)}
                            />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Container>

      <Fab
        color="primary"
        aria-label="Add photo"
        onClick={handleOpenCreateDialog}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: (theme) => theme.zIndex.snackbar + 1,
        }}
      >
        <AddIcon />
      </Fab>

      <PhotoGalleryAdminPhotoDialog
        accountId={accountId}
        open={photoDialogState.open}
        mode={photoDialogState.mode}
        albums={albums}
        photo={photoDialogState.photo ?? undefined}
        token={token}
        onClose={handleClosePhotoDialog}
        onSuccess={handlePhotoDialogSuccess}
        onError={handlePhotoDialogError}
      />

      <PhotoGalleryAlbumManagerDialog
        accountId={accountId}
        open={albumDialogOpen}
        albums={albums}
        albumPhotoCounts={albumPhotoCounts}
        defaultAlbumPhotoCount={defaultAlbumPhotoCount}
        token={token}
        onClose={handleAlbumDialogClose}
        onSuccess={handleAlbumDialogSuccess}
        onError={handleAlbumDialogError}
      />

      <ConfirmationDialog
        open={Boolean(deleteConfirmation)}
        title="Delete Photo"
        message={
          deleteConfirmation
            ? `Are you sure you want to delete “${deleteConfirmation.title}”? This cannot be undone.`
            : ''
        }
        confirmText="Delete Photo"
        confirmButtonColor="error"
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={handleDeletePhoto}
      />

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={6000}
        onClose={handleFeedbackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert
            onClose={handleFeedbackClose}
            severity={feedback.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </main>
  );
};

export default PhotoGalleryAdminManagement;
