'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { AccountPollType } from '@draco/shared-schemas';
import { listAccountPolls } from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import PollEditorDialog from '../../../../../components/polls/PollEditorDialog';
import PollDeleteDialog from '../../../../../components/polls/PollDeleteDialog';
import { useApiClient } from '../../../../../hooks/useApiClient';
import { useAuth } from '../../../../../context/AuthContext';

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

      if (result.error) {
        if (result.error.status === 403) {
          setError('You do not have permission to manage polls for this account.');
        } else {
          setError('Failed to load polls.');
        }
        setPolls([]);
        return;
      }

      setPolls((result.data as AccountPollType[]) ?? []);
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

  const handleRefresh = useCallback(() => {
    setSuccess(null);
    void loadPolls();
  }, [loadPolls]);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Poll Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh polls">
              <IconButton onClick={handleRefresh} disabled={loading} sx={{ color: 'white' }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              New Poll
            </Button>
          </Box>
        </Box>
      </AccountPageHeader>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total Votes</TableCell>
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
                        <TableCell>{poll.question}</TableCell>
                        <TableCell>{poll.active ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell align="right">{poll.totalVotes}</TableCell>
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
