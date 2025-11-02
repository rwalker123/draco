import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, CircularProgress, TextField, Typography } from '@mui/material';
import PlayerCareerStatisticsCard from '../../../../components/statistics/PlayerCareerStatisticsCard';
import {
  type PlayerCareerSearchResult,
  formatPlayerDisplayName,
  usePlayerCareerStatistics,
} from '../../../../hooks/usePlayerCareerStatistics';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';

interface PlayerCareerSearchTabProps {
  accountId: string;
}

const PlayerCareerSearchTab: React.FC<PlayerCareerSearchTabProps> = ({ accountId }) => {
  const {
    searchResults,
    searchLoading,
    searchError,
    searchPlayers,
    playerStats,
    playerLoading,
    playerError,
    loadPlayer,
    resetPlayer,
  } = usePlayerCareerStatistics({ accountId });

  const [inputValue, setInputValue] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerCareerSearchResult | null>(null);
  const debouncedSearch = useDebouncedValue(inputValue, 350);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    void searchPlayers({ query: trimmed });
  }, [debouncedSearch, searchPlayers]);

  useEffect(() => {
    if (selectedPlayer) {
      void loadPlayer(selectedPlayer.playerId);
    } else {
      resetPlayer();
    }
  }, [selectedPlayer, loadPlayer, resetPlayer]);

  const options = useMemo(() => searchResults ?? [], [searchResults]);

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
