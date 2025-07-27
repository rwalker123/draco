import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Game,
  GameFormState,
  GameDialogData,
  GameDialogState,
  GameDialogCallbacks,
  GameDialogPermissions,
  Team,
} from '@/types/schedule';
import { GameFormProvider } from '../contexts/GameFormContext';
import GameFormFields from '../../../app/account/[accountId]/schedule/GameFormFields';

interface GameDialogProps {
  // Core dialog props
  open: boolean;
  mode: 'create' | 'edit';
  title: string;
  selectedGame?: Game | null;
  error?: string | null;

  // Form state
  formState: GameFormState;
  setFormState: (state: Partial<GameFormState>) => void;

  // Grouped props
  data: GameDialogData;
  state: GameDialogState;
  setState: (state: Partial<GameDialogState>) => void;
  callbacks: GameDialogCallbacks;
  permissions: GameDialogPermissions;
}

const GameDialog: React.FC<GameDialogProps> = ({
  open,
  mode,
  title,
  selectedGame,
  error,
  formState,
  setFormState,
  data,
  state,
  setState,
  callbacks,
  permissions,
}) => {
  // Add local state for dialog teams
  const [dialogTeams, setDialogTeams] = useState<Team[]>([]);

  // Destructure grouped props
  const { leagues, fields, umpires, leagueTeamsCache, currentSeasonName } = data;
  const { dialogLeagueSeason, keepDialogOpen } = state;
  const { canEditSchedule, isAccountAdmin } = permissions;
  const {
    onClose,
    onSubmit,
    onDelete,
    onErrorClear,
    getTeamName,
    getFieldName,
    getGameTypeText,
    getAvailableUmpires,
  } = callbacks;

  // Get the selected league for display
  const selectedLeague = leagues.find((league) => league.id === dialogLeagueSeason);

  // Load teams when dialogLeagueSeason changes
  useEffect(() => {
    if (dialogLeagueSeason) {
      // Get teams from cache for the selected league
      const cachedTeams = leagueTeamsCache.get(dialogLeagueSeason);
      if (cachedTeams) {
        setDialogTeams(cachedTeams);
      } else {
        setDialogTeams([]);
      }
    }
  }, [dialogLeagueSeason, leagueTeamsCache]);

  // Clear teams when dialog closes
  useEffect(() => {
    if (!open) {
      // Clear dialog teams when dialog closes
      setDialogTeams([]);
    }
  }, [open]);

  // Try multiple sources for league name
  let leagueName = 'Unknown League';
  if (mode === 'edit') {
    // In edit mode, try selectedGame first, then selectedLeague
    leagueName = selectedGame?.league?.name || selectedLeague?.name || 'Unknown League';
  } else {
    // In create mode, use selectedLeague
    leagueName = selectedLeague?.name || 'No League Selected';
  }

  const seasonName = currentSeasonName || 'Loading season...';

  // Handle league selection change
  const handleLeagueChange = (leagueId: string) => {
    setState({ dialogLeagueSeason: leagueId });
    // Teams will be loaded by the useEffect above
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* League Section */}
          <Box sx={{ flex: 1, mr: 2 }}>
            {mode === 'create' ? (
              <FormControl fullWidth size="small">
                <InputLabel>League</InputLabel>
                <Select
                  value={dialogLeagueSeason}
                  onChange={(e) => handleLeagueChange(e.target.value)}
                  label="League"
                  disabled={!canEditSchedule}
                >
                  {leagues.map((league) => (
                    <MenuItem key={league.id} value={league.id}>
                      {league.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {leagueName}
              </Typography>
            )}
          </Box>

          {/* Season Section */}
          <Box sx={{ flex: 1, textAlign: 'right' }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
              {seasonName} Season
            </Typography>
          </Box>
        </Box>
      </Box>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={onErrorClear}>
            {error}
          </Alert>
        )}

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
            <GameFormFields
              // Form state
              gameDate={formState.gameDate}
              setGameDate={(date) => setFormState({ gameDate: date })}
              gameTime={formState.gameTime}
              setGameTime={(time) => setFormState({ gameTime: time })}
              homeTeamId={formState.homeTeamId}
              setHomeTeamId={(id) => setFormState({ homeTeamId: id })}
              visitorTeamId={formState.visitorTeamId}
              setVisitorTeamId={(id) => setFormState({ visitorTeamId: id })}
              fieldId={formState.fieldId}
              setFieldId={(id) => setFormState({ fieldId: id })}
              comment={formState.comment}
              setComment={(comment) => setFormState({ comment })}
              gameType={formState.gameType}
              setGameType={(type) => setFormState({ gameType: type })}
              umpire1={formState.umpire1}
              setUmpire1={(id) => setFormState({ umpire1: id })}
              umpire2={formState.umpire2}
              setUmpire2={(id) => setFormState({ umpire2: id })}
              umpire3={formState.umpire3}
              setUmpire3={(id) => setFormState({ umpire3: id })}
              umpire4={formState.umpire4}
              setUmpire4={(id) => setFormState({ umpire4: id })}
            />
          </GameFormProvider>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {onDelete && canEditSchedule && (
          <Button onClick={onDelete} color="error" variant="outlined">
            Delete
          </Button>
        )}

        {/* Keep Dialog Open Checkbox - only show in create mode */}
        {mode === 'create' && canEditSchedule && (
          <Button
            onClick={() => setState({ keepDialogOpen: !keepDialogOpen })}
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

        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>

        {canEditSchedule && (
          <Button onClick={onSubmit} variant="contained" color="primary">
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GameDialog;
