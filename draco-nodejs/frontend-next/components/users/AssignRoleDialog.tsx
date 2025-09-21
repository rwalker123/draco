'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
} from '@mui/material';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { AssignRoleDialogProps } from '../../types/users';
import ContactAutocomplete from '../ContactAutocomplete';
import LeagueSelector from '../LeagueSelector';
import TeamSelector from '../TeamSelector';
import { getRoleDisplayName, isTeamBasedRole, isLeagueBasedRole } from '../../utils/roleUtils';
import { useRoleAssignment } from '../../hooks/useRoleAssignment';

/**
 * AssignRoleDialog Component
 * Dialog for assigning roles to users with self-contained error handling
 */
const AssignRoleDialog: React.FC<AssignRoleDialogProps> = ({
  open,
  onClose,
  onSuccess,
  roles,
  accountId,
  // Pre-population props
  preselectedUser,
  isUserReadonly = false,
  // Context data props
  leagues = [],
  teams = [],
  leagueSeasons = [],
  contextDataLoading = false,
}) => {
  // Internal state management
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [newUserContactId, setNewUserContactId] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Use the role assignment hook
  const { assignRole, loading } = useRoleAssignment(accountId);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Reset form state when opening
      setSelectedRole('');
      setSelectedLeagueId('');
      setSelectedTeamId('');
      setNewUserContactId('');
      setError(null); // Clear any previous errors
    }
  }, [open]);

  // Determine which role is selected to show appropriate context selector
  const isLeagueAdmin = selectedRole ? isLeagueBasedRole(selectedRole) : false;
  const isTeamAdmin = selectedRole ? isTeamBasedRole(selectedRole) : false;

  // Handle role change
  const handleRoleChange = useCallback((roleId: string) => {
    setSelectedRole(roleId);
    // Reset context selections when role changes
    setSelectedLeagueId('');
    setSelectedTeamId('');
    // Clear error when user makes changes
    setError(null);
  }, []);

  // Handle user change
  const handleUserChange = useCallback((contactId: string) => {
    setNewUserContactId(contactId);
    // Clear error when user makes changes
    setError(null);
  }, []);

  // Handle assign with internal error handling
  const handleAssign = useCallback(async () => {
    // Clear any previous errors
    setError(null);

    const contactId = isUserReadonly && preselectedUser ? preselectedUser.id : newUserContactId;

    const result = await assignRole(accountId, {
      roleId: selectedRole,
      contactId,
      leagueId: selectedLeagueId || undefined,
      teamId: selectedTeamId || undefined,
    });

    if (result.success && result.assignedRole) {
      onSuccess?.({
        message: result.message || 'Role assigned successfully',
        assignedRole: result.assignedRole,
      });
      onClose(); // Close dialog on success
    } else {
      // Handle error internally
      setError(result.error || 'Failed to assign role');
    }
  }, [
    selectedRole,
    newUserContactId,
    selectedLeagueId,
    selectedTeamId,
    isUserReadonly,
    preselectedUser,
    assignRole,
    accountId,
    onSuccess,
    onClose,
  ]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Role to User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Error display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
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
              onChange={handleUserChange}
              required
              accountId={accountId}
            />
          )}
          <FormControl fullWidth required>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
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
          {isLeagueAdmin && (
            <LeagueSelector
              leagues={leagues}
              value={selectedLeagueId}
              onChange={setSelectedLeagueId}
              label="Select League"
              required
              loading={contextDataLoading}
            />
          )}

          {/* Team selector for TeamAdmin role */}
          {isTeamAdmin && (
            <TeamSelector
              teams={teams}
              leagueSeasons={leagueSeasons}
              value={selectedTeamId}
              onChange={setSelectedTeamId}
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
          onClick={handleAssign}
          variant="contained"
          disabled={
            !selectedRole ||
            loading ||
            (!(isUserReadonly && preselectedUser) && !newUserContactId) ||
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
