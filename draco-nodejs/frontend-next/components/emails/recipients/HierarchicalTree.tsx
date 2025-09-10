'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { HierarchicalSeason, HierarchicalSelectionItem } from '../../../types/emails/recipients';
import { HierarchyMaps } from '../../../hooks/useHierarchicalMaps';
import HierarchicalTreeItem from './HierarchicalTreeItem';

interface HierarchicalTreeProps {
  hierarchicalData: HierarchicalSeason;
  seasonId: string;
  hierarchyMaps: HierarchyMaps;
  itemSelectedState: Map<string, HierarchicalSelectionItem>;
  onSelectionChange: (itemId: string) => void;
  managersOnly: boolean;
}

const HierarchicalTree: React.FC<HierarchicalTreeProps> = ({
  hierarchicalData,
  seasonId,
  itemSelectedState,
  onSelectionChange,
  managersOnly,
}) => {
  // Initialize expansion state with all leagues and divisions expanded by default
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(() => {
    const leagueIds = new Set<string>();
    hierarchicalData.leagues.forEach((league) => {
      leagueIds.add(league.id);
    });
    return leagueIds;
  });

  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(() => {
    const divisionIds = new Set<string>();
    hierarchicalData.leagues.forEach((league) => {
      league.divisions.forEach((division) => {
        divisionIds.add(division.id);
      });
    });
    return divisionIds;
  });

  // Toggle expansion handlers
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

  // Checkbox state calculator
  const getCheckboxState = useCallback(
    (itemId: string) => {
      const stateObj = itemSelectedState.get(itemId) || { state: 'unselected', playerCount: 0 };
      return {
        checked: stateObj.state === 'selected',
        indeterminate: stateObj.state === 'intermediate',
      };
    },
    [itemSelectedState],
  );

  // Render teams
  const renderTeams = useCallback(
    (teams: Array<{ id: string; name: string; playerCount?: number; managerCount?: number }>) => {
      return teams.map((team) => {
        const { checked, indeterminate } = getCheckboxState(team.id);
        return (
          <HierarchicalTreeItem
            key={team.id}
            id={team.id}
            title={team.name}
            playerCount={team.playerCount}
            managerCount={team.managerCount}
            managersOnly={managersOnly}
            level={3}
            isExpandable={false}
            isExpanded={false}
            isChecked={checked}
            isIndeterminate={indeterminate}
            onToggleExpanded={() => {}}
            onToggleSelected={onSelectionChange}
          />
        );
      });
    },
    [getCheckboxState, onSelectionChange, managersOnly],
  );

  // Render divisions
  const renderDivisions = useCallback(
    (divisions: HierarchicalSeason['leagues'][0]['divisions']) => {
      return divisions.map((division) => {
        const { checked, indeterminate } = getCheckboxState(division.id);
        const isExpanded = expandedDivisions.has(division.id);
        const hasTeams = division.teams.length > 0;

        return (
          <HierarchicalTreeItem
            key={division.id}
            id={division.id}
            title={division.name}
            playerCount={division.totalPlayers}
            managerCount={division.totalManagers}
            managersOnly={managersOnly}
            level={2}
            isExpandable={hasTeams}
            isExpanded={isExpanded}
            isChecked={checked}
            isIndeterminate={indeterminate}
            onToggleExpanded={toggleDivisionExpansion}
            onToggleSelected={onSelectionChange}
          >
            {hasTeams && renderTeams(division.teams)}
          </HierarchicalTreeItem>
        );
      });
    },
    [
      getCheckboxState,
      expandedDivisions,
      toggleDivisionExpansion,
      onSelectionChange,
      renderTeams,
      managersOnly,
    ],
  );

  // Render leagues
  const renderLeagues = useCallback(() => {
    return hierarchicalData.leagues.map((league) => {
      const { checked, indeterminate } = getCheckboxState(league.id);
      const isExpanded = expandedLeagues.has(league.id);
      const hasChildren = league.divisions.length > 0 || (league.unassignedTeams?.length ?? 0) > 0;

      return (
        <HierarchicalTreeItem
          key={league.id}
          id={league.id}
          title={league.name}
          playerCount={league.totalPlayers}
          managerCount={league.totalManagers}
          managersOnly={managersOnly}
          level={1}
          isExpandable={hasChildren}
          isExpanded={isExpanded}
          isChecked={checked}
          isIndeterminate={indeterminate}
          onToggleExpanded={toggleLeagueExpansion}
          onToggleSelected={onSelectionChange}
        >
          {hasChildren && (
            <>
              {renderDivisions(league.divisions)}
              {league.unassignedTeams &&
                league.unassignedTeams.length > 0 &&
                renderTeams(league.unassignedTeams)}
            </>
          )}
        </HierarchicalTreeItem>
      );
    });
  }, [
    hierarchicalData.leagues,
    getCheckboxState,
    expandedLeagues,
    toggleLeagueExpansion,
    onSelectionChange,
    renderDivisions,
    renderTeams,
    managersOnly,
  ]);

  // Season checkbox state
  const seasonCheckboxState = useMemo(
    () => getCheckboxState(seasonId),
    [getCheckboxState, seasonId],
  );

  return (
    <Box>
      {/* Season level */}
      <HierarchicalTreeItem
        id={seasonId}
        title={hierarchicalData.name}
        playerCount={hierarchicalData.totalPlayers}
        managerCount={hierarchicalData.totalManagers}
        managersOnly={managersOnly}
        level={0}
        isExpandable={hierarchicalData.leagues.length > 0}
        isExpanded={true} // Season is always expanded
        isChecked={seasonCheckboxState.checked}
        isIndeterminate={seasonCheckboxState.indeterminate}
        onToggleExpanded={() => {}} // Season expansion is not controlled
        onToggleSelected={onSelectionChange}
      >
        {renderLeagues()}
      </HierarchicalTreeItem>
    </Box>
  );
};

export default HierarchicalTree;
