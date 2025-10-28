'use client';

import React from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
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

const GameListCard: React.FC<GameListCardProps> = ({
  games,
  selectedGameId,
  onSelectGame,
  sortOrder,
  onSortOrderChange,
  loading,
  error,
}) => {
  const handleSortChange = (_event: React.MouseEvent<HTMLElement>, value: SortOrder | null) => {
    if (value) {
      onSortOrderChange(value);
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Completed Games"
        subheader="Select a game to view its box score"
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
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} aria-label="Loading completed games" />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : games.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="info">No completed games are available yet.</Alert>
          </Box>
        ) : (
          <List disablePadding>
            {games.map((game) => (
              <ListItem key={game.gameId} disablePadding>
                <ListItemButton
                  selected={selectedGameId === game.gameId}
                  onClick={() => onSelectGame(game.gameId)}
                  sx={{ alignItems: 'flex-start', py: 1.5 }}
                  aria-label={`Select game ${formatGameDate(game.gameDate)}`}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
                        {getOpponentLabel(game)}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {formatGameDate(game.gameDate)}
                        </Typography>
                        <Typography component="span" variant="body2" sx={{ mt: 0.5 }}>
                          {game.homeScore} - {game.visitorScore}
                        </Typography>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default GameListCard;
