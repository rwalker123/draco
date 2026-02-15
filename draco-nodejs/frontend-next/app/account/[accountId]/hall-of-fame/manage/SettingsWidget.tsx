'use client';

import React from 'react';
import { Alert, Box, Button, FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import { useHallOfFameService } from '@/hooks/useHallOfFameService';
import { useNotifications } from '@/hooks/useNotifications';
import WidgetShell from '@/components/ui/WidgetShell';

interface SettingsWidgetProps {
  accountId: string;
}

const SettingsWidget: React.FC<SettingsWidgetProps> = ({ accountId }) => {
  const { getNominationSetup, updateNominationSetup } = useHallOfFameService(accountId);
  const { showNotification } = useNotifications();

  const [enableNomination, setEnableNomination] = React.useState(false);
  const [criteriaText, setCriteriaText] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const setup = await getNominationSetup(controller.signal);
        if (controller.signal.aborted) return;
        setEnableNomination(Boolean(setup.enableNomination));
        setCriteriaText(setup.criteriaText ?? '');
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load settings.';
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      controller.abort();
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
    <WidgetShell
      title="Nomination Settings"
      subtitle="Control how the Hall of Fame nomination form behaves."
      accent="info"
    >
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
    </WidgetShell>
  );
};

export default SettingsWidget;
