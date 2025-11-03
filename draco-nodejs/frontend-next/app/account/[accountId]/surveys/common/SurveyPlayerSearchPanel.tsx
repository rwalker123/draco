import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, CircularProgress, TextField } from '@mui/material';
import { searchPublicContacts } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { useDebouncedValue } from '../../../../../hooks/useDebouncedValue';
import { unwrapApiResult } from '@/utils/apiResult';
import { ContactOption, formatContactName } from './surveyResponseTypes';

interface SurveyPlayerSearchPanelProps {
  accountId: string;
  apiClient: Client;
  selectedContact: ContactOption | null;
  onContactSelected: (contact: ContactOption | null) => void;
  disabled?: boolean;
}

const SurveyPlayerSearchPanel: React.FC<SurveyPlayerSearchPanelProps> = React.memo(
  ({ accountId, apiClient, selectedContact, onContactSelected, disabled = false }) => {
    const [inputValue, setInputValue] = useState('');
    const [searchResults, setSearchResults] = useState<ContactOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debouncedInput = useDebouncedValue(inputValue, 300);

    useEffect(() => {
      const trimmed = debouncedInput.trim();
      if (!trimmed) {
        setSearchResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      let isActive = true;
      setLoading(true);
      setError(null);

      (async () => {
        try {
          const response = await searchPublicContacts({
            client: apiClient,
            path: { accountId },
            query: { query: trimmed, limit: '15' },
            throwOnError: false,
          });

          if (!isActive) {
            return;
          }

          const data = unwrapApiResult(response, 'Failed to search players');
          const options: ContactOption[] =
            data.results?.map((contact) => ({
              id: contact.id,
              firstName: contact.firstName,
              lastName: contact.lastName,
              photoUrl: contact.photoUrl ?? undefined,
            })) ?? [];

          setSearchResults(options);
        } catch (err) {
          if (!isActive) {
            return;
          }
          console.error('Failed to search contacts', err);
          const message = err instanceof Error ? err.message : 'Failed to search players.';
          setError(message);
          setSearchResults([]);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      })();

      return () => {
        isActive = false;
      };
    }, [accountId, apiClient, debouncedInput]);

    const options = useMemo(() => searchResults, [searchResults]);

    return (
      <Box maxWidth={420} sx={{ mb: 2 }}>
        <Autocomplete<ContactOption, false, false, false>
          disabled={disabled}
          options={options}
          loading={loading}
          value={selectedContact}
          inputValue={inputValue}
          onChange={(_event, value) => {
            onContactSelected(value);
          }}
          onInputChange={(_event, value, reason) => {
            if (reason === 'reset') {
              return;
            }
            setInputValue(value);
          }}
          getOptionLabel={(option) => formatContactName(option)}
          filterOptions={(opts) => opts}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              {formatContactName(option)}
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
                    {loading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  },
);

SurveyPlayerSearchPanel.displayName = 'SurveyPlayerSearchPanel';

export default SurveyPlayerSearchPanel;
