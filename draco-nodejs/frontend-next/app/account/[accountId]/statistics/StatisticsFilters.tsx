'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { listAccountSeasons, listAllTimeLeagues } from '@draco/shared-api-client';
import { LeagueType } from '@draco/shared-schemas';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { mapSeasonsWithDivisions, SeasonSummary } from '../../../../utils/seasonMapper';

interface Division {
  id: string;
  name: string;
}

interface League {
  id: string;
  name: string;
}

type Season = SeasonSummary;

interface StatisticsFilters {
  seasonId: string;
  leagueId: string;
  divisionId: string;
  isHistorical: boolean;
}

interface StatisticsFiltersProps {
  accountId: string;
  filters: StatisticsFilters;
  onChange: (filters: Partial<StatisticsFilters>) => void;
}

export default function StatisticsFilters({
  accountId,
  filters,
  onChange,
}: StatisticsFiltersProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonsData, setSeasonsData] = useState<Season[]>([]); // Cache all data
  const [leagues, setLeagues] = useState<League[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState({
    seasons: false,
    leagues: false,
    divisions: false,
  });
  const apiClient = useApiClient();

  // Load seasons on component mount
  useEffect(() => {
    loadSeasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load leagues when season changes or data is loaded
  useEffect(() => {
    if (filters.seasonId && seasonsData.length > 0) {
      loadLeagues();
    } else {
      setLeagues([]);
      setDivisions([]);
      onChange({ leagueId: '', divisionId: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.seasonId, filters.isHistorical, seasonsData]);

  // Load divisions when league changes
  useEffect(() => {
    if (filters.leagueId && filters.leagueId !== '0' && seasonsData.length > 0) {
      loadDivisions();
    } else {
      setDivisions([]);
      onChange({ divisionId: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.leagueId, seasonsData]);

  const loadSeasons = useCallback(async () => {
    setLoading((prev) => ({ ...prev, seasons: true }));
    try {
      const result = await listAccountSeasons({
        client: apiClient,
        path: { accountId },
        query: { includeDivisions: true },
        throwOnError: false,
      });

      const seasonsResponse = unwrapApiResult(result, 'Failed to load seasons');
      const mappedSeasons = mapSeasonsWithDivisions(seasonsResponse);

      setSeasonsData(mappedSeasons);

      const allTimeOption: Season = {
        id: '0',
        name: 'All Time',
        accountId,
        isCurrent: false,
        leagues: [],
      };

      const allSeasons = [allTimeOption, ...mappedSeasons];
      setSeasons(allSeasons);

      if (!filters.seasonId && mappedSeasons.length > 0) {
        const currentSeason = mappedSeasons.find((s) => s.isCurrent) ?? mappedSeasons[0];
        onChange({ seasonId: currentSeason.id });
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
    } finally {
      setLoading((prev) => ({ ...prev, seasons: false }));
    }
  }, [accountId, apiClient, filters.seasonId, onChange]);

  const loadLeagues = useCallback(async () => {
    setLoading((prev) => ({ ...prev, leagues: true }));
    try {
      let formattedLeagues: League[] = [];

      if (filters.isHistorical) {
        // For all-time stats, use the shared API client to fetch leagues
        const result = await listAllTimeLeagues({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        const leagues = unwrapApiResult(result, 'Failed to load leagues') as
          | LeagueType[]
          | undefined;

        formattedLeagues = (leagues ?? []).map((league) => ({
          id: league.id,
          name: league.name,
        }));
      } else {
        // For season stats, use cached season data
        const selectedSeason = seasonsData.find((s) => s.id === filters.seasonId);
        const leaguesData = selectedSeason?.leagues || [];

        // Convert to the format expected by the dropdown
        formattedLeagues = leaguesData.map((league) => ({
          id: league.id, // Use leagueseason.id for season stats
          name: league.leagueName,
        }));
      }

      setLeagues(formattedLeagues);

      // Auto-select first league if none selected
      if (!filters.leagueId && formattedLeagues.length > 0) {
        onChange({ leagueId: formattedLeagues[0].id });
      }
    } catch (error) {
      console.error('Error loading leagues:', error);
    } finally {
      setLoading((prev) => ({ ...prev, leagues: false }));
    }
  }, [
    accountId,
    apiClient,
    seasonsData,
    filters.seasonId,
    filters.isHistorical,
    onChange,
    filters.leagueId,
  ]);

  const loadDivisions = useCallback(() => {
    setLoading((prev) => ({ ...prev, divisions: true }));
    try {
      // Find the season and league from cached data
      const selectedSeason = seasonsData.find((s) => s.id === filters.seasonId);
      const selectedLeague = selectedSeason?.leagues.find((l) => l.id === filters.leagueId);
      const divisionsData = selectedLeague?.divisions || [];

      // Add "All Divisions" option as the first item
      const allDivisions = [{ id: '0', name: 'All Divisions' }, ...divisionsData];

      setDivisions(allDivisions);

      // Auto-select "All Divisions" if none selected
      if (!filters.divisionId) {
        onChange({ divisionId: '0' });
      }
    } catch (error) {
      console.error('Error loading divisions:', error);
    } finally {
      setLoading((prev) => ({ ...prev, divisions: false }));
    }
  }, [seasonsData, filters.seasonId, filters.leagueId, onChange, filters.divisionId]);

  const handleSeasonChange = (event: SelectChangeEvent) => {
    const seasonId = event.target.value;
    const isHistorical = seasonId === '0';
    onChange({
      seasonId,
      isHistorical,
      leagueId: '',
      divisionId: '',
    });
  };

  const handleLeagueChange = (event: SelectChangeEvent) => {
    onChange({
      leagueId: event.target.value,
      divisionId: '',
    });
  };

  const handleDivisionChange = (event: SelectChangeEvent) => {
    onChange({ divisionId: event.target.value });
  };

  const handleHistoricalToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isHistorical = event.target.checked;
    const seasonId = isHistorical ? '0' : seasons.find((s) => s.id !== '0')?.id || '';
    onChange({
      isHistorical,
      seasonId,
      leagueId: '',
      divisionId: '',
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Box sx={{ minWidth: 200 }}>
          <FormControl fullWidth>
            <InputLabel id="season-select-label">Season</InputLabel>
            <Select
              labelId="season-select-label"
              value={filters.seasonId}
              label="Season"
              onChange={handleSeasonChange}
              disabled={loading.seasons}
            >
              {seasons.map((season) => (
                <MenuItem key={season.id} value={season.id}>
                  {season.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ minWidth: 200 }}>
          <FormControl fullWidth>
            <InputLabel id="league-select-label">League</InputLabel>
            <Select
              labelId="league-select-label"
              value={filters.leagueId}
              label="League"
              onChange={handleLeagueChange}
              disabled={loading.leagues || !filters.seasonId}
            >
              {leagues.map((league) => (
                <MenuItem key={league.id} value={league.id}>
                  {league.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ minWidth: 200 }}>
          <FormControl fullWidth>
            <InputLabel id="division-select-label">Division</InputLabel>
            <Select
              labelId="division-select-label"
              value={filters.divisionId}
              label="Division"
              onChange={handleDivisionChange}
              disabled={loading.divisions || !filters.leagueId || filters.leagueId === '0'}
            >
              {divisions.map((division) => (
                <MenuItem key={division.id} value={division.id}>
                  {division.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ minWidth: 200 }}>
          <FormControlLabel
            control={
              <Switch
                checked={filters.isHistorical}
                onChange={handleHistoricalToggle}
                name="historical"
              />
            }
            label="All-Time Stats"
          />
        </Box>
      </Box>
    </Box>
  );
}
