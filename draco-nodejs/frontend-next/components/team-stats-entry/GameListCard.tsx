'use client';

import React, { useRef } from 'react';
import {
  Alert,
  Box,
  ButtonBase,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import type { TeamCompletedGameType } from '@draco/shared-schemas';

import { formatGameDate, getOpponentLabel } from './utils';

export type SortOrder = 'desc' | 'asc';

interface GameListCardProps {
  games: TeamCompletedGameType[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  loading: boolean;
  error: string | null;
}

const scrollStep = 320;

const GameListCard: React.FC<GameListCardProps> = ({
  games,
  selectedGameId,
  onSelectGame,
  sortOrder,
  onSortOrderChange,
  loading,
  error,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleSortChange = (_event: React.MouseEvent<HTMLElement>, value: SortOrder | null) => {
    if (value) {
      onSortOrderChange(value);
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Completed Games"
        subheader="Select a game to view statistics"
        action={
          <ToggleButtonGroup
            value={sortOrder}
            exclusive
            size="small"
            onChange={handleSortChange}
            aria-label="Sort completed games"
          >
            <ToggleButton value="desc">Newest</ToggleButton>
            <ToggleButton value="asc">Oldest</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <Divider />
      <CardContent sx={{ px: 2, py: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} aria-label="Loading completed games" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : games.length === 0 ? (
          <Alert severity="info">No completed games are available yet.</Alert>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              aria-label="Scroll games left"
              onClick={() =>
                containerRef.current?.scrollBy({ left: -scrollStep, behavior: 'smooth' })
              }
              disabled={!games.length}
            >
              <ChevronLeft />
            </IconButton>
            <Box
              ref={containerRef}
              sx={{
                display: 'flex',
                gap: 1.5,
                overflowX: 'auto',
                pb: 0.5,
                flex: 1,
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {games.map((game) => {
                const selected = selectedGameId === game.gameId;

                return (
                  <ButtonBase
                    key={game.gameId}
                    onClick={() => onSelectGame(game.gameId)}
                    aria-label={`Select game ${formatGameDate(game.gameDate)}`}
                    sx={{
                      flexShrink: 0,
                      alignItems: 'flex-start',
                      borderRadius: 2,
                      px: 2,
                      py: 1.25,
                      textAlign: 'left',
                      border: (theme) =>
                        `1px solid ${
                          selected ? theme.palette.primary.main : theme.palette.divider
                        }`,
                      bgcolor: (theme) =>
                        selected ? theme.palette.primary.main : theme.palette.background.paper,
                      color: (theme) =>
                        selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
                      transition: 'background-color 0.2s ease, border-color 0.2s ease',
                      '&:hover': {
                        bgcolor: (theme) =>
                          selected ? theme.palette.primary.dark : theme.palette.action.hover,
                      },
                      '&:focus-visible': {
                        outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {getOpponentLabel(game)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={selected ? 'inherit' : 'text.secondary'}
                        sx={{ opacity: selected ? 0.9 : 1 }}
                      >
                        {formatGameDate(game.gameDate)}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {game.homeScore} - {game.visitorScore}
                      </Typography>
                    </Box>
                  </ButtonBase>
                );
              })}
            </Box>
            <IconButton
              aria-label="Scroll games right"
              onClick={() =>
                containerRef.current?.scrollBy({ left: scrollStep, behavior: 'smooth' })
              }
              disabled={!games.length}
            >
              <ChevronRight />
            </IconButton>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GameListCard;
