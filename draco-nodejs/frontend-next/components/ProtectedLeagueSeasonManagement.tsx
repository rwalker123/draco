import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import LeagueSeasonManagement from './LeagueSeasonManagement';
import { Box, Typography, Alert, Breadcrumbs, Link } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = '';

interface Season {
  id: string;
  name: string;
  accountId: string;
}

const ProtectedLeagueSeasonManagement: React.FC = () => {
  const { accountId, seasonId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const { token } = useAuth();
  const { hasRole, hasPermission } = useRole();
  const router = useRouter();

  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check permissions
  const canAccess = hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');

  // Fetch season data
  useEffect(() => {
    const fetchSeason = async () => {
      if (!accountId || !seasonId || !token) return;

      try {
        const response = await axios.get(
          `/api/accounts/${accountId}/seasons/${seasonId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setSeason(response.data.data.season);
        } else {
          setError('Failed to fetch season data');
        }
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to fetch season data');
      } finally {
        setLoading(false);
      }
    };

    fetchSeason();
  }, [accountId, seasonId, token]);

  if (!accountId) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Account ID is required to access league season management.
        </Alert>
      </Box>
    );
  }

  if (!seasonId) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Season ID is required to access league season management.
        </Alert>
      </Box>
    );
  }

  if (!token) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Authentication required to access league season management.
        </Alert>
      </Box>
    );
  }

  if (!canAccess) {
    return (
      <Box p={3}>
        <Alert severity="error">
          You&apos;re not authorized to access this league season management.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading season data...</Typography>
      </Box>
    );
  }

  if (error || !season) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || 'Failed to load season data'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3 }}
      >
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/account/${accountId}/seasons`);
          }}
          sx={{ cursor: 'pointer' }}
        >
          Seasons
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/account/${accountId}/seasons`);
          }}
          sx={{ cursor: 'pointer' }}
        >
          {season.name}
        </Link>
        <Typography color="text.primary">League Season Management</Typography>
      </Breadcrumbs>

      {/* League Season Management Component */}
      <LeagueSeasonManagement
        accountId={accountIdStr || ''}
        season={season}
        token={token}
        onClose={() => router.push(`/account/${accountId}/seasons`)}
      />
    </Box>
  );
};

export default ProtectedLeagueSeasonManagement; 