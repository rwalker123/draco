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
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { AccountType } from '@draco/shared-schemas';
import { searchAccounts, getMyAccounts } from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';
import { getContactDisplayName } from '../utils/contactUtils';
import { unwrapApiResult } from '../utils/apiResult';
import useCarousel from './profile/useCarousel';

interface OrganizationsWidgetProps {
  title?: string;
  showSearch?: boolean;
  maxDisplay?: number;
  sx?: React.CSSProperties | Record<string, unknown>;
  onOrganizationClick?: (accountId: string) => void;
  // If organizations are provided, use them instead of loading user's organizations
  organizations?: AccountType[];
  loading?: boolean;
  error?: string | null;
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
  onSearchTermChange?: (searchTerm: string) => void;
  // Account ID to exclude from the list (e.g., current account)
  excludeAccountId?: string;
  // Callback when organizations are loaded
  onOrganizationsLoaded?: (organizations: AccountType[]) => void;
  scrollable?: boolean;
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
  scrollable = false,
}) => {
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const apiClient = useApiClient();
  const router = useRouter();

  // Use provided values if available, otherwise use internal state
  const displayAccounts: AccountType[] = providedOrganizations || accounts;
  const displayLoading = providedLoading !== undefined ? providedLoading : loading;
  const displayError = providedError !== undefined ? providedError : error;
  const displaySearchTerm = providedSearchTerm !== undefined ? providedSearchTerm : searchTerm;

  // Filter out excluded account if specified
  const filteredAccounts = excludeAccountId
    ? displayAccounts.filter((account) => account.id !== excludeAccountId)
    : displayAccounts;

  const loadUserAccounts = useCallback(async () => {
    if (!user || providedOrganizations) return; // Don't load if organizations are provided
    setLoading(true);
    setError(null);
    try {
      const result = await getMyAccounts({
        client: apiClient,
        throwOnError: false,
      });

      const organizations =
        (
          unwrapApiResult(result, 'Failed to load your organizations. Please try again.') as
            | AccountType[]
            | undefined
        )?.filter((account) => (excludeAccountId ? account.id !== excludeAccountId : true)) ?? [];
      setAccounts(organizations);
      if (onOrganizationsLoaded) {
        onOrganizationsLoaded(organizations);
      }
    } catch {
      setError('Failed to load your organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, providedOrganizations, onOrganizationsLoaded, apiClient, excludeAccountId]);

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

        const accountsData = unwrapApiResult(
          result,
          'Failed to search accounts. Please try again.',
        ) as AccountType[] | undefined;

        setAccounts(accountsData ?? []);
      } catch (error) {
        console.error('Account search failed:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to search accounts. Please try again.',
        );
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
  const isScrollable = scrollable && !maxDisplay;
  const carousel = useCarousel({
    total: limitedAccounts.length,
    visibleItems: 1,
    loop: false,
  });
  const showCarouselControls = isScrollable && limitedAccounts.length > 1;

  const renderOrganizationCard = (account: AccountType) => {
    const ownerDisplayName = getContactDisplayName(account.accountOwner?.contact);
    const showOwner = Boolean(user && ownerDisplayName);

    return (
      <Card
        key={account.id}
        sx={{
          minWidth: isScrollable ? 320 : 280,
          maxWidth: isScrollable ? undefined : 360,
          flex: isScrollable ? '0 0 320px' : '0 1 360px',
          height: '100%',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          scrollSnapAlign: isScrollable ? 'start' : undefined,
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
            borderColor: 'primary.main',
          },
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {account.name}
          </Typography>
          {account.configuration?.accountType && (
            <Typography color="text.secondary" gutterBottom>
              {account.configuration.accountType.name}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Established: {account.configuration?.firstYear ?? '—'}
          </Typography>
          {account.configuration?.affiliation && (
            <Typography variant="body2" color="text.secondary">
              Affiliation: {account.configuration.affiliation.name}
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
  };

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
        <Box sx={{ position: 'relative', overflow: 'visible' }}>
          {isScrollable ? (
            <Box sx={{ position: 'relative', pt: 4, pb: 3 }}>
              <Box
                ref={carousel.registerNode}
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'nowrap',
                  overflow: 'hidden',
                  alignItems: 'stretch',
                  pt: 3,
                  pb: 1,
                  px: showCarouselControls ? 5 : 0,
                }}
              >
                {limitedAccounts.map(renderOrganizationCard)}
              </Box>

              {showCarouselControls && (
                <>
                  <IconButton
                    aria-label="Previous organizations"
                    onClick={carousel.handlePrev}
                    disabled={!carousel.canGoPrev}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: 16,
                      transform: 'translateY(-50%)',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      '&:hover': {
                        backgroundColor: 'grey.100',
                      },
                    }}
                  >
                    <ArrowBackIosIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    aria-label="Next organizations"
                    onClick={carousel.handleNext}
                    disabled={!carousel.canGoNext}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      right: 16,
                      transform: 'translateY(-50%)',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      '&:hover': {
                        backgroundColor: 'grey.100',
                      },
                    }}
                  >
                    <ArrowForwardIosIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                overflow: 'visible',
                alignItems: 'stretch',
                py: 1,
              }}
            >
              {limitedAccounts.map(renderOrganizationCard)}
            </Box>
          )}
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
