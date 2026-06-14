'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { listTeamSeasonGames } from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import NextGameInline from './NextGameInline';
import FieldLink from './fields/FieldLink';
import { FieldDetails } from './fields/FieldDetailsCard';

interface MyTeamNextGameProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
  timeZone: string;
}

interface NormalizedNextGame {
  gameDate: string;
  isHome: boolean;
  opponent: { id: string; name?: string | null };
  field: FieldDetails | null;
}

const toCoordinate = (value: unknown): string | number | null =>
  typeof value === 'number' || typeof value === 'string' ? value : null;

const FIELD_NAME_MAX_LENGTH = 20;

const truncateFieldName = (name?: string | null): string | null => {
  if (!name) return null;
  return name.length > FIELD_NAME_MAX_LENGTH
    ? `${name.slice(0, FIELD_NAME_MAX_LENGTH - 1)}…`
    : name;
};

const MyTeamNextGame: React.FC<MyTeamNextGameProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  timeZone,
}) => {
  const apiClient = useApiClient();
  const theme = useTheme();
  const [nextGame, setNextGame] = useState<NormalizedNextGame | null>(null);

  useEffect(() => {
    if (!accountId || !seasonId || !teamSeasonId) {
      return;
    }

    const controller = new AbortController();

    const loadNextGame = async () => {
      try {
        const result = await listTeamSeasonGames({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          query: { upcoming: true, recent: false, limit: 1 },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(result, 'Failed to load next game');
        const game = data.upcoming?.[0];

        if (!game) {
          setNextGame(null);
          return;
        }

        const isHome = game.homeTeam.id === teamSeasonId;
        const opponent = isHome ? game.visitorTeam : game.homeTeam;
        const field = game.field;

        setNextGame({
          gameDate: game.gameDate,
          isHome,
          opponent: { id: opponent.id, name: opponent.name },
          field: field
            ? {
                id: field.id,
                name: field.name,
                shortName: field.shortName,
                hasLights: field.hasLights,
                address: field.address ?? null,
                city: field.city ?? null,
                state: field.state ?? null,
                zip: field.zip ?? null,
                rainoutNumber: field.rainoutNumber ?? null,
                comment: field.comment ?? null,
                directions: field.directions ?? null,
                latitude: toCoordinate(field.latitude),
                longitude: toCoordinate(field.longitude),
              }
            : null,
        });
      } catch {
        if (controller.signal.aborted) return;
        setNextGame(null);
      }
    };

    void loadNextGame();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, teamSeasonId, apiClient]);

  if (!nextGame) return null;

  const detailBackdrop = alpha(
    theme.palette.text.primary,
    theme.palette.mode === 'dark' ? 0.18 : 0.06,
  );

  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        mt: 0.5,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: theme.palette.widget.border,
        bgcolor: detailBackdrop,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: 'primary.main' }}>
        Next Game
      </Typography>
      <Box sx={{ color: 'text.secondary' }}>
        <NextGameInline
          accountId={accountId}
          seasonId={seasonId}
          gameDate={nextGame.gameDate}
          isHome={nextGame.isHome}
          opponent={nextGame.opponent}
          timeZone={timeZone}
          showTime
        />
      </Box>
      {nextGame.field && (
        <FieldLink
          field={nextGame.field}
          label={truncateFieldName(nextGame.field.name ?? nextGame.field.shortName)}
        />
      )}
    </Box>
  );
};

export default MyTeamNextGame;
