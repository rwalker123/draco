import React, { useState, useEffect, useRef } from 'react';
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
  Forum as SocialIcon,
  SportsBaseball as FieldIcon,
  Schedule as ScheduleIcon,
  TrendingUp as StatsIcon,
  EmojiEvents as StandingsIcon,
  Group as TeamsIcon,
  Menu as HamburgerIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { getCurrentSeason } from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';
import { useApiClient } from '../hooks/useApiClient';

export interface BaseballOverflowItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
}

interface BaseballMenuProps {
  accountId: string;
  useUnifiedMenu?: boolean;
  onOverflowItemsChange?: (items: BaseballOverflowItem[]) => void;
}

const BaseballMenu: React.FC<BaseballMenuProps> = ({
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
    const controller = new AbortController();
    const fetchCurrentSeason = async () => {
      setLoadingSeason(true);
      try {
        const result = await getCurrentSeason({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;
        const season = unwrapApiResult(result, 'Failed to load current season');
        setCurrentSeasonId(season.id);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn('Failed to load current season', error);
        setCurrentSeasonId(null);
      } finally {
        if (!controller.signal.aborted) setLoadingSeason(false);
      }
    };
    fetchCurrentSeason();
    return () => {
      controller.abort();
    };
  }, [accountId, apiClient]);

  const menuItems = [
    {
      label: 'Socials',
      icon: <SocialIcon />,
      path: `/account/${accountId}/social-hub`,
    },
    {
      label: 'Fields',
      icon: <FieldIcon />,
      path: `/account/${accountId}/fields`,
    },
    {
      label: 'Schedule',
      icon: <ScheduleIcon />,
      onClick: () => {
        if (loadingSeason) return;
        if (currentSeasonId) {
          router.push(`/account/${accountId}/schedule`);
        } else {
          router.push(`/account/${accountId}/no-current-seasons`);
        }
      },
      needsSeason: true,
    },
    {
      label: 'Stats',
      icon: <StatsIcon />,
      path: `/account/${accountId}/statistics`,
    },
    {
      label: 'Standings',
      icon: <StandingsIcon />,
      onClick: () => {
        if (loadingSeason) return;
        if (currentSeasonId) {
          router.push(`/account/${accountId}/seasons/${currentSeasonId}/standings`);
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
          router.push(`/account/${accountId}/seasons/${currentSeasonId}/teams`);
        } else {
          router.push(`/account/${accountId}/no-current-seasons`);
        }
      },
      needsSeason: true,
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const menuItemsWithState = menuItems.map((item) => ({
    ...item,
    isBusy: Boolean(item.needsSeason && loadingSeason),
    action: item.onClick || (() => handleNavigation(item.path)),
  }));

  const menuItemsWithStateRef = useRef(menuItemsWithState);
  menuItemsWithStateRef.current = menuItemsWithState;

  const latestOverflowChangeRef = useRef<BaseballMenuProps['onOverflowItemsChange']>(null);
  useEffect(() => {
    latestOverflowChangeRef.current = onOverflowItemsChange;
  }, [onOverflowItemsChange]);

  useEffect(() => {
    const callback = latestOverflowChangeRef.current;
    if (!useUnifiedMenu || !callback) {
      return;
    }

    if (isLargeScreen) {
      callback([]);
      return;
    }

    const items = menuItemsWithStateRef.current;
    const overflowItems = isMediumScreen ? items.slice(3) : items;

    callback(
      overflowItems.map((item) => ({
        label: item.label,
        icon: item.icon,
        onClick: item.action,
        busy: item.isBusy,
      })),
    );
  }, [isLargeScreen, isMediumScreen, useUnifiedMenu, loadingSeason, currentSeasonId, accountId]);

  useEffect(() => {
    return () => {
      latestOverflowChangeRef.current?.([]);
    };
  }, []);

  if (useUnifiedMenu) {
    if (isLargeScreen) {
      return (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          {menuItemsWithState.map((item, index) => (
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
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                )}
              </Button>
              {index < menuItemsWithState.length - 1 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    height: 20,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Box>
      );
    }

    if (isMediumScreen) {
      const visibleItems = menuItemsWithState.slice(0, 3);
      return (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          {visibleItems.map((item, index) => (
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
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                )}
              </Button>
              {index < visibleItems.length - 1 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    height: 20,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Box>
      );
    }

    return null;
  }

  // Show full menu on large screens, hamburger on smaller screens
  if (isLargeScreen) {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {menuItems.map((item, index) => {
          const isBusy = Boolean(item.needsSeason && loadingSeason);
          return (
            <React.Fragment key={item.label}>
              <Button
                variant="text"
                startIcon={item.icon}
                onClick={item.onClick || (() => handleNavigation(item.path))}
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
                disabled={isBusy}
              >
                {isBusy ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                )}
              </Button>
              {index < menuItems.length - 1 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    height: 20,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Box>
    );
  }

  // Show partial menu on medium screens, hamburger on small screens
  if (isMediumScreen) {
    const visibleItems = menuItems.slice(0, 3); // Show first 3 items
    const hiddenItems = menuItems.slice(3); // Hide last 3 items

    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {visibleItems.map((item, index) => {
          const isBusy = Boolean(item.needsSeason && loadingSeason);
          return (
            <React.Fragment key={item.label}>
              <Button
                variant="text"
                startIcon={item.icon}
                onClick={item.onClick || (() => handleNavigation(item.path))}
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
                disabled={isBusy}
              >
                {isBusy ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                )}
              </Button>
              {index < visibleItems.length - 1 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    height: 20,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Hamburger menu for remaining items */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            height: 20,
          }}
        />
        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          <HamburgerIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          {hiddenItems.map((item) => {
            const isBusy = Boolean(item.needsSeason && loadingSeason);
            return (
              <MenuItem
                key={item.label}
                onClick={item.onClick || (() => handleNavigation(item.path))}
                disabled={isBusy}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText>
                  {isBusy ? <CircularProgress size={16} color="inherit" /> : item.label}
                </ListItemText>
              </MenuItem>
            );
          })}
        </Menu>
      </Box>
    );
  }

  // Show only hamburger menu on small screens
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <IconButton
        color="inherit"
        onClick={handleMenuOpen}
        sx={{
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        <HamburgerIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {menuItems.map((item) => {
          const isBusy = Boolean(item.needsSeason && loadingSeason);
          return (
            <MenuItem
              key={item.label}
              onClick={item.onClick || (() => handleNavigation(item.path))}
              disabled={isBusy}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText>
                {isBusy ? <CircularProgress size={16} color="inherit" /> : item.label}
              </ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default BaseballMenu;
