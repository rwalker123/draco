import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useAccount } from '../context/AccountContext';

const RoleDebug: React.FC = () => {
  const { user, token } = useAuth();
  const { userRoles, hasRole, hasPermission } = useRole();
  const { currentAccount, hasAccessToAccount } = useAccount();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Role Debug Information
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          User Information
        </Typography>
        <Typography>User ID: {user?.id}</Typography>
        <Typography>Username: {user?.username}</Typography>
        <Typography>Token: {token ? 'Present' : 'Missing'}</Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          User Roles
        </Typography>
        {userRoles ? (
          <>
            <Typography><strong>Global Roles:</strong> {userRoles.globalRoles.join(', ') || 'None'}</Typography>
            <Typography><strong>Contact Roles:</strong> {userRoles.contactRoles.length} role(s)</Typography>
            {userRoles.contactRoles.map((role) => (
              <Typography key={role.id} sx={{ ml: 2 }}>
                - {role.roleName || role.roleId} (Account: {role.accountId})
              </Typography>
            ))}
          </>
        ) : (
          <Typography>No roles loaded</Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Role Checks
        </Typography>
        <Typography>Has Administrator role: {hasRole('Administrator') ? '✅' : '❌'}</Typography>
        <Typography>Has AccountAdmin role: {hasRole('AccountAdmin') ? '✅' : '❌'}</Typography>
        <Typography>Has LeagueAdmin role: {hasRole('LeagueAdmin') ? '✅' : '❌'}</Typography>
        <Typography>Has TeamAdmin role: {hasRole('TeamAdmin') ? '✅' : '❌'}</Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Permission Checks
        </Typography>
        <Typography>Has account.manage permission: {hasPermission('account.manage') ? '✅' : '❌'}</Typography>
        <Typography>Has league.manage permission: {hasPermission('league.manage') ? '✅' : '❌'}</Typography>
        <Typography>Has team.manage permission: {hasPermission('team.manage') ? '✅' : '❌'}</Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Account Context
        </Typography>
        <Typography>Current Account: {currentAccount ? `${currentAccount.name} (${currentAccount.id})` : 'None'}</Typography>
        <Typography>Has access to account 1: {hasAccessToAccount('1') ? '✅' : '❌'}</Typography>
        <Typography>Has access to account 2: {hasAccessToAccount('2') ? '✅' : '❌'}</Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Test Links
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => window.location.href = '/account/1/management'}>
            Test Account 1 Management
          </Button>
          <Button variant="contained" onClick={() => window.location.href = '/admin'}>
            Test Admin Dashboard
          </Button>
          <Button variant="contained" onClick={() => window.location.href = '/permission-test'}>
            Test Permission Page
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RoleDebug; 