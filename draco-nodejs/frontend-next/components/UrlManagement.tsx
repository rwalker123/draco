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

interface AccountUrl {
  id: string;
  url: string;
}

interface UrlManagementProps {
  accountId: string;
  accountName: string;
  onUrlsChange?: (urls: AccountUrl[]) => void;
}

const UrlManagement: React.FC<UrlManagementProps> = ({ accountId, accountName, onUrlsChange }) => {
  const { token } = useAuth();
  const { hasRole } = useRole();

  const [urls, setUrls] = useState<AccountUrl[]>([]);
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
  const [selectedUrl, setSelectedUrl] = useState<AccountUrl | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    protocol: 'https://',
    domain: '',
  });

  const canManageUrls = isAccountAdministrator(hasRole, accountId);

  const loadUrls = useCallback(async () => {
    if (!token || !accountId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/accounts/${accountId}/urls`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          const urlList = data.data.urls || [];
          setUrls(urlList);
          onUrlsChangeRef.current?.(urlList);
          setError(null); // Ensure error is cleared on success
        } else {
          setError(data.message || 'Failed to load URLs');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to load URLs');
      }
    } catch {
      setError('Failed to load URLs');
    } finally {
      setLoading(false);
    }
  }, [accountId, token]);

  useEffect(() => {
    loadUrls();
  }, [loadUrls]);

  const validateUrl = (domain: string): string | null => {
    if (!isValidDomain(domain)) {
      return getDomainValidationError(domain);
    }
    return null;
  };

  const handleAddUrl = async () => {
    const fullUrl = formData.protocol + formData.domain;
    const validationError = validateUrl(formData.domain);

    if (validationError) {
      setAddDialogError(validationError);
      return;
    }

    try {
      setAddDialogError(null); // Clear any previous errors

      const response = await fetch(`/api/accounts/${accountId}/urls`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fullUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('URL added successfully');
        setAddDialogOpen(false);
        setFormData({ protocol: 'https://', domain: '' });
        setAddDialogError(null);
        loadUrls();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setAddDialogError(data.message || 'Failed to add URL');
      }
    } catch {
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

      const response = await fetch(`/api/accounts/${accountId}/urls/${selectedUrl.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fullUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('URL updated successfully');
        setEditDialogOpen(false);
        setSelectedUrl(null);
        setFormData({ protocol: 'https://', domain: '' });
        setEditDialogError(null);
        loadUrls();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setEditDialogError(data.message || 'Failed to update URL');
      }
    } catch {
      setEditDialogError('Failed to update URL');
    }
  };

  const handleDeleteUrl = async () => {
    if (!selectedUrl) return;

    try {
      const response = await fetch(`/api/accounts/${accountId}/urls/${selectedUrl.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('URL deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedUrl(null);
        loadUrls();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to delete URL');
      }
    } catch {
      setError('Failed to delete URL');
    }
  };

  const openEditDialog = (url: AccountUrl) => {
    setSelectedUrl(url);
    const urlObj = new URL(url.url);
    setFormData({
      protocol: urlObj.protocol + '//',
      domain: urlObj.host,
    });
    setEditDialogError(null); // Clear any previous errors
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (url: AccountUrl) => {
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
