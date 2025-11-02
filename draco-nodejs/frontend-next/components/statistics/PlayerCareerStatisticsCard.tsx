import React, { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import StatisticsTable, { type ColumnConfig, type StatsRowBase } from './StatisticsTable';
import type {
  PlayerCareerBattingRowType,
  PlayerCareerPitchingRowType,
  PlayerCareerStatisticsType,
} from '@draco/shared-schemas';

type CareerTab = 'batting' | 'pitching';

interface PlayerCareerStatisticsCardProps {
  stats: PlayerCareerStatisticsType | null;
  loading?: boolean;
  error?: string | null;
  photoUrl?: string;
}

const buildCareerPrependColumns = <
  T extends StatsRowBase & {
    level?: string;
    seasonName?: string | null;
    leagueName?: string | null;
    teamName?: string | null;
  },
>(): ColumnConfig<T>[] => {
  const seasonColumn: ColumnConfig<T> = {
    field: 'seasonName' as keyof T & string,
    label: 'Season',
    align: 'left',
    render: ({ row }) => {
      const label =
        row.level === 'career'
          ? 'Career Totals'
          : row.level === 'season'
            ? (row.seasonName ?? 'Season Totals')
            : (row.seasonName ?? 'Season');

      return (
        <Typography
          variant="body2"
          sx={{
            fontWeight: row.level === 'season' ? 600 : row.level === 'career' ? 700 : 400,
            pl: row.level === 'team' ? 2 : 0,
          }}
        >
          {label}
        </Typography>
      );
    },
  };

  const affiliationColumn: ColumnConfig<T> = {
    field: 'teamName' as keyof T & string,
    label: 'Team',
    align: 'left',
    render: ({ row }) => {
      const league = row.leagueName?.trim();
      const team = row.teamName?.trim();

      if (!league && !team) {
        return '—';
      }

      if (league && team) {
        return `${league} ${team}`;
      }

      return league ?? team ?? '—';
    },
  };

  return [seasonColumn, affiliationColumn];
};

const getRowKey = (
  row: StatsRowBase & { level?: string; seasonName?: string | null },
  index: number,
) => {
  const parts = [
    row.level ?? 'row',
    row.seasonName ?? 'season',
    row.teamName ?? 'team',
    String(index),
  ];
  return parts.join(':');
};

const PlayerCareerStatisticsCard: React.FC<PlayerCareerStatisticsCardProps> = ({
  stats,
  loading = false,
  error = null,
  photoUrl,
}) => {
  const [tab, setTab] = useState<CareerTab>('batting');

  const handleTabChange = (_event: React.SyntheticEvent, value: number) => {
    setTab(value === 0 ? 'batting' : 'pitching');
  };

  const battingRows = useMemo<PlayerCareerBattingRowType[]>(
    () => stats?.batting.rows ?? [],
    [stats],
  );

  const pitchingRows = useMemo<PlayerCareerPitchingRowType[]>(
    () => stats?.pitching.rows ?? [],
    [stats],
  );

  const battingPrependColumns = useMemo(
    () => buildCareerPrependColumns<PlayerCareerBattingRowType>(),
    [],
  );

  const pitchingPrependColumns = useMemo(
    () => buildCareerPrependColumns<PlayerCareerPitchingRowType>(),
    [],
  );

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="body1" color="text.secondary">
            Select a player to view career statistics.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const resolvedPhoto = photoUrl ?? stats.photoUrl ?? undefined;
  const playerHeader = (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar
          src={resolvedPhoto}
          alt={stats.playerName}
          sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}
        >
          {resolvedPhoto ? '' : (stats.playerName?.charAt(0) ?? '?')}
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {stats.playerName}
          </Typography>
          {stats.playerNumber !== null && stats.playerNumber !== undefined ? (
            <Typography variant="subtitle2" color="text.secondary">
              #{stats.playerNumber}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Card variant="outlined">
      <CardContent>
        {playerHeader}
        <Tabs value={tab === 'batting' ? 0 : 1} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Batting" />
          <Tab label="Pitching" />
        </Tabs>

        {tab === 'batting' ? (
          <Box>
            {battingRows.length === 0 ? (
              <Alert severity="info">No batting statistics recorded for this player.</Alert>
            ) : (
              <StatisticsTable<PlayerCareerBattingRowType>
                variant="batting"
                extendedStats={false}
                data={battingRows}
                getRowKey={getRowKey}
                prependColumns={battingPrependColumns}
                omitFields={['playerName', 'playerNumber', 'teamName']}
                emptyMessage="No batting statistics recorded for this player."
                playerLinkLabel="Player Statistics"
              />
            )}
          </Box>
        ) : (
          <Box>
            {pitchingRows.length === 0 ? (
              <Alert severity="info">No pitching statistics recorded for this player.</Alert>
            ) : (
              <StatisticsTable<PlayerCareerPitchingRowType>
                variant="pitching"
                extendedStats={false}
                data={pitchingRows}
                getRowKey={getRowKey}
                prependColumns={pitchingPrependColumns}
                omitFields={['playerName', 'playerNumber', 'teamName']}
                emptyMessage="No pitching statistics recorded for this player."
                playerLinkLabel="Player Statistics"
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerCareerStatisticsCard;
