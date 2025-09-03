'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import PlayersWantedCard from './PlayersWantedCard';
import { IPlayersWantedResponse } from '../../types/playerClassifieds';

interface PlayersWantedDetailDialogProps {
  open: boolean;
  onClose: () => void;
  classified: IPlayersWantedResponse | null;
  canEdit?: (classified: IPlayersWantedResponse) => boolean;
  canDelete?: (classified: IPlayersWantedResponse) => boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PlayersWantedDetailDialog: React.FC<PlayersWantedDetailDialogProps> = ({
  open,
  onClose,
  classified,
  canEdit = () => false,
  canDelete = () => false,
  onEdit = () => {},
  onDelete = () => {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!classified) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Team Details
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 0, py: 0 }}>
        <Box sx={{ p: 2 }}>
          <PlayersWantedCard
            classified={classified}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" fullWidth={isMobile}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlayersWantedDetailDialog;
