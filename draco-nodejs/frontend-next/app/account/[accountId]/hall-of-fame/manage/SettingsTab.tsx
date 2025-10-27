'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useHallOfFameService } from '@/hooks/useHallOfFameService';
import { useNotifications } from '@/hooks/useNotifications';

interface SettingsTabProps {
  accountId: string;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ accountId }) => {
  const { getNominationSetup, updateNominationSetup } = useHallOfFameService(accountId);
  const { showNotification } = useNotifications();

  const [enableNomination, setEnableNomination] = React.useState(false);
  const [criteriaText, setCriteriaText] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const setup = await getNominationSetup();
        if (ignore) return;
        setEnableNomination(Boolean(setup.enableNomination));
        setCriteriaText(setup.criteriaText ?? '');
      } catch (err) {
        if (ignore) return;
        const message = err instanceof Error ? err.message : 'Failed to load settings.';
        setError(message);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [getNominationSetup]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateNominationSetup({
        enableNomination,
        criteriaText: criteriaText.trim().length > 0 ? criteriaText.trim() : undefined,
      });
      showNotification('Nomination settings updated.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Nomination Settings
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3} sx={{ maxWidth: 640 }}>
        <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={enableNomination}
              onChange={(_, checked) => setEnableNomination(checked)}
              disabled={loading || saving}
            />
          }
          label="Allow public Hall of Fame nominations"
        />
        <TextField
          label="Nomination Criteria"
          placeholder="Explain what makes a strong Hall of Fame candidate."
          multiline
          minRows={4}
          value={criteriaText}
          onChange={(event) => setCriteriaText(event.target.value)}
          disabled={loading || saving}
          helperText="This text is displayed to visitors when submitting nominations."
        />
        <Box>
          <Button variant="contained" onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default SettingsTab;
