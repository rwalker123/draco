'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
  alpha,
  type Theme,
} from '@mui/material';
import LeaderCategoryPanel from './LeaderCategoryPanel';
import { useLeaderCategories } from '../../hooks/useLeaderCategories';
import { useApiClient } from '../../hooks/useApiClient';
import type { LeaderCategoryType, LeaderRowType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';
import { fetchStatisticalLeaders } from '../../services/statisticsService';

export interface LeagueOption {
  id: string;
  name: string;
}

type StatType = 'batting' | 'pitching';

type WidgetSelection = {
  leagueId: string;
  statType: StatType;
  categoryKey: string;
};

interface WidgetModel {
  selection: WidgetSelection;
  leaders: LeaderRowType[];
}
interface BaseLeadersWidgetProps {
  accountId: string;
  title?: string;
  leaderLimit?: number;
  divisionId?: string | null;
  isHistorical?: boolean;
  randomize?: boolean;
  onHasLeaders?: (hasLeaders: boolean) => void;
}

interface AccountLeadersWidgetProps extends BaseLeadersWidgetProps {
  variant?: 'account';
  leagues: LeagueOption[];
  seasonId?: string | null;
}

interface TeamLeadersWidgetProps extends BaseLeadersWidgetProps {
  variant: 'team';
  seasonId: string;
  teamSeasonId: string;
  leagueId: string;
  leagueName?: string;
  leagues?: LeagueOption[];
  teamId?: string | null;
}

type LeadersWidgetProps = AccountLeadersWidgetProps | TeamLeadersWidgetProps;

const DEFAULT_ACCOUNT_TITLE = 'League Leaders';
const DEFAULT_TEAM_TITLE = 'Team Leaders';

const getRandomIndex = (size: number): number | null => {
  if (size <= 0) {
    return null;
  }

  return Math.floor(Math.random() * size);
};

const getRandomLeagueId = (
  shouldRandomize: boolean,
  isTeamVariant: boolean,
  leagues: LeagueOption[],
): string | null => {
  if (!shouldRandomize || isTeamVariant) {
    return null;
  }

  const index = getRandomIndex(leagues.length);
  return index === null ? null : (leagues[index]?.id ?? null);
};

const pickInitialStatType = (
  shouldRandomize: boolean,
  battingCategories: LeaderCategoryType[],
  pitchingCategories: LeaderCategoryType[],
): StatType | null => {
  const available: StatType[] = [];

  if (battingCategories.length > 0) {
    available.push('batting');
  }
  if (pitchingCategories.length > 0) {
    available.push('pitching');
  }

  if (available.length === 0) {
    return null;
  }

  if (shouldRandomize && available.length > 1) {
    const index = getRandomIndex(available.length);
    if (index !== null) {
      return available[index];
    }
  }

  return available[0];
};

const resolveCategoryForType = (
  statType: StatType,
  battingCategories: LeaderCategoryType[],
  pitchingCategories: LeaderCategoryType[],
  preferredKey?: string | null,
  shouldRandomize?: boolean,
): string | null => {
  const categories = statType === 'batting' ? battingCategories : pitchingCategories;

  if (categories.length === 0) {
    return null;
  }

  if (preferredKey && categories.some((category) => category.key === preferredKey)) {
    return preferredKey;
  }

  if (shouldRandomize) {
    const randomIndex = getRandomIndex(categories.length);
    if (randomIndex !== null) {
      return categories[randomIndex]?.key ?? null;
    }
  }

  return categories[0]?.key ?? null;
};

const buildStatTypeTabSx = (muiTheme: Theme) => ({
  minWidth: 120,
  borderRadius: 2,
  textTransform: 'none',
  border: `1px solid ${muiTheme.palette.divider}`,
  backgroundColor: muiTheme.palette.background.paper,
  color: muiTheme.palette.text.primary,
  '&.Mui-selected': {
    backgroundColor: muiTheme.palette.primary.main,
    color: muiTheme.palette.primary.contrastText,
  },
});

const isTeamVariantProps = (props: LeadersWidgetProps): props is TeamLeadersWidgetProps => {
  return props.variant === 'team';
};

export default function LeadersWidget(props: LeadersWidgetProps) {
  const leaderLimit = props.leaderLimit ?? 5;
  const accountId = props.accountId;
  const randomize = props.randomize === true;
  const onHasLeaders = props.onHasLeaders;
  const isTeamVariant = isTeamVariantProps(props);
  const teamProps = isTeamVariant ? (props as TeamLeadersWidgetProps) : null;
  const showTeamInfo = !isTeamVariant;
  const divisionId = props.divisionId ?? (isTeamVariant ? null : '0');
  const isHistorical = props.isHistorical ?? false;

  const leaguesProp = props.leagues;
  const seasonIdProp = props.seasonId;
  const teamLeagueIdProp = teamProps?.leagueId;
  const teamLeagueNameProp = teamProps?.leagueName;
  const teamSeasonIdProp = teamProps?.teamSeasonId;
  const teamIdProp = teamProps?.teamId;
  const teamLeaguesProp = teamProps?.leagues;
  const teamSeasonIdForHref = teamProps?.teamSeasonId;
  const teamSeasonSeasonIdProp = teamProps?.seasonId;

  const resolvedLeagues =
    isTeamVariant && teamSeasonIdForHref
      ? teamLeaguesProp && teamLeaguesProp.length > 0
        ? teamLeaguesProp
        : teamLeagueIdProp
          ? [{ id: teamLeagueIdProp, name: teamLeagueNameProp ?? 'League' }]
          : []
      : (leaguesProp ?? []);

  const defaultLeagueId =
    isTeamVariant && teamSeasonIdForHref
      ? (teamLeagueIdProp ?? resolvedLeagues[0]?.id ?? null)
      : (resolvedLeagues[0]?.id ?? null);

  const fullStatisticsHref =
    isTeamVariant && teamSeasonIdForHref
      ? `/account/${accountId}/seasons/${teamSeasonSeasonIdProp}/teams/${teamSeasonIdForHref}/stat-entry`
      : seasonIdProp
        ? `/account/${accountId}/statistics?seasonId=${seasonIdProp}`
        : `/account/${accountId}/statistics`;

  const teamIdFilter =
    isTeamVariant && teamSeasonIdForHref ? (teamIdProp ?? teamSeasonIdProp) : undefined;

  const apiClient = useApiClient();
  const title = props.title ?? (isTeamVariant ? DEFAULT_TEAM_TITLE : DEFAULT_ACCOUNT_TITLE);

  const [categoryPreferences, setCategoryPreferences] = useState<Partial<Record<StatType, string>>>(
    {},
  );
  const [model, setModel] = useState<WidgetModel | null>(null);
  const [pendingSelection, setPendingSelection] = useState<WidgetSelection | null>(null);
  const [leadersErrorMessage, setLeadersErrorMessage] = useState<string | null>(null);
  const [hasAnyLeaders, setHasAnyLeaders] = useState<boolean | null>(null);
  const leagueTabsRef = useRef<HTMLDivElement | null>(null);
  const statTabsRef = useRef<HTMLDivElement | null>(null);
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);

  const {
    battingCategories,
    pitchingCategories,
    error: categoriesError,
  } = useLeaderCategories(accountId);

  const isTeamDataFetchable = !isTeamVariant || Boolean(teamIdFilter);

  const initialSelectionQueuedRef = useRef(false);

  useEffect(() => {
    if (initialSelectionQueuedRef.current || model || pendingSelection || !isTeamDataFetchable) {
      return;
    }

    const leagues =
      isTeamVariant && teamSeasonIdForHref
        ? teamLeaguesProp && teamLeaguesProp.length > 0
          ? teamLeaguesProp
          : teamLeagueIdProp
            ? [{ id: teamLeagueIdProp, name: teamLeagueNameProp ?? 'League' }]
            : []
        : (leaguesProp ?? []);

    if (!leagues[0]) {
      return;
    }

    const initialLeagueId =
      getRandomLeagueId(randomize, isTeamVariant, leagues) ??
      defaultLeagueId ??
      leagues[0]?.id ??
      null;

    const initialStatType =
      pickInitialStatType(randomize, battingCategories, pitchingCategories) ?? 'batting';
    const initialCategoryKey =
      randomize && !isTeamVariant
        ? resolveCategoryForType(
            initialStatType,
            battingCategories,
            pitchingCategories,
            undefined,
            true,
          )
        : resolveCategoryForType(initialStatType, battingCategories, pitchingCategories);

    if (!initialLeagueId || !initialCategoryKey) {
      return;
    }

    const initialSelection = {
      leagueId: initialLeagueId,
      statType: initialStatType,
      categoryKey: initialCategoryKey,
    };

    initialSelectionQueuedRef.current = true;
    setPendingSelection(initialSelection);
  }, [
    isTeamDataFetchable,
    model,
    pendingSelection,
    battingCategories,
    defaultLeagueId,
    isTeamVariant,
    pitchingCategories,
    randomize,
    teamSeasonIdForHref,
    teamLeaguesProp,
    teamLeagueIdProp,
    teamLeagueNameProp,
    leaguesProp,
  ]);

  useEffect(() => {
    if (!pendingSelection) {
      return;
    }

    const controller = new AbortController();
    setLeadersErrorMessage(null);
    const selection = pendingSelection;

    const run = async () => {
      try {
        const leaders = await fetchStatisticalLeaders(
          accountId,
          selection.leagueId,
          selection.categoryKey,
          {
            divisionId: divisionId ?? undefined,
            teamId: isTeamVariant ? (teamIdFilter ?? undefined) : undefined,
            isHistorical,
            includeAllGameTypes: undefined,
            limit: leaderLimit,
          },
          { client: apiClient, signal: controller.signal },
        );

        if (controller.signal.aborted) {
          return;
        }

        setModel({ selection, leaders });
        setCategoryPreferences((previous) => ({
          ...previous,
          [selection.statType]: selection.categoryKey,
        }));
        if (leaders.length > 0) {
          if (!hasAnyLeaders) {
            setHasAnyLeaders(true);
          }
        } else if (hasAnyLeaders === null) {
          setHasAnyLeaders(false);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Failed to load statistical leaders:', err);
        const message = err instanceof Error ? err.message : 'Failed to load statistical leaders';
        setLeadersErrorMessage(message);
      } finally {
        if (!controller.signal.aborted) {
          setPendingSelection(null);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [
    accountId,
    apiClient,
    divisionId,
    hasAnyLeaders,
    isHistorical,
    isTeamVariant,
    leaderLimit,
    pendingSelection,
    teamIdFilter,
  ]);

  const defaultStatType = battingCategories.length > 0 ? 'batting' : 'pitching';
  const statType = model?.selection.statType ?? defaultStatType;
  const activeCategories: LeaderCategoryType[] =
    statType === 'batting' ? battingCategories : pitchingCategories;

  const displayedCategoryKey = model?.selection.categoryKey ?? activeCategories[0]?.key ?? null;
  const displayedCategory = displayedCategoryKey
    ? (activeCategories.find((category) => category.key === displayedCategoryKey) ?? null)
    : null;

  const tabCategoryKey = displayedCategory?.key ?? activeCategories[0]?.key ?? '';
  const displayedLeaders: LeaderRowType[] = model?.leaders ?? [];
  const selectedLeagueId = model?.selection.leagueId ?? null;
  const error = categoriesError ?? leadersErrorMessage;
  const showLeagueTabs = resolvedLeagues.length > 1;
  const isUpdatingSelection = pendingSelection !== null;

  const triggerSelectionChange = (
    overrides: Partial<WidgetSelection> & { leagueId?: string | null },
  ) => {
    const fallbackLeagueId =
      overrides.leagueId ??
      model?.selection.leagueId ??
      defaultLeagueId ??
      resolvedLeagues[0]?.id ??
      null;
    const fallbackStatType = overrides.statType ?? model?.selection.statType ?? defaultStatType;
    const preferredCategory =
      overrides.categoryKey ??
      categoryPreferences[fallbackStatType] ??
      (fallbackStatType === model?.selection.statType ? model?.selection.categoryKey : undefined);

    const categoryKey = resolveCategoryForType(
      fallbackStatType,
      battingCategories,
      pitchingCategories,
      preferredCategory,
    );

    if (!fallbackLeagueId || !categoryKey) {
      return;
    }

    const selection = {
      leagueId: fallbackLeagueId,
      statType: fallbackStatType,
      categoryKey,
    };

    if (!isTeamDataFetchable) {
      return;
    }

    if (
      model &&
      model.selection.leagueId === selection.leagueId &&
      model.selection.statType === selection.statType &&
      model.selection.categoryKey === selection.categoryKey
    ) {
      return;
    }

    setPendingSelection(selection);
  };

  const handleLeagueChange = (_: React.SyntheticEvent, value: string) => {
    if (!value) {
      return;
    }
    triggerSelectionChange({ leagueId: value });
  };

  const handleStatTypeChange = (_: React.SyntheticEvent, value: string) => {
    if (value !== 'batting' && value !== 'pitching') {
      return;
    }
    triggerSelectionChange({ statType: value });
  };

  const handleCategoryChange = (_: React.SyntheticEvent, value: string) => {
    if (!value) {
      return;
    }
    triggerSelectionChange({ categoryKey: value });
  };

  useEffect(() => {
    const node = leagueTabsRef.current;
    if (node) {
      const scroller = node.querySelector<HTMLElement>('.MuiTabs-scroller');
      if (scroller) {
        scroller.scrollLeft = 0;
      }
    }
  }, [resolvedLeagues.length]);

  useEffect(() => {
    const node = statTabsRef.current;
    if (node) {
      const scroller = node.querySelector<HTMLElement>('.MuiTabs-scroller');
      if (scroller) {
        scroller.scrollLeft = 0;
      }
    }
  }, [statType]);

  useEffect(() => {
    const node = categoryTabsRef.current;
    if (node) {
      const scroller = node.querySelector<HTMLElement>('.MuiTabs-scroller');
      if (scroller) {
        scroller.scrollLeft = 0;
      }
    }
  }, [tabCategoryKey, activeCategories.length]);

  useEffect(() => {
    if (hasAnyLeaders !== null && onHasLeaders) {
      onHasLeaders(hasAnyLeaders);
    }
  }, [hasAnyLeaders, onHasLeaders]);

  const hasConfiguredCategories = battingCategories.length > 0 || pitchingCategories.length > 0;
  const shouldHideWidget =
    (!error && !hasConfiguredCategories) || (hasAnyLeaders === false && !error);
  if (shouldHideWidget) {
    return null;
  }

  return (
    <WidgetShell
      title={
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          {title}
        </Typography>
      }
      actions={
        <Button component={Link} href={fullStatisticsHref} variant="outlined" size="small">
          View Full Statistics
        </Button>
      }
      accent="primary"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        minWidth: { md: 360 },
        maxWidth: '100%',
      }}
    >
      {!model ? (
        <Box
          sx={{
            minHeight: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          {showLeagueTabs ? (
            <Box
              sx={{
                width: '100%',
                overflowX: 'auto',
                maskImage:
                  'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,1) 70%, rgba(0,0,0,0.85) 100%)',
                WebkitMaskImage:
                  'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,1) 70%, rgba(0,0,0,0.85) 100%)',
              }}
            >
              <Tabs
                ref={leagueTabsRef}
                value={selectedLeagueId}
                onChange={handleLeagueChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                aria-label="Select league"
                sx={{
                  borderBottom: (muiTheme) => `1px solid ${muiTheme.palette.divider}`,
                  minHeight: 48,
                  '& .MuiTabs-flexContainer': {
                    minHeight: 48,
                    justifyContent: 'flex-start',
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 'medium',
                    minHeight: 48,
                    minWidth: 0,
                    paddingLeft: 1,
                    paddingRight: 1,
                  },
                }}
              >
                {resolvedLeagues.map((league) => (
                  <Tab key={league.id} label={league.name} value={league.id} />
                ))}
              </Tabs>
            </Box>
          ) : !isTeamVariant && resolvedLeagues[0] ? (
            <Typography variant="subtitle1" color="text.secondary">
              {resolvedLeagues[0].name}
            </Typography>
          ) : null}

          <Tabs
            ref={statTabsRef}
            value={statType}
            onChange={handleStatTypeChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Select leader type"
            sx={{
              '& .MuiTabs-flexContainer': {
                gap: 1,
                justifyContent: 'flex-start',
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
              '& .MuiTab-root': {
                minWidth: 0,
                paddingLeft: 2,
                paddingRight: 2,
              },
            }}
          >
            <Tab label="Batting" value="batting" sx={buildStatTypeTabSx} />
            <Tab label="Pitching" value="pitching" sx={buildStatTypeTabSx} />
          </Tabs>

          {activeCategories.length > 0 ? (
            <Tabs
              ref={categoryTabsRef}
              value={tabCategoryKey}
              onChange={handleCategoryChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Select leader category"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  minHeight: 36,
                  minWidth: 0,
                  paddingLeft: 1.5,
                  paddingRight: 1.5,
                },
                '& .MuiTabs-flexContainer': {
                  justifyContent: 'flex-start',
                },
              }}
            >
              {activeCategories.map((category) => (
                <Tab key={category.key} label={category.label} value={category.key} />
              ))}
            </Tabs>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No leader categories configured.
            </Typography>
          )}

          <Box sx={{ minHeight: 200 }}>
            {displayedCategory ? (
              <LeaderCategoryPanel
                category={displayedCategory}
                leaders={displayedLeaders}
                loading={false}
                emptyMessage={`No additional ${displayedCategory.label.toLowerCase()} data available`}
                hideTeamInfo={!showTeamInfo}
                hideHeaderWhenCard
                accountId={accountId}
                playerLinkLabelPrefix={title}
              />
            ) : activeCategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No leader categories configured.
              </Typography>
            ) : null}
          </Box>
        </>
      )}

      {isUpdatingSelection && model ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (theme) =>
              alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.7 : 0.5),
            backdropFilter: 'blur(2px)',
            borderRadius: 'inherit',
            zIndex: 10,
          }}
        >
          <CircularProgress size={40} />
        </Box>
      ) : null}

      {error && (
        <Alert severity="error" sx={{ mt: model ? 1 : 0 }}>
          {error}
        </Alert>
      )}
    </WidgetShell>
  );
}
