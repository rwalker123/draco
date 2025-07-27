'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  TablePagination,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import { isAccountAdministrator } from '../../../../utils/permissionUtils';
import ContactAutocomplete from '../../../../components/ContactAutocomplete';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  roles?: UserRole[]; // Optional since backend doesn't include roles yet
}

interface UserRole {
  id: string;
  roleId: string;
  roleName: string;
  roleData: string;
}

interface Role {
  id: string;
  name: string;
}

interface UserManagementProps {
  accountId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ accountId }) => {
  const { token } = useAuth();
  const { hasRole } = useRole();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Dialog states
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [removeRoleDialogOpen, setRemoveRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedRoleToRemove, setSelectedRoleToRemove] = useState<UserRole | null>(null);

  // Form states
  const [newUserContactId, setNewUserContactId] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);

  const canManageUsers = isAccountAdministrator(hasRole, accountId);

  const loadUsers = useCallback(
    async (searchQuery = '', currentPage = 0) => {
      if (!token || !accountId) return;

      try {
        setLoading(true);
        setError(null);

        const searchParams = new URLSearchParams();
        if (searchQuery) searchParams.append('search', searchQuery);
        searchParams.append('page', currentPage.toString());
        searchParams.append('limit', rowsPerPage.toString());

        const response = await fetch(
          `/api/accounts/${accountId}/users?${searchParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // TODO: Backend API needs to include roles in response
            // Currently users don't have roles property, so we set empty arrays
            const usersWithRoles = (data.data.users || []).map((user: Omit<User, 'roles'>) => ({
              ...user,
              roles: [] // Ensure roles property exists
            }));
            setUsers(usersWithRoles);
            setTotalUsers(data.data.total || 0);
          } else {
            setError(data.message || 'Failed to load users');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || 'Failed to load users');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    },
    [token, accountId, rowsPerPage],
  );

  const loadRoles = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/roleTest/role-ids', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRoles(data.data.roles || []);
        }
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token && accountId) {
      loadUsers();
      loadRoles();
    }
  }, [token, accountId, loadUsers, loadRoles]);

  const handleSearch = useCallback(async () => {
    setSearchLoading(true);
    setPage(0);
    await loadUsers(searchTerm, 0);
    setSearchLoading(false);
  }, [searchTerm, loadUsers]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
    loadUsers(searchTerm, newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    loadUsers(searchTerm, 0);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole || !newUserContactId) return;

    try {
      setFormLoading(true);
      setError(null);

      const response = await fetch(`/api/accounts/${accountId}/users/${newUserContactId}/roles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: selectedRole,
          roleData: accountId,
        }),
      });

      if (response.ok) {
        setSuccess('Role assigned successfully');
        setAssignRoleDialogOpen(false);
        setSelectedUser(null);
        setSelectedRole('');
        setNewUserContactId('');
        loadUsers(searchTerm, page);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to assign role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!selectedUser || !selectedRoleToRemove) return;

    try {
      setFormLoading(true);
      setError(null);

      const response = await fetch(
        `/api/accounts/${accountId}/users/${selectedUser.id}/roles/${selectedRoleToRemove.roleId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleData: accountId,
          }),
        },
      );

      if (response.ok) {
        setSuccess('Role removed successfully');
        setRemoveRoleDialogOpen(false);
        setSelectedUser(null);
        setSelectedRoleToRemove(null);
        loadUsers(searchTerm, page);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to remove role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    } finally {
      setFormLoading(false);
    }
  };

  const openAssignRoleDialog = (user: User) => {
    setSelectedUser(user);
    setAssignRoleDialogOpen(true);
  };

  const openRemoveRoleDialog = (user: User, role: UserRole) => {
    setSelectedUser(user);
    setSelectedRoleToRemove(role);
    setRemoveRoleDialogOpen(true);
  };

  const getRoleDisplayName = (roleId: string): string => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : roleId;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        {canManageUsers && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAssignRoleDialogOpen(true)}
          >
            Assign Role
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage users and their roles for this organization.
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="outlined"
            onClick={handleSearch}
            disabled={searchLoading}
            startIcon={searchLoading ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            Search
          </Button>
          {searchTerm && (
            <Button
              variant="text"
              onClick={() => {
                setSearchTerm('');
                loadUsers('', 0);
              }}
            >
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonIcon color="action" />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {user.firstName} {user.lastName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Chip
                            key={role.id}
                            label={getRoleDisplayName(role.roleId)}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={
                              canManageUsers ? () => openRemoveRoleDialog(user, role) : undefined
                            }
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No roles assigned
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {canManageUsers && (
                      <Tooltip title="Assign Role">
                        <IconButton
                          size="small"
                          onClick={() => openAssignRoleDialog(user)}
                          color="primary"
                        >
                          <SecurityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Assign Role Dialog */}
      <Dialog
        open={assignRoleDialogOpen}
        onClose={() => setAssignRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Role to User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ContactAutocomplete
              label="Select User"
              value={newUserContactId}
              onChange={setNewUserContactId}
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
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
          <Button onClick={() => setAssignRoleDialogOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignRole}
            variant="contained"
            disabled={!newUserContactId || !selectedRole || formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Role Dialog */}
      <Dialog
        open={removeRoleDialogOpen}
        onClose={() => setRemoveRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove Role</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Are you sure you want to remove the role &quot;
            {selectedRoleToRemove?.roleName || selectedRoleToRemove?.roleId}&quot; from{' '}
            {selectedUser?.firstName} {selectedUser?.lastName}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveRoleDialogOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoveRole}
            variant="contained"
            color="error"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Remove Role
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default UserManagement;
