import React from 'react';
import {
  Alert,
  Box,
  Button,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Tab,
  Tabs,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import type { PhotoGalleryAlbumType, PhotoGalleryPhotoType } from '@draco/shared-schemas';
import PhotoGalleryGrid from './PhotoGalleryGrid';
import PhotoGalleryHero from './PhotoGalleryHero';
import PhotoGalleryLightbox from './PhotoGalleryLightbox';
import MenuIcon from '@mui/icons-material/Menu';

export interface TeamAlbumHierarchyTeam {
  teamId: string;
  teamSeasonId?: string;
  teamName: string;
  albumId: string;
  photoCount: number;
}

export interface TeamAlbumHierarchyDivision {
  id: string;
  name: string;
  teams: TeamAlbumHierarchyTeam[];
}

export interface TeamAlbumHierarchyGroup {
  leagueId: string;
  leagueName: string;
  divisions: TeamAlbumHierarchyDivision[];
  unassignedTeams: TeamAlbumHierarchyTeam[];
}

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
  const [teamMenuAnchorEl, setTeamMenuAnchorEl] = React.useState<HTMLElement | null>(null);

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
      if (onAlbumChange) {
        onAlbumChange(albumId);
      }
      setTeamMenuAnchorEl(null);
    },
    [onAlbumChange],
  );

  const handleOpenTeamMenu = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    setTeamMenuAnchorEl(event.currentTarget);
  }, []);

  const handleCloseTeamMenu = React.useCallback(() => {
    setTeamMenuAnchorEl(null);
  }, []);

  const heroPhotos = photos.slice(0, Math.min(10, photos.length));
  const gridPhotos = photos.slice(heroPhotos.length);
  const lightboxPhoto = lightboxIndex !== null ? (photos[lightboxIndex] ?? null) : null;

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
      </Box>
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
              <Button
                variant={selectedTeamEntry ? 'contained' : 'outlined'}
                color="primary"
                size="small"
                startIcon={<MenuIcon fontSize="small" />}
                onClick={handleOpenTeamMenu}
                aria-haspopup="menu"
                aria-expanded={Boolean(teamMenuAnchorEl)}
                aria-controls={Boolean(teamMenuAnchorEl) ? 'team-album-menu' : undefined}
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                }}
                disabled={!onAlbumChange}
              >
                {selectedTeamEntry
                  ? `${selectedTeamEntry.team.teamName} (${selectedTeamEntry.team.photoCount})`
                  : 'Team Albums'}
              </Button>
              <Menu
                id="team-album-menu"
                anchorEl={teamMenuAnchorEl}
                open={Boolean(teamMenuAnchorEl)}
                onClose={handleCloseTeamMenu}
                disableAutoFocusItem
                MenuListProps={{
                  dense: true,
                  sx: {
                    width: 300,
                    maxHeight: 420,
                    p: 0,
                  },
                }}
              >
                {teamAlbumHierarchy.flatMap((league) => [
                  <MenuItem
                    key={`league-${league.leagueId}`}
                    disabled
                    component="div"
                    sx={{
                      opacity: 1,
                      fontWeight: 700,
                      color: 'text.primary',
                      cursor: 'default',
                      '&:hover': { bgcolor: 'transparent' },
                    }}
                  >
                    {league.leagueName}
                  </MenuItem>,
                  ...league.divisions.flatMap((division) => [
                    <MenuItem
                      key={`division-${division.id}`}
                      disabled
                      component="div"
                      sx={{
                        opacity: 1,
                        pl: 4,
                        fontWeight: 600,
                        color: 'text.secondary',
                        cursor: 'default',
                        '&:hover': { bgcolor: 'transparent' },
                      }}
                    >
                      {division.name}
                    </MenuItem>,
                    ...division.teams.map((team) => (
                      <MenuItem
                        key={`${team.teamId}-${team.albumId}`}
                        onClick={() => handleAlbumSelection(team.albumId)}
                        selected={selectedAlbumKey === team.albumId}
                        sx={{
                          pl: 6,
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 2,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {team.teamName}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: 'text.secondary' }}
                        >
                          {team.photoCount}
                        </Typography>
                      </MenuItem>
                    )),
                  ]),
                  ...(league.unassignedTeams.length > 0
                    ? [
                        <MenuItem
                          key={`unassigned-heading-${league.leagueId}`}
                          disabled
                          component="div"
                          sx={{
                            opacity: 1,
                            pl: 4,
                            fontWeight: 600,
                            color: 'text.secondary',
                            cursor: 'default',
                            '&:hover': { bgcolor: 'transparent' },
                          }}
                        >
                          Unassigned
                        </MenuItem>,
                        ...league.unassignedTeams.map((team) => (
                          <MenuItem
                            key={`unassigned-${team.teamId}-${team.albumId}`}
                            onClick={() => handleAlbumSelection(team.albumId)}
                            selected={selectedAlbumKey === team.albumId}
                            sx={{
                              pl: 6,
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 2,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {team.teamName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600, color: 'text.secondary' }}
                            >
                              {team.photoCount}
                            </Typography>
                          </MenuItem>
                        )),
                      ]
                    : []),
                ])}
              </Menu>
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
          sx={{ borderRadius: 4, mb: 4, bgcolor: 'rgba(15,23,42,0.08)' }}
        />
      ) : null}
      <PhotoGalleryGrid
        photos={gridPhotos}
        loading={loading}
        emptyMessage={emptyMessage}
        onPhotoClick={handleOpenLightbox}
        photoIndexOffset={heroPhotos.length}
      />
      <PhotoGalleryLightbox
        open={lightboxIndex !== null}
        photo={lightboxPhoto}
        onClose={handleCloseLightbox}
        onNext={handleNextLightbox}
        onPrev={handlePrevLightbox}
      />
    </Paper>
  );
};

export default PhotoGallerySection;
