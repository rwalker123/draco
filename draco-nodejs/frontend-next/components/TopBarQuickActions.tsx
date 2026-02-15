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
import CampaignIcon from '@mui/icons-material/Campaign';
import CreateIcon from '@mui/icons-material/Create';
import DescriptionIcon from '@mui/icons-material/Description';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
import {
  AnnouncementType,
  AnnouncementSummaryType,
  HandoutType,
  TeamSeasonType,
} from '@draco/shared-schemas';
import { getAccountUserTeams } from '@draco/shared-api-client';
import { HandoutService } from '../services/handoutService';
import { AnnouncementService } from '../services/announcementService';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useIsIndividualGolfAccount } from '../context/AccountContext';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import ThemeSwitcher from './ThemeSwitcher';
import AnnouncementDetailDialog from './announcements/AnnouncementDetailDialog';
import { formatDateTime } from '../utils/dateUtils';
import { useThemeContext } from './ThemeClientProvider';

interface TopBarQuickActionsProps {
  accountId?: string | null;
  canViewHandouts?: boolean;
  canViewAnnouncements?: boolean;
  useUnifiedMenu?: boolean;
  onCompactMenuItemsChange?: (items: React.ReactNode[]) => void;
  onUnifiedMenuClose?: () => void;
}

interface TeamHandoutSection {
  teamId: string;
  teamSeasonId: string;
  seasonId?: string | null;
  teamName: string;
  handouts: HandoutType[];
}

interface TeamAnnouncementSection {
  teamId: string;
  teamSeasonId: string;
  seasonId?: string | null;
  teamName: string;
  announcements: AnnouncementSummaryType[];
}

const ComposeEmailIcon: React.FC<{ size?: 'inherit' | 'small' | 'medium' | 'large' }> = ({
  size = 'small',
}) => {
  const theme = useTheme();
  const foregroundColor =
    theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <MailOutlineIcon fontSize={size} color="inherit" />
      <CreateIcon
        fontSize={size}
        htmlColor={foregroundColor}
        sx={{
          position: 'absolute',
          right: -4,
          bottom: -4,
          bgcolor: theme.palette.background.paper,
          borderRadius: '50%',
          border: `1px solid ${theme.palette.divider}`,
          fontSize: size === 'small' ? 14 : undefined,
          boxShadow: theme.shadows[1],
        }}
      />
    </Box>
  );
};

const menuPaperStyles = {
  sx: {
    minWidth: 260,
    maxWidth: 340,
  },
};

const TopBarQuickActions: React.FC<TopBarQuickActionsProps> = ({
  accountId,
  canViewHandouts = false,
  canViewAnnouncements = false,
  useUnifiedMenu = false,
  onCompactMenuItemsChange,
  onUnifiedMenuClose,
}) => {
  const theme = useTheme();
  const [isHydrated, setIsHydrated] = React.useState(false);
  const compactMediaQuery = useMediaQuery(theme.breakpoints.down('sm'));
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);
  const isCompact = isHydrated ? compactMediaQuery : false;
  const { user, token } = useAuth();
  const isIndividualGolfAccount = useIsIndividualGolfAccount();
  const showHandouts = Boolean(canViewHandouts && accountId && !isIndividualGolfAccount);
  const showAnnouncements = Boolean(canViewAnnouncements && accountId && !isIndividualGolfAccount);
  const apiClient = useApiClient();
  const handoutService = React.useMemo(
    () => new HandoutService(token, apiClient),
    [token, apiClient],
  );
  const announcementService = React.useMemo(
    () => new AnnouncementService(token, apiClient),
    [token, apiClient],
  );

  const [accountHandouts, setAccountHandouts] = React.useState<HandoutType[]>([]);
  const [accountHandoutsLoading, setAccountHandoutsLoading] = React.useState(false);
  const [accountHandoutsError, setAccountHandoutsError] = React.useState<string | null>(null);

  const [teamHandoutSections, setTeamHandoutSections] = React.useState<TeamHandoutSection[]>([]);
  const [teamHandoutsLoading, setTeamHandoutsLoading] = React.useState(false);
  const [teamHandoutsError, setTeamHandoutsError] = React.useState<string | null>(null);

  const [accountAnnouncements, setAccountAnnouncements] = React.useState<AnnouncementSummaryType[]>(
    [],
  );
  const [accountAnnouncementsLoading, setAccountAnnouncementsLoading] = React.useState(false);
  const [accountAnnouncementsError, setAccountAnnouncementsError] = React.useState<string | null>(
    null,
  );

  const [teamAnnouncementSections, setTeamAnnouncementSections] = React.useState<
    TeamAnnouncementSection[]
  >([]);
  const [teamAnnouncementsLoading, setTeamAnnouncementsLoading] = React.useState(false);
  const [teamAnnouncementsError, setTeamAnnouncementsError] = React.useState<string | null>(null);

  const [downloadingHandoutId, setDownloadingHandoutId] = React.useState<string | null>(null);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = React.useState(false);
  const [announcementDetail, setAnnouncementDetail] = React.useState<AnnouncementType | null>(null);
  const [announcementDetailLoading, setAnnouncementDetailLoading] = React.useState(false);
  const [announcementDetailError, setAnnouncementDetailError] = React.useState<string | null>(null);
  const [announcementSourceLabel, setAnnouncementSourceLabel] = React.useState<string>('');
  const [selectedAnnouncementTitle, setSelectedAnnouncementTitle] = React.useState<string>('');
  const [selectedAnnouncementPublishedAt, setSelectedAnnouncementPublishedAt] =
    React.useState<string>('');
  const [selectedAnnouncementIsSpecial, setSelectedAnnouncementIsSpecial] =
    React.useState<boolean>(false);

  const hasLoadedAccountHandoutsRef = React.useRef(false);
  const hasLoadedTeamHandoutsRef = React.useRef(false);
  const hasLoadedAccountAnnouncementsRef = React.useRef(false);
  const hasLoadedTeamAnnouncementsRef = React.useRef(false);
  const userTeamsCacheRef = React.useRef<TeamSeasonType[] | null>(null);

  const [handoutAnchorEl, setHandoutAnchorEl] = React.useState<null | HTMLElement>(null);
  const [announcementAnchorEl, setAnnouncementAnchorEl] = React.useState<null | HTMLElement>(null);
  const [compactAnchorEl, setCompactAnchorEl] = React.useState<null | HTMLElement>(null);
  const lastEmittedEmptyRef = React.useRef(true);

  const { currentThemeName, setCurrentThemeName } = useThemeContext();
  const isDarkMode = currentThemeName === 'dark';
  const themeToggleLabel = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';
  const { hasRole, loading: roleLoading, initialized: roleInitialized } = useRole();
  const composeHref = accountId ? `/account/${accountId}/communications/compose` : null;
  const canComposeEmail =
    !isIndividualGolfAccount &&
    Boolean(composeHref) &&
    roleInitialized &&
    !roleLoading &&
    accountId !== undefined &&
    accountId !== null &&
    hasRole('AccountAdmin', { accountId });

  const resetHandoutState = React.useCallback(() => {
    hasLoadedAccountHandoutsRef.current = false;
    hasLoadedTeamHandoutsRef.current = false;
    setAccountHandouts([]);
    setAccountHandoutsError(null);
    setTeamHandoutSections([]);
    setTeamHandoutsError(null);
  }, []);

  const resetAnnouncementState = React.useCallback(() => {
    hasLoadedAccountAnnouncementsRef.current = false;
    hasLoadedTeamAnnouncementsRef.current = false;
    setAccountAnnouncements([]);
    setAccountAnnouncementsError(null);
    setTeamAnnouncementSections([]);
    setTeamAnnouncementsError(null);
    setAnnouncementDetail(null);
    setAnnouncementDetailError(null);
    setAnnouncementDialogOpen(false);
    setSelectedAnnouncementTitle('');
    setSelectedAnnouncementPublishedAt('');
    setSelectedAnnouncementIsSpecial(false);
  }, []);

  React.useEffect(() => {
    resetHandoutState();
    resetAnnouncementState();
    userTeamsCacheRef.current = null;
  }, [accountId, resetHandoutState, resetAnnouncementState]);

  React.useEffect(() => {
    resetHandoutState();
    resetAnnouncementState();
    userTeamsCacheRef.current = null;
  }, [user, token, resetHandoutState, resetAnnouncementState]);

  const loadAccountHandouts = React.useCallback(async () => {
    if (!showHandouts || !accountId) {
      hasLoadedAccountHandoutsRef.current = true;
      return;
    }

    setAccountHandoutsLoading(true);
    setAccountHandoutsError(null);

    try {
      const data = await handoutService.listAccountHandouts(accountId);
      setAccountHandouts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load handouts';
      setAccountHandoutsError(message);
    } finally {
      setAccountHandoutsLoading(false);
      hasLoadedAccountHandoutsRef.current = true;
    }
  }, [accountId, handoutService, showHandouts]);

  const fetchUserTeams = React.useCallback(async (): Promise<TeamSeasonType[]> => {
    if (!accountId || !user || !token) {
      return [];
    }

    if (userTeamsCacheRef.current) {
      return userTeamsCacheRef.current;
    }

    const result = await getAccountUserTeams({
      client: apiClient,
      path: { accountId },
      throwOnError: false,
    });

    const payload = unwrapApiResult(result, 'Failed to load your teams');
    const teams = Array.isArray(payload) ? (payload as TeamSeasonType[]) : [];
    userTeamsCacheRef.current = teams;
    return teams;
  }, [accountId, apiClient, token, user]);

  const loadTeamHandouts = React.useCallback(async () => {
    if (!showHandouts || !accountId || !user || !token) {
      hasLoadedTeamHandoutsRef.current = true;
      return;
    }

    setTeamHandoutsLoading(true);
    setTeamHandoutsError(null);

    try {
      const teamsArray = await fetchUserTeams();

      if (teamsArray.length === 0) {
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
              const handouts = await handoutService.listTeamHandouts({
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
  }, [accountId, fetchUserTeams, handoutService, showHandouts, token, user]);

  const loadAccountAnnouncements = React.useCallback(async () => {
    if (!showAnnouncements || !accountId) {
      hasLoadedAccountAnnouncementsRef.current = true;
      return;
    }

    setAccountAnnouncementsLoading(true);
    setAccountAnnouncementsError(null);

    try {
      const data = await announcementService.listAccountAnnouncementSummaries(accountId, {
        limit: 10,
      });
      setAccountAnnouncements(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load account announcements';
      setAccountAnnouncementsError(message);
      setAccountAnnouncements([]);
    } finally {
      setAccountAnnouncementsLoading(false);
      hasLoadedAccountAnnouncementsRef.current = true;
    }
  }, [accountId, announcementService, showAnnouncements]);

  const loadTeamAnnouncements = React.useCallback(async () => {
    if (!showAnnouncements || !accountId || !user || !token) {
      hasLoadedTeamAnnouncementsRef.current = true;
      return;
    }

    setTeamAnnouncementsLoading(true);
    setTeamAnnouncementsError(null);

    try {
      const teamsArray = await fetchUserTeams();

      if (teamsArray.length === 0) {
        setTeamAnnouncementSections([]);
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
              const announcements = await announcementService.listTeamAnnouncementSummaries(
                {
                  accountId,
                  teamId,
                },
                { limit: 10 },
              );

              return {
                teamId,
                teamSeasonId,
                seasonId: seasonIdValue,
                teamName,
                announcements,
              } as TeamAnnouncementSection;
            } catch (error) {
              console.error(
                `Failed to load announcements for team ${teamName} (${teamId}) in account ${accountId}:`,
                error,
              );
              errors.push(teamName);
              return {
                teamId,
                teamSeasonId,
                seasonId: seasonIdValue,
                teamName,
                announcements: [],
              } as TeamAnnouncementSection;
            }
          }),
      );

      if (errors.length > 0) {
        setTeamAnnouncementsError(
          `Failed to load announcements for ${errors.join(', ')}. Please try again.`,
        );
      }

      setTeamAnnouncementSections(sections);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load team announcements';
      setTeamAnnouncementsError(message);
      setTeamAnnouncementSections([]);
    } finally {
      setTeamAnnouncementsLoading(false);
      hasLoadedTeamAnnouncementsRef.current = true;
    }
  }, [accountId, announcementService, fetchUserTeams, showAnnouncements, token, user]);

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

  const ensureAnnouncementsLoaded = React.useCallback(() => {
    if (!showAnnouncements) {
      return;
    }

    if (!hasLoadedAccountAnnouncementsRef.current && !accountAnnouncementsLoading) {
      void loadAccountAnnouncements();
    }

    if (!hasLoadedTeamAnnouncementsRef.current && !teamAnnouncementsLoading) {
      void loadTeamAnnouncements();
    }
  }, [
    showAnnouncements,
    accountAnnouncementsLoading,
    teamAnnouncementsLoading,
    loadAccountAnnouncements,
    loadTeamAnnouncements,
  ]);

  React.useEffect(() => {
    if (showHandouts) {
      ensureHandoutsLoaded();
    }
  }, [ensureHandoutsLoaded, showHandouts]);

  React.useEffect(() => {
    if (showAnnouncements) {
      ensureAnnouncementsLoaded();
    }
  }, [ensureAnnouncementsLoaded, showAnnouncements]);

  const handleHandoutMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setHandoutAnchorEl(event.currentTarget);
    ensureHandoutsLoaded();
  };

  const handleHandoutMenuClose = () => {
    setHandoutAnchorEl(null);
  };

  const handleAnnouncementMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnnouncementAnchorEl(event.currentTarget);
    ensureAnnouncementsLoaded();
  };

  const handleAnnouncementMenuClose = () => {
    setAnnouncementAnchorEl(null);
  };

  const handleCompactMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCompactAnchorEl(event.currentTarget);
    ensureHandoutsLoaded();
    ensureAnnouncementsLoaded();
  };

  const handleCompactMenuClose = () => {
    setCompactAnchorEl(null);
  };

  const handleThemeToggle = React.useCallback(() => {
    setCurrentThemeName(isDarkMode ? 'light' : 'dark');
  }, [isDarkMode, setCurrentThemeName]);

  const normalizeMenuContent = React.useCallback((content: React.ReactNode): React.ReactNode[] => {
    if (Array.isArray(content)) {
      return content;
    }
    if (content === null || content === undefined) {
      return [];
    }
    return [content];
  }, []);

  const buildMenuSection = React.useCallback(
    (
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
    },
    [],
  );

  const handleHandoutDownload = React.useCallback(
    async (handout: HandoutType) => {
      if (!handout.downloadUrl || !accountId) {
        return;
      }

      try {
        setDownloadingHandoutId(handout.id);
        setAccountHandoutsError(null);
        setTeamHandoutsError(null);

        let blob: Blob;
        if (handout.teamId) {
          blob = await handoutService.downloadTeamHandout(
            { accountId, teamId: handout.teamId },
            handout.id,
          );
        } else {
          blob = await handoutService.downloadAccountHandout(accountId, handout.id);
        }

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
    [accountId, handoutService],
  );

  const handleAnnouncementSelect = React.useCallback(
    async (summary: AnnouncementSummaryType, sourceLabel: string) => {
      if (!accountId) {
        return;
      }

      setAnnouncementDialogOpen(true);
      setAnnouncementDetail(null);
      setAnnouncementDetailError(null);
      setAnnouncementSourceLabel(sourceLabel);
      setSelectedAnnouncementTitle(summary.title);
      setSelectedAnnouncementPublishedAt(summary.publishedAt);
      setSelectedAnnouncementIsSpecial(summary.isSpecial);
      setAnnouncementDetailLoading(true);

      try {
        let announcement: AnnouncementType;
        if (summary.visibility === 'team' && summary.teamId) {
          announcement = await announcementService.getTeamAnnouncement(
            { accountId, teamId: summary.teamId },
            summary.id,
          );
        } else {
          announcement = await announcementService.getAccountAnnouncement(accountId, summary.id);
        }

        setAnnouncementDetail(announcement);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load announcement details';
        setAnnouncementDetailError(message);
        setAnnouncementDetail(null);
      } finally {
        setAnnouncementDetailLoading(false);
      }
    },
    [accountId, announcementService],
  );

  const handleAnnouncementDialogClose = () => {
    setAnnouncementDialogOpen(false);
    setAnnouncementDetailError(null);
    setAnnouncementDetail(null);
  };

  const renderAccountHandoutItems = React.useCallback(
    (onClose: () => void): React.ReactNode[] => {
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
    },
    [
      accountHandouts,
      accountHandoutsError,
      accountHandoutsLoading,
      downloadingHandoutId,
      handleHandoutDownload,
      loadAccountHandouts,
      showHandouts,
    ],
  );

  const renderAccountAnnouncementItems = React.useCallback(
    (onClose: () => void): React.ReactNode[] => {
      if (!showAnnouncements) {
        return [];
      }

      if (
        accountAnnouncementsLoading &&
        accountAnnouncements.length === 0 &&
        !accountAnnouncementsError
      ) {
        return [
          <MenuItem key="account-announcements-loading" disabled dense sx={{ gap: 1, opacity: 1 }}>
            <CircularProgress size={18} />
            <ListItemText
              primary="Loading account announcements…"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </MenuItem>,
        ];
      }

      if (accountAnnouncementsError) {
        return [
          <MenuItem key="account-announcements-error" disabled dense sx={{ opacity: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <ErrorOutlineIcon color="error" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={accountAnnouncementsError}
              primaryTypographyProps={{ variant: 'body2', color: 'error.main' }}
            />
          </MenuItem>,
          <MenuItem
            key="account-announcements-retry"
            dense
            onClick={() => {
              onClose();
              hasLoadedAccountAnnouncementsRef.current = false;
              void loadAccountAnnouncements();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Retry loading account announcements" />
          </MenuItem>,
        ];
      }

      if (accountAnnouncements.length === 0) {
        return [];
      }

      return accountAnnouncements.map((announcement) => {
        const secondaryText = formatDateTime(announcement.publishedAt);

        return (
          <MenuItem
            key={`account-announcement-${announcement.id}`}
            dense
            onClick={() => {
              onClose();
              void handleAnnouncementSelect(announcement, 'Account Announcement');
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CampaignIcon
                fontSize="small"
                color={announcement.isSpecial ? 'secondary' : 'inherit'}
              />
            </ListItemIcon>
            <ListItemText
              primary={announcement.title}
              primaryTypographyProps={{
                variant: 'body2',
                sx: { fontWeight: announcement.isSpecial ? 600 : undefined, whiteSpace: 'normal' },
              }}
              secondary={secondaryText}
              secondaryTypographyProps={{
                variant: 'caption',
                color: announcement.isSpecial ? 'secondary.main' : 'text.secondary',
              }}
            />
          </MenuItem>
        );
      });
    },
    [
      accountAnnouncements,
      accountAnnouncementsError,
      accountAnnouncementsLoading,
      handleAnnouncementSelect,
      loadAccountAnnouncements,
      showAnnouncements,
    ],
  );

  const renderTeamHandoutSections = React.useCallback(
    (onClose: () => void): React.ReactNode[] => {
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

        const section = buildMenuSection(items, 'team-loading', 'Team Handouts');
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

        const sectionNodes = buildMenuSection(
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
        const emptySection = buildMenuSection(
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
        const errorSection = buildMenuSection(
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
                userTeamsCacheRef.current = null;
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
    },
    [
      accountId,
      buildMenuSection,
      loadTeamHandouts,
      normalizeMenuContent,
      showHandouts,
      teamHandoutSections,
      teamHandoutsError,
      teamHandoutsLoading,
      downloadingHandoutId,
      handleHandoutDownload,
    ],
  );

  const renderTeamAnnouncementSections = React.useCallback(
    (onClose: () => void): React.ReactNode[] => {
      if (!showAnnouncements) {
        return [];
      }

      if (
        teamAnnouncementsLoading &&
        teamAnnouncementSections.length === 0 &&
        !teamAnnouncementsError
      ) {
        const items = normalizeMenuContent(
          <MenuItem key="team-announcements-loading" disabled dense sx={{ gap: 1, opacity: 1 }}>
            <CircularProgress size={18} />
            <ListItemText
              primary="Loading your team announcements…"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </MenuItem>,
        );

        const section = buildMenuSection(items, 'team-announcements-loading', 'Team Announcements');
        return section ?? [];
      }

      const sections: React.ReactNode[] = [];

      teamAnnouncementSections.forEach((section) => {
        if (section.announcements.length === 0) {
          return;
        }

        const items = normalizeMenuContent(
          section.announcements.map((announcement) => {
            const secondaryText = formatDateTime(announcement.publishedAt);

            return (
              <MenuItem
                key={`team-announcement-${section.teamId}-${announcement.id}`}
                dense
                onClick={() => {
                  onClose();
                  void handleAnnouncementSelect(announcement, `${section.teamName} Announcement`);
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CampaignIcon
                    fontSize="small"
                    color={announcement.isSpecial ? 'secondary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={announcement.title}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: {
                      fontWeight: announcement.isSpecial ? 600 : undefined,
                      whiteSpace: 'normal',
                    },
                  }}
                  secondary={secondaryText}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: announcement.isSpecial ? 'secondary.main' : 'text.secondary',
                  }}
                />
              </MenuItem>
            );
          }),
        );

        const sectionLink =
          accountId && section.teamId
            ? `/account/${accountId}/teams/${section.teamId}/announcements`
            : undefined;

        const sectionNodes = buildMenuSection(
          items,
          `team-announcements-${section.teamId}`,
          `${section.teamName} Announcements`,
          sectionLink,
        );

        if (sectionNodes) {
          sections.push(...sectionNodes);
        }
      });

      if (!teamAnnouncementsLoading && sections.length === 0 && !teamAnnouncementsError) {
        return [];
      }

      if (teamAnnouncementsError) {
        const errorSection = buildMenuSection(
          [
            <MenuItem key="team-announcements-error" disabled dense sx={{ opacity: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ErrorOutlineIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={teamAnnouncementsError}
                primaryTypographyProps={{ variant: 'body2', color: 'error.main' }}
              />
            </MenuItem>,
            <MenuItem
              key="team-announcements-retry"
              dense
              onClick={() => {
                onClose();
                userTeamsCacheRef.current = null;
                hasLoadedTeamAnnouncementsRef.current = false;
                void loadTeamAnnouncements();
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <RefreshIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Retry loading team announcements" />
            </MenuItem>,
          ],
          'team-announcements-error',
          'Team Announcements',
        );

        if (errorSection) {
          sections.push(...errorSection);
        }
      }

      return sections;
    },
    [
      accountId,
      buildMenuSection,
      handleAnnouncementSelect,
      normalizeMenuContent,
      showAnnouncements,
      teamAnnouncementSections,
      teamAnnouncementsError,
      teamAnnouncementsLoading,
      loadTeamAnnouncements,
    ],
  );

  const hasAccountHandoutItems = accountHandouts.length > 0;
  const hasTeamHandoutItems = teamHandoutSections.some((section) => section.handouts.length > 0);
  const hasAccountAnnouncementItems = accountAnnouncements.length > 0;
  const hasTeamAnnouncementItems = teamAnnouncementSections.some(
    (section) => section.announcements.length > 0,
  );

  const shouldShowHandoutAction =
    showHandouts &&
    (hasAccountHandoutItems ||
      hasTeamHandoutItems ||
      (hasLoadedAccountHandoutsRef.current && Boolean(accountHandoutsError)) ||
      (hasLoadedTeamHandoutsRef.current && Boolean(teamHandoutsError)));

  const shouldShowAnnouncementAction =
    showAnnouncements &&
    (hasAccountAnnouncementItems ||
      hasTeamAnnouncementItems ||
      (hasLoadedAccountAnnouncementsRef.current && Boolean(accountAnnouncementsError)) ||
      (hasLoadedTeamAnnouncementsRef.current && Boolean(teamAnnouncementsError)));

  const shouldShowComposeAction = canComposeEmail && Boolean(composeHref);

  const allQuickActionsLoaded =
    (!showHandouts || (hasLoadedAccountHandoutsRef.current && hasLoadedTeamHandoutsRef.current)) &&
    (!showAnnouncements ||
      (hasLoadedAccountAnnouncementsRef.current && hasLoadedTeamAnnouncementsRef.current));

  const shouldShowQuickActionsMenu =
    shouldShowAnnouncementAction || shouldShowHandoutAction || shouldShowComposeAction;

  const buildCompactMenuItems = React.useCallback(
    (closeMenu: () => void): React.ReactNode[] => {
      const nodes: React.ReactNode[] = [];

      if (shouldShowComposeAction && composeHref) {
        nodes.push(
          <MenuItem
            key="compose-email"
            dense
            component={NextLink}
            href={composeHref}
            onClick={closeMenu}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <ComposeEmailIcon size="small" />
            </ListItemIcon>
            <ListItemText primary="Compose email" />
          </MenuItem>,
        );
      }

      nodes.push(
        <MenuItem
          key="theme-toggle"
          dense
          onClick={() => {
            handleThemeToggle();
            closeMenu();
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText primary={themeToggleLabel} />
        </MenuItem>,
      );

      const extraNodes = (() => {
        const sectionNodes: React.ReactNode[] = [];

        if (shouldShowAnnouncementAction) {
          const accountNodes = buildMenuSection(
            normalizeMenuContent(renderAccountAnnouncementItems(closeMenu)),
            'compact-account-announcements',
            'Account Announcements',
            `/account/${accountId}/announcements`,
          );
          if (accountNodes) {
            sectionNodes.push(...accountNodes);
          }

          const teamNodes = renderTeamAnnouncementSections(closeMenu);
          if (teamNodes.length > 0) {
            sectionNodes.push(...teamNodes);
          }
        }

        if (shouldShowHandoutAction) {
          const accountNodes = buildMenuSection(
            normalizeMenuContent(renderAccountHandoutItems(closeMenu)),
            'compact-account-handouts',
            'Account Handouts',
            `/account/${accountId}/handouts`,
          );
          if (accountNodes) {
            sectionNodes.push(...accountNodes);
          }

          const teamNodes = renderTeamHandoutSections(closeMenu);
          if (teamNodes.length > 0) {
            sectionNodes.push(...teamNodes);
          }
        }

        return sectionNodes.length > 0 ? sectionNodes : null;
      })();

      if (extraNodes) {
        nodes.push(...extraNodes);
      }

      return nodes;
    },
    [
      accountId,
      buildMenuSection,
      composeHref,
      isDarkMode,
      normalizeMenuContent,
      renderAccountAnnouncementItems,
      renderTeamAnnouncementSections,
      renderAccountHandoutItems,
      renderTeamHandoutSections,
      handleThemeToggle,
      shouldShowAnnouncementAction,
      shouldShowComposeAction,
      shouldShowHandoutAction,
      themeToggleLabel,
    ],
  );

  React.useEffect(() => {
    if (!useUnifiedMenu || !isCompact || !allQuickActionsLoaded) {
      if (!lastEmittedEmptyRef.current) {
        onCompactMenuItemsChange?.([]);
        lastEmittedEmptyRef.current = true;
      }
      return;
    }

    const items = buildCompactMenuItems(onUnifiedMenuClose ?? (() => {}));
    onCompactMenuItemsChange?.(items);
    lastEmittedEmptyRef.current = items.length === 0;
  }, [
    allQuickActionsLoaded,
    buildCompactMenuItems,
    isCompact,
    onCompactMenuItemsChange,
    onUnifiedMenuClose,
    useUnifiedMenu,
  ]);

  React.useEffect(
    () => () => {
      onCompactMenuItemsChange?.([]);
    },
    [onCompactMenuItemsChange],
  );

  const announcementDialog = (
    <AnnouncementDetailDialog
      open={announcementDialogOpen}
      onClose={handleAnnouncementDialogClose}
      loading={announcementDetailLoading}
      error={announcementDetailError}
      announcement={announcementDetail}
      fallbackTitle={selectedAnnouncementTitle}
      sourceLabel={announcementSourceLabel}
      publishedAt={selectedAnnouncementPublishedAt}
      isSpecial={selectedAnnouncementIsSpecial}
    />
  );

  if (!isCompact) {
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {allQuickActionsLoaded && (
            <>
              {shouldShowAnnouncementAction ? (
                <>
                  <Tooltip title="Announcements">
                    <IconButton
                      color="inherit"
                      size="small"
                      onClick={handleAnnouncementMenuOpen}
                      aria-haspopup="true"
                      aria-controls={announcementAnchorEl ? 'announcement-menu' : undefined}
                    >
                      <CampaignIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    id="announcement-menu"
                    anchorEl={announcementAnchorEl}
                    open={Boolean(announcementAnchorEl)}
                    onClose={handleAnnouncementMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={menuPaperStyles}
                  >
                    {(() => {
                      const nodes: React.ReactNode[] = [];

                      const accountNodes = buildMenuSection(
                        normalizeMenuContent(
                          renderAccountAnnouncementItems(handleAnnouncementMenuClose),
                        ),
                        'desktop-account-announcements',
                        'Account Announcements',
                        `/account/${accountId}/announcements`,
                      );
                      if (accountNodes) {
                        nodes.push(...accountNodes);
                      }

                      const teamNodes = renderTeamAnnouncementSections(handleAnnouncementMenuClose);
                      if (teamNodes.length > 0) {
                        nodes.push(...teamNodes);
                      }

                      return nodes.length > 0 ? nodes : null;
                    })()}
                  </Menu>
                </>
              ) : null}
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

                      const accountNodes = buildMenuSection(
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
              {shouldShowComposeAction && composeHref ? (
                <Tooltip title="Compose email">
                  <IconButton
                    color="inherit"
                    size="small"
                    component={NextLink}
                    href={composeHref}
                    aria-label="Compose email"
                  >
                    <ComposeEmailIcon size="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </>
          )}
          <ThemeSwitcher />
        </Box>
        {announcementDialog}
      </>
    );
  }

  if (isCompact && useUnifiedMenu) {
    return <>{announcementDialog}</>;
  }

  return (
    <>
      {shouldShowQuickActionsMenu ? (
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
        {buildCompactMenuItems(handleCompactMenuClose)}
      </Menu>
      {announcementDialog}
    </>
  );
};

export default TopBarQuickActions;
