'use client';
import React from 'react';
import { Box, FormControl, ListSubheader, MenuItem, Select, Typography } from '@mui/material';

interface LeagueOption {
  id: string;
  name: string;
}

interface TeamOption {
  id: string;
  name?: string | null;
  divisionName?: string | null;
}

interface LeagueTeamFilterProps {
  leagues: LeagueOption[];
  teams: TeamOption[];
  leagueValue: string;
  teamValue: string;
  onLeagueChange: (leagueId: string) => void;
  onTeamChange: (teamId: string) => void;
}

const UNASSIGNED_DIVISION = 'Unassigned';

const renderTeamMenuItems = (teams: TeamOption[]): React.ReactNode => {
  const teamLabel = (team: TeamOption) => team.name ?? 'Unknown Team';
  const hasDivisions = teams.some((team) => Boolean(team.divisionName?.trim()));

  if (!hasDivisions) {
    return teams.map((team) => (
      <MenuItem key={team.id} value={team.id}>
        {teamLabel(team)}
      </MenuItem>
    ));
  }

  const groups = new Map<string, TeamOption[]>();
  for (const team of teams) {
    const key = team.divisionName?.trim() || UNASSIGNED_DIVISION;
    const group = groups.get(key);
    if (group) {
      group.push(team);
    } else {
      groups.set(key, [team]);
    }
  }

  return Array.from(groups.keys())
    .sort((a, b) => a.localeCompare(b))
    .flatMap((groupName) => [
      <ListSubheader key={`division-${groupName}`}>{groupName}</ListSubheader>,
      ...groups
        .get(groupName)!
        .slice()
        .sort((a, b) => teamLabel(a).localeCompare(teamLabel(b)))
        .map((team) => (
          <MenuItem key={team.id} value={team.id}>
            {teamLabel(team)}
          </MenuItem>
        )),
    ]);
};

const LeagueTeamFilter: React.FC<LeagueTeamFilterProps> = ({
  leagues,
  teams,
  leagueValue,
  teamValue,
  onLeagueChange,
  onTeamChange,
}) => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ minWidth: 'fit-content' }}>
          League:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select value={leagueValue} onChange={(e) => onLeagueChange(e.target.value)} displayEmpty>
            <MenuItem value="">
              <em>All Leagues</em>
            </MenuItem>
            {leagues.map((league) => (
              <MenuItem key={league.id} value={league.id}>
                {league.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ minWidth: 'fit-content' }}>
          Team:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={teamValue}
            onChange={(e) => onTeamChange(e.target.value)}
            displayEmpty
            disabled={!leagueValue}
          >
            <MenuItem value="">
              <em>All Teams</em>
            </MenuItem>
            {renderTeamMenuItems(teams)}
          </Select>
        </FormControl>
      </Box>
    </>
  );
};

export default LeagueTeamFilter;
