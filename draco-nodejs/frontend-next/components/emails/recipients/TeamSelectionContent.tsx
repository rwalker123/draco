import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  SportsSoccer as LeagueIcon,
  Groups as DivisionIcon,
  EmojiEvents as TeamIcon,
} from '@mui/icons-material';

// Mock data structure - this will come from API in real implementation
interface MockLeague {
  id: string;
  name: string;
  divisions: MockDivision[];
  teamCount: number;
  totalPlayers: number;
}

interface MockDivision {
  id: string;
  name: string;
  teams: MockTeam[];
  teamCount: number;
  totalPlayers: number;
}

interface MockTeam {
  id: string;
  name: string;
  playerCount: number;
}

interface TeamSelectionContentProps {
  selectedLeagues: Set<string>;
  selectedDivisions: Set<string>;
  selectedTeams: Set<string>;
  onLeagueToggle: (leagueId: string) => void;
  onDivisionToggle: (divisionId: string) => void;
  onTeamToggle: (teamId: string) => void;
  onSelectAllTeams: () => void;
  onDeselectAllTeams: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

// Mock data for development
const mockLeagues: MockLeague[] = [
  {
    id: 'league-1',
    name: 'Premier League',
    teamCount: 20,
    totalPlayers: 440,
    divisions: [
      {
        id: 'div-1',
        name: 'Division A',
        teamCount: 10,
        totalPlayers: 220,
        teams: [
          { id: 'team-1', name: 'Arsenal', playerCount: 22 },
          { id: 'team-2', name: 'Chelsea', playerCount: 23 },
          { id: 'team-3', name: 'Manchester United', playerCount: 24 },
          { id: 'team-4', name: 'Liverpool', playerCount: 21 },
          { id: 'team-5', name: 'Manchester City', playerCount: 22 },
        ],
      },
      {
        id: 'div-2',
        name: 'Division B',
        teamCount: 10,
        totalPlayers: 220,
        teams: [
          { id: 'team-6', name: 'Tottenham', playerCount: 23 },
          { id: 'team-7', name: 'West Ham', playerCount: 22 },
          { id: 'team-8', name: 'Leicester', playerCount: 21 },
          { id: 'team-9', name: 'Aston Villa', playerCount: 22 },
          { id: 'team-10', name: 'Newcastle', playerCount: 23 },
        ],
      },
    ],
  },
  {
    id: 'league-2',
    name: 'Championship',
    teamCount: 24,
    totalPlayers: 528,
    divisions: [
      {
        id: 'div-3',
        name: 'Upper Division',
        teamCount: 12,
        totalPlayers: 264,
        teams: [
          { id: 'team-11', name: 'Fulham', playerCount: 22 },
          { id: 'team-12', name: 'Bournemouth', playerCount: 21 },
          { id: 'team-13', name: 'Nottingham Forest', playerCount: 23 },
          { id: 'team-14', name: 'Crystal Palace', playerCount: 22 },
          { id: 'team-15', name: 'Brighton', playerCount: 21 },
          { id: 'team-16', name: 'Brentford', playerCount: 22 },
        ],
      },
      {
        id: 'div-4',
        name: 'Lower Division',
        teamCount: 12,
        totalPlayers: 264,
        teams: [
          { id: 'team-17', name: 'Wolves', playerCount: 22 },
          { id: 'team-18', name: 'Everton', playerCount: 21 },
          { id: 'team-19', name: 'Burnley', playerCount: 23 },
          { id: 'team-20', name: 'Watford', playerCount: 22 },
          { id: 'team-21', name: 'Norwich', playerCount: 21 },
          { id: 'team-22', name: 'Southampton', playerCount: 22 },
        ],
      },
    ],
  },
];

const TeamSelectionContent: React.FC<TeamSelectionContentProps> = ({
  selectedLeagues,
  selectedDivisions,
  selectedTeams,
  onLeagueToggle,
  onDivisionToggle,
  onTeamToggle,
  onSelectAllTeams,
  onDeselectAllTeams,
  searchQuery,
  onSearchQueryChange,
}) => {
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());

  // Filter leagues and teams based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return mockLeagues;

    const query = searchQuery.toLowerCase();
    return mockLeagues
      .map((league) => ({
        ...league,
        divisions: league.divisions
          .map((division) => ({
            ...division,
            teams: division.teams.filter(
              (team) =>
                team.name.toLowerCase().includes(query) ||
                division.name.toLowerCase().includes(query) ||
                league.name.toLowerCase().includes(query),
            ),
          }))
          .filter((division) => division.teams.length > 0),
      }))
      .filter((league) => league.divisions.length > 0);
  }, [searchQuery]);

  // Calculate totals
  const totalTeams = useMemo(
    () =>
      filteredData.reduce(
        (sum, league) =>
          sum + league.divisions.reduce((divSum, division) => divSum + division.teams.length, 0),
        0,
      ),
    [filteredData],
  );

  const totalSelectedTeams = selectedTeams.size;
  const totalSelectedDivisions = selectedDivisions.size;
  const totalSelectedLeagues = selectedLeagues.size;

  // Toggle league expansion
  const toggleLeagueExpansion = (leagueId: string) => {
    setExpandedLeagues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leagueId)) {
        newSet.delete(leagueId);
      } else {
        newSet.add(leagueId);
      }
      return newSet;
    });
  };

  // Toggle division expansion
  const toggleDivisionExpansion = (divisionId: string) => {
    setExpandedDivisions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) {
        newSet.delete(divisionId);
      } else {
        newSet.add(divisionId);
      }
      return newSet;
    });
  };

  // Check if all teams in a division are selected
  const isDivisionFullySelected = (division: MockDivision) => {
    return division.teams.every((team) => selectedTeams.has(team.id));
  };

  // Check if division is partially selected
  const isDivisionPartiallySelected = (division: MockDivision) => {
    const selectedCount = division.teams.filter((team) => selectedTeams.has(team.id)).length;
    return selectedCount > 0 && selectedCount < division.teams.length;
  };

  // Check if all teams in a league are selected
  const isLeagueFullySelected = (league: MockLeague) => {
    return league.divisions.every((division) => isDivisionFullySelected(division));
  };

  // Check if league is partially selected
  const isLeaguePartiallySelected = (league: MockLeague) => {
    const selectedCount = league.divisions.filter(
      (division) => isDivisionFullySelected(division) || isDivisionPartiallySelected(division),
    ).length;
    return selectedCount > 0 && selectedCount < league.divisions.length;
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header with selection summary */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Team Selection
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select specific teams or entire divisions/leagues. Use the search to find specific teams
          quickly.
        </Typography>

        {/* Selection summary */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip
            label={`${totalSelectedLeagues} Leagues`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            label={`${totalSelectedDivisions} Divisions`}
            color="secondary"
            variant="outlined"
            size="small"
          />
          <Chip
            label={`${totalSelectedTeams} Teams`}
            color="success"
            variant="outlined"
            size="small"
          />
        </Stack>

        {/* Bulk actions */}
        <Stack direction="row" spacing={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={totalSelectedTeams === totalTeams}
                indeterminate={totalSelectedTeams > 0 && totalSelectedTeams < totalTeams}
                onChange={() => {
                  if (totalSelectedTeams === totalTeams) {
                    onDeselectAllTeams();
                  } else {
                    onSelectAllTeams();
                  }
                }}
              />
            }
            label={`Select All Teams (${totalTeams})`}
          />
        </Stack>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search teams, divisions, or leagues..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Leagues and Divisions */}
      {filteredData.length === 0 ? (
        <Alert severity="info">
          {searchQuery ? `No results found for "${searchQuery}"` : 'No leagues available'}
        </Alert>
      ) : (
        <Box>
          {filteredData.map((league) => (
            <Accordion
              key={league.id}
              expanded={expandedLeagues.has(league.id)}
              onChange={() => toggleLeagueExpansion(league.id)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isLeagueFullySelected(league)}
                        indeterminate={isLeaguePartiallySelected(league)}
                        onChange={() => onLeagueToggle(league.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label=""
                    sx={{ mr: 1 }}
                  />
                  <LeagueIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {league.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={`${league.teamCount} teams`} size="small" variant="outlined" />
                    <Chip
                      label={`${league.totalPlayers} players`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ pl: 4 }}>
                {league.divisions.map((division) => (
                  <Accordion
                    key={division.id}
                    expanded={expandedDivisions.has(division.id)}
                    onChange={() => toggleDivisionExpansion(division.id)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isDivisionFullySelected(division)}
                              indeterminate={isDivisionPartiallySelected(division)}
                              onChange={() => onDivisionToggle(division.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                          label=""
                          sx={{ mr: 1 }}
                        />
                        <DivisionIcon sx={{ mr: 1, color: 'secondary.main' }} />
                        <Typography variant="body1" sx={{ flexGrow: 1 }}>
                          {division.name}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={`${division.teamCount} teams`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`${division.totalPlayers} players`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pl: 4 }}>
                      <Stack spacing={1}>
                        {division.teams.map((team) => (
                          <Box
                            key={team.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1,
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedTeams.has(team.id)}
                                  onChange={() => onTeamToggle(team.id)}
                                />
                              }
                              label=""
                              sx={{ mr: 1 }}
                            />
                            <TeamIcon sx={{ mr: 1, color: 'success.main' }} />
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                              {team.name}
                            </Typography>
                            <Chip
                              label={`${team.playerCount} players`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TeamSelectionContent;
