'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export interface NoWaiverPlayer {
  contactId: string;
  fullName: string;
  teams: Array<{ leagueName: string; teamName: string }>;
}

interface NoWaiverPlayersDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  players: NoWaiverPlayer[];
  onExport: () => void;
  exporting: boolean;
  exportError: string | null;
}

export default function NoWaiverPlayersDialog({
  open,
  onClose,
  title,
  players,
  onExport,
  exporting,
  exportError,
}: NoWaiverPlayersDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {exportError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {exportError}
          </Alert>
        )}
        {players.length === 0 ? (
          <Alert severity="success">No players are missing a waiver.</Alert>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {players.length} player{players.length !== 1 ? 's' : ''} with no waiver:
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '40%', fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.contactId}>
                      <TableCell sx={{ verticalAlign: 'top', wordBreak: 'break-word' }}>
                        {player.fullName}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {player.teams.map((team, idx) => (
                            <Chip
                              key={idx}
                              size="small"
                              color="error"
                              variant="outlined"
                              label={`${team.leagueName} / ${team.teamName}`}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          size="small"
          startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
          onClick={onExport}
          disabled={exporting || players.length === 0}
          aria-label="Export CSV"
        >
          Export CSV
        </Button>
      </DialogActions>
    </Dialog>
  );
}
