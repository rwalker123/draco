'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Paper, Tab, Tabs, Typography, useTheme } from '@mui/material';
import LeaderCategoryPanel from './LeaderCategoryPanel';
import { useLeaderCategories } from '../../hooks/useLeaderCategories';
import { useStatisticalLeaders } from '../../hooks/useStatisticalLeaders';
import type { LeaderCategoryType, LeaderRowType } from '@draco/shared-schemas';

export interface LeagueOption {
  id: string;
  name: string;
}

type StatType = 'batting' | 'pitching';

interface BaseLeadersWidgetProps {
  accountId: string;
  title?: string;
  leaderLimit?: number;
  divisionId?: string | null;
  isHistorical?: boolean;
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

const isTeamVariantProps = (props: LeadersWidgetProps): props is TeamLeadersWidgetProps => {
  return props.variant === 'team';
};

export default function LeadersWidget(props: LeadersWidgetProps) {
  const theme = useTheme();
  const leaderLimit = props.leaderLimit ?? 5;
  const accountId = props.accountId;
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

  const { resolvedLeagues, defaultLeagueId, fullStatisticsHref, teamIdFilter } = useMemo(() => {
    if (isTeamVariant && teamSeasonIdForHref) {
      const leaguesList =
        teamLeaguesProp && teamLeaguesProp.length > 0
          ? teamLeaguesProp
          : teamLeagueIdProp
            ? [{ id: teamLeagueIdProp, name: teamLeagueNameProp ?? 'League' }]
            : [];

      return {
        resolvedLeagues: leaguesList,
        defaultLeagueId: teamLeagueIdProp ?? leaguesList[0]?.id ?? null,
        fullStatisticsHref: `/account/${accountId}/seasons/${teamSeasonSeasonIdProp}/teams/${teamSeasonIdForHref}/stat-entry`,
        teamIdFilter: teamIdProp ?? teamSeasonIdProp,
      };
    }

    const leaguesList = leaguesProp ?? [];
    const defaultId = leaguesList[0]?.id ?? null;
    const statsHref = seasonIdProp
      ? `/account/${accountId}/statistics?seasonId=${seasonIdProp}`
      : `/account/${accountId}/statistics`;

    return {
      resolvedLeagues: leaguesList,
      defaultLeagueId: defaultId,
      fullStatisticsHref: statsHref,
      teamIdFilter: undefined,
    };
  }, [
    accountId,
    isTeamVariant,
    leaguesProp,
    seasonIdProp,
    teamLeaguesProp,
    teamLeagueIdProp,
    teamLeagueNameProp,
    teamSeasonIdProp,
    teamIdProp,
    teamSeasonIdForHref,
    teamSeasonSeasonIdProp,
  ]);

  const title = props.title ?? (isTeamVariant ? DEFAULT_TEAM_TITLE : DEFAULT_ACCOUNT_TITLE);

  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(defaultLeagueId);

  useEffect(() => {
    const desiredLeagueId = defaultLeagueId ?? null;

    if (isTeamVariant) {
      if (desiredLeagueId !== selectedLeagueId) {
        setSelectedLeagueId(desiredLeagueId);
      }
      return;
    }

    if (resolvedLeagues.length === 0) {
      if (selectedLeagueId !== null) {
        setSelectedLeagueId(null);
      }
      return;
    }

    if (!selectedLeagueId || !resolvedLeagues.some((league) => league.id === selectedLeagueId)) {
      setSelectedLeagueId(resolvedLeagues[0].id);
    }
  }, [defaultLeagueId, isTeamVariant, resolvedLeagues, selectedLeagueId]);

  const [statType, setStatType] = useState<StatType>('batting');
  const [requestedCategoryByType, setRequestedCategoryByType] = useState<
    Partial<Record<StatType, string>>
  >({});
  const [displayedCategoryByType, setDisplayedCategoryByType] = useState<
    Partial<Record<StatType, string>>
  >({});
  const [renderStateByType, setRenderStateByType] = useState<
    Partial<
      Record<StatType, { leagueId: string | null; categoryKey: string; leaders: LeaderRowType[] }>
    >
  >({});

  const {
    battingCategories,
    pitchingCategories,
    error: categoriesError,
  } = useLeaderCategories(accountId);

  const ensureCategoryState = useCallback((type: StatType, categories: LeaderCategoryType[]) => {
    if (categories.length === 0) {
      console.debug('[LeadersWidget] no categories available', { statType: type });
      return;
    }

    const availableKeys = new Set(categories.map((category) => category.key));
    const defaultKey = categories[0].key;

    setRequestedCategoryByType((previous) => {
      const current = previous[type];
      const next = current && availableKeys.has(current) ? current : defaultKey;
      if (current === next) {
        return previous;
      }
      console.debug('[LeadersWidget] initializing requested category', {
        statType: type,
        next,
      });
      return { ...previous, [type]: next };
    });
  }, []);

  useEffect(() => {
    ensureCategoryState('batting', battingCategories);
  }, [battingCategories, ensureCategoryState]);

  useEffect(() => {
    ensureCategoryState('pitching', pitchingCategories);
  }, [pitchingCategories, ensureCategoryState]);

  const activeCategories: LeaderCategoryType[] =
    statType === 'batting' ? battingCategories : pitchingCategories;

  const displayedCategoryKey = displayedCategoryByType[statType];
  const requestedCategoryKey =
    requestedCategoryByType[statType] ?? displayedCategoryKey ?? activeCategories[0]?.key;

  const renderState = renderStateByType[statType];
  const resolvedDisplayedKey =
    renderState?.categoryKey ?? displayedCategoryKey ?? requestedCategoryKey ?? null;
  const displayedCategory = useMemo(() => {
    if (!resolvedDisplayedKey) {
      return null;
    }
    return activeCategories.find((category) => category.key === resolvedDisplayedKey) ?? null;
  }, [activeCategories, resolvedDisplayedKey]);

  const requestedCategory = useMemo(() => {
    if (!requestedCategoryKey) {
      return null;
    }
    return activeCategories.find((category) => category.key === requestedCategoryKey) ?? null;
  }, [activeCategories, requestedCategoryKey]);

  const tabCategoryKey =
    displayedCategory?.key ?? requestedCategory?.key ?? activeCategories[0]?.key ?? '';

  const canFetchTeamData = !isTeamVariant || Boolean(teamIdFilter && selectedLeagueId);

  const {
    leaders,
    loading: leadersLoading,
    error: leadersError,
    resolvedCacheKey,
  } = useStatisticalLeaders({
    accountId,
    leagueId: selectedLeagueId,
    categoryKey: requestedCategory?.key,
    divisionId: divisionId ?? undefined,
    teamId: canFetchTeamData ? teamIdFilter : undefined,
    isHistorical,
    limit: leaderLimit,
    enabled: Boolean(selectedLeagueId && requestedCategory?.key && canFetchTeamData),
  });

  const error = categoriesError ?? leadersError;
  const showLeagueTabs = resolvedLeagues.length > 1;
  const buildCacheKey = useCallback(
    (category?: string | null) => {
      if (!selectedLeagueId || !category) {
        return null;
      }
      return JSON.stringify({
        accountId,
        leagueId: selectedLeagueId,
        categoryKey: category,
        divisionId: divisionId ?? null,
        teamId: teamIdFilter ?? null,
        isHistorical: isHistorical ?? null,
        includeAllGameTypes: null,
        limit: leaderLimit ?? null,
      });
    },
    [accountId, divisionId, isHistorical, leaderLimit, selectedLeagueId, teamIdFilter],
  );

  const requestedCacheKey = buildCacheKey(requestedCategoryKey ?? null);
  const displayedLeaders = renderState?.leaders ?? [];
  const [panelWidth, setPanelWidth] = useState<number>();

  const handlePanelWidthChange = useCallback((width?: number) => {
    if (typeof width !== 'number') {
      return;
    }

    setPanelWidth((previous) => {
      if (previous === undefined) {
        return width;
      }

      return Math.abs(previous - width) > 1 ? width : previous;
    });
  }, []);

  const horizontalPadding = theme.spacing(6);
  const contentWidthForPaper = panelWidth
    ? `calc(${panelWidth}px + ${horizontalPadding})`
    : undefined;

  const handleLeagueChange = (_: React.SyntheticEvent, value: string) => {
    setSelectedLeagueId(value);
  };

  const handleStatTypeChange = (_: React.SyntheticEvent, value: string) => {
    if (value !== 'batting' && value !== 'pitching') {
      return;
    }
    console.debug('[LeadersWidget] stat type change requested', {
      from: statType,
      to: value,
    });
    setStatType(value);
  };

  useEffect(() => {
    if (!requestedCategoryKey || !requestedCacheKey) {
      console.debug('[LeadersWidget] awaiting category initialization', {
        statType,
        requestedCategoryKey,
        requestedCacheKey,
      });
      return;
    }
    if (leadersLoading || leadersError) {
      console.debug('[LeadersWidget] waiting for leaders response', {
        statType,
        requestedCategoryKey,
        leadersLoading,
        leadersError,
      });
      return;
    }
    if (resolvedCacheKey !== requestedCacheKey) {
      console.debug('[LeadersWidget] resolved data not yet for requested category', {
        statType,
        requestedCategoryKey,
        resolvedCacheKey,
      });
      return;
    }

    setDisplayedCategoryByType((previous) => {
      if (previous[statType] === requestedCategoryKey) {
        return previous;
      }

      console.debug('[LeadersWidget] updating displayed category', {
        statType,
        requestedCategoryKey,
      });
      return {
        ...previous,
        [statType]: requestedCategoryKey,
      };
    });

    setRenderStateByType((previous) => ({
      ...previous,
      [statType]: {
        leagueId: selectedLeagueId ?? null,
        categoryKey: requestedCategoryKey,
        leaders,
      },
    }));
  }, [
    requestedCategoryKey,
    requestedCacheKey,
    leaders,
    leadersLoading,
    leadersError,
    selectedLeagueId,
    resolvedCacheKey,
    statType,
  ]);

  const handleCategoryChange = (_: React.SyntheticEvent, value: string) => {
    if (!value || value === requestedCategoryKey) {
      console.debug('[LeadersWidget] category change ignored', {
        statType,
        value,
        requestedCategoryKey,
      });
      return;
    }
    console.debug('[LeadersWidget] category change requested', {
      statType,
      value,
      requestedCategoryKey,
    });
    setRequestedCategoryByType((previous) => {
      if (previous[statType] === value) {
        return previous;
      }
      return { ...previous, [statType]: value };
    });
  };

  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: { xs: '100%', md: contentWidthForPaper ?? 'fit-content' },
        minWidth: { md: 360 },
        maxWidth: '100%',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
        <Button component={Link} href={fullStatisticsHref} variant="outlined" size="small">
          View Full Statistics
        </Button>
      </Box>

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
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'medium',
                minHeight: 48,
              },
            }}
          >
            {resolvedLeagues.map((league) => (
              <Tab key={league.id} label={league.name} value={league.id} />
            ))}
          </Tabs>
        </Box>
      ) : resolvedLeagues[0] ? (
        <Typography variant="subtitle1" color="text.secondary">
          {resolvedLeagues[0].name}
        </Typography>
      ) : null}

      <Tabs
        value={statType}
        onChange={handleStatTypeChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Select leader type"
        sx={{
          '& .MuiTabs-flexContainer': {
            gap: 1,
          },
          '& .MuiTab-root': {
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            border: (muiTheme) => `1px solid ${muiTheme.palette.divider}`,
            backgroundColor: (muiTheme) => muiTheme.palette.background.paper,
          },
          '& .Mui-selected': {
            backgroundColor: (muiTheme) => muiTheme.palette.primary.main,
            color: (muiTheme) => muiTheme.palette.primary.contrastText,
          },
        }}
      >
        <Tab label="Batting" value="batting" />
        <Tab label="Pitching" value="pitching" />
      </Tabs>

      {activeCategories.length > 0 ? (
        <Tabs
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

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ minHeight: 200 }}>
        {displayedCategory ? (
          <LeaderCategoryPanel
            category={displayedCategory}
            leaders={displayedLeaders}
            loading={false}
            emptyMessage={`No additional ${displayedCategory.label.toLowerCase()} data available`}
            onWidthChange={handlePanelWidthChange}
            hideTeamInfo={!showTeamInfo}
            hideHeaderWhenCard
          />
        ) : activeCategories.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No leader categories configured.
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
}
