import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, CircularProgress, TextField, Typography } from '@mui/material';
import type { PlayerCareerStatisticsType } from '@draco/shared-schemas';
import PlayerCareerStatisticsCard from '../../../../components/statistics/PlayerCareerStatisticsCard';
import {
  type PlayerCareerSearchResult,
  formatPlayerDisplayName,
} from '../../../../hooks/usePlayerCareerStatistics';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { useApiClient } from '../../../../hooks/useApiClient';
import {
  fetchPlayerCareerStatistics,
  searchPublicContacts,
} from '../../../../services/statisticsService';

interface PlayerCareerSearchTabProps {
  accountId: string;
}

const PlayerCareerSearchTab: React.FC<PlayerCareerSearchTabProps> = ({ accountId }) => {
  const apiClient = useApiClient();
  const [searchResults, setSearchResults] = useState<PlayerCareerSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerCareerStatisticsType | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerCareerSearchResult | null>(null);
  const debouncedSearch = useDebouncedValue(inputValue, 350);

  useEffect(() => {
    const performSearch = async () => {
      const trimmedQuery = debouncedSearch.trim();
      if (trimmedQuery.length === 0) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const response = await searchPublicContacts(
          accountId,
          { query: trimmedQuery },
          { client: apiClient },
        );

        const results: PlayerCareerSearchResult[] =
          response.results?.map((contact) => ({
            playerId: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            photoUrl: contact.photoUrl ?? undefined,
          })) ?? [];

        setSearchResults(results);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to search players';
        setSearchError(message);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    void performSearch();
  }, [debouncedSearch, accountId, apiClient]);

  useEffect(() => {
    const loadPlayerStats = async () => {
      if (!selectedPlayer) {
        setPlayerStats(null);
        setPlayerError(null);
        return;
      }

      setPlayerLoading(true);
      setPlayerError(null);

      try {
        const stats = await fetchPlayerCareerStatistics(accountId, selectedPlayer.playerId, {
          client: apiClient,
        });
        setPlayerStats(stats);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load player career statistics';
        setPlayerError(message);
        setPlayerStats(null);
      } finally {
        setPlayerLoading(false);
      }
    };

    void loadPlayerStats();
  }, [selectedPlayer, accountId, apiClient]);

  const options = searchResults;

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Player Career Statistics
        </Typography>
      </Box>

      <Box maxWidth={420} mb={3}>
        <Autocomplete<PlayerCareerSearchResult, false, false, false>
          options={options}
          loading={searchLoading}
          value={selectedPlayer}
          onChange={(_event, value) => setSelectedPlayer(value)}
          onInputChange={(_event, value) => setInputValue(value)}
          getOptionLabel={(option) => formatPlayerDisplayName(option)}
          filterOptions={(opts) => opts}
          isOptionEqualToValue={(option, value) => option.playerId === value.playerId}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.playerId}>
              <Box display="flex" alignItems="center" width="100%" gap={1}>
                <Typography variant="body2">{formatPlayerDisplayName(option)}</Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search players"
              placeholder="Start typing a player name"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Box>

      {searchError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {searchError}
        </Alert>
      ) : null}

      <PlayerCareerStatisticsCard
        stats={playerStats}
        loading={playerLoading}
        error={playerError}
        photoUrl={selectedPlayer?.photoUrl ?? undefined}
      />
    </Box>
  );
};

export default PlayerCareerSearchTab;
