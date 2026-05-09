'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Autocomplete,
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useApiClient } from '../../hooks/useApiClient';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { searchPublicContacts } from '../../services/statisticsService';

interface GlobalPlayerSearchOption {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

const ACCOUNT_PATH_PATTERN = /^\/account\/(\d+)(?:\/|$)/;

const resolveAccountId = (pathname: string | null): string | null => {
  if (!pathname) return null;
  const match = pathname.match(ACCOUNT_PATH_PATTERN);
  return match ? match[1] : null;
};

const formatDisplayName = (option: GlobalPlayerSearchOption) =>
  `${option.firstName} ${option.lastName}`.trim();

const GlobalPlayerSearch: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const apiClient = useApiClient();
  const accountId = resolveAccountId(pathname);

  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<GlobalPlayerSearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const debouncedQuery = useDebouncedValue(inputValue, 350);
  const trimmedQuery = debouncedQuery.trim();
  const hasActiveQuery = trimmedQuery.length > 0;

  useEffect(() => {
    if (!expanded) {
      setInputValue('');
      setOptions([]);
      setError(null);
      return;
    }
    inputRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (containerRef.current && containerRef.current.contains(target)) return;
      if (target.closest('.MuiAutocomplete-popper')) return;
      setExpanded(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded || !accountId || !hasActiveQuery) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();

    const performSearch = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await searchPublicContacts(
          accountId,
          { query: trimmedQuery, limit: 10 },
          { client: apiClient, signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const next: GlobalPlayerSearchOption[] =
          response.results?.map((contact) => ({
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            photoUrl: contact.photoUrl ?? undefined,
          })) ?? [];
        setOptions(next);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to search players');
        setOptions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void performSearch();

    return () => {
      controller.abort();
    };
  }, [expanded, accountId, hasActiveQuery, trimmedQuery, apiClient]);

  if (!accountId) {
    return null;
  }

  const handleOpen = () => {
    setExpanded(true);
  };

  const handleClose = () => {
    setExpanded(false);
  };

  const handleSelect = (option: GlobalPlayerSearchOption | null) => {
    if (!option) return;
    setExpanded(false);
    router.push(`/account/${accountId}/players/${option.id}`);
  };

  if (!expanded) {
    return (
      <Tooltip title="Search players">
        <IconButton color="inherit" aria-label="Search players" onClick={handleOpen} size="large">
          <SearchIcon />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{ display: 'flex', alignItems: 'center', width: { xs: 220, sm: 300, md: 340 } }}
    >
      <Autocomplete<GlobalPlayerSearchOption, false, false, false>
        fullWidth
        size="small"
        options={options}
        loading={loading}
        filterOptions={(opts) => opts}
        getOptionLabel={(option) => formatDisplayName(option)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        inputValue={inputValue}
        onInputChange={(_event, value) => setInputValue(value)}
        onChange={(_event, value) => handleSelect(value)}
        noOptionsText={
          hasActiveQuery ? (error ?? 'No players found') : 'Start typing a player name'
        }
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <Box display="flex" alignItems="center" width="100%" gap={1}>
              <Avatar
                src={option.photoUrl}
                alt={formatDisplayName(option)}
                sx={{ width: 28, height: 28 }}
              >
                {option.firstName?.[0]}
                {option.lastName?.[0]}
              </Avatar>
              <Typography variant="body2">{formatDisplayName(option)}</Typography>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            placeholder="Search players"
            variant="outlined"
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 1,
            }}
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
      <IconButton
        color="inherit"
        aria-label="Close player search"
        onClick={handleClose}
        size="small"
        sx={{ ml: 0.5 }}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
};

export default GlobalPlayerSearch;
