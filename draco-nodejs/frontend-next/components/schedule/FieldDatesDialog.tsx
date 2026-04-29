'use client';

import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Game } from '@/types/schedule';
import { GameStatus } from '@/types/schedule';
import { formatDateInTimezone, formatTimeInTimezone } from '../../utils/dateUtils';

interface FieldDatesDialogProps {
  open: boolean;
  onClose: () => void;
  fieldId: string | null;
  fieldName: string;
  games: Game[];
  timeZone: string;
}

const normalizeFieldId = (value?: string | null): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return null;
};

const matchesField = (game: Game, fieldId: string | null): boolean => {
  const gameFieldId = normalizeFieldId(game.field?.id) ?? normalizeFieldId(game.fieldId) ?? null;
  return gameFieldId === fieldId;
};

const sortByGameDate = (a: Game, b: Game): number => {
  return new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
};

const formatMatchup = (game: Game): string => {
  const home = game.homeTeamName || game.homeTeamId;
  const visitor = game.visitorTeamName || game.visitorTeamId;
  return `${home} vs ${visitor}`;
};

const formatResult = (game: Game): string => {
  if (game.gameStatus === GameStatus.Scheduled) {
    return 'Upcoming';
  }
  return game.gameStatusText || '—';
};

const FieldDatesDialog: React.FC<FieldDatesDialogProps> = ({
  open,
  onClose,
  fieldId,
  fieldName,
  games,
  timeZone,
}) => {
  const fieldGames = games.filter((game) => matchesField(game, fieldId)).sort(sortByGameDate);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Box>
          <Typography variant="h6" component="span" fontWeight={700}>
            {fieldName}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {fieldGames.length} {fieldGames.length === 1 ? 'game' : 'games'} scheduled
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {fieldGames.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No games found for this field.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="caption" fontWeight={700}>
                    Date
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={700}>
                    Time
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={700}>
                    League
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={700}>
                    Matchup
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={700}>
                    Result
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fieldGames.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDateInTimezone(game.gameDate, timeZone, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTimeInTimezone(game.gameDate, timeZone)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{game.league?.name ?? ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatMatchup(game)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatResult(game)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FieldDatesDialog;
