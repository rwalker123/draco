'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import OrganizationsWidget from '../../components/OrganizationsWidget';
import { searchAccounts } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { AccountType as SharedAccountType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../utils/apiResult';
import CreateAccountDialog from '../../components/account-management/dialogs/CreateAccountDialog';

const Accounts: FC = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [searchResults, setSearchResults] = useState<SharedAccountType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const accountId = params?.accountId as string | undefined;
  const apiClient = useApiClient();
  // If accountId is provided, redirect to that account's home page
  useEffect(() => {
    if (accountId) {
      router.push(`/account/${accountId}/home`);
    }
  }, [accountId, router]);

  const handleSearch = useCallback(
    async (term: string) => {
      const trimmedTerm = term.trim();
      if (!trimmedTerm) return;

      setIsSearching(true);
      try {
        const result = await searchAccounts({
          client: apiClient,
          throwOnError: false,
          query: { q: trimmedTerm },
        });

        const data = unwrapApiResult(result, 'Failed to search accounts');
        setSearchResults((data as SharedAccountType[]) ?? []);
      } catch (error) {
        console.error('Account search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [apiClient],
  );

  const handleCreateAccount = useCallback(() => {
    if (user) {
      setCreateDialogOpen(true);
    } else {
      setShowSignup(true);
    }
  }, [user]);

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const handleCreateDialogSuccess = useCallback(
    (_result: { account: SharedAccountType; message: string }) => {
      setCreateDialogOpen(false);
      router.push('/account-management');
    },
    [router],
  );

  const handleSignup = () => {
    router.push('/signup');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-background">
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Draco Sports Manager
      </Typography>

      {/* Action Buttons */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {user ? 'Quick Actions' : 'Get Started'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" color="primary" size="large" onClick={handleCreateAccount}>
            {user ? 'Create New Organization' : 'Create Your Organization'}
          </Button>
          {!user && (
            <Button variant="contained" color="primary" size="large" onClick={handleSignup}>
              Sign Up
            </Button>
          )}
          {!user && (
            <Button variant="outlined" color="primary" size="large" onClick={handleLogin}>
              Sign In
            </Button>
          )}
        </Box>
      </Box>

      {/* Organizations Widget - Show for all users */}
      <OrganizationsWidget
        title={
          user
            ? searchTerm
              ? 'Search Results'
              : 'Your Organizations'
            : searchTerm
              ? 'Search Results'
              : 'Find Organizations'
        }
        showSearch={true}
        organizations={searchTerm ? searchResults : user ? undefined : []}
        loading={isSearching}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      {/* Signup Modal */}
      {showSignup && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create Your Account
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {"To create and manage your own sports organization, you'll need to create an account"}
            first.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleSignup} sx={{ mr: 2 }}>
              Sign Up
            </Button>
            <Button variant="outlined" onClick={() => setShowSignup(false)}>
              Cancel
            </Button>
          </Box>
        </Paper>
      )}

      <CreateAccountDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        onSuccess={handleCreateDialogSuccess}
      />
    </main>
  );
};

export default Accounts;
