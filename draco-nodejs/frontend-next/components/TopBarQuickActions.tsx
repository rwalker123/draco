'use client';

import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
import { HandoutType } from '@draco/shared-schemas';
import { getAccountUserTeams } from '@draco/shared-api-client';
import { HandoutService } from '../services/handoutService';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import ThemeSwitcher from './ThemeSwitcher';
import { useThemeContext } from './ThemeClientProvider';

interface TopBarQuickActionsProps {
  accountId?: string | null;
  canViewHandouts?: boolean;
}

interface TeamHandoutSection {
  teamId: string;
  teamSeasonId: string;
  seasonId?: string | null;
  teamName: string;
  handouts: HandoutType[];
}

const menuPaperStyles = {
  sx: {
    minWidth: 260,
    maxWidth: 340,
  },
};

const TopBarQuickActions: React.FC<TopBarQuickActionsProps> = ({
  accountId,
  canViewHandouts = false,
}) => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const showHandouts = Boolean(canViewHandouts && accountId);
  const { user, token } = useAuth();
  const apiClient = useApiClient();
  const service = React.useMemo(() => new HandoutService(token, apiClient), [token, apiClient]);

  const [accountHandouts, setAccountHandouts] = React.useState<HandoutType[]>([]);
  const [accountHandoutsLoading, setAccountHandoutsLoading] = React.useState(false);
  const [accountHandoutsError, setAccountHandoutsError] = React.useState<string | null>(null);

  const [teamHandoutSections, setTeamHandoutSections] = React.useState<TeamHandoutSection[]>([]);
  const [teamHandoutsLoading, setTeamHandoutsLoading] = React.useState(false);
  const [teamHandoutsError, setTeamHandoutsError] = React.useState<string | null>(null);

  const [downloadingHandoutId, setDownloadingHandoutId] = React.useState<string | null>(null);

  const hasLoadedAccountHandoutsRef = React.useRef(false);
  const hasLoadedTeamHandoutsRef = React.useRef(false);

  const [handoutAnchorEl, setHandoutAnchorEl] = React.useState<null | HTMLElement>(null);
  const [compactAnchorEl, setCompactAnchorEl] = React.useState<null | HTMLElement>(null);

  const { currentThemeName, setCurrentThemeName } = useThemeContext();
  const isDarkMode = currentThemeName === 'dark';
  const themeToggleLabel = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';

  const resetHandoutState = React.useCallback(() => {
    hasLoadedAccountHandoutsRef.current = false;
    hasLoadedTeamHandoutsRef.current = false;
    setAccountHandouts([]);
    setAccountHandoutsError(null);
    setTeamHandoutSections([]);
    setTeamHandoutsError(null);
  }, []);

  React.useEffect(() => {
    resetHandoutState();
  }, [accountId, resetHandoutState]);

  React.useEffect(() => {
    resetHandoutState();
  }, [user, token, resetHandoutState]);

  const loadAccountHandouts = React.useCallback(async () => {
    if (!showHandouts || !accountId) {
      return;
    }

    setAccountHandoutsLoading(true);
    setAccountHandoutsError(null);

    try {
      const data = await service.listAccountHandouts(accountId);
      setAccountHandouts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load handouts';
      setAccountHandoutsError(message);
    } finally {
      setAccountHandoutsLoading(false);
      hasLoadedAccountHandoutsRef.current = true;
    }
  }, [accountId, service, showHandouts]);

  const loadTeamHandouts = React.useCallback(async () => {
    if (!showHandouts || !accountId || !user || !token) {
      return;
    }

    setTeamHandoutsLoading(true);
    setTeamHandoutsError(null);

    try {
      const result = await getAccountUserTeams({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const teamsArray = unwrapApiResult(result, 'Failed to load your teams');

      if (!teamsArray || teamsArray.length === 0) {
        setTeamHandoutSections([]);
        return;
      }

      const errors: string[] = [];

      const sections = await Promise.all(
        teamsArray
          .filter((team) => team?.team?.id)
          .map(async (team) => {
            const teamId = team.team.id;
            const teamSeasonId = team.id;
            const seasonIdValue = team.season?.id ?? null;
            const teamName = team.name ?? 'Team';

            try {
              const handouts = await service.listTeamHandouts({
                accountId,
                teamId,
              });
              return {
                teamId,
                teamSeasonId,
                seasonId: seasonIdValue,
                teamName,
                handouts,
              } as TeamHandoutSection;
            } catch (error) {
              console.error(
                `Failed to load handouts for team ${teamName} (${teamId}) in account ${accountId}:`,
                error,
              );
              errors.push(teamName);
              return {
                teamId,
                teamSeasonId,
                seasonId: seasonIdValue,
                teamName,
                handouts: [],
              } as TeamHandoutSection;
            }
          }),
      );

      if (errors.length > 0) {
        setTeamHandoutsError(`Failed to load handouts for ${errors.join(', ')}. Please try again.`);
      }

      setTeamHandoutSections(sections);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load team handouts';
      setTeamHandoutsError(message);
      setTeamHandoutSections([]);
    } finally {
      setTeamHandoutsLoading(false);
      hasLoadedTeamHandoutsRef.current = true;
    }
  }, [accountId, apiClient, service, showHandouts, token, user]);

  const ensureHandoutsLoaded = React.useCallback(() => {
    if (!showHandouts) {
      return;
    }

    if (!hasLoadedAccountHandoutsRef.current && !accountHandoutsLoading) {
      void loadAccountHandouts();
    }

    if (!hasLoadedTeamHandoutsRef.current && !teamHandoutsLoading) {
      void loadTeamHandouts();
    }
  }, [
    showHandouts,
    accountHandoutsLoading,
    teamHandoutsLoading,
    loadAccountHandouts,
    loadTeamHandouts,
  ]);

  React.useEffect(() => {
    if (showHandouts) {
      ensureHandoutsLoaded();
    }
  }, [ensureHandoutsLoaded, showHandouts]);

  const handleHandoutMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setHandoutAnchorEl(event.currentTarget);
    ensureHandoutsLoaded();
  };

  const handleHandoutMenuClose = () => {
    setHandoutAnchorEl(null);
  };

  const handleCompactMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCompactAnchorEl(event.currentTarget);
    ensureHandoutsLoaded();
  };

  const handleCompactMenuClose = () => {
    setCompactAnchorEl(null);
  };

  const handleThemeToggle = () => {
    setCurrentThemeName(isDarkMode ? 'light' : 'dark');
  };

  const normalizeMenuContent = (content: React.ReactNode): React.ReactNode[] => {
    if (Array.isArray(content)) {
      return content;
    }
    if (content === null || content === undefined) {
      return [];
    }
    return [content];
  };

  const buildHandoutMenuSection = (
    items: React.ReactNode[],
    keyPrefix: string,
    title: string,
    href?: string,
  ): React.ReactNode[] | null => {
    if (items.length === 0) {
      return null;
    }

    return [
      href ? (
        <MenuItem
          key={`${keyPrefix}-title-link`}
          dense
          component={NextLink}
          href={href}
          onClick={(event) => {
            event.stopPropagation();
          }}
          sx={{ px: 2, py: 1.25 }}
        >
          <ListItemText
            primary={title}
            primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
          />
        </MenuItem>
      ) : (
        <Typography key={`${keyPrefix}-title`} variant="subtitle2" sx={{ px: 2, pt: 1 }}>
          {title}
        </Typography>
      ),
      <Divider key={`${keyPrefix}-divider`} sx={{ my: 1 }} />,
      ...items,
    ];
  };

  const handleHandoutDownload = React.useCallback(
    async (handout: HandoutType) => {
      if (!handout.downloadUrl) {
        return;
      }

      if (!token) {
        window.open(handout.downloadUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      try {
        setDownloadingHandoutId(handout.id);
        setAccountHandoutsError(null);
        setTeamHandoutsError(null);

        const response = await fetch(handout.downloadUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = handout.fileName ?? 'handout';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
      } catch {
        const message = 'Unable to download handout. Please try again.';
        setAccountHandoutsError(message);
        setTeamHandoutsError((prev) => prev ?? message);
      } finally {
        setDownloadingHandoutId(null);
      }
    },
    [token],
  );

  const renderAccountHandoutItems = (onClose: () => void): React.ReactNode[] => {
    if (!showHandouts) {
      return [];
    }

    if (accountHandoutsLoading && accountHandouts.length === 0 && !accountHandoutsError) {
      return [
        <MenuItem key="account-handouts-loading" disabled dense sx={{ gap: 1, opacity: 1 }}>
          <CircularProgress size={18} />
          <ListItemText
            primary="Loading account handouts…"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>,
      ];
    }

    if (accountHandoutsError) {
      return [
        <MenuItem key="account-handouts-error" disabled dense sx={{ opacity: 1 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <ErrorOutlineIcon color="error" fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={accountHandoutsError}
            primaryTypographyProps={{ variant: 'body2', color: 'error.main' }}
          />
        </MenuItem>,
        <MenuItem
          key="account-handouts-retry"
          dense
          onClick={() => {
            onClose();
            hasLoadedAccountHandoutsRef.current = false;
            void loadAccountHandouts();
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Retry loading account handouts" />
        </MenuItem>,
      ];
    }

    if (accountHandouts.length === 0) {
      return [];
    }

    return [
      ...accountHandouts.map((handout) => (
        <MenuItem
          key={`account-${handout.id}`}
          dense
          onClick={async () => {
            await handleHandoutDownload(handout);
            onClose();
          }}
          disabled={downloadingHandoutId === handout.id}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {downloadingHandoutId === handout.id ? (
              <CircularProgress size={18} />
            ) : (
              <DescriptionIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={handout.fileName}
            primaryTypographyProps={{
              variant: 'body2',
              sx: { whiteSpace: 'normal' },
            }}
          />
        </MenuItem>
      )),
    ];
  };

  const renderTeamHandoutSections = (onClose: () => void): React.ReactNode[] => {
    if (!showHandouts) {
      return [];
    }

    if (teamHandoutsLoading && teamHandoutSections.length === 0 && !teamHandoutsError) {
      const items = normalizeMenuContent(
        <MenuItem key="team-handouts-loading" disabled dense sx={{ gap: 1, opacity: 1 }}>
          <CircularProgress size={18} />
          <ListItemText
            primary="Loading your team handouts…"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>,
      );

      const section = buildHandoutMenuSection(items, 'team-loading', 'Team Handouts');
      return section ?? [];
    }

    const sections: React.ReactNode[] = [];

    teamHandoutSections.forEach((section) => {
      if (section.handouts.length === 0) {
        return;
      }

      const items = normalizeMenuContent(
        section.handouts.map((handout) => (
          <MenuItem
            key={`team-${section.teamId}-${handout.id}`}
            dense
            onClick={async () => {
              await handleHandoutDownload(handout);
              onClose();
            }}
            disabled={downloadingHandoutId === handout.id}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {downloadingHandoutId === handout.id ? (
                <CircularProgress size={18} />
              ) : (
                <DescriptionIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={handout.fileName}
              primaryTypographyProps={{
                variant: 'body2',
                sx: { whiteSpace: 'normal' },
              }}
            />
          </MenuItem>
        )),
      );

      const sectionNodes = buildHandoutMenuSection(
        items,
        `team-${section.teamId}`,
        `${section.teamName} Handouts`,
        section.seasonId
          ? `/account/${accountId}/seasons/${section.seasonId}/teams/${section.teamSeasonId}/handouts`
          : `/account/${accountId}/teams/${section.teamId}/handouts`,
      );

      if (sectionNodes) {
        sections.push(...sectionNodes);
      }
    });

    if (!teamHandoutsLoading && sections.length === 0 && teamHandoutSections.length > 0) {
      const emptySection = buildHandoutMenuSection(
        normalizeMenuContent(
          <MenuItem key="team-handouts-empty" disabled dense sx={{ opacity: 1 }}>
            <ListItemText
              primary="None of your teams have shared handouts yet."
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </MenuItem>,
        ),
        'team-empty',
        'Team Handouts',
      );

      if (emptySection) {
        sections.push(...emptySection);
      }
    }

    if (teamHandoutsError) {
      const errorSection = buildHandoutMenuSection(
        [
          <MenuItem key="team-handouts-error" disabled dense sx={{ opacity: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <ErrorOutlineIcon color="error" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={teamHandoutsError}
              primaryTypographyProps={{ variant: 'body2', color: 'error.main' }}
            />
          </MenuItem>,
          <MenuItem
            key="team-handouts-retry"
            dense
            onClick={() => {
              onClose();
              hasLoadedTeamHandoutsRef.current = false;
              void loadTeamHandouts();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Retry loading team handouts" />
          </MenuItem>,
        ],
        'team-error',
        'Team Handouts',
      );

      if (errorSection) {
        sections.push(...errorSection);
      }
    }

    return sections;
  };

  const hasAccountHandoutItems = accountHandouts.length > 0;
  const hasTeamHandoutItems = teamHandoutSections.some((section) => section.handouts.length > 0);

  const shouldShowHandoutAction =
    showHandouts &&
    (!hasLoadedAccountHandoutsRef.current ||
      !hasLoadedTeamHandoutsRef.current ||
      hasAccountHandoutItems ||
      hasTeamHandoutItems ||
      accountHandoutsLoading ||
      teamHandoutsLoading ||
      Boolean(accountHandoutsError) ||
      Boolean(teamHandoutsError));

  if (!isCompact || !showHandouts) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {shouldShowHandoutAction ? (
          <>
            <Tooltip title="Handouts">
              <IconButton
                color="inherit"
                size="small"
                onClick={handleHandoutMenuOpen}
                aria-haspopup="true"
                aria-controls={handoutAnchorEl ? 'handout-menu' : undefined}
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              id="handout-menu"
              anchorEl={handoutAnchorEl}
              open={Boolean(handoutAnchorEl)}
              onClose={handleHandoutMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={menuPaperStyles}
            >
              {(() => {
                const nodes: React.ReactNode[] = [];

                const accountNodes = buildHandoutMenuSection(
                  normalizeMenuContent(renderAccountHandoutItems(handleHandoutMenuClose)),
                  'desktop-account',
                  'Account Handouts',
                  `/account/${accountId}/handouts`,
                );
                if (accountNodes) {
                  nodes.push(...accountNodes);
                }

                const teamNodes = renderTeamHandoutSections(handleHandoutMenuClose);
                if (teamNodes.length > 0) {
                  nodes.push(...teamNodes);
                }

                return nodes.length > 0 ? nodes : null;
              })()}
            </Menu>
          </>
        ) : null}
        <ThemeSwitcher />
      </Box>
    );
  }

  return (
    <>
      {shouldShowHandoutAction ? (
        <Tooltip title="Quick actions">
          <IconButton
            color="inherit"
            size="small"
            onClick={handleCompactMenuOpen}
            aria-haspopup="true"
            aria-controls={compactAnchorEl ? 'quick-actions-menu' : undefined}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      <Menu
        id="quick-actions-menu"
        anchorEl={compactAnchorEl}
        open={Boolean(compactAnchorEl)}
        onClose={handleCompactMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={menuPaperStyles}
      >
        <MenuItem
          dense
          onClick={() => {
            handleThemeToggle();
            handleCompactMenuClose();
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText primary={themeToggleLabel} />
        </MenuItem>
        {shouldShowHandoutAction
          ? (() => {
              const nodes: React.ReactNode[] = [];

              const accountNodes = buildHandoutMenuSection(
                normalizeMenuContent(renderAccountHandoutItems(handleCompactMenuClose)),
                'compact-account',
                'Account Handouts',
                `/account/${accountId}/handouts`,
              );
              if (accountNodes) {
                nodes.push(...accountNodes);
              }

              const teamNodes = renderTeamHandoutSections(handleCompactMenuClose);
              if (teamNodes.length > 0) {
                nodes.push(...teamNodes);
              }

              return nodes.length > 0 ? nodes : null;
            })()
          : null}
      </Menu>
    </>
  );
};

export default TopBarQuickActions;
