import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../context/AccountContext';
import { RequireAccountAdmin } from './ProtectedRoute';

const AccountManagement: React.FC = () => {
  const { user } = useAuth();
  const { accountId } = useParams<{ accountId: string }>();
  const { currentAccount, hasAccessToAccount } = useAccount();
  const navigate = useNavigate();

  // If no accountId in URL, redirect to current account or default
  React.useEffect(() => {
    if (!accountId) {
      if (currentAccount) {
        navigate(`/account/${currentAccount.id}/management`);
      } else {
        navigate('/account/1/management'); // Default fallback
      }
    }
  }, [accountId, currentAccount, navigate]);

  // Check if user has access to this account
  React.useEffect(() => {
    if (accountId && !hasAccessToAccount(accountId)) {
      // Redirect to an account they have access to
      if (currentAccount) {
        navigate(`/account/${currentAccount.id}/management`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [accountId, hasAccessToAccount, currentAccount, navigate]);

  if (!accountId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Loading Account Management...
        </Typography>
      </Box>
    );
  }

  return (
    <RequireAccountAdmin accountId={accountId}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Account Management
        </Typography>
        
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Welcome, {user?.username}!
          </Typography>
          <Typography variant="body1" paragraph>
            This page is only accessible to Account Administrators for Account ID: {accountId}
          </Typography>
          {currentAccount && currentAccount.id === accountId && (
            <Typography variant="body2" color="text.secondary">
              Managing: {currentAccount.name}
            </Typography>
          )}
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Account Actions for Account {accountId}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" color="primary">
              Manage Users
            </Button>
            <Button variant="contained" color="secondary">
              Manage Roles
            </Button>
            <Button variant="outlined">
              View Analytics
            </Button>
            <Button variant="outlined">
              Settings
            </Button>
          </Box>
        </Paper>
      </Box>
    </RequireAccountAdmin>
  );
};

export default AccountManagement; 