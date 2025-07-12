// TODO: Replace the plain text/textarea input with a WYSIWYG editor (e.g., react-quill, TinyMCE, Slate) for game recaps once React 19 support is available.
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from '@mui/material';

interface EnterGameSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (summary: string) => void;
  initialSummary?: string;
  teamName?: string;
  gameDate?: string; // ISO string
  homeScore?: number;
  awayScore?: number;
  homeTeamName?: string;
  awayTeamName?: string;
  loading?: boolean;
  error?: string | null;
}

const EnterGameSummaryDialog: React.FC<EnterGameSummaryDialogProps> = ({
  open,
  onClose,
  onSave,
  initialSummary = '',
  teamName,
  gameDate,
  homeScore,
  awayScore,
  homeTeamName,
  awayTeamName,
  loading = false,
  error = null,
}) => {
  const [summary, setSummary] = useState(initialSummary);

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary, open]);

  const handleSave = () => {
    onSave(summary);
  };

  // Show loading spinner or error message if needed
  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Enter Game Summary for {teamName}</DialogTitle>
        <DialogContent>
          <Typography>Loading...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Enter Game Summary for {teamName}</DialogTitle>
        <DialogContent>
          <Typography color="error">{error}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Enter Game Summary for {teamName}</DialogTitle>
      <DialogContent>
        {gameDate && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {(() => {
              const date = new Date(gameDate);
              if (!isNaN(date.getTime())) {
                return date.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
              }
              return gameDate;
            })()}
          </Typography>
        )}
        {homeScore !== undefined && awayScore !== undefined && homeTeamName && awayTeamName && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {`${awayTeamName} ${awayScore} at ${homeTeamName} ${homeScore}`}
          </Typography>
        )}
        <TextField
          label="Game Summary"
          multiline
          minRows={4}
          fullWidth
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          variant="outlined"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={!summary.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnterGameSummaryDialog;
