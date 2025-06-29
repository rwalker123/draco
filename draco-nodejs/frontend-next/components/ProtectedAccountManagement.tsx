import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useRole } from '../context/RoleContext';
import AccountManagement from './AccountManagement';

const ProtectedAccountManagement: React.FC = () => {
  const { hasRole } = useRole();

  // Check if user has required roles
  const isGlobalAdmin = hasRole('Administrator');
  const isAccountAdmin = hasRole('AccountAdmin');

  if (!isGlobalAdmin && !isAccountAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            You do not have permission to access Account Management. 
            This page requires Administrator or Account Admin privileges.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return <AccountManagement />;
};

export default ProtectedAccountManagement; 