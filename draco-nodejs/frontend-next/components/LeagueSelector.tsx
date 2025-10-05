'use client';

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { SelectChangeEvent } from '../interfaces/formInterfaces';
import { LeagueSeasonType } from '@draco/shared-schemas';

interface LeagueSelectorProps {
  leagues: LeagueSeasonType[];
  value: string;
  onChange: (leagueId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  helperText?: string;
}

/**
 * LeagueSelector Component
 * Reusable dropdown for selecting leagues from a list
 */
const LeagueSelector: React.FC<LeagueSelectorProps> = ({
  leagues,
  value,
  onChange,
  label = 'League',
  required = false,
  disabled = false,
  loading = false,
  error = false,
  helperText,
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading leagues...
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl fullWidth required={required} error={error} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={label}
        displayEmpty
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        {leagues.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No leagues available
            </Typography>
          </MenuItem>
        ) : (
          leagues.map((league) => (
            <MenuItem key={league.id} value={league.id}>
              <Typography variant="body1">{league.league.name}</Typography>
            </MenuItem>
          ))
        )}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};

export default LeagueSelector;
