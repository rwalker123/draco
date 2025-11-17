import React from 'react';
import {
  Alert,
  Box,
  Skeleton,
  Tab,
  Tabs,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { PhotoGalleryAlbumType, PhotoGalleryPhotoType } from '@draco/shared-schemas';
import PhotoGalleryGrid from './PhotoGalleryGrid';
import PhotoGalleryHero from './PhotoGalleryHero';
import PhotoGalleryLightbox from './PhotoGalleryLightbox';
import type { TeamAlbumHierarchyGroup } from './types';
import TeamAlbumMenu from './TeamAlbumMenu';
import WidgetShell from '../ui/WidgetShell';

export interface PhotoGallerySectionProps {
  title: string;
  description?: string;
  photos: PhotoGalleryPhotoType[];
  albums?: PhotoGalleryAlbumType[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  emptyMessage?: string;
  enableAlbumTabs?: boolean;
  selectedAlbumKey?: string;
  onAlbumChange?: (albumId: string) => void;
  accent?: 'account' | 'team';
  totalCountOverride?: number;
  teamAlbumHierarchy?: TeamAlbumHierarchyGroup[];
  sx?: SxProps<Theme>;
}

const defaultEmptyMessage = 'No photos have been published yet.';

const renderAlbumTabs = (
  albums: PhotoGalleryAlbumType[],
  selectedKey: string | false,
  onChange: (albumId: string) => void,
  totalCount: number,
) => (
  <Tabs
    value={selectedKey}
    onChange={(_event, value) => {
      onChange(typeof value === 'string' ? value : String(value));
    }}
    variant="scrollable"
    scrollButtons="auto"
    sx={{
      '& .MuiTab-root': {
        minHeight: 0,
        textTransform: 'none',
        fontWeight: 600,
      },
    }}
  >
    <Tab
      value="all"
      label={
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">All Photos</Typography>
          <Box
            component="span"
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: '999px',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {totalCount}
          </Box>
        </Box>
      }
    />
    {[...albums]
      .sort((a, b) => {
        const aDefault = a.accountId === '0';
        const bDefault = b.accountId === '0';
        if (aDefault && !bDefault) return -1;
        if (!aDefault && bDefault) return 1;
        return (a.title ?? '').localeCompare(b.title ?? '');
      })
      .map((album) => {
        const key = album.id ?? 'null';
        return (
          <Tab
            key={key}
            value={key}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">{album.title}</Typography>
                <Box
                  component="span"
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: '999px',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
                    color: 'primary.main',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {album.photoCount}
                </Box>
              </Box>
            }
          />
        );
      })}
  </Tabs>
);

const PhotoGallerySection: React.FC<PhotoGallerySectionProps> = ({
  title,
  description,
  photos,
  albums = [],
  loading = false,
  error = null,
  emptyMessage = defaultEmptyMessage,
  enableAlbumTabs = false,
  selectedAlbumKey = 'all',
  onAlbumChange,
  accent = 'account',
  totalCountOverride,
  teamAlbumHierarchy = [],
  sx,
}) => {
  const totalCount = totalCountOverride ?? photos.length;
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const shellSx = React.useMemo(() => {
    const extras = Array.isArray(sx) ? sx : sx ? [sx] : [];
    return [{ mb: 2 }, ...extras] as SxProps<Theme>;
  }, [sx]);

  const accountAlbums = React.useMemo(() => albums.filter((album) => !album.teamId), [albums]);
  const accountAlbumKeys = React.useMemo(() => {
    const keys = new Set<string>();
    accountAlbums.forEach((album) => {
      keys.add(album.id ?? 'null');
    });
    return keys;
  }, [accountAlbums]);
  const accountTabValue =
    accountAlbumKeys.has(selectedAlbumKey) || selectedAlbumKey === 'all' ? selectedAlbumKey : false;
  const hasTeamAlbumHierarchy = teamAlbumHierarchy.length > 0;
  const selectedTeamEntry = React.useMemo(() => {
    if (!selectedAlbumKey || !hasTeamAlbumHierarchy) {
      return null;
    }

    for (const league of teamAlbumHierarchy) {
      for (const division of league.divisions) {
        const found = division.teams.find((team) => team.albumId === selectedAlbumKey);
        if (found) {
          return { leagueName: league.leagueName, divisionName: division.name, team: found };
        }
      }
      const unassigned = league.unassignedTeams.find((team) => team.albumId === selectedAlbumKey);
      if (unassigned) {
        return { leagueName: league.leagueName, divisionName: 'Unassigned', team: unassigned };
      }
    }

    return null;
  }, [hasTeamAlbumHierarchy, selectedAlbumKey, teamAlbumHierarchy]);

  const handleOpenLightbox = React.useCallback(
    (index: number) => {
      if (index >= 0 && index < photos.length) {
        setLightboxIndex(index);
      }
    },
    [photos.length],
  );

  const handleCloseLightbox = React.useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handleNextLightbox = React.useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null || photos.length === 0) {
        return current;
      }
      return (current + 1) % photos.length;
    });
  }, [photos.length]);

  const handlePrevLightbox = React.useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null || photos.length === 0) {
        return current;
      }
      return (current - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const handleAlbumSelection = React.useCallback(
    (albumId: string) => {
      onAlbumChange?.(albumId);
    },
    [onAlbumChange],
  );

  const heroPhotos = photos.slice(0, Math.min(10, photos.length));
  const gridPhotos = photos;
  const lightboxPhoto = lightboxIndex !== null ? (photos[lightboxIndex] ?? null) : null;

  const shouldRender = React.useMemo(() => {
    if (loading) {
      return true;
    }

    if (error) {
      return true;
    }

    return photos.length > 0;
  }, [error, loading, photos.length]);

  if (!shouldRender) {
    return null;
  }

  return (
    <WidgetShell
      title={
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {title}
        </Typography>
      }
      subtitle={
        description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : undefined
      }
      actions={
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {totalCount} {totalCount === 1 ? 'photo' : 'photos'}
        </Typography>
      }
      accent={accent === 'team' ? 'primary' : 'secondary'}
      sx={shellSx}
    >
      {enableAlbumTabs && albums.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {renderAlbumTabs(accountAlbums, accountTabValue, handleAlbumSelection, totalCount)}
          </Box>
          {hasTeamAlbumHierarchy ? (
            <>
              <TeamAlbumMenu
                teamAlbumHierarchy={teamAlbumHierarchy}
                selectedAlbumKey={selectedAlbumKey}
                onSelect={handleAlbumSelection}
                selectedTeam={selectedTeamEntry?.team ?? null}
                disabled={!onAlbumChange}
              />
            </>
          ) : null}
        </Box>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {heroPhotos.length > 0 ? (
        <Box mb={4}>
          <PhotoGalleryHero photos={heroPhotos} onSelect={(index) => handleOpenLightbox(index)} />
        </Box>
      ) : loading ? (
        <Skeleton
          variant="rectangular"
          height={360}
          sx={{ borderRadius: 4, mb: 4, bgcolor: (theme) => theme.palette.action.hover }}
        />
      ) : null}
      <PhotoGalleryGrid
        photos={gridPhotos}
        loading={loading}
        emptyMessage={emptyMessage}
        onPhotoClick={handleOpenLightbox}
      />
      <PhotoGalleryLightbox
        open={lightboxIndex !== null}
        photo={lightboxPhoto}
        onClose={handleCloseLightbox}
        onNext={handleNextLightbox}
        onPrev={handlePrevLightbox}
      />
    </WidgetShell>
  );
};

export default PhotoGallerySection;

export type {
  TeamAlbumHierarchyDivision,
  TeamAlbumHierarchyGroup,
  TeamAlbumHierarchyTeam,
} from './types';
