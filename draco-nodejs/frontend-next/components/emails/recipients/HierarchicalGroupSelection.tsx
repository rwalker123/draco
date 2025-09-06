'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Switch,
  Stack,
  Collapse,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import {
  HierarchicalSeason,
  HierarchicalGroupSelectionProps,
} from '../../../types/emails/recipients';

const HierarchicalGroupSelection: React.FC<HierarchicalGroupSelectionProps> = ({
  accountId,
  seasonId,
  itemSelectedState,
  managersOnly,
  onSelectionChange,
  loading = false,
}) => {
  // Component state
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalSeason | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  // Initialize with all leagues and divisions expanded by default
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());

  // Hierarchical relationship data structures for universal selection algorithm
  const hierarchyMaps = useMemo(() => {
    if (!hierarchicalData) {
      return {
        parentMap: new Map<string, string>(), // child -> parent
        childrenMap: new Map<string, Set<string>>(), // parent -> children
        itemTypeMap: new Map<string, 'season' | 'league' | 'division' | 'team'>(), // item -> type
        siblingsMap: new Map<string, Set<string>>(), // item -> siblings
      };
    }

    const parentMap = new Map<string, string>();
    const childrenMap = new Map<string, Set<string>>();
    const itemTypeMap = new Map<string, 'season' | 'league' | 'division' | 'team'>();
    const siblingsMap = new Map<string, Set<string>>();

    // Season level
    itemTypeMap.set(seasonId, 'season');
    childrenMap.set(seasonId, new Set());

    // Process leagues
    const leagueIds = new Set<string>();
    hierarchicalData.leagues.forEach((league) => {
      itemTypeMap.set(league.id, 'league');
      parentMap.set(league.id, seasonId);
      childrenMap.get(seasonId)!.add(league.id);
      childrenMap.set(league.id, new Set());
      leagueIds.add(league.id);

      // Process divisions
      const divisionIds = new Set<string>();
      league.divisions.forEach((division) => {
        itemTypeMap.set(division.id, 'division');
        parentMap.set(division.id, league.id);
        childrenMap.get(league.id)!.add(division.id);
        childrenMap.set(division.id, new Set());
        divisionIds.add(division.id);

        // Process teams in division
        const teamIds = new Set<string>();
        division.teams.forEach((team) => {
          itemTypeMap.set(team.id, 'team');
          parentMap.set(team.id, division.id);
          childrenMap.get(division.id)!.add(team.id);
          teamIds.add(team.id);
        });
        siblingsMap.set(division.id, new Set(teamIds));
        teamIds.forEach((teamId) => siblingsMap.set(teamId, new Set(teamIds)));
      });

      siblingsMap.set(league.id, new Set(divisionIds));
      divisionIds.forEach((divId) => siblingsMap.set(divId, new Set(divisionIds)));
    });

    siblingsMap.set(seasonId, new Set(leagueIds));
    leagueIds.forEach((leagueId) => siblingsMap.set(leagueId, new Set(leagueIds)));

    return { parentMap, childrenMap, itemTypeMap, siblingsMap };
  }, [hierarchicalData, seasonId]);

  // Universal selection algorithm - works for any hierarchy level
  const handleUniversalToggle = useCallback(
    (itemId: string, currentlySelected: boolean) => {
      if (!hierarchicalData) return;

      const newStateMap = new Map(itemSelectedState);

      if (currentlySelected) {
        // DESELECTION: Set item and all children to 'unselected'
        const setItemAndChildrenUnselected = (id: string) => {
          newStateMap.set(id, 'unselected');
          const children = hierarchyMaps.childrenMap.get(id);
          if (children) {
            children.forEach((childId) => setItemAndChildrenUnselected(childId));
          }
        };
        setItemAndChildrenUnselected(itemId);
      } else {
        // SELECTION: Set item and all children to 'selected'
        const setItemAndChildrenSelected = (id: string) => {
          newStateMap.set(id, 'selected');
          const children = hierarchyMaps.childrenMap.get(id);
          if (children) {
            children.forEach((childId) => setItemAndChildrenSelected(childId));
          }
        };
        setItemAndChildrenSelected(itemId);
      }

      // Update parent chain: walk up from the changed item
      const updateParentChain = (id: string) => {
        const parentId = hierarchyMaps.parentMap.get(id);
        if (!parentId) return; // Reached root

        const children = hierarchyMaps.childrenMap.get(parentId);
        if (!children || children.size === 0) return;

        // Count children states
        let selectedCount = 0;
        let intermediateCount = 0;

        children.forEach((childId) => {
          const childState = newStateMap.get(childId) || 'unselected';
          if (childState === 'selected') {
            selectedCount++;
          } else if (childState === 'intermediate') {
            intermediateCount++;
          }
        });

        // Determine parent state
        if (selectedCount === children.size) {
          // All children selected -> parent selected
          newStateMap.set(parentId, 'selected');
        } else if (selectedCount > 0 || intermediateCount > 0) {
          // Some children selected or intermediate -> parent intermediate
          newStateMap.set(parentId, 'intermediate');
        } else {
          // No children selected -> parent unselected
          newStateMap.set(parentId, 'unselected');
        }

        // Recursively update parent's parent
        updateParentChain(parentId);
      };

      updateParentChain(itemId);

      onSelectionChange(newStateMap, managersOnly);
    },
    [itemSelectedState, hierarchyMaps, hierarchicalData, managersOnly, onSelectionChange],
  );

  // Load hierarchical data
  const loadHierarchicalData = useCallback(async () => {
    if (!accountId || !seasonId) return;

    try {
      setDataLoading(true);
      setDataError(null);

      const response = await fetch(
        `/api/accounts/${accountId}/seasons/${seasonId}/leagues?includeTeams=true`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to load team hierarchy data');
      }

      const data = await response.json();

      // Define interfaces for API response
      interface ApiTeam {
        id: string;
        name: string;
        playerCount?: number;
        managerCount?: number;
      }

      interface ApiDivision {
        id: string;
        divisionName: string;
        teams?: ApiTeam[];
      }

      interface ApiLeague {
        id: string;
        leagueName: string;
        divisions?: ApiDivision[];
      }

      interface ApiResponse {
        data: {
          season: {
            id: string;
            name: string;
          };
          leagueSeasons: ApiLeague[];
        };
      }

      const apiData = data as ApiResponse;

      // Transform the API response into our hierarchical structure
      const season: HierarchicalSeason = {
        id: apiData.data.season.id,
        name: apiData.data.season.name,
        leagues: apiData.data.leagueSeasons.map((league: ApiLeague) => ({
          id: league.id,
          name: league.leagueName,
          divisions:
            league.divisions?.map((division: ApiDivision) => ({
              id: division.id,
              name: division.divisionName,
              teams:
                division.teams?.map((team: ApiTeam) => ({
                  id: team.id,
                  name: team.name,
                  playerCount: team.playerCount || 0,
                  managerCount: team.managerCount || 0,
                })) || [],
              totalPlayers:
                division.teams?.reduce(
                  (sum: number, team: ApiTeam) => sum + (team.playerCount || 0),
                  0,
                ) || 0,
              totalManagers:
                division.teams?.reduce(
                  (sum: number, team: ApiTeam) => sum + (team.managerCount || 0),
                  0,
                ) || 0,
            })) || [],
          totalPlayers: [
            ...(league.divisions || []).flatMap((d: ApiDivision) => d.teams || []),
          ].reduce((sum: number, team: ApiTeam) => sum + (team.playerCount || 0), 0),
          totalManagers: [
            ...(league.divisions || []).flatMap((d: ApiDivision) => d.teams || []),
          ].reduce((sum: number, team: ApiTeam) => sum + (team.managerCount || 0), 0),
        })),
        totalPlayers: apiData.data.leagueSeasons.reduce((sum: number, league: ApiLeague) => {
          const leaguePlayers = [
            ...(league.divisions || []).flatMap((d: ApiDivision) => d.teams || []),
          ].reduce((leagueSum: number, team: ApiTeam) => leagueSum + (team.playerCount || 0), 0);
          return sum + leaguePlayers;
        }, 0),
        totalManagers: apiData.data.leagueSeasons.reduce((sum: number, league: ApiLeague) => {
          const leagueManagers = [
            ...(league.divisions || []).flatMap((d: ApiDivision) => d.teams || []),
          ].reduce((leagueSum: number, team: ApiTeam) => leagueSum + (team.managerCount || 0), 0);
          return sum + leagueManagers;
        }, 0),
      };

      setHierarchicalData(season);

      // Expand all leagues and divisions by default
      const allLeagueIds = new Set(season.leagues.map((league) => league.id));
      const allDivisionIds = new Set<string>();
      season.leagues.forEach((league) => {
        league.divisions.forEach((division) => {
          allDivisionIds.add(division.id);
        });
      });

      setExpandedLeagues(allLeagueIds);
      setExpandedDivisions(allDivisionIds);
    } catch (error) {
      console.error('Failed to load hierarchical data:', error);
      setDataError(error instanceof Error ? error.message : 'Failed to load team hierarchy');
    } finally {
      setDataLoading(false);
    }
  }, [accountId, seasonId]);

  // Load data on mount
  useEffect(() => {
    loadHierarchicalData();
  }, [loadHierarchicalData]);

  // Manager-only toggle handler
  const handleManagerToggle = useCallback(() => {
    // Toggle managersOnly flag, keep same selections
    onSelectionChange(itemSelectedState, !managersOnly);
  }, [itemSelectedState, managersOnly, onSelectionChange]);

  // Expand/collapse handlers
  const toggleLeagueExpansion = useCallback((leagueId: string) => {
    setExpandedLeagues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leagueId)) {
        newSet.delete(leagueId);
      } else {
        newSet.add(leagueId);
      }
      return newSet;
    });
  }, []);

  const toggleDivisionExpansion = useCallback((divisionId: string) => {
    setExpandedDivisions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) {
        newSet.delete(divisionId);
      } else {
        newSet.add(divisionId);
      }
      return newSet;
    });
  }, []);

  // Simple checkbox state calculation using Map lookup
  const getCheckboxState = useCallback(
    (itemId: string) => {
      const state = itemSelectedState.get(itemId) || 'unselected';
      return {
        checked: state === 'selected',
        indeterminate: state === 'intermediate',
      };
    },
    [itemSelectedState],
  );

  // Render loading state
  if (loading || dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading team hierarchy...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (dataError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading team hierarchy: {dataError}</Alert>
      </Box>
    );
  }

  // Render empty state
  if (!hierarchicalData || hierarchicalData.leagues.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No teams found for this season.
        </Typography>
      </Box>
    );
  }

  const seasonCheckboxState = getCheckboxState(seasonId);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        {/* Manager-only toggle */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Selection Options
          </Typography>
          <FormControlLabel
            control={<Switch checked={managersOnly} onChange={handleManagerToggle} size="small" />}
            label={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <GroupsIcon fontSize="small" />
                <Typography variant="body2">Include only Managers</Typography>
              </Stack>
            }
          />
        </Stack>
        <Divider />
      </Paper>

      <Paper variant="outlined" sx={{ maxHeight: '400px', overflow: 'auto' }}>
        <Box sx={{ p: 1 }}>
          {/* Season level */}
          <FormControlLabel
            control={
              <Checkbox
                checked={seasonCheckboxState.checked}
                indeterminate={seasonCheckboxState.indeterminate}
                onChange={() => handleUniversalToggle(seasonId, seasonCheckboxState.checked)}
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon fontSize="small" />
                <Typography variant="subtitle1" fontWeight="medium">
                  {hierarchicalData.name} Season
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (
                  {managersOnly
                    ? `${hierarchicalData.totalManagers || 0} managers`
                    : `${hierarchicalData.totalPlayers || 0} players`}
                  )
                </Typography>
              </Stack>
            }
            sx={{ width: '100%', m: 0, '& .MuiFormControlLabel-label': { flex: 1 } }}
          />

          {/* Leagues */}
          {hierarchicalData.leagues.map((league) => {
            const leagueCheckboxState = getCheckboxState(league.id);
            const isExpanded = expandedLeagues.has(league.id);

            return (
              <Box
                key={league.id}
                sx={{ ml: 3, borderLeft: '1px solid', borderColor: 'divider', pl: 1 }}
              >
                <Stack direction="row" alignItems="center" sx={{ py: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={leagueCheckboxState.checked}
                        indeterminate={leagueCheckboxState.indeterminate}
                        onChange={() =>
                          handleUniversalToggle(league.id, leagueCheckboxState.checked)
                        }
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body1">{league.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          (
                          {managersOnly
                            ? `${league.totalManagers || 0} managers`
                            : `${league.totalPlayers || 0} players`}
                          )
                        </Typography>
                      </Stack>
                    }
                    sx={{ flex: 1, m: 0 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => toggleLeagueExpansion(league.id)}
                    disabled={league.divisions.length === 0}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Stack>

                <Collapse in={isExpanded}>
                  <Box sx={{ ml: 2, borderLeft: '1px solid', borderColor: 'divider', pl: 1 }}>
                    {/* Divisions */}
                    {league.divisions.map((division) => {
                      const isDivisionExpanded = expandedDivisions.has(division.id);
                      const divisionCheckboxState = getCheckboxState(division.id);

                      return (
                        <Box key={division.id}>
                          <Stack direction="row" alignItems="center" sx={{ py: 0.5 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={divisionCheckboxState.checked}
                                  indeterminate={divisionCheckboxState.indeterminate}
                                  onChange={() =>
                                    handleUniversalToggle(
                                      division.id,
                                      divisionCheckboxState.checked,
                                    )
                                  }
                                />
                              }
                              label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="body2">{division.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    (
                                    {managersOnly
                                      ? `${division.totalManagers || 0} managers`
                                      : `${division.totalPlayers || 0} players`}
                                    )
                                  </Typography>
                                </Stack>
                              }
                              sx={{ flex: 1, m: 0 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => toggleDivisionExpansion(division.id)}
                              disabled={division.teams.length === 0}
                            >
                              {isDivisionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Stack>

                          <Collapse in={isDivisionExpanded}>
                            <Box
                              sx={{ ml: 2, borderLeft: '1px solid', borderColor: 'divider', pl: 1 }}
                            >
                              {/* Teams */}
                              {division.teams.map((team) => {
                                const teamCheckboxState = getCheckboxState(team.id);

                                return (
                                  <FormControlLabel
                                    key={team.id}
                                    control={
                                      <Checkbox
                                        size="small"
                                        checked={teamCheckboxState.checked}
                                        indeterminate={teamCheckboxState.indeterminate}
                                        onChange={() =>
                                          handleUniversalToggle(team.id, teamCheckboxState.checked)
                                        }
                                      />
                                    }
                                    label={
                                      <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="body2">{team.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          (
                                          {managersOnly
                                            ? `${team.managerCount || 0} managers`
                                            : `${team.playerCount || 0} players`}
                                          )
                                        </Typography>
                                      </Stack>
                                    }
                                    sx={{
                                      width: '100%',
                                      py: 0.5,
                                      m: 0,
                                      '& .MuiFormControlLabel-label': { flex: 1 },
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default HierarchicalGroupSelection;
