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
  Typography,
} from '@mui/material';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { AssignRoleDialogProps } from '../../types/users';
import ContactAutocomplete from '../ContactAutocomplete';
import LeagueSelector from '../LeagueSelector';
import TeamSelector from '../TeamSelector';
import { getRoleDisplayName, isTeamBasedRole, isLeagueBasedRole } from '../../utils/roleUtils';

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
  // Pre-population props
  preselectedUser,
  isUserReadonly = false,
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
  const isLeagueAdmin = selectedRole ? isLeagueBasedRole(selectedRole) : false;
  const isTeamAdmin = selectedRole ? isTeamBasedRole(selectedRole) : false;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Role to User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {preselectedUser && isUserReadonly ? (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Assigning role to:
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300',
                }}
              >
                <PersonIcon color="action" />
                <Typography variant="subtitle2" fontWeight="bold">
                  {preselectedUser.firstName} {preselectedUser.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({preselectedUser.email})
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <ContactAutocomplete
              label="Select User"
              value={newUserContactId}
              onChange={onUserChange}
              required
              accountId={accountId}
            />
          )}
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
