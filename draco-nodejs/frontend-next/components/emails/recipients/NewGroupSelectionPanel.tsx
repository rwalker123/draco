'use client';

import React from 'react';
import {
  Box,
  Typography,
  Checkbox,
  Select,
  MenuItem,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import TeamSelectionContent from './TeamSelectionContent';
import ManagerSelectionContent from './ManagerSelectionContent';
import ManagerErrorBoundary from './ManagerErrorBoundary';

import { GroupSelectionType } from '../../../types/emails/recipients';

export interface NewGroupSelectionPanelProps {
  activeGroupType: GroupSelectionType | null;
  seasonParticipants: {
    selected: boolean;
    totalPlayers: number;
  };
  _leagueSpecific: {
    selectedLeagues: Set<string>;
    selectedDivisions: Set<string>;
    selectedTeams: Set<string>;
    totalPlayers: number;
  };
  _teamSelection: {
    selectedLeagues: Set<string>;
    selectedDivisions: Set<string>;
    selectedTeams: Set<string>;
    totalPlayers: number;
  };
  _managerCommunications: {
    selectedLeagues: Set<string>;
    selectedTeams: Set<string>;
    selectedManagers: Set<string>;
    allManagersSelected: boolean;
    totalManagers: number;
  };
  _groupSearchQueries: Record<string, string>;
  onGroupTypeChange: (groupType: GroupSelectionType | null) => void;
  onSeasonParticipantsToggle: () => void;
  _onLeagueToggle: (leagueId: string) => void;
  _onDivisionToggle: (divisionId: string) => void;
  _onTeamToggle: (teamId: string) => void;
  _onTeamSelectionLeagueToggle: (leagueId: string) => void;
  _onTeamSelectionDivisionToggle: (divisionId: string) => void;
  _onTeamSelectionTeamToggle: (teamId: string) => void;
  _onManagerSelectionToggle: (managerId: string) => void;
  _onManagerLeagueSelectionToggle: (leagueId: string) => void;
  _onManagerTeamSelectionToggle: (teamId: string) => void;
  _onAllManagersToggle: () => void;
  _onSearchQueryChange: (groupType: string, query: string) => void;
  onSearchQueryChange: (groupType: string, query: string) => void;
  loading?: boolean;
  _compact?: boolean;
  // Manager selection props
  accountId?: string;
  seasonId?: string;
}

/**
 * NewGroupSelectionPanel - Redesigned group selection interface
 * Provides categorized sections for different recipient group types
 */
const NewGroupSelectionPanel: React.FC<NewGroupSelectionPanelProps> = ({
  activeGroupType,
  seasonParticipants,
  _leagueSpecific,
  _teamSelection,
  _managerCommunications,
  _groupSearchQueries,
  onGroupTypeChange,
  onSeasonParticipantsToggle,
  _onLeagueToggle,
  _onDivisionToggle,
  _onTeamToggle,
  _onTeamSelectionLeagueToggle,
  _onTeamSelectionDivisionToggle,
  _onTeamSelectionTeamToggle,
  _onManagerSelectionToggle,
  _onManagerLeagueSelectionToggle,
  _onManagerTeamSelectionToggle,
  _onAllManagersToggle,
  _onSearchQueryChange,
  loading = false,
  _compact = false,
  accountId,
  seasonId,
}) => {
  // Group type options for dropdown
  const groupTypeOptions = [
    { value: 'season-participants', label: 'Season Participants (All Current Players)' },
    { value: 'league-specific', label: 'League-specific Communications' },
    { value: 'team-selection', label: 'Team Selection' },
    { value: 'manager-communications', label: 'Manager Communications' },
  ];

  // Handle group type change
  const handleGroupTypeChange = (event: SelectChangeEvent<string>) => {
    const newType = event.target.value;
    if (newType === '') {
      onGroupTypeChange(null);
    } else {
      onGroupTypeChange(newType as GroupSelectionType);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading recipient groups...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      {/* Group Type Selection Dropdown */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <FormLabel component="legend" sx={{ mb: 1 }}>
            <Typography variant="h6">Select Group Type</Typography>
          </FormLabel>
          <Select
            value={activeGroupType || ''}
            onChange={handleGroupTypeChange}
            displayEmpty
            size="small"
          >
            <MenuItem value="">
              <em>Choose a group type...</em>
            </MenuItem>
            {groupTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Dynamic Content Area */}
      {activeGroupType === 'season-participants' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Season Participants
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Include all current players in the season.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={seasonParticipants.selected}
                onChange={onSeasonParticipantsToggle}
              />
            }
            label={`Include all ${seasonParticipants.totalPlayers} season participants`}
          />
        </Box>
      )}

      {activeGroupType === 'league-specific' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            League-specific Communications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select leagues to include all teams and players within those leagues.
          </Typography>
          {/* TODO: Implement league selection UI */}
          <Typography variant="body2" color="text.secondary">
            League selection UI will be implemented here.
          </Typography>
        </Box>
      )}

      {activeGroupType === 'team-selection' && (
        <TeamSelectionContent
          selectedLeagues={_teamSelection.selectedLeagues}
          selectedDivisions={_teamSelection.selectedDivisions}
          selectedTeams={_teamSelection.selectedTeams}
          onLeagueToggle={_onTeamSelectionLeagueToggle}
          onDivisionToggle={_onTeamSelectionDivisionToggle}
          onTeamToggle={_onTeamSelectionTeamToggle}
          onSelectAllTeams={() => {
            // TODO: Implement select all teams logic
            console.log('Select all teams clicked');
          }}
          onDeselectAllTeams={() => {
            // TODO: Implement deselect all teams logic
            console.log('Deselect all teams clicked');
          }}
          searchQuery={_groupSearchQueries['team-selection'] || ''}
          onSearchQueryChange={(query) => _onSearchQueryChange('team-selection', query)}
        />
      )}

      {activeGroupType === 'manager-communications' && (
        <Box>
          <ManagerErrorBoundary>
            <ManagerSelectionContent
              accountId={accountId || ''}
              seasonId={seasonId || ''}
              selectedManagers={_managerCommunications.selectedManagers}
              selectedLeagues={_managerCommunications.selectedLeagues}
              selectedTeams={_managerCommunications.selectedTeams}
              onManagerToggle={_onManagerSelectionToggle}
              onLeagueToggle={_onManagerLeagueSelectionToggle}
              onTeamToggle={_onManagerTeamSelectionToggle}
              onSelectAll={_onAllManagersToggle}
              onDeselectAll={_onAllManagersToggle}
              onSearchQueryChange={(query) => _onSearchQueryChange('manager-communications', query)}
              searchQuery={_groupSearchQueries['manager-communications'] || ''}
            />
          </ManagerErrorBoundary>
        </Box>
      )}

      {/* No Group Type Selected */}
      {!activeGroupType && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Select a Group Type
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a group type from the dropdown above to configure recipient selection.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NewGroupSelectionPanel;
