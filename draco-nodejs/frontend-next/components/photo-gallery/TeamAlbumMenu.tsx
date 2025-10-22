import React from 'react';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import type { TeamAlbumHierarchyGroup, TeamAlbumHierarchyTeam } from './types';

export interface TeamAlbumMenuOption {
  label: string;
  albumId: string;
  photoCount?: number;
}

export interface TeamAlbumMenuProps {
  teamAlbumHierarchy: TeamAlbumHierarchyGroup[];
  selectedAlbumKey: string;
  onSelect: (albumId: string) => void;
  selectedTeam?: TeamAlbumHierarchyTeam | null;
  disabled?: boolean;
  buttonLabel?: string;
  size?: 'small' | 'medium';
  additionalOptions?: TeamAlbumMenuOption[];
}

const TeamAlbumMenu: React.FC<TeamAlbumMenuProps> = ({
  teamAlbumHierarchy,
  selectedAlbumKey,
  onSelect,
  selectedTeam,
  disabled = false,
  buttonLabel = 'Team Albums',
  size = 'small',
  additionalOptions = [],
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleOpen = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = React.useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSelect = React.useCallback(
    (albumId: string) => {
      onSelect(albumId);
      handleClose();
    },
    [handleClose, onSelect],
  );

  const buttonText = selectedTeam
    ? `${selectedTeam.teamName} (${selectedTeam.photoCount})`
    : buttonLabel;
  const hasSelection = Boolean(selectedTeam);

  const leaguesWithTeams = React.useMemo(
    () =>
      teamAlbumHierarchy
        .map((league) => ({
          ...league,
          divisions: league.divisions
            .map((division) => ({
              ...division,
              teams: division.teams.filter((team) => team.albumId !== ''),
            }))
            .filter((division) => division.teams.length > 0),
        }))
        .filter((league) => league.divisions.length > 0),
    [teamAlbumHierarchy],
  );

  if (leaguesWithTeams.length === 0 && additionalOptions.length === 0) {
    return null;
  }

  const menuItems: React.ReactNode[] = [];

  additionalOptions.forEach((option) => {
    menuItems.push(
      <MenuItem
        key={`option-${option.albumId || 'all'}`}
        onClick={() => handleSelect(option.albumId)}
        selected={selectedAlbumKey === option.albumId}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {option.label}
        </Typography>
        {option.photoCount !== undefined ? (
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {option.photoCount}
          </Typography>
        ) : null}
      </MenuItem>,
    );
  });

  leaguesWithTeams.forEach((league) => {
    menuItems.push(
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
    );

    league.divisions.forEach((division) => {
      menuItems.push(
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
      );

      division.teams.forEach((team) => {
        menuItems.push(
          <MenuItem
            key={`${team.teamId}-${team.albumId}`}
            onClick={() => handleSelect(team.albumId)}
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
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {team.photoCount}
            </Typography>
          </MenuItem>,
        );
      });
    });
  });

  return (
    <>
      <Button
        variant={hasSelection ? 'contained' : 'outlined'}
        color="primary"
        size={size}
        startIcon={<MenuIcon fontSize="small" />}
        onClick={handleOpen}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
        aria-controls={Boolean(anchorEl) ? 'team-album-menu' : undefined}
        sx={{
          fontWeight: 600,
          textTransform: 'none',
          whiteSpace: 'nowrap',
        }}
        disabled={disabled}
      >
        {buttonText}
      </Button>
      <Menu
        id="team-album-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
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
        {menuItems}
      </Menu>
    </>
  );
};

export default TeamAlbumMenu;
