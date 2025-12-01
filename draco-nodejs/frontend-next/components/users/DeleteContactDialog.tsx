'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
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
  Stack,
} from '@mui/material';
import { Warning as WarningIcon, Error as ErrorIcon, Info as InfoIcon } from '@mui/icons-material';
import { DependencyCheckResult } from '../../types/users';
import { BaseContactType } from '@draco/shared-schemas';
import { useContactDeletion } from '../../hooks/useContactDeletion';
import ConfirmDeleteDialog from '../social/ConfirmDeleteDialog';

interface DeleteContactDialogProps {
  open: boolean;
  contact: BaseContactType | null;
  onClose: () => void;
  onSuccess?: (result: {
    message: string;
    contactId: string;
    dependenciesDeleted?: number;
    wasForced: boolean;
  }) => void;
  accountId: string;
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

/**
 * DeleteContactDialog Component
 * Self-contained dialog for deleting contacts with internal error handling and dependency checking
 */
const DeleteContactDialog: React.FC<DeleteContactDialogProps> = ({ open, contact, ...rest }) => {
  if (!open || !contact) {
    return null;
  }

  return <DeleteContactDialogInner key={contact.id} contact={contact} {...rest} />;
};

interface DeleteContactDialogInnerProps extends Omit<DeleteContactDialogProps, 'open' | 'contact'> {
  contact: BaseContactType;
}

const DeleteContactDialogInner: React.FC<DeleteContactDialogInnerProps> = ({
  contact,
  onClose,
  onSuccess,
  accountId,
}) => {
  const [dependencyResult, setDependencyResult] = useState<DependencyCheckResult | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { deleteContact, checkDependencies, loading, checkingDependencies } =
    useContactDeletion(accountId);

  useEffect(() => {
    let cancelled = false;

    const performCheck = async () => {
      const result = await checkDependencies(contact.id);
      if (cancelled) {
        return;
      }
      if (result.success) {
        setDependencyResult(result.dependencyCheck || null);
        setError(null);
      } else {
        setDependencyResult(null);
        setError(result.error || 'Failed to check dependencies');
      }
    };

    performCheck();

    return () => {
      cancelled = true;
    };
  }, [checkDependencies, contact.id]);

  const handleDelete = useCallback(async () => {
    if (!contact) return;

    // Clear any previous errors
    setError(null);

    const result = await deleteContact(contact.id, forceDelete);

    if (result.success) {
      onSuccess?.({
        message: result.message || 'Contact deleted successfully',
        contactId: result.contactId!,
        dependenciesDeleted: result.dependenciesDeleted,
        wasForced: result.wasForced || false,
      });
      onClose(); // Close dialog on success
    } else {
      // Handle error internally
      setError(result.error || 'Failed to delete contact');
    }
  }, [contact, forceDelete, deleteContact, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (loading) {
      return;
    }
    onClose();
  }, [loading, onClose]);

  const canProceed = checkingDependencies ? false : dependencyResult?.canDelete || forceDelete;

  return (
    <ConfirmDeleteDialog
      open
      title={
        <Box display="flex" alignItems="center" gap={1}>
          <ErrorIcon color="error" />
          <Typography variant="h6">Delete Contact</Typography>
        </Box>
      }
      content={
        <>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box>
              <Typography variant="body1" gutterBottom>
                Contact:{' '}
                <strong>
                  {contact.firstName} {contact.lastName}
                </strong>
              </Typography>
              {contact.email && (
                <Typography variant="body2" color="text.secondary">
                  {contact.email}
                </Typography>
              )}
            </Box>
          </Stack>

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
                        {dependencyResult.dependencies.some(
                          (d) => d.description === 'Account Owner',
                        )
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
        </>
      }
      onClose={handleClose}
      onConfirm={handleDelete}
      confirmLabel={loading ? 'Deleting...' : forceDelete ? 'Force Delete' : 'Delete Contact'}
      confirmButtonProps={{
        color: 'error',
        variant: 'contained',
        disabled: loading || !canProceed,
        startIcon: loading ? <CircularProgress size={16} /> : null,
      }}
      cancelButtonProps={{ disabled: loading }}
      dialogProps={{ maxWidth: 'md', fullWidth: true }}
    />
  );
};

export default DeleteContactDialog;
