'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import NextLink from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import {
  StatisticsTableBase,
  formatBattingAverage,
  formatERA,
  formatIPDecimal,
  type ColumnConfig,
} from './StatisticsTable';
import LeaderCard from './LeaderCard';
import TeamBadges from './TeamBadges';
import type { LeaderCategoryType, LeaderRowType } from '@draco/shared-schemas';

type LeaderRow = LeaderRowType;

const MIN_CARD_WIDTH = 380;

const formatters: Record<string, (value: unknown) => string> = {
  average: formatBattingAverage,
  era: formatERA,
  innings: formatIPDecimal,
};

const getFormatter = (format: string) => {
  return formatters[format] ?? ((value: unknown) => String(value ?? '0'));
};

const getLeaderForCard = (leaders: LeaderRow[]): LeaderRow | null => {
  const firstPlaceEntries = leaders.filter((row) => row.rank === 1 && !row.isTie);

  if (firstPlaceEntries.length === 1) {
    return firstPlaceEntries[0];
  }

  if (firstPlaceEntries.length > 1) {
    return {
      playerId: 'tie-entry',
      playerName: `${firstPlaceEntries.length} tied`,
      teams: [],
      teamName: '',
      statValue: firstPlaceEntries[0].statValue,
      category: firstPlaceEntries[0].category,
      rank: 1,
      isTie: true,
      tieCount: firstPlaceEntries.length,
    };
  }

  return null;
};

const processLeadersForTable = (
  leaders: LeaderRow[],
  leaderCard: LeaderRow | null,
): LeaderRow[] => {
  const processed = leaders.map((leader) => {
    if (leader.isTie) {
      return {
        ...leader,
        playerName: `${leader.tieCount} tied`,
        teamName: '',
        teams: [],
      };
    }
    return leader;
  });

  if (leaderCard && !leaderCard.isTie) {
    return processed.filter((leader) => leader.rank !== 1 || leader.isTie);
  }

  return processed;
};

const createLeaderColumns = (
  category: LeaderCategoryType,
  includeTeamColumn: boolean,
  renderPlayerName: ColumnConfig<LeaderRow>['render'],
): ColumnConfig<LeaderRow>[] => {
  const columns: ColumnConfig<LeaderRow>[] = [
    {
      field: 'rank',
      label: '#',
      align: 'center',
      tooltip: 'Rank',
      sortable: false,
      formatter: (value: unknown) => String(value ?? ''),
    },
    {
      field: 'playerName',
      label: 'Player',
      align: 'left',
      sortable: false,
      render: renderPlayerName,
    },
  ];

  if (includeTeamColumn) {
    columns.push({
      field: 'teamName',
      label: 'Team',
      align: 'left',
      sortable: false,
      render: ({ row }) => (
        <TeamBadges
          teams={row.teams as string[] | undefined}
          teamName={row.teamName as string | undefined}
          maxVisible={2}
        />
      ),
    });
  }

  columns.push({
    field: 'statValue',
    label: category.label,
    align: 'right',
    tooltip: category.label,
    primary: true,
    sortable: false,
    formatter: getFormatter(category.format),
  });

  return columns;
};

const getRowKey = (item: LeaderRow, index: number) => {
  if (item.isTie) {
    return `tie-${item.rank}-${index}`;
  }
  return `${item.playerId}-${item.rank}-${index}`;
};

interface LeaderCategoryPanelProps {
  category: LeaderCategoryType;
  leaders: LeaderRow[];
  loading: boolean;
  emptyMessage?: string;
  hideHeaderWhenCard?: boolean;
  onWidthChange?: (width?: number) => void;
  hideTeamInfo?: boolean;
  accountId: string;
  playerLinkLabelPrefix?: string;
}

export default function LeaderCategoryPanel({
  category,
  leaders,
  loading,
  emptyMessage,
  hideHeaderWhenCard = true,
  onWidthChange,
  hideTeamInfo = false,
  accountId,
  playerLinkLabelPrefix,
}: LeaderCategoryPanelProps) {
  const leaderForCard = getLeaderForCard(leaders);
  const processedLeaders = processLeadersForTable(leaders, leaderForCard);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const [cardWidthStore] = useState(() => {
    let snapshot: number | undefined;
    const listeners = new Set<() => void>();

    return {
      getSnapshot: () => snapshot,
      setSnapshot: (next: number | undefined) => {
        if (snapshot === next) {
          return;
        }
        snapshot = next;
        listeners.forEach((listener) => listener());
      },
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  });
  const cardWidth = useSyncExternalStore(
    cardWidthStore.subscribe,
    cardWidthStore.getSnapshot,
    cardWidthStore.getSnapshot,
  );
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLocation = (() => {
    if (!pathname) {
      return null;
    }
    if (!searchParams) {
      return pathname;
    }
    const query = searchParams.toString();
    return query.length > 0 ? `${pathname}?${query}` : pathname;
  })();

  const playerLinkLabel = (() => {
    const prefix = playerLinkLabelPrefix?.trim() ?? '';
    const categoryLabel = category.label?.trim() ?? '';

    if (prefix && categoryLabel) {
      return `${prefix} • ${categoryLabel}`;
    }

    if (prefix) {
      return prefix;
    }

    return categoryLabel || 'Leaders';
  })();

  const buildPlayerHref: ((row: LeaderRow) => string | null) | undefined = accountId
    ? (row: LeaderRow): string | null => {
        if (row.isTie) {
          return null;
        }

        const rawId = row.playerId ?? null;
        if (rawId === null || rawId === undefined) {
          return null;
        }

        const playerId = typeof rawId === 'string' ? rawId.trim() : String(rawId);
        if (!playerId) {
          return null;
        }

        const basePath = `/account/${accountId}/players/${playerId}/statistics`;
        const query = new URLSearchParams();

        if (currentLocation) {
          query.set('returnTo', currentLocation);
          if (playerLinkLabel) {
            query.set('returnLabel', playerLinkLabel);
          }
        }

        const queryString = query.toString();
        return queryString.length > 0 ? `${basePath}?${queryString}` : basePath;
      }
    : undefined;

  const renderPlayerName: ColumnConfig<LeaderRow>['render'] = ({ row, formattedValue }) => {
    const text =
      typeof formattedValue === 'string' || typeof formattedValue === 'number'
        ? formattedValue
        : (row.playerName ?? '');

    const href = buildPlayerHref?.(row) ?? null;
    if (href) {
      return (
        <Typography
          component={NextLink}
          href={href}
          prefetch={false}
          variant="body2"
          fontWeight="medium"
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {text}
        </Typography>
      );
    }

    return (
      <Typography variant="body2" fontWeight="medium">
        {text}
      </Typography>
    );
  };

  useEffect(() => {
    const element = cardContainerRef.current;

    if (!element) {
      cardWidthStore.setSnapshot(undefined);
      return;
    }

    const updateWidth = () => {
      const measuredWidth = element.offsetWidth;
      const previousWidth = cardWidthStore.getSnapshot();
      const nextWidth = Math.max(measuredWidth, MIN_CARD_WIDTH);

      if (previousWidth === undefined) {
        cardWidthStore.setSnapshot(nextWidth);
        return;
      }

      const difference = Math.abs(previousWidth - nextWidth);
      cardWidthStore.setSnapshot(difference > 1 ? nextWidth : previousWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [cardWidthStore, leaderForCard]);

  useEffect(() => {
    if (!onWidthChange) {
      return;
    }

    onWidthChange(cardWidth ? Math.max(cardWidth, MIN_CARD_WIDTH) : undefined);
  }, [cardWidth, onWidthChange]);

  if (!leaderForCard && processedLeaders.length === 0) {
    return null;
  }

  const message = emptyMessage ?? `No additional ${category.label.toLowerCase()} data available`;

  return (
    <Box
      sx={{
        width: { xs: '100%', sm: cardWidth ?? MIN_CARD_WIDTH },
        maxWidth: '100%',
      }}
    >
      {leaderForCard && (
        <Box
          ref={cardContainerRef}
          sx={{
            display: 'inline-block',
            width: { xs: '100%', sm: 'auto' },
            maxWidth: '100%',
          }}
        >
          <LeaderCard
            leader={leaderForCard}
            formatter={getFormatter(category.format)}
            hideTeamInfo={hideTeamInfo}
            accountId={accountId}
            playerLinkLabel={playerLinkLabel}
          />
        </Box>
      )}

      {processedLeaders.length > 0 && (
        <Box
          sx={{
            width: { xs: '100%', sm: cardWidth ?? MIN_CARD_WIDTH },
            maxWidth: '100%',
          }}
        >
          <StatisticsTableBase
            data={processedLeaders}
            columns={createLeaderColumns(category, !hideTeamInfo, renderPlayerName)}
            loading={loading}
            emptyMessage={message}
            getRowKey={getRowKey}
            hideHeader={hideHeaderWhenCard && leaderForCard !== null}
          />
        </Box>
      )}
    </Box>
  );
}
