'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FC } from 'react';
import { Box, Container, Paper, Button, Typography } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import OrganizationsWidget from '../../components/OrganizationsWidget';
import { AccountType as SharedAccountType } from '@draco/shared-schemas';
import CreateAccountDialog from '../../components/account-management/dialogs/CreateAccountDialog';
import { useAccountManagementService } from '../../hooks/useAccountManagementService';
import HeroSection from '../../components/landing/HeroSection';
import FeatureShowcaseSection from '../../components/landing/FeatureShowcaseSection';
import CommunityHighlightsSection from '../../components/landing/CommunityHighlightsSection';
import HowItWorksSection from '../../components/landing/HowItWorksSection';
import SportFeaturesSection from '../../components/landing/SportFeaturesSection';
import IndividualGolfSignupDialog from '../../components/golf/dialogs/IndividualGolfSignupDialog';
// FinalCtaSection import commented out - see TODO below
// import FinalCtaSection from '../../components/landing/FinalCtaSection';

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
  const [golfSignupOpen, setGolfSignupOpen] = useState(false);
  const { user } = useAuth();
  const { isAdministrator } = useRole();
  const router = useRouter();
  const params = useParams();
  const accountId = params?.accountId as string | undefined;
  const { searchAccounts: searchAccountsOperation } = useAccountManagementService();

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

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setSearchState((previous) => {
        if (previous.status === 'idle' && previous.results.length === 0) {
          return previous;
        }

        return { status: 'idle', results: [] };
      });
    }
  }, []);

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

  const handleSignup = useCallback(() => {
    setCtaState('idle');
    router.push('/signup');
  }, [router]);

  // handleContact commented out - see TODO for FinalCtaSection below
  // const handleContact = useCallback(() => {
  //   router.push('/contact');
  // }, [router]);

  const scrollToSearch = useCallback(() => {
    document.getElementById('organization-search')?.scrollIntoView({
      behavior: 'smooth',
    });
  }, []);

  const handleGolfGetStarted = useCallback(() => {
    setGolfSignupOpen(true);
  }, []);

  const handleGolfSignupSuccess = useCallback(
    (result: { token?: string; accountId: string }) => {
      setGolfSignupOpen(false);
      router.push(`/account/${result.accountId}/home`);
    },
    [router],
  );

  return (
    <Box component="main" className="min-h-screen bg-background">
      <HeroSection
        onSignUp={handleSignup}
        onFindLeague={scrollToSearch}
        isAuthenticated={Boolean(user)}
      />

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          sx={{ textAlign: 'center', mb: 6, fontWeight: 600 }}
        >
          What We Offer
        </Typography>
        <FeatureShowcaseSection />
      </Container>

      <Box id="organization-search" sx={{ backgroundColor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
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
            onSearchTermChange={handleSearchTermChange}
          />

          {isAdministrator && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button variant="contained" size="large" onClick={handleCreateAccount}>
                Create New Organization
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      <CommunityHighlightsSection />

      <Box sx={{ backgroundColor: 'background.paper' }}>
        <SportFeaturesSection onGolfGetStarted={handleGolfGetStarted} />
      </Box>

      <HowItWorksSection />

      {/* TODO: Re-enable FinalCtaSection ("Ready to Transform your league")
      <FinalCtaSection
        onSignUp={handleSignup}
        onContact={handleContact}
        isAuthenticated={Boolean(user)}
      />
      */}

      {ctaState === 'signupPrompt' && (
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create Your Account
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              To create and manage your own sports organization, you&apos;ll need to create an
              account first.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={handleSignup}>
                Sign Up
              </Button>
              <Button variant="outlined" onClick={() => setCtaState('idle')}>
                Cancel
              </Button>
            </Box>
          </Paper>
        </Container>
      )}

      <CreateAccountDialog
        open={isAdministrator && ctaState === 'createAccount'}
        onClose={handleCloseCreateDialog}
        onSuccess={handleCreateDialogSuccess}
      />

      <IndividualGolfSignupDialog
        open={golfSignupOpen}
        onClose={() => setGolfSignupOpen(false)}
        onSuccess={handleGolfSignupSuccess}
      />
    </Box>
  );
};

export default Accounts;
