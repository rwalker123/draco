'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import OrganizationsWidget from '../../components/OrganizationsWidget';
import { AccountType as SharedAccountType } from '@draco/shared-schemas';
import CreateAccountDialog from '../../components/account-management/dialogs/CreateAccountDialog';
import { useAccountManagementService } from '../../hooks/useAccountManagementService';

type SearchState =
  | { status: 'idle'; results: SharedAccountType[] }
  | { status: 'searching'; results: SharedAccountType[] }
  | { status: 'success'; results: SharedAccountType[] }
  | { status: 'error'; results: SharedAccountType[]; error: string };

type CtaState = 'idle' | 'createAccount' | 'signupPrompt';

const Accounts: FC = () => {
  const [ctaState, setCtaState] = useState<CtaState>('idle');
  const [searchState, setSearchState] = useState<SearchState>({
    status: 'idle',
    results: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { isAdministrator } = useRole();
  const router = useRouter();
  const params = useParams();
  const accountId = params?.accountId as string | undefined;
  const { searchAccounts: searchAccountsOperation } = useAccountManagementService();
  const showCreateOrganizationAction = isAdministrator;
  const showPublicAuthActions = !user;
  const shouldRenderActionBar = showCreateOrganizationAction || showPublicAuthActions;

  // If accountId is provided, redirect to that account's home page
  useEffect(() => {
    if (accountId) {
      router.push(`/account/${accountId}/home`);
    }
  }, [accountId, router]);

  const handleSearch = useCallback(
    async (term: string) => {
      const trimmedTerm = term.trim();
      if (!trimmedTerm) {
        setSearchState({ status: 'idle', results: [] });
        return;
      }

      setSearchState({ status: 'searching', results: [] });
      try {
        const result = await searchAccountsOperation({ query: trimmedTerm });

        if (result.success) {
          setSearchState({ status: 'success', results: result.data });
        } else {
          setSearchState({ status: 'error', results: [], error: result.error });
        }
      } catch (error) {
        console.error('Account search failed:', error);
        setSearchState({
          status: 'error',
          results: [],
          error: error instanceof Error ? error.message : 'Account search failed',
        });
      }
    },
    [searchAccountsOperation],
  );

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchState((previous) => {
        if (previous.status === 'idle' && previous.results.length === 0) {
          return previous;
        }

        return { status: 'idle', results: [] };
      });
    }
  }, [searchTerm]);

  const handleCreateAccount = useCallback(() => {
    if (!user) {
      setCtaState('signupPrompt');
      return;
    }

    if (!isAdministrator) {
      return;
    }

    setCtaState('createAccount');
  }, [isAdministrator, user]);

  const handleCloseCreateDialog = useCallback(() => {
    setCtaState('idle');
  }, []);

  const handleCreateDialogSuccess = useCallback(
    (_result: { account: SharedAccountType; message: string }) => {
      setCtaState('idle');
      router.push('/account-management');
    },
    [router],
  );

  const handleSignup = () => {
    setCtaState('idle');
    router.push('/signup');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <Box
      component="main"
      className="min-h-screen bg-background"
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
    >
      <Typography variant="h3" component="h1" gutterBottom align="center">
        ezRecSports.com
      </Typography>

      {/* Action Buttons */}
      {shouldRenderActionBar && (
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {showCreateOrganizationAction ? 'Quick Actions' : 'Get Started'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {showCreateOrganizationAction && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleCreateAccount}
              >
                Create New Organization
              </Button>
            )}
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
      )}

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
        organizations={searchTerm ? searchState.results : user ? undefined : []}
        loading={searchState.status === 'searching'}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      {/* Signup Modal */}
      {ctaState === 'signupPrompt' && (
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
            <Button variant="outlined" onClick={() => setCtaState('idle')}>
              Cancel
            </Button>
          </Box>
        </Paper>
      )}

      <CreateAccountDialog
        open={isAdministrator && ctaState === 'createAccount'}
        onClose={handleCloseCreateDialog}
        onSuccess={handleCreateDialogSuccess}
      />
    </Box>
  );
};

export default Accounts;
