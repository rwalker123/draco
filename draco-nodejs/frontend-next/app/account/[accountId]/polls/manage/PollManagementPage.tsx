'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Fab,
  IconButton,
  Paper,
  Snackbar,
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
import { AdminBreadcrumbs } from '../../../../../components/admin';
import PollEditorDialog from '../../../../../components/polls/PollEditorDialog';
import PollDeleteDialog from '../../../../../components/polls/PollDeleteDialog';
import { useApiClient } from '../../../../../hooks/useApiClient';
import { useAuth } from '../../../../../context/AuthContext';
import { unwrapApiResult } from '@/utils/apiResult';
import { alpha } from '@mui/material/styles';
import { UI_TIMEOUTS } from '../../../../../constants/timeoutConstants';

interface PollManagementPageProps {
  accountId: string;
}

const PollManagementPage: React.FC<PollManagementPageProps> = ({ accountId }) => {
  const apiClient = useApiClient();
  const { token } = useAuth();
  const [polls, setPolls] = useState<AccountPollType[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPoll, setEditorPoll] = useState<AccountPollType | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePoll, setDeletePoll] = useState<AccountPollType | null>(null);

  const canManage = Boolean(token);

  useEffect(() => {
    if (!canManage) {
      setPolls([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadPolls = async () => {
      setLoading(true);

      try {
        const result = await listAccountPolls({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const loaded = unwrapApiResult(result, 'Failed to load poll list');
        setPolls(loaded ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load polls:', err);
        setSnackbar({ severity: 'error', message: 'Failed to load polls.' });
        setPolls([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadPolls();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, canManage]);

  const handleOpenCreate = () => {
    setEditorPoll(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (poll: AccountPollType) => {
    setEditorPoll(poll);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditorPoll(null);
  };

  const handleEditorSuccess = ({ message, poll }: { message: string; poll: AccountPollType }) => {
    setPolls((prev) => {
      const exists = prev.some((item) => item.id === poll.id);
      return exists ? prev.map((item) => (item.id === poll.id ? poll : item)) : [...prev, poll];
    });
    setSnackbar({ severity: 'success', message });
  };

  const handleEditorError = (message: string) => {
    setSnackbar({ severity: 'error', message });
  };

  const handleConfirmDelete = (poll: AccountPollType) => {
    setDeletePoll(poll);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setDeletePoll(null);
  };

  const handleDeleteSuccess = ({ message, pollId }: { message: string; pollId: string }) => {
    setPolls((prev) => prev.filter((poll) => poll.id !== pollId));
    setSnackbar({ severity: 'success', message });
  };

  const handleDeleteError = (message: string) => {
    setSnackbar({ severity: 'error', message });
  };

  if (!canManage) {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
          >
            Poll Management
          </Typography>
        </AccountPageHeader>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">You must be signed in to manage polls.</Alert>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Poll Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Create, edit, and retire polls that keep your members engaged. Results update instantly as
          votes come in.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Community', href: `/account/${accountId}/admin/community` }}
          currentPage="Poll Management"
        />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Paper elevation={3} sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table sx={{ tableLayout: 'auto' }}>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: (theme) =>
                        alpha(
                          theme.palette.primary.main,
                          theme.palette.mode === 'dark' ? 0.2 : 0.08,
                        ),
                      '& .MuiTableCell-root': {
                        fontWeight: 600,
                      },
                    }}
                  >
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
                              <IconButton color="primary" onClick={() => handleOpenEdit(poll)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete poll">
                              <IconButton color="error" onClick={() => handleConfirmDelete(poll)}>
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
          </Paper>
        )}
      </Container>

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

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={
          snackbar?.severity === 'error'
            ? UI_TIMEOUTS.ERROR_MESSAGE_TIMEOUT_MS
            : UI_TIMEOUTS.SUCCESS_MESSAGE_TIMEOUT_MS
        }
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert
            onClose={() => setSnackbar(null)}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </main>
  );
};

export default PollManagementPage;
