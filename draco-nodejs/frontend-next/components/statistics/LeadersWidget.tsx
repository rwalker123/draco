'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Tab, Tabs, Typography, type Theme } from '@mui/material';
import LeaderCategoryPanel from './LeaderCategoryPanel';
import { useLeaderCategories } from '../../hooks/useLeaderCategories';
import { useStatisticalLeaders } from '../../hooks/useStatisticalLeaders';
import type { LeaderCategoryType, LeaderRowType } from '@draco/shared-schemas';
import WidgetShell from '../ui/WidgetShell';

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
  randomize?: boolean;
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

const computeStableHash = (input: string): number => {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash >>> 0;
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

  const [preferredLeagueId, setPreferredLeagueId] = useState<string | null>(null);
  const randomizedLeagueId = useMemo(() => {
    if (!randomize || isTeamVariant || resolvedLeagues.length === 0) {
      return null;
    }
    const seedInput = `${accountId}-${resolvedLeagues.map((league) => league.id).join('|')}`;
    const leagueIndex = computeStableHash(seedInput) % resolvedLeagues.length;
    return resolvedLeagues[leagueIndex]?.id ?? null;
  }, [accountId, isTeamVariant, randomize, resolvedLeagues]);

  const selectedLeagueId = useMemo(() => {
    if (isTeamVariant) {
      return defaultLeagueId ?? null;
    }

    if (resolvedLeagues.length === 0) {
      return null;
    }

    const isValidLeagueId = (leagueId?: string | null) =>
      Boolean(leagueId && resolvedLeagues.some((league) => league.id === leagueId));

    if (isValidLeagueId(preferredLeagueId)) {
      return preferredLeagueId;
    }

    if (isValidLeagueId(randomizedLeagueId)) {
      return randomizedLeagueId;
    }

    if (isValidLeagueId(defaultLeagueId)) {
      return defaultLeagueId;
    }

    return resolvedLeagues[0]?.id ?? null;
  }, [defaultLeagueId, isTeamVariant, preferredLeagueId, randomizedLeagueId, resolvedLeagues]);

  const [preferredStatType, setPreferredStatType] = useState<StatType | null>(null);
  const [requestedCategoryByType, setRequestedCategoryByType] = useState<
    Partial<Record<StatType, string>>
  >({});
  const leagueTabsRef = useRef<HTMLDivElement | null>(null);
  const statTabsRef = useRef<HTMLDivElement | null>(null);
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);

  const {
    battingCategories,
    pitchingCategories,
    error: categoriesError,
  } = useLeaderCategories(accountId);

  const randomSelection = useMemo(() => {
    if (!randomize) {
      return null;
    }

    const battingCount = battingCategories.length;
    const pitchingCount = pitchingCategories.length;
    const totalCategories = battingCount + pitchingCount;

    if (totalCategories === 0) {
      return null;
    }

    const seedSource = `${accountId}-${battingCategories
      .map((category) => category.key)
      .join(
        '|',
      )}-${pitchingCategories.map((category) => category.key).join('|')}-${totalCategories}`;
    const seed = computeStableHash(seedSource);
    const chosenType: StatType = seed < battingCount ? 'batting' : 'pitching';
    const categoryIndex = chosenType === 'batting' ? seed : seed - battingCount;
    const categoriesForType = chosenType === 'batting' ? battingCategories : pitchingCategories;
    const chosenCategory = categoriesForType[categoryIndex];

    if (!chosenCategory) {
      return null;
    }

    return {
      statType: chosenType,
      categoryKey: chosenCategory.key,
    };
  }, [accountId, battingCategories, pitchingCategories, randomize]);

  const statType = preferredStatType ?? randomSelection?.statType ?? 'batting';

  const activeCategories: LeaderCategoryType[] =
    statType === 'batting' ? battingCategories : pitchingCategories;

  const resolveCategoryKey = (key?: string | null) => {
    if (!key) {
      return undefined;
    }
    return activeCategories.some((category) => category.key === key) ? key : undefined;
  };

  const storedDisplayedCategoryKey = resolveCategoryKey(
    requestedCategoryByType[statType] ?? undefined,
  );
  const requestedCategoryKey = storedDisplayedCategoryKey ?? activeCategories[0]?.key;

  const requestedCategory = useMemo(() => {
    if (!requestedCategoryKey) {
      return null;
    }
    return activeCategories.find((category) => category.key === requestedCategoryKey) ?? null;
  }, [activeCategories, requestedCategoryKey]);

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

  const resolveRenderState = useMemo(() => {
    if (
      requestedCategoryKey &&
      resolvedCacheKey === buildCacheKey(requestedCategoryKey ?? null) &&
      !leadersLoading &&
      !leadersError
    ) {
      return {
        leagueId: selectedLeagueId ?? null,
        categoryKey: requestedCategoryKey,
        leaders,
      };
    }
    return null;
  }, [
    buildCacheKey,
    leaders,
    leadersError,
    leadersLoading,
    requestedCategoryKey,
    resolvedCacheKey,
    selectedLeagueId,
  ]);

  const resolvedDisplayedKey =
    resolveCategoryKey(resolveRenderState?.categoryKey) ?? requestedCategoryKey ?? null;

  const displayedCategory = useMemo(() => {
    if (!resolvedDisplayedKey) {
      return null;
    }
    return activeCategories.find((category) => category.key === resolvedDisplayedKey) ?? null;
  }, [activeCategories, resolvedDisplayedKey]);

  const tabCategoryKey =
    displayedCategory?.key ?? requestedCategory?.key ?? activeCategories[0]?.key ?? '';

  const displayedLeaders: LeaderRowType[] = resolveRenderState?.leaders ?? [];

  const resetTabsScrollLeft = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      return;
    }
    const scroller = node.querySelector<HTMLElement>('.MuiTabs-scroller');
    if (scroller) {
      scroller.scrollLeft = 0;
    }
  }, []);

  const handleLeagueChange = (_: React.SyntheticEvent, value: string) => {
    if (!value || value === selectedLeagueId) {
      return;
    }
    setPreferredLeagueId(value);
  };

  const handleStatTypeChange = (_: React.SyntheticEvent, value: string) => {
    if (value !== 'batting' && value !== 'pitching') {
      return;
    }
    console.debug('[LeadersWidget] stat type change requested', {
      from: statType,
      to: value,
    });
    setPreferredStatType(value);
  };

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

  useEffect(() => {
    resetTabsScrollLeft(leagueTabsRef.current);
  }, [resetTabsScrollLeft, resolvedLeagues.length]);

  useEffect(() => {
    resetTabsScrollLeft(statTabsRef.current);
  }, [resetTabsScrollLeft, statType]);

  useEffect(() => {
    resetTabsScrollLeft(categoryTabsRef.current);
  }, [resetTabsScrollLeft, tabCategoryKey, activeCategories.length]);

  const hasConfiguredCategories = battingCategories.length > 0 || pitchingCategories.length > 0;
  const shouldHideWidget = !error && !hasConfiguredCategories;
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
    </WidgetShell>
  );
}
