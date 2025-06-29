import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  CardActions,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const accountId = params?.accountId as string | undefined;

  const loadUserAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/accounts/my-accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAccounts(data.data.accounts || []);
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
  }, [user, token]);

  useEffect(() => {
    if (user && !accountId) {
      loadUserAccounts();
    }
  }, [user, accountId, loadUserAccounts]);

  // If accountId is provided, redirect to that account's home page
  useEffect(() => {
    if (accountId) {
      router.push(`/account/${accountId}/home`);
    }
  }, [accountId, router]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
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
          setAccounts(data.data.accounts || []);
        } else {
          setError(data.message || 'Search failed');
        }
      } else {
        setError('Failed to search accounts. Please try again.');
      }
    } catch {
      setError('Failed to search accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAccounts([]);
    if (user) {
      loadUserAccounts();
    }
  };

  const handleViewAccount = (accountId: string) => {
    router.push(`/account/${accountId}/home`);
  };

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Draco Sports Manager
      </Typography>
      
      <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
        {user ? 'Your Organizations' : 'Find and manage sports organizations'}
      </Typography>

      {/* Search Section - Only show for anonymous users or when explicitly searching */}
      {!user && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Search Organizations
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <TextField
                fullWidth
                placeholder="Search by organization name, type, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch} disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : <SearchIcon />}
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
                disabled={loading || !searchTerm.trim()}
              >
                Search
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Search Section for logged-in users */}
      {user && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Search All Organizations
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <TextField
                fullWidth
                placeholder="Search by organization name, type, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch} disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : <SearchIcon />}
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
                disabled={loading || !searchTerm.trim()}
              >
                Search
              </Button>
            </Box>
          </Box>
          {searchTerm && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearSearch}
              >
                Clear Search & Show My Organizations
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {user ? 'Quick Actions' : 'Get Started'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCreateAccount}
          >
            {user ? 'Create New Organization' : 'Create Your Organization'}
          </Button>
          {!user && (
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={handleLogin}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Box>

      {/* Search Results or User's Organizations */}
      {accounts.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {user && !searchTerm ? 'Your Organizations' : 'Search Results'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {accounts.map((account) => (
              <Card key={account.id} sx={{ minWidth: 300, flex: '1 1 400px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {account.name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {account.accountType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Established: {account.firstYear}
                  </Typography>
                  {account.affiliation && (
                    <Typography variant="body2" color="text.secondary">
                      Affiliation: {account.affiliation}
                    </Typography>
                  )}
                  {account.urls && account.urls.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Website: {account.urls[0].url}
                    </Typography>
                  )}
                  {user && account.ownerName && (
                    <Typography variant="body2" color="text.secondary">
                      Owner: {account.ownerName}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewAccount(account.id)}
                  >
                    View Organization
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {user ? 'Loading your organizations...' : 'Searching...'}
          </Typography>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create Your Account
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            To create and manage your own sports organization, you&apos;ll need to create an account first.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSignup}
              sx={{ mr: 2 }}
            >
              Create Account
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowSignup(false)}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      )}

      {/* No Organizations Message */}
      {accounts.length === 0 && !loading && !error && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          You&apos;re not a member of any organizations yet.
        </Typography>
      )}
    </Container>
  );
};

export default Accounts; 