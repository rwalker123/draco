import React from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Tab,
  Tabs,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { PhotoGalleryAlbumType, PhotoGalleryPhotoType } from '@draco/shared-schemas';
import PhotoGalleryGrid from './PhotoGalleryGrid';

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
  sx?: SxProps<Theme>;
}

const gradientStyles: Record<'account' | 'team', (theme: Theme) => string> = {
  account: (theme) =>
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(16,24,63,0.9) 0%, rgba(17,24,39,0.85) 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
  team: (theme) =>
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(16,24,63,0.92) 0%, rgba(17,24,39,0.88) 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
};

const defaultEmptyMessage = 'No photos have been published yet.';

const renderAlbumTabs = (
  albums: PhotoGalleryAlbumType[],
  selectedKey: string,
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
      mb: 3,
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
              bgcolor: 'rgba(99,102,241,0.15)',
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
    {albums.map((album) => {
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
                  bgcolor: 'rgba(79,70,229,0.18)',
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
  onRefresh,
  emptyMessage = defaultEmptyMessage,
  enableAlbumTabs = false,
  selectedAlbumKey = 'all',
  onAlbumChange,
  accent = 'account',
  totalCountOverride,
  sx,
}) => {
  const totalCount = totalCountOverride ?? photos.length;

  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 3,
        mb: 2,
        background: (theme) => gradientStyles[accent](theme),
        color: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.92)' : theme.palette.text.primary,
        overflow: 'hidden',
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: enableAlbumTabs || description ? 3 : 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="body2"
              sx={{
                color: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.72)'
                    : theme.palette.text.secondary,
              }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.75)'
                  : theme.palette.text.secondary,
            }}
          >
            {totalCount} {totalCount === 1 ? 'photo' : 'photos'}
          </Typography>
          {onRefresh ? (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => {
                void onRefresh();
              }}
            >
              Refresh
            </Button>
          ) : null}
        </Box>
      </Box>
      {enableAlbumTabs && albums.length > 0 && onAlbumChange
        ? renderAlbumTabs(albums, selectedAlbumKey, onAlbumChange, totalCount)
        : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <PhotoGalleryGrid photos={photos} loading={loading} emptyMessage={emptyMessage} />
    </Paper>
  );
};

export default PhotoGallerySection;
