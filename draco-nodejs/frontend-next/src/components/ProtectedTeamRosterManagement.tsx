import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import TeamRosterManagement from './TeamRosterManagement';
import { Box, Typography, Button } from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedTeamRosterManagement: React.FC = () => {
  const { user, loading } = useAuth();
  const { hasRole, hasPermission } = useRole();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required permissions (AccountAdmin or Administrator)
  const canAccess = hasPermission('account.manage') || hasRole('AccountAdmin') || hasRole('Administrator');

  if (!canAccess) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You&apos;re not authorized to view this roster.
        </Typography>
        <Button variant="contained" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </Box>
    );
  }

  return <TeamRosterManagement />;
};

export default ProtectedTeamRosterManagement; 