import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { isAccountAdministrator } from '../utils/permissionUtils';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import { getAccountUrls } from '@draco/shared-api-client';
import type { AccountUrlType } from '@draco/shared-schemas';
import { useDialog } from '../hooks/useDialog';
import AddAccountUrlDialog from './url-management/AddAccountUrlDialog';
import EditAccountUrlDialog from './url-management/EditAccountUrlDialog';
import DeleteAccountUrlDialog from './url-management/DeleteAccountUrlDialog';
import type {
  AccountUrlCreateResult,
  AccountUrlDeleteResult,
  AccountUrlUpdateResult,
} from '../hooks/useAccountUrlsService';

interface UrlManagementProps {
  accountId: string;
  accountName: string;
  onUrlsChange?: (urls: AccountUrlType[]) => void;
}

const UrlManagement: React.FC<UrlManagementProps> = ({ accountId, accountName, onUrlsChange }) => {
  const { token } = useAuth();
  const { hasRole } = useRole();
  const apiClient = useApiClient();

  const [urls, setUrls] = useState<AccountUrlType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use ref to store the callback to avoid dependency issues
  const onUrlsChangeRef = useRef(onUrlsChange);
  onUrlsChangeRef.current = onUrlsChange;

  const addDialog = useDialog<void>();
  const editDialog = useDialog<AccountUrlType>();
  const deleteDialog = useDialog<AccountUrlType>();

  const canManageUrls = isAccountAdministrator(hasRole, accountId);

  const loadUrls = useCallback(async () => {
    if (!accountId || !token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getAccountUrls({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const urlList = unwrapApiResult(result, 'Failed to load URLs') ?? [];
      setUrls(urlList);
      onUrlsChangeRef.current?.(urlList);
    } catch (err) {
      console.error('Failed to load URLs', err);
      setError('Failed to load URLs');
      setUrls([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, token]);

  useEffect(() => {
    void loadUrls();
  }, [loadUrls]);

  const handleDialogSuccess = useCallback(
    async (message: string) => {
      setSuccess(message);
      setError(null);
      await loadUrls();
    },
    [loadUrls],
  );

  const handleCreateSuccess = useCallback(
    (result: AccountUrlCreateResult) => {
      void handleDialogSuccess(result.message);
    },
    [handleDialogSuccess],
  );

  const handleUpdateSuccess = useCallback(
    (result: AccountUrlUpdateResult) => {
      void handleDialogSuccess(result.message);
    },
    [handleDialogSuccess],
  );

  const handleDeleteSuccess = useCallback(
    (result: AccountUrlDeleteResult) => {
      void handleDialogSuccess(result.message);
    },
    [handleDialogSuccess],
  );

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
      setSuccess(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [success]);

  const openEditDialog = (url: AccountUrlType) => {
    editDialog.open(url);
  };

  const openDeleteDialog = (url: AccountUrlType) => {
    deleteDialog.open(url);
  };

  const handleAddClick = () => {
    addDialog.open();
  };

  const handleVisitUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '400px' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        URL Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {urls.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <LinkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No URLs configured
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {canManageUrls
                ? 'Add URLs to make your organization accessible via custom domains.'
                : 'No custom URLs have been configured for this organization.'}
            </Typography>
            {canManageUrls && (
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddClick}>
                Add First URL
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>URL</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {urls.map((url) => (
                  <TableRow key={url.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinkIcon color="primary" />
                        <Typography variant="body2" fontFamily="monospace">
                          {url.url}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Visit URL">
                          <IconButton size="small" onClick={() => handleVisitUrl(url.url)}>
                            <OpenInNewIcon />
                          </IconButton>
                        </Tooltip>
                        {canManageUrls && (
                          <>
                            <Tooltip title="Edit URL">
                              <IconButton size="small" onClick={() => openEditDialog(url)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete URL">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteDialog(url)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <AddAccountUrlDialog
        accountId={accountId}
        accountName={accountName}
        open={addDialog.isOpen}
        onClose={addDialog.close}
        onSuccess={handleCreateSuccess}
      />

      <EditAccountUrlDialog
        accountId={accountId}
        open={editDialog.isOpen}
        url={editDialog.data ?? null}
        onClose={editDialog.close}
        onSuccess={handleUpdateSuccess}
      />

      <DeleteAccountUrlDialog
        accountId={accountId}
        open={deleteDialog.isOpen}
        url={deleteDialog.data ?? null}
        onClose={deleteDialog.close}
        onSuccess={handleDeleteSuccess}
      />

      <Typography variant="body2" color="text.secondary">
        You can use &quot;URL Management&quot; to update your URLs.
      </Typography>

      {/* Floating Action Button for Add URL */}
      {canManageUrls && (
        <Fab
          color="primary"
          aria-label="add URL"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={handleAddClick}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default UrlManagement;
