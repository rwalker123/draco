'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
} from '@mui/material';
import { getGolfFlightSkins } from '@draco/shared-api-client';
import type { GolfSkinsEntryType } from '@draco/shared-schemas';
import { useApiClient } from '../../../hooks/useApiClient';

interface SkinsLeaderboardProps {
  accountId: string;
  flightId: string;
  weekNumber?: number;
}

type SkinsType = 'actual' | 'net';

export default function SkinsLeaderboard({
  accountId,
  flightId,
  weekNumber,
}: SkinsLeaderboardProps) {
  const apiClient = useApiClient();
  const [skinsType, setSkinsType] = useState<SkinsType>('actual');
  const [entries, setEntries] = useState<GolfSkinsEntryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId || !flightId) return;

    const controller = new AbortController();

    const loadSkins = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getGolfFlightSkins({
          client: apiClient,
          path: { accountId, flightId },
          query: { type: skinsType, weekNumber },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        if (result.error) {
          const errorObj = result.error as { message?: string };
          setError(errorObj?.message ?? 'Failed to load skins data');
        } else {
          setEntries(result.data ?? []);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load skins data');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadSkins();

    return () => {
      controller.abort();
    };
  }, [accountId, flightId, skinsType, weekNumber, apiClient]);

  const handleSkinsTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: SkinsType | null,
  ) => {
    if (value !== null) {
      setSkinsType(value);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={skinsType}
          exclusive
          onChange={handleSkinsTypeChange}
          size="small"
        >
          <ToggleButton value="actual">Actual</ToggleButton>
          <ToggleButton value="net">Net</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && entries.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No skins data available
        </Typography>
      )}

      {!loading &&
        !error &&
        entries.length > 0 &&
        (() => {
          let rank = 1;
          const rankedEntries = entries.map((entry, i) => {
            if (i > 0 && entry.skinsWon < entries[i - 1].skinsWon) {
              rank = i + 1;
            }
            return { ...entry, rank };
          });

          return (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell align="right">Skins Won</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankedEntries.map((entry) => (
                  <TableRow key={entry.contactId}>
                    <TableCell>{entry.rank}</TableCell>
                    <TableCell>
                      {entry.firstName} {entry.lastName}
                    </TableCell>
                    <TableCell>{entry.teamName ?? '—'}</TableCell>
                    <TableCell align="right">{entry.skinsWon}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          );
        })()}
    </Box>
  );
}
