'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Chip,
  OutlinedInput,
  Divider,
  Button,
  Collapse,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { UserTableFiltersProps } from '../../../../types/userTable';

const UserTableFilters: React.FC<UserTableFiltersProps> = ({
  filters,
  onFiltersChange,
  availableRoles,
  onClearFilters,
  loading = false,
}) => {
  const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const roles = typeof value === 'string' ? value.split(',') : value;
    onFiltersChange({
      ...filters,
      roles,
    });
  };

  const handleRoleTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const roleTypes = typeof value === 'string' ? value.split(',') : value;
    onFiltersChange({
      ...filters,
      roleTypes: roleTypes as ('global' | 'account' | 'contact')[],
    });
  };

  const handleContactMethodChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const contactMethods = typeof value === 'string' ? value.split(',') : value;
    onFiltersChange({
      ...filters,
      contactMethods: contactMethods as ('email' | 'phone' | 'address')[],
    });
  };

  const handleActivityStatusChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      activityStatus: value as 'active' | 'inactive' | 'all',
    });
  };

  const handleContactInfoToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      hasContactInfo: event.target.checked ? true : undefined,
    });
  };

  const uniqueRoleNames = Array.from(
    new Set(availableRoles.map((role) => role.roleName).filter(Boolean)),
  ).sort();

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  });

  return (
    <Collapse in={true}>
      <Paper
        sx={{
          m: 2,
          p: 2,
          borderRadius: 2,
          backgroundColor: 'background.default',
        }}
        elevation={1}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Advanced Filters
          </Typography>
          {hasActiveFilters && (
            <Button size="small" variant="outlined" onClick={onClearFilters} disabled={loading}>
              Clear All Filters
            </Button>
          )}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 2,
          }}
        >
          {/* Role Filter */}
          <FormControl size="small" disabled={loading}>
            <InputLabel>Roles</InputLabel>
            <Select
              multiple
              value={filters.roles || []}
              onChange={handleRoleChange}
              input={<OutlinedInput label="Roles" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {uniqueRoleNames.map((roleName) => (
                <MenuItem key={roleName} value={roleName}>
                  <Checkbox checked={(filters.roles || []).includes(roleName)} />
                  {roleName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Role Type Filter */}
          <FormControl size="small" disabled={loading}>
            <InputLabel>Role Types</InputLabel>
            <Select
              multiple
              value={filters.roleTypes || []}
              onChange={handleRoleTypeChange}
              input={<OutlinedInput label="Role Types" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={value.charAt(0).toUpperCase() + value.slice(1)}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="global">
                <Checkbox checked={(filters.roleTypes || []).includes('global')} />
                Global
              </MenuItem>
              <MenuItem value="account">
                <Checkbox checked={(filters.roleTypes || []).includes('account')} />
                Account
              </MenuItem>
              <MenuItem value="contact">
                <Checkbox checked={(filters.roleTypes || []).includes('contact')} />
                Contact
              </MenuItem>
            </Select>
          </FormControl>

          {/* Contact Methods Filter */}
          <FormControl size="small" disabled={loading}>
            <InputLabel>Contact Methods</InputLabel>
            <Select
              multiple
              value={filters.contactMethods || []}
              onChange={handleContactMethodChange}
              input={<OutlinedInput label="Contact Methods" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={value.charAt(0).toUpperCase() + value.slice(1)}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="email">
                <Checkbox checked={(filters.contactMethods || []).includes('email')} />
                Email
              </MenuItem>
              <MenuItem value="phone">
                <Checkbox checked={(filters.contactMethods || []).includes('phone')} />
                Phone
              </MenuItem>
              <MenuItem value="address">
                <Checkbox checked={(filters.contactMethods || []).includes('address')} />
                Address
              </MenuItem>
            </Select>
          </FormControl>

          {/* Activity Status Filter */}
          <FormControl size="small" disabled={loading}>
            <InputLabel>Activity Status</InputLabel>
            <Select
              value={filters.activityStatus || 'all'}
              onChange={handleActivityStatusChange}
              label="Activity Status"
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="active">Active Users</MenuItem>
              <MenuItem value="inactive">Inactive Users</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Additional Options */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Additional Options
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.hasContactInfo === true}
                  onChange={handleContactInfoToggle}
                  disabled={loading}
                />
              }
              label="Has complete contact information"
            />
          </FormGroup>
        </Box>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Active Filters Summary:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {filters.roles && filters.roles.length > 0 && (
                  <Chip
                    size="small"
                    label={`${filters.roles.length} role${filters.roles.length !== 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.roleTypes && filters.roleTypes.length > 0 && (
                  <Chip
                    size="small"
                    label={`${filters.roleTypes.length} role type${filters.roleTypes.length !== 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.contactMethods && filters.contactMethods.length > 0 && (
                  <Chip
                    size="small"
                    label={`${filters.contactMethods.length} contact method${filters.contactMethods.length !== 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.activityStatus && filters.activityStatus !== 'all' && (
                  <Chip
                    size="small"
                    label={`${filters.activityStatus} users`}
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.hasContactInfo && (
                  <Chip size="small" label="With contact info" color="primary" variant="outlined" />
                )}
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Collapse>
  );
};

export default UserTableFilters;
