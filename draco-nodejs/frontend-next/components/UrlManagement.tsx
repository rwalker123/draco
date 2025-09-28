import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { isValidDomain, getDomainValidationError } from '../utils/validation';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import {
  getAccountUrls,
  createAccountUrl,
  updateAccountUrl,
  deleteAccountUrl,
} from '@draco/shared-api-client';
import type { AccountUrlType, CreateAccountUrlType } from '@draco/shared-schemas';

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

  // Dialog-specific error states
  const [addDialogError, setAddDialogError] = useState<string | null>(null);
  const [editDialogError, setEditDialogError] = useState<string | null>(null);

  // Use ref to store the callback to avoid dependency issues
  const onUrlsChangeRef = useRef(onUrlsChange);
  onUrlsChangeRef.current = onUrlsChange;

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<AccountUrlType | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    protocol: 'https://',
    domain: '',
  });

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

  const validateUrl = (domain: string): string | null => {
    if (!isValidDomain(domain)) {
      return getDomainValidationError(domain);
    }
    return null;
  };

  const buildUrlPayload = (url: string): CreateAccountUrlType => ({ url });

  const handleAddUrl = async () => {
    const fullUrl = formData.protocol + formData.domain;
    const validationError = validateUrl(formData.domain);

    if (validationError) {
      setAddDialogError(validationError);
      return;
    }

    try {
      setAddDialogError(null); // Clear any previous errors

      const result = await createAccountUrl({
        client: apiClient,
        path: { accountId },
        body: buildUrlPayload(fullUrl),
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to add URL');

      setSuccess('URL added successfully');
      setAddDialogOpen(false);
      setFormData({ protocol: 'https://', domain: '' });
      setAddDialogError(null);
      await loadUrls();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to add URL', err);
      setAddDialogError('Failed to add URL');
    }
  };

  const handleEditUrl = async () => {
    if (!selectedUrl) return;

    const fullUrl = formData.protocol + formData.domain;
    const validationError = validateUrl(formData.domain);

    if (validationError) {
      setEditDialogError(validationError);
      return;
    }

    try {
      setEditDialogError(null); // Clear any previous errors

      const result = await updateAccountUrl({
        client: apiClient,
        path: { accountId, urlId: selectedUrl.id },
        body: buildUrlPayload(fullUrl),
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to update URL');

      setSuccess('URL updated successfully');
      setEditDialogOpen(false);
      setSelectedUrl(null);
      setFormData({ protocol: 'https://', domain: '' });
      setEditDialogError(null);
      await loadUrls();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update URL', err);
      setEditDialogError('Failed to update URL');
    }
  };

  const handleDeleteUrl = async () => {
    if (!selectedUrl) return;

    try {
      const result = await deleteAccountUrl({
        client: apiClient,
        path: { accountId, urlId: selectedUrl.id },
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to delete URL');

      setSuccess('URL deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedUrl(null);
      await loadUrls();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete URL', err);
      setError('Failed to delete URL');
    }
  };

  const openEditDialog = (url: AccountUrlType) => {
    setSelectedUrl(url);
    const urlObj = new URL(url.url);
    setFormData({
      protocol: urlObj.protocol + '//',
      domain: urlObj.host,
    });
    setEditDialogError(null); // Clear any previous errors
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (url: AccountUrlType) => {
    setSelectedUrl(url);
    setDeleteDialogOpen(true);
  };

  const handleAddClick = () => {
    setFormData({ protocol: 'https://', domain: '' });
    setAddDialogError(null);
    setAddDialogOpen(true);
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

      {/* Add URL Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setAddDialogError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add URL for {accountName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {addDialogError && <Alert severity="error">{addDialogError}</Alert>}
            <FormControl fullWidth>
              <InputLabel>Protocol</InputLabel>
              <Select
                value={formData.protocol}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                label="Protocol"
              >
                <MenuItem value="https://">HTTPS (Recommended)</MenuItem>
                <MenuItem value="http://">HTTP</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="example.com or subdomain.example.com"
              fullWidth
              required
              helperText="Enter the domain name only (e.g., example.com, www.example.com)"
            />
            {formData.protocol && formData.domain && (
              <Alert severity="info">Full URL: {formData.protocol + formData.domain}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setAddDialogError(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleAddUrl} variant="contained">
            Add URL
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit URL Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditDialogError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit URL</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editDialogError && <Alert severity="error">{editDialogError}</Alert>}
            <FormControl fullWidth>
              <InputLabel>Protocol</InputLabel>
              <Select
                value={formData.protocol}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                label="Protocol"
              >
                <MenuItem value="https://">HTTPS (Recommended)</MenuItem>
                <MenuItem value="http://">HTTP</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="example.com or subdomain.example.com"
              fullWidth
              required
              helperText="Enter the domain name only (e.g., example.com, www.example.com)"
            />
            {formData.protocol && formData.domain && (
              <Alert severity="info">Full URL: {formData.protocol + formData.domain}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditDialogError(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleEditUrl} variant="contained">
            Update URL
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete URL Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete URL</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the URL &quot;{selectedUrl?.url}&quot;? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUrl} color="error" variant="contained">
            Delete URL
          </Button>
        </DialogActions>
      </Dialog>

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
