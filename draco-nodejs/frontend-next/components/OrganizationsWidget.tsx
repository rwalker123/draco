import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { AccountType } from '@draco/shared-schemas';
import { searchAccounts } from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';

export type OrganizationAccount = AccountType & {
  ownerName?: string;
};

interface AccountListApiItem {
  id: string;
  name: string;
  accountType?: string | null;
  firstYear?: number | null;
  affiliation?: string | null;
  affiliationId?: string | null;
  urls?: { id: string; url: string }[];
  ownerName?: string | null;
}

interface OrganizationsWidgetProps {
  title?: string;
  showSearch?: boolean;
  maxDisplay?: number;
  sx?: React.CSSProperties | Record<string, unknown>;
  onOrganizationClick?: (accountId: string) => void;
  // If organizations are provided, use them instead of loading user's organizations
  organizations?: OrganizationAccount[];
  loading?: boolean;
  error?: string | null;
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  onSearchTermChange?: (searchTerm: string) => void;
  // Account ID to exclude from the list (e.g., current account)
  excludeAccountId?: string;
  // Callback when organizations are loaded
  onOrganizationsLoaded?: (organizations: OrganizationAccount[]) => void;
}

const OrganizationsWidget: React.FC<OrganizationsWidgetProps> = ({
  title = 'Organizations',
  showSearch = false,
  maxDisplay,
  sx,
  onOrganizationClick,
  organizations: providedOrganizations,
  loading: providedLoading,
  error: providedError,
  onSearch,
  searchTerm: providedSearchTerm,
  onSearchTermChange,
  excludeAccountId,
  onOrganizationsLoaded,
}) => {
  const [accounts, setAccounts] = useState<OrganizationAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const apiClient = useApiClient();
  const router = useRouter();

  // Use provided values if available, otherwise use internal state
  const displayAccounts = providedOrganizations || accounts;
  const displayLoading = providedLoading !== undefined ? providedLoading : loading;
  const displayError = providedError !== undefined ? providedError : error;
  const displaySearchTerm = providedSearchTerm !== undefined ? providedSearchTerm : searchTerm;

  // Filter out excluded account if specified
  const filteredAccounts = excludeAccountId
    ? displayAccounts.filter((account) => account.id !== excludeAccountId)
    : displayAccounts;

  const getOwnerDisplayName = useCallback((account: OrganizationAccount): string | undefined => {
    if (account.accountOwner) {
      const names = [account.accountOwner.firstName, account.accountOwner.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      return names || undefined;
    }

    return account.ownerName ?? undefined;
  }, []);

  const loadUserAccounts = useCallback(async () => {
    if (!user || providedOrganizations) return; // Don't load if organizations are provided
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/accounts/my-accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const accountsData = Array.isArray(data.data.accounts)
            ? (data.data.accounts as AccountListApiItem[])
            : [];
          const normalizedAccounts: OrganizationAccount[] = accountsData.map((account) => ({
            id: account.id,
            name: account.name,
            accountType: account.accountType ?? undefined,
            firstYear: account.firstYear ?? null,
            affiliation:
              account.affiliation && account.affiliationId
                ? {
                    id: account.affiliationId,
                    name: account.affiliation,
                    url: undefined,
                  }
                : undefined,
            urls: account.urls?.map((url) => ({ id: url.id, url: url.url })) ?? [],
            ownerName: account.ownerName ?? undefined,
          }));

          setAccounts(normalizedAccounts);
          // Notify parent component about loaded organizations
          if (onOrganizationsLoaded) {
            onOrganizationsLoaded(normalizedAccounts);
          }
        } else {
          setError(data.message || 'Failed to load your organizations');
        }
      } else {
        setError('Failed to load your organizations. Please try again.');
      }
    } catch {
      setError('Failed to load your organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, token, providedOrganizations, onOrganizationsLoaded]);

  useEffect(() => {
    if (user && !providedOrganizations) {
      loadUserAccounts();
    }
  }, [user, providedOrganizations, loadUserAccounts]);

  const handleSearch = async () => {
    if (!displaySearchTerm.trim()) return;

    if (onSearch) {
      onSearch(displaySearchTerm);
    } else {
      setLoading(true);
      setError(null);

      try {
        const result = await searchAccounts({
          client: apiClient,
          throwOnError: false,
          query: { q: displaySearchTerm.trim() },
        });

        if (result.error) {
          setAccounts([]);
          setError(result.error.message || 'Search failed');
          return;
        }

        setAccounts(result.data ?? []);
      } catch (error) {
        console.error('Account search failed:', error);
        setError('Failed to search accounts. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearSearch = () => {
    const newSearchTerm = '';
    if (onSearchTermChange) {
      onSearchTermChange(newSearchTerm);
    } else {
      setSearchTerm(newSearchTerm);
    }
    setAccounts([]);
    if (user && !providedOrganizations) {
      loadUserAccounts();
    }
  };

  const handleViewAccount = (accountId: string) => {
    if (onOrganizationClick) {
      onOrganizationClick(accountId);
    } else {
      router.push(`/account/${accountId}/home`);
    }
  };

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    if (onSearchTermChange) {
      onSearchTermChange(newSearchTerm);
    } else {
      setSearchTerm(newSearchTerm);
    }
  };

  // Filter and limit accounts for display
  const limitedAccounts = maxDisplay ? filteredAccounts.slice(0, maxDisplay) : filteredAccounts;

  // Don't show widget for non-authenticated users unless organizations are provided or search is enabled
  if (!user && !providedOrganizations && !showSearch) {
    return null;
  }

  return (
    <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', ...sx }}>
      {/* Search Section */}
      {showSearch && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <TextField
                fullWidth
                placeholder="Search by organization name, type, or location..."
                value={displaySearchTerm}
                onChange={handleSearchTermChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch} disabled={displayLoading}>
                        {displayLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ minWidth: 120 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={displayLoading || !displaySearchTerm.trim()}
              >
                Search
              </Button>
            </Box>
          </Box>
          {displaySearchTerm && (
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" onClick={handleClearSearch}>
                {user ? 'Clear Search & Show My Organizations' : 'Clear Search'}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Title - shown below search or at top if no search */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
        }}
      >
        <StarIcon sx={{ color: 'warning.main' }} />
        {title}
      </Typography>

      {/* Loading State */}
      {displayLoading && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {displaySearchTerm ? 'Searching...' : 'Loading organizations...'}
          </Typography>
        </Box>
      )}

      {/* Error Display */}
      {displayError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {displayError}
        </Alert>
      )}

      {/* Organizations Display */}
      {limitedAccounts.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {limitedAccounts.map((account) => {
            const ownerDisplayName = getOwnerDisplayName(account);
            const showOwner = Boolean(user && ownerDisplayName);

            return (
              <Card
                key={account.id}
                sx={{
                  minWidth: 280,
                  flex: '1 1 300px',
                  height: '100%',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {account.name}
                  </Typography>
                  {account.accountType && (
                    <Typography color="text.secondary" gutterBottom>
                      {account.accountType}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Established: {account.firstYear ?? '—'}
                  </Typography>
                  {account.affiliation && (
                    <Typography variant="body2" color="text.secondary">
                      Affiliation: {account.affiliation.name}
                    </Typography>
                  )}
                  {account.urls && account.urls.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Website: {account.urls[0].url}
                    </Typography>
                  )}
                  {showOwner && (
                    <Typography variant="body2" color="text.secondary">
                      Owner: {ownerDisplayName}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewAccount(account.id)}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'transparent',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    View Organization
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}

      {/* No Organizations Message */}
      {limitedAccounts.length === 0 && !displayLoading && !displayError && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          {displaySearchTerm
            ? 'No organizations found matching your search.'
            : 'No organizations to display.'}
        </Typography>
      )}

      {/* Show More Button */}
      {maxDisplay && filteredAccounts.length > maxDisplay && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="outlined" onClick={() => router.push('/accounts')}>
            View All Organizations
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default OrganizationsWidget;
