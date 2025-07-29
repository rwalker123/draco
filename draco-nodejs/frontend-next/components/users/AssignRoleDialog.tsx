'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AssignRoleDialogProps } from '../../types/users';
import ContactAutocomplete from '../ContactAutocomplete';
import LeagueSelector from '../LeagueSelector';
import TeamSelector from '../TeamSelector';
import { getRoleDisplayName } from '../../utils/roleUtils';

/**
 * AssignRoleDialog Component
 * Dialog for assigning roles to users
 */
const AssignRoleDialog: React.FC<AssignRoleDialogProps> = ({
  open,
  onClose,
  onAssign,
  selectedRole,
  newUserContactId,
  roles,
  onUserChange,
  onRoleChange,
  loading,
  accountId,
  // Context data props
  leagues = [],
  teams = [],
  leagueSeasons = [],
  selectedLeagueId = '',
  selectedTeamId = '',
  onLeagueChange,
  onTeamChange,
  contextDataLoading = false,
}) => {
  // Determine which role is selected to show appropriate context selector
  const selectedRoleData = roles.find((role) => role.id === selectedRole);
  const roleDisplayName = selectedRoleData ? getRoleDisplayName(selectedRoleData.id) : '';
  const isLeagueAdmin = roleDisplayName === 'League Administrator';
  const isTeamAdmin = roleDisplayName === 'Team Administrator';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Role to User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <ContactAutocomplete
            label="Select User"
            value={newUserContactId}
            onChange={onUserChange}
            required
            accountId={accountId}
          />
          <FormControl fullWidth required>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              label="Role"
            >
              {roles
                .filter((role) => !['Administrator', 'PhotoAdmin'].includes(role.name))
                .map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {getRoleDisplayName(role.id)}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* League selector for LeagueAdmin role */}
          {isLeagueAdmin && onLeagueChange && (
            <LeagueSelector
              leagues={leagues}
              value={selectedLeagueId}
              onChange={onLeagueChange}
              label="Select League"
              required
              loading={contextDataLoading}
            />
          )}

          {/* Team selector for TeamAdmin role */}
          {isTeamAdmin && onTeamChange && (
            <TeamSelector
              teams={teams}
              leagueSeasons={leagueSeasons}
              value={selectedTeamId}
              onChange={onTeamChange}
              label="Select Team"
              required
              loading={contextDataLoading}
              displayMode="hierarchical"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onAssign}
          variant="contained"
          disabled={
            !newUserContactId ||
            !selectedRole ||
            loading ||
            (isLeagueAdmin && !selectedLeagueId) ||
            (isTeamAdmin && !selectedTeamId)
          }
          startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          Assign Role
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignRoleDialog;
