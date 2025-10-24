'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { listMemberBusinesses } from '@draco/shared-api-client';
import type { MemberBusinessType } from '@draco/shared-schemas';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuth } from '@/context/AuthContext';
import { unwrapApiResult } from '@/utils/apiResult';
import MemberBusinessFormDialog, {
  type MemberBusinessDialogResult,
} from './MemberBusinessFormDialog';
import MemberBusinessDeleteDialog, {
  type MemberBusinessDeleteResult,
} from './MemberBusinessDeleteDialog';

interface MemberBusinessCardProps {
  accountId: string | null;
  contactId: string | null;
}

type DialogMode = 'create' | 'edit';

const renderField = (label: string, value?: string | null) => {
  if (!value) {
    return null;
  }

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
};

const MemberBusinessCard: React.FC<MemberBusinessCardProps> = ({ accountId, contactId }) => {
  const apiClient = useApiClient();
  const { user, token } = useAuth();

  const [memberBusinesses, setMemberBusinesses] = useState<MemberBusinessType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<DialogMode>('create');
  const [selectedBusiness, setSelectedBusiness] = useState<MemberBusinessType | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canManage = Boolean(user && token && accountId && contactId);

  const loadMemberBusinesses = useCallback(async () => {
    if (!accountId || !token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await listMemberBusinesses({
        client: apiClient,
        path: { accountId },
        query: contactId ? { contactId } : undefined,
        security: [{ type: 'http', scheme: 'bearer' }],
        throwOnError: false,
      });

      const payload = unwrapApiResult(result, 'Failed to load member businesses');
      setMemberBusinesses(payload?.memberBusinesses ?? []);
    } catch (err) {
      console.error('Failed to load member businesses', err);
      setError('Unable to load member businesses right now.');
      setMemberBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, contactId, token]);

  useEffect(() => {
    void loadMemberBusinesses();
  }, [loadMemberBusinesses]);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timeout = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timeout);
  }, [success]);

  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedBusiness(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (business: MemberBusinessType) => {
    setFormMode('edit');
    setSelectedBusiness(business);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedBusiness(null);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setSelectedBusiness(null);
  };

  const handleFormSuccess = (result: MemberBusinessDialogResult) => {
    setSuccess(result.message);
    setError(null);
    handleCloseForm();
    void loadMemberBusinesses();
  };

  const handleFormError = (message: string) => {
    setError(message);
  };

  const handleDeleteSuccess = (result: MemberBusinessDeleteResult) => {
    setSuccess(result.message);
    setError(null);
    handleCloseDelete();
    void loadMemberBusinesses();
  };

  const showEmptyState = !loading && memberBusinesses.length === 0;

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Member Business
          </Typography>
          {canManage && memberBusinesses.length === 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              disabled={loading}
            >
              Add Business
            </Button>
          )}
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {loading ? (
          <Stack spacing={1}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="rectangular" height={80} />
          </Stack>
        ) : showEmptyState ? (
          <Typography variant="body2" color="text.secondary">
            You haven&apos;t added any member business information yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {memberBusinesses.map((business, index) => (
              <Box key={business.id}>
                <Stack
                  spacing={1}
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                >
                  <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {business.name}
                    </Typography>
                    {business.description && (
                      <Typography variant="body2" color="text.secondary">
                        {business.description}
                      </Typography>
                    )}
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {renderField('Street Address', business.streetAddress)}
                      {renderField('City / State / ZIP', business.cityStateZip)}
                      {renderField('Email', business.email)}
                      {renderField('Phone', business.phone)}
                      {renderField('Fax', business.fax)}
                      {renderField('Website', business.website)}
                    </Stack>
                  </Stack>
                  {canManage && (
                    <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
                      <IconButton
                        aria-label="Edit member business"
                        size="small"
                        onClick={() => handleOpenEdit(business)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label="Delete member business"
                        size="small"
                        onClick={() => {
                          setSelectedBusiness(business);
                          setDeleteOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                </Stack>
                {index < memberBusinesses.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>

      <MemberBusinessFormDialog
        open={formOpen}
        mode={formMode}
        accountId={accountId}
        contactId={contactId}
        memberBusiness={selectedBusiness}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
      />

      <MemberBusinessDeleteDialog
        open={deleteOpen}
        accountId={accountId}
        memberBusiness={selectedBusiness}
        onClose={handleCloseDelete}
        onSuccess={handleDeleteSuccess}
        onError={handleFormError}
      />
    </Paper>
  );
};

export default MemberBusinessCard;
