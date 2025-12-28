'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { AvailablePlayerType, SignPlayerType } from '@draco/shared-schemas';

interface SignPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  onSign: (data: SignPlayerType) => Promise<void>;
  availablePlayers: AvailablePlayerType[];
  loadingPlayers?: boolean;
  teamName?: string;
}

const SignPlayerDialog: React.FC<SignPlayerDialogProps> = ({
  open,
  onClose,
  onSign,
  availablePlayers,
  loadingPlayers = false,
  teamName,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<AvailablePlayerType | null>(null);
  const [initialDifferential, setInitialDifferential] = useState<number | null>(null);
  const [isSub, setIsSub] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedPlayer(null);
      setInitialDifferential(null);
      setIsSub(false);
      setError(null);
    }
  }, [open]);

  const formatPlayerName = useCallback((player: AvailablePlayerType): string => {
    const { firstName, lastName, middleName } = player;
    if (middleName) {
      return `${firstName} ${middleName} ${lastName}`;
    }
    return `${firstName} ${lastName}`;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPlayer) {
      setError('Please select a player');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const signData: SignPlayerType = {
        contactId: selectedPlayer.id,
        initialDifferential,
        isSub,
      };
      await onSign(signData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign player');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPlayer, initialDifferential, isSub, onSign, onClose]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Sign Player{teamName ? ` to ${teamName}` : ''}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth>
            <FormLabel htmlFor="player-select" required>
              Select Player
            </FormLabel>
            <Autocomplete
              id="player-select"
              options={availablePlayers}
              getOptionLabel={(option) => formatPlayerName(option)}
              value={selectedPlayer}
              onChange={(_, newValue) => setSelectedPlayer(newValue)}
              loading={loadingPlayers}
              disabled={isSubmitting}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search players..."
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingPlayers ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Stack>
                    <Typography variant="body1">{formatPlayerName(option)}</Typography>
                    {option.email && (
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}
              noOptionsText="No available players found"
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="initial-differential">Initial Differential</FormLabel>
            <TextField
              id="initial-differential"
              type="number"
              placeholder="e.g., 12.5"
              value={initialDifferential ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setInitialDifferential(val === '' ? null : parseFloat(val));
              }}
              disabled={isSubmitting}
              size="small"
              fullWidth
              helperText="Used for initial handicap calculations"
              inputProps={{ step: 0.1 }}
            />
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={isSub}
                onChange={(e) => setIsSub(e.target.checked)}
                disabled={isSubmitting}
              />
            }
            label="Sign as substitute player"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedPlayer}
        >
          {isSubmitting ? 'Signing...' : 'Sign Player'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignPlayerDialog;
