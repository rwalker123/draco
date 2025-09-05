import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { SelectAll as SelectAllIcon, ClearAll as ClearAllIcon } from '@mui/icons-material';

import { League } from '../../../types/emails/recipients';
import { createEmailRecipientService } from '../../../services/emailRecipientService';
import { useAuth } from '../../../context/AuthContext';

interface LeagueSelectionContentProps {
  selectedLeagues: Set<string>;
  onLeagueToggle: (leagueId: string, league?: League) => void;
  onSelectAllLeagues: (leagues: League[]) => void;
  onDeselectAllLeagues: () => void;
  accountId?: string;
  seasonId?: string;
}

/**
 * LeagueSelectionContent - Component for selecting leagues in email recipients
 * Provides individual league selection with select all/clear all functionality
 */
const LeagueSelectionContent: React.FC<LeagueSelectionContentProps> = ({
  selectedLeagues,
  onLeagueToggle,
  onSelectAllLeagues,
  onDeselectAllLeagues,
  accountId,
  seasonId,
}) => {
  const { token } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create email recipient service
  const emailRecipientService = useMemo(() => createEmailRecipientService(), []);

  // Fetch leagues when component mounts or dependencies change
  useEffect(() => {
    const fetchLeagues = async () => {
      if (!accountId || !seasonId || !token) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await emailRecipientService.fetchLeagues(accountId, token, seasonId, true);

        if (result.success) {
          setLeagues(result.data);
        } else {
          setError('Failed to load leagues. Please try again.');
          console.error('Failed to fetch leagues:', result.error);
        }
      } catch (err) {
        setError('An unexpected error occurred while loading leagues.');
        console.error('Error fetching leagues:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, [accountId, seasonId, token, emailRecipientService]);

  // Calculate selection statistics
  const selectionStats = useMemo(() => {
    const selectedCount = selectedLeagues.size;
    const totalCount = leagues.length;
    const totalTeams = leagues.reduce((sum, league) => sum + league.teamCount, 0);
    const totalPlayers = leagues.reduce((sum, league) => sum + league.totalPlayers, 0);
    const selectedTeams = leagues
      .filter((league) => selectedLeagues.has(league.id))
      .reduce((sum, league) => sum + league.teamCount, 0);
    const selectedPlayers = leagues
      .filter((league) => selectedLeagues.has(league.id))
      .reduce((sum, league) => sum + league.totalPlayers, 0);

    return {
      selectedCount,
      totalCount,
      totalTeams,
      totalPlayers,
      selectedTeams,
      selectedPlayers,
      allSelected: selectedCount === totalCount && totalCount > 0,
      noneSelected: selectedCount === 0,
    };
  }, [selectedLeagues, leagues]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2">Loading leagues...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {error}
      </Alert>
    );
  }

  if (leagues.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        No leagues found for this season.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Selection Controls */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SelectAllIcon />}
            onClick={() => onSelectAllLeagues(leagues)}
            disabled={selectionStats.allSelected}
          >
            Select All
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ClearAllIcon />}
            onClick={onDeselectAllLeagues}
            disabled={selectionStats.noneSelected}
          >
            Clear All
          </Button>
        </Stack>

        {/* Selection Summary */}
        <Typography variant="body2" color="text.secondary">
          {selectionStats.selectedCount} of {selectionStats.totalCount} leagues selected
          {selectionStats.selectedTeams > 0 && ` (${selectionStats.selectedTeams} teams`}
          {selectionStats.selectedPlayers > 0 && `, ${selectionStats.selectedPlayers} players`}
          {(selectionStats.selectedTeams > 0 || selectionStats.selectedPlayers > 0) && `)`}
        </Typography>
      </Box>

      {/* League List */}
      <Stack spacing={1}>
        {leagues.map((league) => {
          const isSelected = selectedLeagues.has(league.id);

          // Build label similar to season participants format
          let label = league.name;
          const details = [];
          if (league.teamCount > 0) {
            details.push(`${league.teamCount} teams`);
          }
          if (league.totalPlayers > 0) {
            details.push(`${league.totalPlayers} players`);
          }
          if (details.length > 0) {
            label += ` (${details.join(', ')})`;
          }

          return (
            <FormControlLabel
              key={league.id}
              control={
                <Checkbox checked={isSelected} onChange={() => onLeagueToggle(league.id, league)} />
              }
              label={label}
            />
          );
        })}
      </Stack>
    </Box>
  );
};

export default LeagueSelectionContent;
