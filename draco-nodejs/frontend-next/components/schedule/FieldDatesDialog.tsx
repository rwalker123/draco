'use client';

import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import type { Game } from '@/types/schedule';
import {
  formatFieldGameDate,
  formatFieldGameMatchup,
  formatFieldGameResult,
  formatFieldGameTime,
  selectFieldGames,
} from './utils/fieldGames';

interface FieldDatesDialogProps {
  open: boolean;
  onClose: () => void;
  fieldId: string | null;
  fieldName: string;
  games: Game[];
  timeZone: string;
  onExport?: () => void;
  onPrint?: () => void;
}

const FieldDatesDialog: React.FC<FieldDatesDialogProps> = ({
  open,
  onClose,
  fieldId,
  fieldName,
  games,
  timeZone,
  onExport,
  onPrint,
}) => {
  const fieldGames = selectFieldGames(games, fieldId);
  const hasActions = Boolean(onExport || onPrint);
  const hasGames = fieldGames.length > 0;

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
                    <Typography variant="body2">{formatFieldGameDate(game, timeZone)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatFieldGameTime(game, timeZone)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{game.league?.name ?? ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatFieldGameMatchup(game)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatFieldGameResult(game)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      {hasActions ? (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {onExport ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={onExport}
              disabled={!hasGames}
            >
              Export CSV
            </Button>
          ) : null}
          {onPrint ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={onPrint}
              disabled={!hasGames}
            >
              Print
            </Button>
          ) : null}
        </DialogActions>
      ) : null}
    </Dialog>
  );
};

export default FieldDatesDialog;
