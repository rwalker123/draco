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
  ListSubheader,
} from '@mui/material';
import { SelectChangeEvent } from '../interfaces/formInterfaces';
import { LeagueSeasonWithDivisionTeamsType, TeamSeasonType } from '@draco/shared-schemas';

interface TeamSelectorProps {
  teams: TeamSeasonType[];
  leagueSeasons?: LeagueSeasonWithDivisionTeamsType[]; // For hierarchical display
  value: string;
  onChange: (teamId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  helperText?: string;
  displayMode?: 'simple' | 'hierarchical' | 'league-team';
}

/**
 * TeamSelector Component
 * Reusable dropdown for selecting teams with support for different display modes
 */
const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  leagueSeasons,
  value,
  onChange,
  label = 'Team',
  required = false,
  disabled = false,
  loading = false,
  error = false,
  helperText,
  displayMode = 'simple',
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading teams...
        </Typography>
      </Box>
    );
  }

  const renderSimpleTeams = () => {
    if (teams.length === 0) {
      return (
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            No teams available
          </Typography>
        </MenuItem>
      );
    }

    return teams
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map((team) => (
        <MenuItem key={team.id} value={team.id}>
          <Typography variant="body1">{team.name}</Typography>
        </MenuItem>
      ));
  };

  const renderLeagueTeamDisplay = () => {
    if (!leagueSeasons || leagueSeasons.length === 0) {
      return (
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            No teams available
          </Typography>
        </MenuItem>
      );
    }

    const menuItems: React.ReactNode[] = [];

    leagueSeasons
      .sort((a, b) => a.league.name.localeCompare(b.league.name))
      .forEach((leagueSeason) => {
        const leagueTeams = teams.filter((team) => {
          // Find team in this league's divisions
          return leagueSeason.divisions?.some((division) =>
            division.teams.some((divTeam) => divTeam.team.id === team.team.id),
          );
        });

        if (leagueTeams.length > 0) {
          leagueTeams
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .forEach((team) => {
              menuItems.push(
                <MenuItem key={team.id} value={team.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="body1" fontWeight="medium">
                      {team.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {leagueSeason.league.name}
                    </Typography>
                  </Box>
                </MenuItem>,
              );
            });
        }
      });

    return menuItems.length > 0 ? (
      menuItems
    ) : (
      <MenuItem disabled>
        <Typography variant="body2" color="text.secondary">
          No teams available
        </Typography>
      </MenuItem>
    );
  };

  const renderHierarchicalDisplay = () => {
    if (!leagueSeasons || leagueSeasons.length === 0) {
      return (
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            No teams available
          </Typography>
        </MenuItem>
      );
    }

    const menuItems: React.ReactNode[] = [];

    leagueSeasons
      .sort((a, b) => a.league.name.localeCompare(b.league.name))
      .forEach((leagueSeason) => {
        // Add league header
        menuItems.push(
          <ListSubheader key={`league-${leagueSeason.id}`} sx={{ fontWeight: 'bold' }}>
            {leagueSeason.league.name}
          </ListSubheader>,
        );

        if (leagueSeason.divisions) {
          leagueSeason.divisions
            .sort(
              (a, b) => a.priority - b.priority || a.division.name.localeCompare(b.division.name),
            )
            .forEach((division) => {
              // Add division header
              menuItems.push(
                <ListSubheader key={`division-${division.id}`} sx={{ pl: 2, fontWeight: 'medium' }}>
                  {division.division.name}
                </ListSubheader>,
              );

              // Add teams in this division
              division.teams
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .forEach((team) => {
                  menuItems.push(
                    <MenuItem key={team.id} value={team.id} sx={{ pl: 4 }}>
                      <Typography variant="body1">{team.name}</Typography>
                    </MenuItem>,
                  );
                });
            });
        }
      });

    return menuItems.length > 0 ? (
      menuItems
    ) : (
      <MenuItem disabled>
        <Typography variant="body2" color="text.secondary">
          No teams available
        </Typography>
      </MenuItem>
    );
  };

  const renderMenuItems = () => {
    switch (displayMode) {
      case 'hierarchical':
        return renderHierarchicalDisplay();
      case 'league-team':
        return renderLeagueTeamDisplay();
      case 'simple':
      default:
        return renderSimpleTeams();
    }
  };

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
        {renderMenuItems()}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};

export default TeamSelector;
