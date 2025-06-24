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
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon, Email as EmailIcon, Twitter as TwitterIcon } from '@mui/icons-material';

interface Game {
  id: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  gameStatus: number;
  gameStatusText: string;
  leagueName: string;
  fieldId: string | null;
  fieldName: string | null;
  fieldShortName: string | null;
  hasGameRecap: boolean;
  gameRecaps: any[];
}

interface EnterGameResultsDialogProps {
  open: boolean;
  onClose: () => void;
  game: Game | null;
  onSave: (gameData: GameResultData) => Promise<void>;
}

interface GameResultData {
  gameId: string;
  homeScore: number;
  awayScore: number;
  gameStatus: number;
  emailPlayers: boolean;
  postToTwitter: boolean;
  postToBluesky: boolean;
  postToFacebook: boolean;
}

const gameStatusOptions = [
  { value: 0, label: 'Scheduled' },
  { value: 1, label: 'Final' },
  { value: 2, label: 'In Progress' },
  { value: 3, label: 'Postponed' },
  { value: 4, label: 'Forfeit' },
  { value: 5, label: 'Did Not Report' }
];

const EnterGameResultsDialog: React.FC<EnterGameResultsDialogProps> = ({
  open,
  onClose,
  game,
  onSave
}) => {
  const [formData, setFormData] = useState<GameResultData>({
    gameId: '',
    homeScore: 0,
    awayScore: 0,
    gameStatus: 0,
    emailPlayers: false,
    postToTwitter: false,
    postToBluesky: false,
    postToFacebook: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when game changes
  React.useEffect(() => {
    if (game) {
      setFormData({
        gameId: game.id,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        gameStatus: game.gameStatus,
        emailPlayers: false,
        postToTwitter: false,
        postToBluesky: false,
        postToFacebook: false
      });
      setError(null);
    }
  }, [game]);

  const handleInputChange = (field: keyof GameResultData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!game) return;

    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game results');
    } finally {
      setLoading(false);
    }
  };

  const formatGameTime = (dateString: string) => {
    try {
      const localDateString = dateString.replace('Z', '');
      const dateObj = new Date(localDateString);
      return dateObj.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'TBD';
    }
  };

  const getDisplayFieldName = (game: Game) => {
    return game.fieldName;
  };

  if (!game) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(180deg, #0a2342 0%, #1e3a5c 100%)',
          color: 'white',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        pb: 2
      }}>
        <Typography variant="h6" fontWeight={700}>
          Enter Game Results
        </Typography>
        <Button
          onClick={onClose}
          sx={{ color: '#b0c4de', minWidth: 'auto', p: 0 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Game Information Display */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="#b0c4de" gutterBottom>
            Game Information
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 200px' }}>
              <Typography variant="body2" color="white">
                <strong>Date/Time:</strong>
              </Typography>
              <Typography variant="body2" color="#b0c4de">
                {formatGameTime(game.date)}
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <Typography variant="body2" color="white">
                <strong>Field:</strong>
              </Typography>
              <Typography variant="body2" color="#b0c4de">
                {getDisplayFieldName(game) || 'TBD'}
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 100%' }}>
              <Typography variant="body2" color="white">
                <strong>League:</strong>
              </Typography>
              <Typography variant="body2" color="#b0c4de">
                {game.leagueName}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Game Status and Teams */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 1, alignItems: 'center', justifyContent: 'start' }}>
            <Box>
              <Typography variant="subtitle2" color="#b0c4de">
                Game Status:
              </Typography>
            </Box>
            <Box>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={formData.gameStatus}
                  onChange={(e) => handleInputChange('gameStatus', e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#b0c4de',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#b0c4de',
                    },
                  }}
                >
                  {gameStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography variant="body2" color="white" fontWeight={600}>
                {game.awayTeamName}
              </Typography>
            </Box>
            <Box>
              <TextField
                type="number"
                value={formData.awayScore}
                onChange={(e) => handleInputChange('awayScore', parseInt(e.target.value) || 0)}
                size="small"
                sx={{
                  width: '80px',
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#b0c4de',
                    },
                    '&:hover fieldset': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#b0c4de',
                  },
                }}
              />
            </Box>
            <Box>
              <Typography variant="body2" color="white" fontWeight={600}>
                {game.homeTeamName}
              </Typography>
            </Box>
            <Box>
              <TextField
                type="number"
                value={formData.homeScore}
                onChange={(e) => handleInputChange('homeScore', parseInt(e.target.value) || 0)}
                size="small"
                sx={{
                  width: '80px',
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#b0c4de',
                    },
                    '&:hover fieldset': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#b0c4de',
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Notification Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="#b0c4de" gutterBottom>
            Notifications & Social Media
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.emailPlayers}
                    onChange={(e) => handleInputChange('emailPlayers', e.target.checked)}
                    sx={{
                      color: '#b0c4de',
                      '&.Mui-checked': {
                        color: 'white',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body2" color="white">
                      Email game results to players
                    </Typography>
                  </Box>
                }
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.postToTwitter}
                    onChange={(e) => handleInputChange('postToTwitter', e.target.checked)}
                    sx={{
                      color: '#b0c4de',
                      '&.Mui-checked': {
                        color: 'white',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TwitterIcon fontSize="small" />
                    <Typography variant="body2" color="white">
                      Post to Twitter
                    </Typography>
                  </Box>
                }
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.postToBluesky}
                    onChange={(e) => handleInputChange('postToBluesky', e.target.checked)}
                    sx={{
                      color: '#b0c4de',
                      '&.Mui-checked': {
                        color: 'white',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="BS" size="small" sx={{ bgcolor: '#0085FF', color: 'white', fontSize: '0.75rem' }} />
                    <Typography variant="body2" color="white">
                      Post to Bluesky
                    </Typography>
                  </Box>
                }
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.postToFacebook}
                    onChange={(e) => handleInputChange('postToFacebook', e.target.checked)}
                    sx={{
                      color: '#b0c4de',
                      '&.Mui-checked': {
                        color: 'white',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="FB" size="small" sx={{ bgcolor: '#1877F2', color: 'white', fontSize: '0.75rem' }} />
                    <Typography variant="body2" color="white">
                      Post to Facebook
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        gap: 1
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: '#b0c4de',
            borderColor: '#b0c4de',
            '&:hover': {
              borderColor: 'white',
              color: 'white',
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
          sx={{
            bgcolor: '#4CAF50',
            color: 'white',
            '&:hover': {
              bgcolor: '#45a049',
            },
            '&:disabled': {
              bgcolor: 'rgba(255,255,255,0.1)',
              color: '#b0c4de',
            },
          }}
        >
          {loading ? 'Saving...' : 'Save Results'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnterGameResultsDialog; 