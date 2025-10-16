'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Fab,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { AccountPollType } from '@draco/shared-schemas';
import { listAccountPolls } from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import PollEditorDialog from '../../../../../components/polls/PollEditorDialog';
import PollDeleteDialog from '../../../../../components/polls/PollDeleteDialog';
import { useApiClient } from '../../../../../hooks/useApiClient';
import { useAuth } from '../../../../../context/AuthContext';
import { unwrapApiResult } from '@/utils/apiResult';

interface PollManagementPageProps {
  accountId: string;
}

const PollManagementPage: React.FC<PollManagementPageProps> = ({ accountId }) => {
  const apiClient = useApiClient();
  const { token } = useAuth();
  const [polls, setPolls] = useState<AccountPollType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPoll, setEditorPoll] = useState<AccountPollType | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePoll, setDeletePoll] = useState<AccountPollType | null>(null);

  const canManage = useMemo(() => Boolean(token), [token]);

  const loadPolls = useCallback(async () => {
    if (!canManage) {
      setPolls([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await listAccountPolls({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const polls = unwrapApiResult(result, 'Failed to load poll list');

      setPolls(polls ?? []);
    } catch (err) {
      console.error('Failed to load polls:', err);
      setError('Failed to load polls.');
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, canManage]);

  useEffect(() => {
    void loadPolls();
  }, [loadPolls]);

  const handleOpenCreate = useCallback(() => {
    setEditorPoll(null);
    setEditorOpen(true);
  }, []);

  const handleOpenEdit = useCallback((poll: AccountPollType) => {
    setEditorPoll(poll);
    setEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditorOpen(false);
    setEditorPoll(null);
  }, []);

  const handleEditorSuccess = useCallback(
    ({ message, poll }: { message: string; poll: AccountPollType }) => {
      setPolls((prev) => {
        const exists = prev.some((item) => item.id === poll.id);
        return exists ? prev.map((item) => (item.id === poll.id ? poll : item)) : [...prev, poll];
      });
      setSuccess(message);
      setError(null);
    },
    [],
  );

  const handleEditorError = useCallback((message: string) => {
    setError(message);
    setSuccess(null);
  }, []);

  const handleConfirmDelete = useCallback((poll: AccountPollType) => {
    setDeletePoll(poll);
    setDeleteOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteOpen(false);
    setDeletePoll(null);
  }, []);

  const handleDeleteSuccess = useCallback(
    ({ message, pollId }: { message: string; pollId: string }) => {
      setPolls((prev) => prev.filter((poll) => poll.id !== pollId));
      setSuccess(message);
      setError(null);
    },
    [],
  );

  const handleDeleteError = useCallback((message: string) => {
    setError(message);
    setSuccess(null);
  }, []);

  if (!canManage) {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
            Poll Management
          </Typography>
        </AccountPageHeader>
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">You must be signed in to manage polls.</Alert>
        </Box>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
            Poll Management
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 1, maxWidth: 520, mx: 'auto', color: 'rgba(255,255,255,0.85)' }}
          >
            Create, edit, and retire polls that keep your members engaged. Results update instantly
            as votes come in.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Box
        sx={{
          position: 'relative',
          p: 3,
          pb: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ tableLayout: 'auto' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Results</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {polls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary">No polls found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  polls
                    .slice()
                    .sort((a, b) => Number(b.active) - Number(a.active))
                    .map((poll) => (
                      <TableRow key={poll.id} hover>
                        <TableCell sx={{ whiteSpace: 'normal' }}>{poll.question}</TableCell>
                        <TableCell>{poll.active ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell>
                          {poll.options && poll.options.length > 0 ? (
                            <Table
                              size="small"
                              sx={{
                                width: 'auto',
                                border: (theme) => `1px solid ${theme.palette.divider}`,
                                borderRadius: 1,
                                overflow: 'hidden',
                                '& td:first-of-type': { pr: 3 },
                                '& td:last-of-type': { pl: 1.5 },
                                '& td:not(:last-of-type)': {
                                  borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                },
                                '& td': {
                                  borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                                  py: 0.5,
                                },
                                '& tbody tr:last-of-type td': { borderBottom: 'none' },
                              }}
                            >
                              <TableBody>
                                {poll.options.map((option) => (
                                  <TableRow key={option.id}>
                                    <TableCell sx={{ pr: 2 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {option.optionText}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ pl: 0 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        {option.voteCount ?? 0} votes
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No options configured.
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit poll">
                            <IconButton onClick={() => handleOpenEdit(poll)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete poll">
                            <IconButton onClick={() => handleConfirmDelete(poll)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Fab
        color="primary"
        aria-label="add poll"
        sx={{
          position: 'fixed',
          bottom: { xs: 24, md: 32 },
          right: { xs: 24, md: 32 },
          zIndex: (theme) => theme.zIndex.tooltip,
        }}
        onClick={handleOpenCreate}
      >
        <AddIcon />
      </Fab>

      <PollEditorDialog
        accountId={accountId}
        open={editorOpen}
        poll={editorPoll}
        onClose={handleCloseEditor}
        onSuccess={handleEditorSuccess}
        onError={handleEditorError}
      />
      <PollDeleteDialog
        accountId={accountId}
        open={deleteOpen}
        poll={deletePoll}
        onClose={handleCloseDelete}
        onSuccess={handleDeleteSuccess}
        onError={handleDeleteError}
      />
    </main>
  );
};

export default PollManagementPage;
