'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Warning as WarningIcon, Error as ErrorIcon, Info as InfoIcon } from '@mui/icons-material';
import { Contact, DependencyCheckResult } from '../../types/users';
import { createUserManagementService } from '../../services/userManagementService';
import { useAuth } from '../../context/AuthContext';

interface DeleteContactDialogProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onDelete: (contactId: string, force: boolean) => Promise<void>;
  loading?: boolean;
}

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

const getRiskLevelIcon = (riskLevel: string) => {
  switch (riskLevel) {
    case 'critical':
      return <ErrorIcon fontSize="small" />;
    case 'high':
      return <WarningIcon fontSize="small" />;
    case 'medium':
      return <InfoIcon fontSize="small" />;
    case 'low':
      return <InfoIcon fontSize="small" />;
    default:
      return undefined;
  }
};

const DeleteContactDialog: React.FC<DeleteContactDialogProps> = ({
  open,
  contact,
  onClose,
  onDelete,
  loading = false,
}) => {
  const { token } = useAuth();
  const [checkingDependencies, setCheckingDependencies] = useState(false);
  const [dependencyResult, setDependencyResult] = useState<DependencyCheckResult | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDependencies = useCallback(async () => {
    if (!contact || !token) return;

    setCheckingDependencies(true);
    setError(null);

    try {
      const userService = createUserManagementService(token);
      // Extract accountId from contact.userId or current URL
      const pathSegments = window.location.pathname.split('/');
      const accountIdIndex = pathSegments.indexOf('account');
      const accountId = accountIdIndex !== -1 ? pathSegments[accountIdIndex + 1] : '';

      if (!accountId) {
        throw new Error('Unable to determine account ID');
      }

      const result = await userService.checkContactDependencies(accountId, contact.id);
      setDependencyResult(result.dependencyCheck);
    } catch (err) {
      console.error('Error checking dependencies:', err);
      setError(err instanceof Error ? err.message : 'Failed to check dependencies');
    } finally {
      setCheckingDependencies(false);
    }
  }, [contact, token]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && contact) {
      setForceDelete(false);
      setError(null);
      setDependencyResult(null);
      checkDependencies();
    } else {
      setDependencyResult(null);
      setForceDelete(false);
      setError(null);
    }
  }, [open, contact, checkDependencies]);

  const handleDelete = async () => {
    if (!contact) return;

    try {
      await onDelete(contact.id, forceDelete);
      onClose();
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete contact');
    }
  };

  const canProceed = checkingDependencies ? false : dependencyResult?.canDelete || forceDelete;

  if (!contact) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ErrorIcon color="error" />
          <Typography variant="h6">Delete Contact</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Contact:{' '}
          <strong>
            {contact.firstName} {contact.lastName}
          </strong>
          {contact.email && (
            <Typography variant="body2" color="text.secondary">
              {contact.email}
            </Typography>
          )}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {checkingDependencies && (
          <Box display="flex" alignItems="center" gap={2} sx={{ mt: 2, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography>Checking dependencies...</Typography>
          </Box>
        )}

        {dependencyResult && (
          <Box sx={{ mt: 2 }}>
            {dependencyResult.canDelete ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  ✅ This contact can be safely deleted with no dependencies.
                </Typography>
              </Alert>
            ) : (
              <>
                <Alert
                  severity={
                    dependencyResult.dependencies.some((d) => d.riskLevel === 'critical')
                      ? 'error'
                      : 'warning'
                  }
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2" gutterBottom>
                    ⚠️ This contact has <strong>{dependencyResult.totalDependencies}</strong>{' '}
                    dependencies that will be affected by deletion:
                  </Typography>
                </Alert>

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1 }}>
                  Dependencies Found:
                </Typography>

                <List
                  dense
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  {dependencyResult.dependencies.map((dep, index) => (
                    <React.Fragment key={`${dep.table}-${index}`}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                icon={getRiskLevelIcon(dep.riskLevel)}
                                label={dep.riskLevel.toUpperCase()}
                                color={
                                  getRiskLevelColor(dep.riskLevel) as
                                    | 'error'
                                    | 'warning'
                                    | 'info'
                                    | 'success'
                                    | 'default'
                                }
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="body2" fontWeight="medium">
                                {dep.description}
                              </Typography>
                              <Chip
                                label={`${dep.count} record${dep.count !== 1 ? 's' : ''}`}
                                size="small"
                                variant="filled"
                                color="default"
                              />
                            </Box>
                          }
                          secondary={`Table: ${dep.table}`}
                        />
                      </ListItem>
                      {index < dependencyResult.dependencies.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Force deleting will permanently remove all related data. This action cannot be
                    undone.
                  </Typography>
                </Alert>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={forceDelete}
                      onChange={(e) => setForceDelete(e.target.checked)}
                      color="error"
                      disabled={dependencyResult.dependencies.some(
                        (d) => d.description === 'Account Owner',
                      )}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {dependencyResult.dependencies.some((d) => d.description === 'Account Owner')
                        ? 'Account owners cannot be deleted'
                        : 'I understand the risks and want to force delete this contact and all related data'}
                    </Typography>
                  }
                  sx={{ mt: 2 }}
                />
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={loading || !canProceed}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Deleting...' : forceDelete ? 'Force Delete' : 'Delete Contact'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteContactDialog;
