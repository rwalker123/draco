'use client';

import React from 'react';
import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

interface UserFilterBarProps {
  onlyWithRoles: boolean;
  onToggle: (checked: boolean) => void;
  userCount?: number;
  totalCount?: number;
  loading?: boolean;
}

const UserFilterBar: React.FC<UserFilterBarProps> = ({
  onlyWithRoles,
  onToggle,
  userCount,
  totalCount,
  loading = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(event.target.checked);
  };

  const getCountText = () => {
    if (loading) return 'Loading...';
    if (userCount !== undefined && totalCount !== undefined) {
      if (onlyWithRoles) {
        return `Showing ${userCount} users with roles`;
      } else {
        return `Showing ${userCount} of ${totalCount} users`;
      }
    }
    return '';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={onlyWithRoles}
            onChange={handleChange}
            disabled={loading}
            color="primary"
            icon={<PersonIcon fontSize="small" />}
            checkedIcon={<PersonIcon fontSize="small" />}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              Users with roles only
            </Typography>
          </Box>
        }
        sx={{ m: 0 }}
      />

      {getCountText() && (
        <Typography variant="body2" color="text.secondary">
          {getCountText()}
        </Typography>
      )}
    </Box>
  );
};

export default UserFilterBar;
