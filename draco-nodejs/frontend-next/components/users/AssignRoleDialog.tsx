'use client';

import React, { useState } from 'react';
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

interface AssignRoleDialogContentProps {
  onClose: () => void;
  onSuccess?: AssignRoleDialogProps['onSuccess'];
  roles: AssignRoleDialogProps['roles'];
  accountId: string;
  preselectedUser: AssignRoleDialogProps['preselectedUser'];
  isUserReadonly: boolean;
  leagues: AssignRoleDialogProps['leagues'];
  teams: AssignRoleDialogProps['teams'];
  leagueSeasons: AssignRoleDialogProps['leagueSeasons'];
  contextDataLoading: boolean;
}

const AssignRoleDialogContent: React.FC<AssignRoleDialogContentProps> = ({
  onClose,
  onSuccess,
  roles,
  accountId,
  preselectedUser,
  isUserReadonly,
  leagues = [],
  teams = [],
  leagueSeasons = [],
  contextDataLoading,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [newUserContactId, setNewUserContactId] = useState<string>('');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { assignRole, loading } = useRoleAssignment(accountId);

  // Determine which role is selected to show appropriate context selector
  const isLeagueAdmin = selectedRole ? isLeagueBasedRole(selectedRole) : false;
  const isTeamAdmin = selectedRole ? isTeamBasedRole(selectedRole) : false;

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    setSelectedLeagueId('');
    setSelectedTeamId('');
    setError(null);
  };

  const handleUserChange = (contactId: string) => {
    setNewUserContactId(contactId);
    setError(null);
  };

  const handleAssign = async () => {
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
      onClose();
    } else {
      setError(result.error || 'Failed to assign role');
    }
  };

  return (
    <>
      <DialogTitle>Assign Role to User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
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
    </>
  );
};

/**
 * AssignRoleDialog Component
 */
const AssignRoleDialog: React.FC<AssignRoleDialogProps> = ({
  open,
  onClose,
  onSuccess,
  roles,
  accountId,
  preselectedUser,
  isUserReadonly = false,
  leagues = [],
  teams = [],
  leagueSeasons = [],
  contextDataLoading = false,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    {open && (
      <AssignRoleDialogContent
        onClose={onClose}
        onSuccess={onSuccess}
        roles={roles}
        accountId={accountId}
        preselectedUser={preselectedUser}
        isUserReadonly={isUserReadonly}
        leagues={leagues}
        teams={teams}
        leagueSeasons={leagueSeasons}
        contextDataLoading={contextDataLoading}
      />
    )}
  </Dialog>
);

export default AssignRoleDialog;
