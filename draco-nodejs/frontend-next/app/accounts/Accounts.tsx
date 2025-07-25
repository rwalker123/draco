import React, { useState, useCallback } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import OrganizationsWidget from '../../components/OrganizationsWidget';

interface Account {
  id: string;
  name: string;
  accountType: string;
  firstYear: number;
  affiliation?: string;
  urls: Array<{ id: string; url: string }>;
  ownerName?: string;
}

const Accounts: React.FC = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const accountId = params?.accountId as string | undefined;

  // If accountId is provided, redirect to that account's home page
  React.useEffect(() => {
    if (accountId) {
      router.push(`/account/${accountId}/home`);
    }
  }, [accountId, router]);

  const handleSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/accounts/search?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data.accounts || []);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleCreateAccount = () => {
    if (user) {
      router.push('/account-management');
    } else {
      setShowSignup(true);
    }
  };

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
    </main>
  );
};

export default Accounts;
