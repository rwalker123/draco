import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Stack,
  FormHelperText,
} from '@mui/material';
import { Controller, FormProvider, useForm, useWatch, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TeamSeasonType, UpsertGameSchema } from '@draco/shared-schemas';
import { Game, GameType, League, Field, Umpire, GameStatus } from '@/types/schedule';
import { GameFormProvider } from '../contexts/GameFormContext';
import GameFormFields from '../../../app/account/[accountId]/schedule/GameFormFields';
import { useGameOperations, GameFormValues } from '../hooks/useGameOperations';
import { convertUTCToZonedDate, formatGameDateTime } from '../../../utils/dateUtils';

interface GameDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  title: string;
  accountId: string;
  timeZone: string;
  selectedGame?: Game | null;
  leagues: League[];
  fields: Field[];
  umpires: Umpire[];
  leagueTeamsCache: Map<string, TeamSeasonType[]>;
  currentSeasonName?: string;
  canEditSchedule: boolean;
  isAccountAdmin: boolean;
  defaultLeagueSeasonId?: string;
  defaultGameDate?: Date;
  onClose: () => void;
  onSuccess?: (result: { message: string }) => void;
  onError?: (error: string) => void;
  onDelete?: () => void;
  getTeamName: (teamId: string) => string;
  getFieldName: (fieldId?: string) => string;
  getGameTypeText: (gameType: number | string) => string;
}

const preprocessDate = (message: string) =>
  z.preprocess((value) => {
    if (value instanceof Date) {
      return value;
    }
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value as string);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, z.date(message));

const createGameDialogSchema = (gameStatus: number, timeZone: string) =>
  z
    .object({
      leagueSeasonId: z.string('League is required').trim().min(1, 'League is required'),
      gameDate: preprocessDate('Game date is required'),
      gameTime: preprocessDate('Game time is required'),
      homeTeamId: z.string('Home team is required').trim().min(1, 'Home team is required'),
      visitorTeamId: z.string('Visitor team is required').trim().min(1, 'Visitor team is required'),
      fieldId: z.string().nullable().optional(),
      comment: z
        .string()
        .max(255, 'Comment must be 255 characters or fewer')
        .optional()
        .transform((value) => (value ?? '').trim()),
      gameType: z.number('Game type is required').int().min(0).max(2),
      umpire1: z.string().nullable().optional(),
      umpire2: z.string().nullable().optional(),
      umpire3: z.string().nullable().optional(),
      umpire4: z.string().nullable().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.homeTeamId === data.visitorTeamId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['homeTeamId'],
          message: 'Home and visitor teams must be different',
        });
      }

      const gameDateTime = formatGameDateTime(data.gameDate, data.gameTime, timeZone);
      const validationResult = UpsertGameSchema.safeParse({
        leagueSeasonId: data.leagueSeasonId,
        gameDate: gameDateTime,
        gameStatus,
        gameType: data.gameType,
        comment: data.comment ?? '',
        homeTeam: { id: data.homeTeamId },
        visitorTeam: { id: data.visitorTeamId },
        field: data.fieldId ? { id: data.fieldId } : null,
        umpire1: data.umpire1 ? { id: data.umpire1 } : null,
        umpire2: data.umpire2 ? { id: data.umpire2 } : null,
        umpire3: data.umpire3 ? { id: data.umpire3 } : null,
        umpire4: data.umpire4 ? { id: data.umpire4 } : null,
      });

      if (!validationResult.success) {
        const pathMap: Record<string, keyof GameDialogFormValues> = {
          homeTeam: 'homeTeamId',
          visitorTeam: 'visitorTeamId',
          field: 'fieldId',
          umpire1: 'umpire1',
          umpire2: 'umpire2',
          umpire3: 'umpire3',
          umpire4: 'umpire4',
        };

        validationResult.error.issues.forEach((issue) => {
          const firstPathSegment = issue.path[0] as string | undefined;
          const mappedPath = firstPathSegment && pathMap[firstPathSegment];

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: mappedPath ? [mappedPath] : issue.path,
            message: issue.message,
          });
        });
      }
    });

type GameDialogSchema = ReturnType<typeof createGameDialogSchema>;
export type GameDialogFormValues = z.infer<GameDialogSchema>;

const GameDialog: React.FC<GameDialogProps> = ({
  open,
  mode,
  title,
  accountId,
  timeZone,
  selectedGame,
  leagues,
  fields,
  umpires,
  leagueTeamsCache,
  currentSeasonName,
  canEditSchedule,
  isAccountAdmin,
  defaultLeagueSeasonId,
  defaultGameDate,
  onClose,
  onSuccess,
  onError,
  onDelete,
  getTeamName,
  getFieldName,
  getGameTypeText,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [keepDialogOpen, setKeepDialogOpen] = useState(false);
  const [dialogTeams, setDialogTeams] = useState<TeamSeasonType[]>([]);

  const defaultSchemaStatus =
    mode === 'edit' && selectedGame ? selectedGame.gameStatus : GameStatus.Scheduled;

  const validationSchema = useMemo(
    () => createGameDialogSchema(defaultSchemaStatus, timeZone),
    [defaultSchemaStatus, timeZone],
  );

  const { createGame, updateGame, loading } = useGameOperations({ accountId, timeZone });

  const formResolver = useMemo(
    () =>
      zodResolver(validationSchema) as Resolver<
        GameDialogFormValues,
        Record<string, never>,
        GameDialogFormValues
      >,
    [validationSchema],
  );

  const formMethods = useForm<GameDialogFormValues>({
    resolver: formResolver,
    defaultValues: {
      leagueSeasonId: '',
      gameDate: new Date(),
      gameTime: new Date(),
      homeTeamId: '',
      visitorTeamId: '',
      fieldId: '',
      comment: '',
      gameType: GameType.RegularSeason,
      umpire1: '',
      umpire2: '',
      umpire3: '',
      umpire4: '',
    },
    shouldUnregister: false,
  });

  const { control, reset, handleSubmit, getValues } = formMethods;
  const leagueSeasonId = useWatch({
    control,
    name: 'leagueSeasonId',
  });

  useEffect(() => {
    if (leagueSeasonId) {
      setDialogTeams(leagueTeamsCache.get(leagueSeasonId) ?? []);
    } else {
      setDialogTeams([]);
    }
  }, [leagueSeasonId, leagueTeamsCache]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSubmitError(null);

    if (mode === 'edit' && selectedGame) {
      const zonedDate = convertUTCToZonedDate(selectedGame.gameDate, timeZone);
      const baseDate = zonedDate ?? new Date(selectedGame.gameDate);
      const baseTime = new Date(baseDate.getTime());

      reset({
        leagueSeasonId: selectedGame.league.id,
        gameDate: baseDate,
        gameTime: baseTime,
        homeTeamId: selectedGame.homeTeamId,
        visitorTeamId: selectedGame.visitorTeamId,
        fieldId: selectedGame.fieldId || '',
        comment: selectedGame.comment || '',
        gameType: selectedGame.gameType ?? GameType.RegularSeason,
        umpire1: selectedGame.umpire1 || '',
        umpire2: selectedGame.umpire2 || '',
        umpire3: selectedGame.umpire3 || '',
        umpire4: selectedGame.umpire4 || '',
      });
      setDialogTeams(leagueTeamsCache.get(selectedGame.league.id) ?? []);
    } else {
      const initialDate = defaultGameDate ?? new Date();

      reset({
        leagueSeasonId: defaultLeagueSeasonId ?? '',
        gameDate: initialDate,
        gameTime: initialDate,
        homeTeamId: '',
        visitorTeamId: '',
        fieldId: '',
        comment: '',
        gameType: GameType.RegularSeason,
        umpire1: '',
        umpire2: '',
        umpire3: '',
        umpire4: '',
      });
      if (defaultLeagueSeasonId) {
        setDialogTeams(leagueTeamsCache.get(defaultLeagueSeasonId) ?? []);
      } else {
        setDialogTeams([]);
      }
    }

    setKeepDialogOpen(false);
  }, [
    open,
    mode,
    selectedGame,
    reset,
    leagueTeamsCache,
    defaultLeagueSeasonId,
    defaultGameDate,
    timeZone,
  ]);

  const getAvailableUmpires = useCallback(
    (currentPosition: string, currentValue: string) => {
      const formValues = getValues();
      const selected = ['umpire1', 'umpire2', 'umpire3', 'umpire4']
        .filter((position) => position !== currentPosition)
        .map((position) => formValues[position as keyof GameDialogFormValues])
        .filter(
          (value): value is string =>
            typeof value === 'string' && value.length > 0 && value !== currentValue,
        );

      return umpires.filter((umpire) => !selected.includes(umpire.id));
    },
    [getValues, umpires],
  );

  const selectedLeague = leagues.find((league) => league.id === leagueSeasonId);
  const seasonName = currentSeasonName || 'Loading season...';

  const sanitizeFormValues = (values: GameDialogFormValues): GameFormValues => ({
    leagueSeasonId: values.leagueSeasonId,
    gameDate: values.gameDate,
    gameTime: values.gameTime,
    homeTeamId: values.homeTeamId,
    visitorTeamId: values.visitorTeamId,
    fieldId: values.fieldId ? values.fieldId : undefined,
    comment: values.comment || '',
    gameType: values.gameType,
    umpire1: values.umpire1 ? values.umpire1 : undefined,
    umpire2: values.umpire2 ? values.umpire2 : undefined,
    umpire3: values.umpire3 ? values.umpire3 : undefined,
    umpire4: values.umpire4 ? values.umpire4 : undefined,
  });

  const handleDialogSubmit = handleSubmit(async (values) => {
    try {
      setSubmitError(null);
      const payload = sanitizeFormValues(values);

      const result =
        mode === 'create'
          ? await createGame(payload)
          : await updateGame(selectedGame as Game, payload);

      onSuccess?.({ message: result.message });

      if (mode === 'create' && keepDialogOpen) {
        const preservedDate = values.gameDate;
        const preservedTime = values.gameTime;
        const preservedLeague = values.leagueSeasonId;

        reset({
          leagueSeasonId: preservedLeague,
          gameDate: preservedDate,
          gameTime: preservedTime,
          homeTeamId: '',
          visitorTeamId: '',
          fieldId: '',
          comment: '',
          gameType: GameType.RegularSeason,
          umpire1: '',
          umpire2: '',
          umpire3: '',
          umpire4: '',
        });
        if (preservedLeague) {
          setDialogTeams(leagueTeamsCache.get(preservedLeague) ?? []);
        } else {
          setDialogTeams([]);
        }
        return;
      }

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save game';
      setSubmitError(message);
      onError?.(message);
    }
  });

  const handleClose = () => {
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      {/* Custom Header with League and Season Info */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box sx={{ flex: 1, width: '100%' }}>
            {mode === 'create' ? (
              <Controller
                name="leagueSeasonId"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={!canEditSchedule}
                    error={!!fieldState.error}
                  >
                    <InputLabel>League</InputLabel>
                    <Select {...field} label="League" value={field.value ?? ''}>
                      {leagues.map((league) => (
                        <MenuItem key={league.id} value={league.id}>
                          {league.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{fieldState.error?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {selectedLeague?.name || selectedGame?.league?.name || 'Unknown League'}
              </Typography>
            )}
          </Box>

          <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
              {seasonName} Season
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent>
        {submitError && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{submitError}</Alert>
          </Box>
        )}

        <FormProvider {...formMethods}>
          <Box sx={{ mt: 1 }}>
            <GameFormProvider
              value={{
                leagueTeams: dialogTeams,
                fields,
                umpires,
                canEditSchedule,
                isAccountAdmin,
                getAvailableUmpires,
                getTeamName,
                getFieldName,
                getGameTypeText,
                selectedGame: selectedGame || undefined,
              }}
            >
              <GameFormFields />
            </GameFormProvider>
          </Box>
        </FormProvider>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {mode === 'edit' && canEditSchedule && onDelete && (
          <Button onClick={onDelete} color="error" variant="outlined" disabled={loading}>
            Delete
          </Button>
        )}

        {mode === 'create' && canEditSchedule && (
          <Button
            onClick={() => setKeepDialogOpen((prev) => !prev)}
            variant={keepDialogOpen ? 'contained' : 'outlined'}
            color="secondary"
            size="small"
            sx={{
              minWidth: 'auto',
              px: 2,
              '&.MuiButton-contained': {
                backgroundColor: 'secondary.main',
                color: 'secondary.contrastText',
                '&:hover': {
                  backgroundColor: 'secondary.dark',
                },
              },
            }}
          >
            Keep Open
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        <Button onClick={handleClose} variant="outlined" disabled={loading}>
          Cancel
        </Button>

        {canEditSchedule && (
          <Button
            onClick={handleDialogSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GameDialog;
