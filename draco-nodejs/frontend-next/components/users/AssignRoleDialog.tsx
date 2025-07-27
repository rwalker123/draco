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
}) => {
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
          />
          <FormControl fullWidth required>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              label="Role"
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onAssign}
          variant="contained"
          disabled={!newUserContactId || !selectedRole || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          Assign Role
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignRoleDialog;
