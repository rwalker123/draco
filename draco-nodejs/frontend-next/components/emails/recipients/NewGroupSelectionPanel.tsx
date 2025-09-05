'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import LeagueSelectionContent from './LeagueSelectionContent';

import {
  GroupSelectionType,
  GroupType,
  ContactGroup,
  League,
} from '../../../types/emails/recipients';
import { createEmailRecipientService } from '../../../services/emailRecipientService';
import { useAuth } from '../../../context/AuthContext';

export interface NewGroupSelectionPanelProps {
  activeGroupType: GroupSelectionType | null;
  selectedGroups: Map<GroupType, ContactGroup[]>;
  onGroupTypeChange: (groupType: GroupSelectionType | null) => void;
  onGroupsChange: (groups: Map<GroupType, ContactGroup[]>) => void;
  searchQueries: Record<string, string>;
  onSearchQueryChange: (groupType: string, query: string) => void;
  loading?: boolean;
  accountId?: string;
  seasonId?: string;
}

/**
 * NewGroupSelectionPanel - Redesigned group selection interface
 * Provides categorized sections for different recipient group types
 */
const NewGroupSelectionPanel: React.FC<NewGroupSelectionPanelProps> = ({
  activeGroupType,
  selectedGroups,
  onGroupTypeChange,
  onGroupsChange,
  searchQueries,
  onSearchQueryChange,
  loading = false,
  accountId,
  seasonId,
}) => {
  // Auth context for API calls
  const { token } = useAuth();

  // State for season participants count
  const [participantCount, setParticipantCount] = useState<number | null>(null);

  // Create email recipient service
  const emailRecipientService = useMemo(() => createEmailRecipientService(), []);

  // Fetch season participants count when accountId or seasonId changes
  useEffect(() => {
    const fetchParticipantCount = async () => {
      if (!accountId || !seasonId || !token) {
        return;
      }

      try {
        const result = await emailRecipientService.fetchSeasonParticipantsCount(
          accountId,
          token,
          seasonId,
        );

        if (result.success) {
          setParticipantCount(result.data);
        } else {
          // On error, keep count as null (will show basic label)
          setParticipantCount(null);
        }
      } catch {
        // On error, keep count as null (will show basic label)
        setParticipantCount(null);
      }
    };

    fetchParticipantCount();
  }, [accountId, seasonId, token, emailRecipientService]);

  // Group type options for dropdown
  const groupTypeOptions = [
    { value: 'season-participants', label: 'Season Participants (All Current Players)' },
    { value: 'league-specific', label: 'League-specific Communications' },
    { value: 'team-selection', label: 'Team Selection' },
    { value: 'manager-communications', label: 'Manager Communications' },
  ];

  // Helper functions for unified group manipulation
  const isSeasonParticipantsSelected = (): boolean => {
    const seasonGroups = selectedGroups.get('season');
    return Boolean(seasonGroups && seasonGroups.length > 0);
  };

  // Generate label for season participants checkbox
  const getSeasonParticipantsLabel = () => {
    const baseLabel = 'All players in current season';
    if (participantCount !== null) {
      return `${baseLabel} (${participantCount})`;
    }
    return baseLabel;
  };

  const handleSeasonParticipantsToggle = () => {
    const newGroups = new Map(selectedGroups);

    if (isSeasonParticipantsSelected()) {
      // Remove season participants
      newGroups.delete('season');
    } else {
      // Add season participants with actual count
      const seasonGroup: ContactGroup = {
        groupType: 'season',
        groupName: 'Season Participants',
        contactIds: new Set(), // Would be populated with actual participant IDs
        totalCount: participantCount || 0, // Use actual participant count
      };
      newGroups.set('season', [seasonGroup]);
    }

    onGroupsChange(newGroups);
  };

  // Team selection helpers
  const getTeamGroups = () => {
    return selectedGroups.get('teams') || [];
  };

  const handleTeamSelectionChange = (teamId: string, selected: boolean) => {
    const newGroups = new Map(selectedGroups);
    let teamGroups = newGroups.get('teams') || [];

    if (selected) {
      // Add team group if not exists
      const existingGroup = teamGroups.find((g) => g.contactIds.has(teamId));
      if (!existingGroup) {
        const newTeamGroup: ContactGroup = {
          groupType: 'teams',
          groupName: `Team ${teamId}`, // Would be populated with actual team name
          contactIds: new Set([teamId]),
          totalCount: 1, // Would be populated with actual team member count
        };
        teamGroups = [...teamGroups, newTeamGroup];
      }
    } else {
      // Remove team group
      teamGroups = teamGroups.filter((g) => !g.contactIds.has(teamId));
    }

    if (teamGroups.length > 0) {
      newGroups.set('teams', teamGroups);
    } else {
      newGroups.delete('teams');
    }

    onGroupsChange(newGroups);
  };

  // League selection helpers
  const getLeagueGroups = () => {
    return selectedGroups.get('league') || [];
  };

  const handleLeagueSelectionChange = (leagueId: string, selected: boolean, league?: League) => {
    const newGroups = new Map(selectedGroups);
    let leagueGroups = newGroups.get('league') || [];

    if (selected) {
      // Add league group if not exists
      const existingGroup = leagueGroups.find((g) => g.contactIds.has(leagueId));
      if (!existingGroup) {
        const newLeagueGroup: ContactGroup = {
          groupType: 'league',
          groupName: league?.name || `League ${leagueId}`,
          contactIds: new Set([leagueId]),
          totalCount: league?.totalPlayers || 0,
        };
        leagueGroups = [...leagueGroups, newLeagueGroup];
      }
    } else {
      // Remove league group
      leagueGroups = leagueGroups.filter((g) => !g.contactIds.has(leagueId));
    }

    if (leagueGroups.length > 0) {
      newGroups.set('league', leagueGroups);
    } else {
      newGroups.delete('league');
    }

    onGroupsChange(newGroups);
  };

  const handleSelectAllLeagues = (leagues: League[]) => {
    const newGroups = new Map(selectedGroups);
    const leagueGroups: ContactGroup[] = leagues.map((league) => ({
      groupType: 'league',
      groupName: league.name,
      contactIds: new Set([league.id]),
      totalCount: league.totalPlayers || 0,
    }));

    newGroups.set('league', leagueGroups);
    onGroupsChange(newGroups);
  };

  // Manager selection helpers
  const getManagerGroups = () => {
    return selectedGroups.get('managers') || [];
  };

  const handleManagerSelectionChange = (managerId: string, selected: boolean) => {
    const newGroups = new Map(selectedGroups);
    let managerGroups = newGroups.get('managers') || [];

    if (selected) {
      // Add manager to group
      const existingGroup = managerGroups.find((g) => g.groupName === 'Managers');
      if (existingGroup) {
        existingGroup.contactIds.add(managerId);
        existingGroup.totalCount = existingGroup.contactIds.size;
      } else {
        const newManagerGroup: ContactGroup = {
          groupType: 'managers',
          groupName: 'Managers',
          contactIds: new Set([managerId]),
          totalCount: 1,
        };
        managerGroups = [...managerGroups, newManagerGroup];
      }
    } else {
      // Remove manager from group
      managerGroups = managerGroups
        .map((group) => {
          const newContactIds = new Set(group.contactIds);
          newContactIds.delete(managerId);
          return {
            ...group,
            contactIds: newContactIds,
            totalCount: newContactIds.size,
          };
        })
        .filter((group) => group.totalCount > 0);
    }

    if (managerGroups.length > 0) {
      newGroups.set('managers', managerGroups);
    } else {
      newGroups.delete('managers');
    }

    onGroupsChange(newGroups);
  };

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
                checked={isSeasonParticipantsSelected()}
                onChange={handleSeasonParticipantsToggle}
              />
            }
            label={getSeasonParticipantsLabel()}
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
          <LeagueSelectionContent
            selectedLeagues={new Set(getLeagueGroups().flatMap((g) => Array.from(g.contactIds)))}
            onLeagueToggle={(leagueId, league) => {
              const isSelected = getLeagueGroups().some((g) => g.contactIds.has(leagueId));
              handleLeagueSelectionChange(leagueId, !isSelected, league);
            }}
            onSelectAllLeagues={handleSelectAllLeagues}
            onDeselectAllLeagues={() => {
              // Clear all league selections
              const newGroups = new Map(selectedGroups);
              newGroups.delete('league');
              onGroupsChange(newGroups);
            }}
            accountId={accountId}
            seasonId={seasonId}
          />
        </Box>
      )}

      {activeGroupType === 'team-selection' && (
        <TeamSelectionContent
          selectedLeagues={new Set()} // TODO: Extract from team groups when needed
          selectedDivisions={new Set()} // TODO: Extract from team groups when needed
          selectedTeams={new Set(getTeamGroups().flatMap((g) => Array.from(g.contactIds)))}
          onLeagueToggle={(leagueId) => {
            // TODO: Implement league-based team selection
            console.log('League toggle:', leagueId);
          }}
          onDivisionToggle={(divisionId) => {
            // TODO: Implement division-based team selection
            console.log('Division toggle:', divisionId);
          }}
          onTeamToggle={(teamId) => {
            const isSelected = getTeamGroups().some((g) => g.contactIds.has(teamId));
            handleTeamSelectionChange(teamId, !isSelected);
          }}
          onSelectAllTeams={() => {
            // TODO: Implement select all teams logic
            console.log('Select all teams clicked');
          }}
          onDeselectAllTeams={() => {
            // Clear all team selections
            const newGroups = new Map(selectedGroups);
            newGroups.delete('teams');
            onGroupsChange(newGroups);
          }}
          searchQuery={searchQueries['team-selection'] || ''}
          onSearchQueryChange={(query) => onSearchQueryChange('team-selection', query)}
        />
      )}

      {activeGroupType === 'manager-communications' && (
        <Box>
          <ManagerErrorBoundary>
            <ManagerSelectionContent
              accountId={accountId || ''}
              seasonId={seasonId || ''}
              selectedManagers={
                new Set(getManagerGroups().flatMap((g) => Array.from(g.contactIds)))
              }
              selectedLeagues={new Set()} // TODO: Extract from manager groups when needed
              selectedTeams={new Set()} // TODO: Extract from manager groups when needed
              onManagerToggle={(managerId) => {
                const isSelected = getManagerGroups().some((g) => g.contactIds.has(managerId));
                handleManagerSelectionChange(managerId, !isSelected);
              }}
              onLeagueToggle={(leagueId) => {
                // TODO: Implement league-based manager selection
                console.log('Manager league toggle:', leagueId);
              }}
              onTeamToggle={(teamId) => {
                // TODO: Implement team-based manager selection
                console.log('Manager team toggle:', teamId);
              }}
              onSelectAll={() => {
                // TODO: Implement select all managers logic
                console.log('Select all managers clicked');
              }}
              onDeselectAll={() => {
                // Clear all manager selections
                const newGroups = new Map(selectedGroups);
                newGroups.delete('managers');
                onGroupsChange(newGroups);
              }}
              onSearchQueryChange={(query) => onSearchQueryChange('manager-communications', query)}
              searchQuery={searchQueries['manager-communications'] || ''}
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
