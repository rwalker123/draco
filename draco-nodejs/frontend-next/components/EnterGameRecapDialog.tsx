'use client';

// TODO: Replace the plain text/textarea input with a WYSIWYG editor (e.g., react-quill, TinyMCE, Slate) for game recaps once React 19 support is available.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpsertGameRecapSchema, UpsertGameRecapType } from '@draco/shared-schemas';
import { useGameRecap } from '../hooks/useGameRecap';

interface EnterGameRecapDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  gameId: string;
  teamSeasonId: string;
  initialRecap?: string;
  teamName?: string;
  gameDate?: string;
  homeScore?: number;
  awayScore?: number;
  homeTeamName?: string;
  awayTeamName?: string;
  readOnly?: boolean;
  onSuccess?: (recap: UpsertGameRecapType) => void;
  onError?: (message: string) => void;
}

const EnterGameRecapDialog: React.FC<EnterGameRecapDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  gameId,
  teamSeasonId,
  initialRecap = '',
  teamName,
  gameDate,
  homeScore,
  awayScore,
  homeTeamName,
  awayTeamName,
  readOnly = false,
  onSuccess,
  onError,
}) => {
  const { saveRecap, loading } = useGameRecap({
    accountId,
    seasonId,
    gameId,
    teamSeasonId,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpsertGameRecapType>({
    resolver: zodResolver(UpsertGameRecapSchema),
    defaultValues: { recap: initialRecap },
    mode: 'onChange',
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      reset({ recap: initialRecap });
      setSubmitError(null);
    }
  }, [initialRecap, open, reset]);

  const formattedGameDate = useMemo(() => {
    if (!gameDate) {
      return null;
    }

    const date = new Date(gameDate);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    return gameDate;
  }, [gameDate]);

  const scoreboardLine = useMemo(() => {
    if (
      homeScore === undefined ||
      awayScore === undefined ||
      !homeTeamName ||
      !awayTeamName
    ) {
      return null;
    }

    return `${awayTeamName} ${awayScore} at ${homeTeamName} ${homeScore}`;
  }, [awayScore, awayTeamName, homeScore, homeTeamName]);

  const recapValue = watch('recap') ?? '';
  const trimmedRecap = recapValue.trim();

  const handleClose = useCallback(() => {
    if (isSubmitting || loading) {
      return;
    }

    setSubmitError(null);
    onClose();
  }, [isSubmitting, loading, onClose]);

  const onSubmit = handleSubmit(async (values) => {
    if (readOnly) {
      return;
    }

    setSubmitError(null);

    const result = await saveRecap(values);

    if (result.success) {
      onSuccess?.(result.data);
      onClose();
      return;
    }

    setSubmitError(result.error);
    onError?.(result.error);
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {readOnly ? 'Game Recap for' : 'Enter Game Recap for'} {teamName}
      </DialogTitle>
      <DialogContent>
        {formattedGameDate && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {formattedGameDate}
          </Typography>
        )}
        {scoreboardLine && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {scoreboardLine}
          </Typography>
        )}

        {readOnly ? (
          <div
            style={{
              whiteSpace: 'pre-line',
              color: 'inherit',
              fontSize: '1rem',
              padding: '12px 0',
              minHeight: '96px',
            }}
            data-testid="game-summary-readonly"
          >
            {trimmedRecap || (
              <span style={{ color: '#888' }}>(No recap provided)</span>
            )}
          </div>
        ) : (
          <TextField
            {...register('recap')}
            label="Game Recap"
            multiline
            minRows={4}
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            error={Boolean(errors.recap)}
            helperText={errors.recap?.message}
            disabled={readOnly}
          />
        )}

        {submitError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" disabled={isSubmitting || loading}>
          Close
        </Button>
        {!readOnly && (
          <Button
            onClick={onSubmit}
            color="primary"
            variant="contained"
            disabled={
              isSubmitting ||
              loading ||
              trimmedRecap.length === 0 ||
              !isDirty
            }
          >
            {isSubmitting || loading ? 'Saving…' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EnterGameRecapDialog;
