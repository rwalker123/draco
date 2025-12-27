'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  GolfCourse as CourseIcon,
  ViewList as FlightsIcon,
  Schedule as ScheduleIcon,
  Leaderboard as StandingsIcon,
  Group as TeamsIcon,
  ScoreboardOutlined as ScoresIcon,
  Menu as HamburgerIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { getCurrentSeason } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../utils/apiResult';
import { useApiClient } from '../../hooks/useApiClient';

export interface GolfOverflowItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
}

interface GolfMenuProps {
  accountId: string;
  useUnifiedMenu?: boolean;
  onOverflowItemsChange?: (items: GolfOverflowItem[]) => void;
}

const GolfMenu: React.FC<GolfMenuProps> = ({
  accountId,
  useUnifiedMenu = false,
  onOverflowItemsChange,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(true);
  const apiClient = useApiClient();

  useEffect(() => {
    let isMounted = true;
    const fetchCurrentSeason = async () => {
      setLoadingSeason(true);
      try {
        const result = await getCurrentSeason({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        const season = unwrapApiResult(result, 'Failed to load current season');
        if (isMounted) setCurrentSeasonId(season.id);
      } catch (error) {
        console.warn('Failed to load current season', error);
        if (isMounted) setCurrentSeasonId(null);
      } finally {
        if (isMounted) setLoadingSeason(false);
      }
    };
    fetchCurrentSeason();
    return () => {
      isMounted = false;
    };
  }, [accountId, apiClient]);

  const menuItems = React.useMemo(
    () => [
      {
        label: 'Courses',
        icon: <CourseIcon />,
        path: `/account/${accountId}/golf/courses`,
      },
      {
        label: 'Flights',
        icon: <FlightsIcon />,
        onClick: () => {
          if (loadingSeason) return;
          if (currentSeasonId) {
            router.push(`/account/${accountId}/golf/seasons/${currentSeasonId}/flights`);
          } else {
            router.push(`/account/${accountId}/no-current-seasons`);
          }
        },
        needsSeason: true,
      },
      {
        label: 'Teams',
        icon: <TeamsIcon />,
        onClick: () => {
          if (loadingSeason) return;
          if (currentSeasonId) {
            router.push(`/account/${accountId}/golf/seasons/${currentSeasonId}/teams`);
          } else {
            router.push(`/account/${accountId}/no-current-seasons`);
          }
        },
        needsSeason: true,
      },
      {
        label: 'Schedule',
        icon: <ScheduleIcon />,
        onClick: () => {
          if (loadingSeason) return;
          if (currentSeasonId) {
            router.push(`/account/${accountId}/golf/seasons/${currentSeasonId}/schedule`);
          } else {
            router.push(`/account/${accountId}/no-current-seasons`);
          }
        },
        needsSeason: true,
      },
      {
        label: 'Scores',
        icon: <ScoresIcon />,
        onClick: () => {
          if (loadingSeason) return;
          if (currentSeasonId) {
            router.push(`/account/${accountId}/golf/seasons/${currentSeasonId}/scores`);
          } else {
            router.push(`/account/${accountId}/no-current-seasons`);
          }
        },
        needsSeason: true,
      },
      {
        label: 'Standings',
        icon: <StandingsIcon />,
        onClick: () => {
          if (loadingSeason) return;
          if (currentSeasonId) {
            router.push(`/account/${accountId}/golf/seasons/${currentSeasonId}/standings`);
          } else {
            router.push(`/account/${accountId}/no-current-seasons`);
          }
        },
        needsSeason: true,
      },
    ],
    [accountId, currentSeasonId, loadingSeason, router],
  );

  const handleNavigation = React.useCallback(
    (path: string) => {
      router.push(path);
      setAnchorEl(null);
    },
    [router],
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const menuItemsWithState = React.useMemo(
    () =>
      menuItems.map((item) => ({
        ...item,
        isBusy: Boolean(item.needsSeason && loadingSeason),
        action: item.onClick || (() => handleNavigation(item.path!)),
      })),
    [handleNavigation, loadingSeason, menuItems],
  );

  const latestOverflowChangeRef = React.useRef<GolfMenuProps['onOverflowItemsChange']>(null);
  React.useEffect(() => {
    latestOverflowChangeRef.current = onOverflowItemsChange;
  }, [onOverflowItemsChange]);

  React.useEffect(() => {
    if (!useUnifiedMenu || !onOverflowItemsChange) {
      return;
    }

    if (isLargeScreen) {
      onOverflowItemsChange([]);
      return;
    }

    const overflowItems = isMediumScreen ? menuItemsWithState.slice(3) : menuItemsWithState;

    onOverflowItemsChange(
      overflowItems.map((item) => ({
        label: item.label,
        icon: item.icon,
        onClick: item.action,
        busy: item.isBusy,
      })),
    );
  }, [isLargeScreen, isMediumScreen, menuItemsWithState, onOverflowItemsChange, useUnifiedMenu]);

  React.useEffect(() => {
    return () => {
      latestOverflowChangeRef.current?.([]);
    };
  }, []);

  const renderButton = (item: (typeof menuItemsWithState)[0], index: number, total: number) => (
    <React.Fragment key={item.label}>
      <Button
        variant="text"
        startIcon={item.icon}
        onClick={item.action}
        sx={{
          color: 'white',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.75rem',
          px: 1,
          py: 0.5,
          minWidth: 'auto',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.1)',
            color: 'white',
          },
          '&:active': {
            bgcolor: 'rgba(255,255,255,0.2)',
          },
        }}
        disabled={item.isBusy}
      >
        {item.isBusy ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {item.label}
          </Typography>
        )}
      </Button>
      {index < total - 1 && (
        <Divider
          orientation="vertical"
          flexItem
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', height: 20 }}
        />
      )}
    </React.Fragment>
  );

  const renderMenuItem = (item: (typeof menuItemsWithState)[0]) => (
    <MenuItem key={item.label} onClick={item.action} disabled={item.isBusy}>
      <ListItemIcon>{item.icon}</ListItemIcon>
      <ListItemText>
        {item.isBusy ? <CircularProgress size={16} color="inherit" /> : item.label}
      </ListItemText>
    </MenuItem>
  );

  if (useUnifiedMenu) {
    if (isLargeScreen) {
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {menuItemsWithState.map((item, index) =>
            renderButton(item, index, menuItemsWithState.length),
          )}
        </Box>
      );
    }

    if (isMediumScreen) {
      const visibleItems = menuItemsWithState.slice(0, 3);
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {visibleItems.map((item, index) => renderButton(item, index, visibleItems.length))}
        </Box>
      );
    }

    return null;
  }

  if (isLargeScreen) {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {menuItemsWithState.map((item, index) =>
          renderButton(item, index, menuItemsWithState.length),
        )}
      </Box>
    );
  }

  if (isMediumScreen) {
    const visibleItems = menuItemsWithState.slice(0, 3);
    const hiddenItems = menuItemsWithState.slice(3);

    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {visibleItems.map((item, index) => renderButton(item, index, visibleItems.length))}
        <Divider
          orientation="vertical"
          flexItem
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', height: 20 }}
        />
        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <HamburgerIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          {hiddenItems.map(renderMenuItem)}
        </Menu>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton
        color="inherit"
        onClick={handleMenuOpen}
        sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
      >
        <HamburgerIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {menuItemsWithState.map(renderMenuItem)}
      </Menu>
    </Box>
  );
};

export default GolfMenu;
