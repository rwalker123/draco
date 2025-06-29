import React from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import { RequirePermission } from './ProtectedRoute';
import { useRole } from '../context/RoleContext';

const PermissionTest: React.FC = () => {
  const { hasPermission } = useRole();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Permission Test Page
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Current User Permissions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography>
            <strong>Account Management:</strong> {hasPermission('account.manage') ? '✅' : '❌'}
          </Typography>
          <Typography>
            <strong>User Management:</strong> {hasPermission('account.users.manage') ? '✅' : '❌'}
          </Typography>
          <Typography>
            <strong>League Management:</strong> {hasPermission('league.manage') ? '✅' : '❌'}
          </Typography>
          <Typography>
            <strong>Team Management:</strong> {hasPermission('team.manage') ? '✅' : '❌'}
          </Typography>
          <Typography>
            <strong>Photo Management:</strong> {hasPermission('photo.manage') ? '✅' : '❌'}
          </Typography>
        </Box>
      </Paper>

      {/* Permission-based content sections */}
      <RequirePermission permission="account.manage">
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Account Management Section
          </Typography>
          <Typography paragraph>
            This section is only visible to users with account management permissions.
          </Typography>
          <Button variant="contained" color="primary">
            Manage Account Settings
          </Button>
        </Paper>
      </RequirePermission>

      <RequirePermission permission="league.manage">
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            League Management Section
          </Typography>
          <Typography paragraph>
            This section is only visible to users with league management permissions.
          </Typography>
          <Button variant="contained" color="secondary">
            Manage Leagues
          </Button>
        </Paper>
      </RequirePermission>

      <RequirePermission permission="team.manage">
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Team Management Section
          </Typography>
          <Typography paragraph>
            This section is only visible to users with team management permissions.
          </Typography>
          <Button variant="contained" color="success">
            Manage Teams
          </Button>
        </Paper>
      </RequirePermission>

      {/* Show message if user has no permissions */}
      {!hasPermission('account.manage') && 
       !hasPermission('league.manage') && 
       !hasPermission('team.manage') && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body1">
            You don't have any management permissions. Contact your administrator to request access.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default PermissionTest; 