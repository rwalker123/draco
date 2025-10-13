import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Twitter as TwitterIcon,
} from '@mui/icons-material';
import type { GameRecapType, GameResultType, UpdateGameResultsType } from '@draco/shared-schemas';
import { UpdateGameResultsSchema } from '@draco/shared-schemas';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GameStatus } from '../types/schedule';
import { formatDateTimeInTimezone } from '../utils/dateUtils';
import { DEFAULT_TIMEZONE } from '../utils/timezones';
import { useGameResults } from '../hooks/useGameResults';

type TeamSummary = {
  id: string;
  name?: string | null;
};

export interface EnterGameResultsDialogGame {
  id: string;
  seasonId: string;
  gameDate: string;
  homeTeam: TeamSummary;
  visitorTeam: TeamSummary;
  homeScore: number;
  visitorScore: number;
  gameStatus: number;
  gameStatusText?: string;
  leagueName?: string;
  fieldId?: string | null;
  fieldName?: string | null;
  fieldShortName?: string | null;
  recaps?: GameRecapType[];
}

export interface GameResultsSuccessPayload {
  gameId: string;
  seasonId: string;
  result: GameResultType;
  request: UpdateGameResultsType;
}

interface EnterGameResultsDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  game: EnterGameResultsDialogGame | null;
  onSuccess?: (payload: GameResultsSuccessPayload) => void;
  timeZone?: string;
}

const gameStatusOptions = [
  { value: 0, label: 'Incomplete' },
  { value: 1, label: 'Final' },
  { value: 2, label: 'Rainout' },
  { value: 3, label: 'Postponed' },
  { value: 4, label: 'Forfeit' },
  { value: 5, label: 'Did Not Report' },
];

const defaultFormValues: UpdateGameResultsType = {
  homeScore: 0,
  visitorScore: 0,
  gameStatus: GameStatus.Scheduled,
  emailPlayers: false,
  postToTwitter: false,
  postToBluesky: false,
  postToFacebook: false,
};

const mapGameToFormValues = (game: EnterGameResultsDialogGame | null): UpdateGameResultsType => ({
  homeScore: game?.homeScore ?? defaultFormValues.homeScore,
  visitorScore: game?.visitorScore ?? defaultFormValues.visitorScore,
  gameStatus: game?.gameStatus ?? defaultFormValues.gameStatus,
  emailPlayers: defaultFormValues.emailPlayers,
  postToTwitter: defaultFormValues.postToTwitter,
  postToBluesky: defaultFormValues.postToBluesky,
  postToFacebook: defaultFormValues.postToFacebook,
});

const EnterGameResultsDialog: React.FC<EnterGameResultsDialogProps> = ({
  open,
  onClose,
  accountId,
  game,
  onSuccess,
  timeZone = DEFAULT_TIMEZONE,
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateGameResultsType>({
    resolver: zodResolver(UpdateGameResultsSchema),
    defaultValues: mapGameToFormValues(game ?? null),
  });

  const { submitResults, loading, error, resetError } = useGameResults({
    accountId,
    seasonId: game?.seasonId ?? '',
  });

  // Initialize form data when game changes
  React.useEffect(() => {
    if (!game) {
      reset(defaultFormValues);
      setFormError(null);
      resetError();
      return;
    }

    reset(mapGameToFormValues(game));
    setFormError(null);
    resetError();
  }, [game, reset, resetError]);

  const handleSave = handleSubmit(async (values) => {
    if (!game) {
      return;
    }

    if (!game.seasonId) {
      setFormError('Missing season information for the selected game.');
      return;
    }

    setFormError(null);

    try {
      const result = await submitResults(game.id, values);

      onSuccess?.({
        gameId: game.id,
        seasonId: game.seasonId,
        result,
        request: values,
      });

      onClose();
    } catch {
      // Error state is managed by the service hook; no additional handling required.
    }
  });

  const formatGameTime = (dateString: string) => {
    return formatDateTimeInTimezone(dateString, timeZone, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDisplayFieldName = (gameDetails: EnterGameResultsDialogGame) => {
    if (gameDetails.fieldName) {
      return gameDetails.fieldName;
    }

    if (gameDetails.fieldShortName) {
      return gameDetails.fieldShortName;
    }

    return null;
  };

  if (!game) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth={false}
      sx={{
        '& .MuiDialog-paper': {
          margin: '32px',
          maxHeight: 'calc(100% - 64px)',
          width: '70%',
          maxWidth: '600px',
        },
        zIndex: 1400,
      }}
      PaperProps={{
        sx: {
          background: 'background.paper',
          color: 'text.primary',
          borderRadius: 2,
          minHeight: '600px',
          maxHeight: '85vh',
          overflow: 'auto',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Typography variant="h6" component="div" fontWeight={700}>
          Enter Game Results
        </Typography>
        <Button onClick={onClose} sx={{ color: 'text.secondary', minWidth: 'auto', p: 0 }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 2, px: 3 }}>
        {(formError || error) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError ?? error}
          </Alert>
        )}

        {/* Game Information Display */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1, mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Game Information
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.primary" fontWeight={600}>
                Date/Time:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatGameTime(game.gameDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.primary" fontWeight={600}>
                Field:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getDisplayFieldName(game) || 'TBD'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.primary" fontWeight={600}>
                League:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {game.leagueName ?? 'Unknown League'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Game Status and Teams */}
        <Box sx={{ mb: 3 }}>
          {/* Game Status */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                Game Status:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200 }} error={Boolean(errors.gameStatus)}>
                <Controller
                  name="gameStatus"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            zIndex: 1500,
                            '& .MuiMenuItem-root': {
                              color: 'text.primary',
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                              '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                },
                              },
                            },
                          },
                        },
                        sx: {
                          zIndex: 1500,
                        },
                        container: document.body,
                      }}
                      sx={{
                        color: 'text.primary',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'text.secondary',
                        },
                      }}
                    >
                      {gameStatusOptions.map((option) => (
                        <MenuItem
                          key={option.value}
                          value={option.value}
                          sx={{
                            color: 'text.primary',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                            '&.Mui-selected': {
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              },
                            },
                          }}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.gameStatus && (
                  <FormHelperText error>{errors.gameStatus.message}</FormHelperText>
                )}
              </FormControl>
            </Box>
          </Box>

          {/* Team Scores */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
            {/* Away Team */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: '300px' }}>
              <Typography
                variant="h6"
                component="div"
                color="text.primary"
                fontWeight={600}
                sx={{ minWidth: '150px' }}
              >
                {game.visitorTeam.name ?? 'Away Team'}
              </Typography>
              <Controller
                name="visitorScore"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    value={field.value ?? 0}
                    onChange={(e) => {
                      const numericValue = Number(e.target.value);
                      field.onChange(Number.isNaN(numericValue) ? 0 : numericValue);
                    }}
                    inputProps={{ min: 0 }}
                    size="medium"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    sx={{
                      width: '100px',
                      '& .MuiOutlinedInput-root': {
                        color: 'text.primary',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        '& fieldset': {
                          borderColor: 'divider',
                          borderWidth: '2px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'text.secondary',
                      },
                      '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                        {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                        textAlign: 'center',
                      },
                    }}
                  />
                )}
              />
            </Box>

            {/* Home Team */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: '300px' }}>
              <Typography
                variant="h6"
                component="div"
                color="text.primary"
                fontWeight={600}
                sx={{ minWidth: '150px' }}
              >
                {game.homeTeam.name ?? 'Home Team'}
              </Typography>
              <Controller
                name="homeScore"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    value={field.value ?? 0}
                    onChange={(e) => {
                      const numericValue = Number(e.target.value);
                      field.onChange(Number.isNaN(numericValue) ? 0 : numericValue);
                    }}
                    inputProps={{ min: 0 }}
                    size="medium"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    sx={{
                      width: '100px',
                      '& .MuiOutlinedInput-root': {
                        color: 'text.primary',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        '& fieldset': {
                          borderColor: 'divider',
                          borderWidth: '2px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'text.secondary',
                      },
                      '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                        {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                        textAlign: 'center',
                      },
                    }}
                  />
                )}
              />
            </Box>
          </Box>
        </Box>

        {/* Notification Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Notifications & Social Media
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 2,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Controller
              name="emailPlayers"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      sx={{
                        color: 'text.secondary',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      <Typography variant="body2" color="text.primary">
                        Email game results to players
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
            <Controller
              name="postToTwitter"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      sx={{
                        color: 'text.secondary',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TwitterIcon fontSize="small" />
                      <Typography variant="body2" color="text.primary">
                        Post to Twitter
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
            <Controller
              name="postToBluesky"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      sx={{
                        color: 'text.secondary',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label="BS"
                        size="small"
                        sx={{ bgcolor: '#0085FF', color: 'white', fontSize: '0.75rem' }}
                      />
                      <Typography variant="body2" color="text.primary">
                        Post to Bluesky
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
            <Controller
              name="postToFacebook"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      sx={{
                        color: 'text.secondary',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label="FB"
                        size="small"
                        sx={{ bgcolor: '#1877F2', color: 'white', fontSize: '0.75rem' }}
                      />
                      <Typography variant="body2" color="text.primary">
                        Post to Facebook
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Saving...' : 'Save Results'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnterGameResultsDialog;
