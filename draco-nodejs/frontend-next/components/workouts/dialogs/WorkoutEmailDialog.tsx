'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import RichTextEditor from '../../email/RichTextEditor';
import type {
  WorkoutRegistrationType,
  WorkoutRegistrationsEmailRequestType,
  WorkoutSummaryType,
} from '@draco/shared-schemas';
import {
  listWorkoutRegistrations,
  sendWorkoutRegistrationEmails,
} from '../../../services/workoutService';

interface WorkoutEmailDialogProps {
  accountId: string;
  workout: WorkoutSummaryType | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const hasContent = (value: string): boolean => {
  if (!value) {
    return false;
  }

  const text = value
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return text.length > 0;
};

type RichTextEditorHandle = {
  getCurrentContent: () => string;
  getTextContent: () => string;
  insertText: (text: string) => void;
};

export const WorkoutEmailDialog: React.FC<WorkoutEmailDialogProps> = ({
  accountId,
  workout,
  open,
  onClose,
  onSuccess,
  onError,
}) => {
  const { token } = useAuth();
  const [registrations, setRegistrations] = useState<WorkoutRegistrationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const editorRef = useRef<RichTextEditorHandle | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadRegistrations = useCallback(async () => {
    if (!workout) {
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);
      const data = await listWorkoutRegistrations(accountId, workout.id, token ?? undefined);
      setRegistrations(data);
      setSelectedIds(new Set(data.map((registration) => registration.id)));
    } catch (error) {
      console.error('Failed to load workout registrations for email dialog:', error);
      setLoadError('Failed to load registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [accountId, workout, token]);

  useEffect(() => {
    if (!open) {
      setRegistrations([]);
      setSelectedIds(new Set());
      setSubject('');
      setEditorKey((value) => value + 1);
      setFormError(null);
      setLoadError(null);
      return;
    }

    if (workout) {
      setSubject(`Update: ${workout.workoutDesc}`);
    }

    setEditorKey((value) => value + 1);
    void loadRegistrations();
  }, [open, workout, loadRegistrations]);

  const allSelected = useMemo(() => {
    return registrations.length > 0 && selectedIds.size === registrations.length;
  }, [registrations, selectedIds]);

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(registrations.map((registration) => registration.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [registrations],
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (!workout) {
      return;
    }

    if (!subject.trim()) {
      setFormError('Subject is required');
      return;
    }

    const editorHtml = editorRef.current?.getCurrentContent() ?? '';
    const editorText = editorRef.current?.getTextContent() ?? '';

    if (!hasContent(editorHtml) && !editorText.trim()) {
      setFormError('Email body cannot be empty');
      return;
    }

    if (selectedIds.size === 0) {
      setFormError('Select at least one registrant');
      return;
    }

    setFormError(null);
    setSending(true);

    const payload: WorkoutRegistrationsEmailRequestType = {
      subject: subject.trim(),
      body: editorHtml,
      registrationIds:
        selectedIds.size === registrations.length ? undefined : Array.from(selectedIds.values()),
    };

    try {
      await sendWorkoutRegistrationEmails(accountId, workout.id, payload, token ?? undefined);

      onSuccess?.('Email queued for delivery to workout registrants');
      onClose();
    } catch (error) {
      console.error('Failed to send workout registration email:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to send workout registration email';
      setFormError(message);
      onError?.(message);
    } finally {
      setSending(false);
    }
  }, [
    accountId,
    onClose,
    onError,
    onSuccess,
    registrations.length,
    selectedIds,
    subject,
    token,
    workout,
  ]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Email Workout Registrants</DialogTitle>
      <DialogContent dividers>
        {loadError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        ) : null}

        {formError ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                fullWidth
                required
              />
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Message
                </Typography>
                <RichTextEditor key={editorKey} ref={editorRef} initialValue="" minHeight={220} />
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Recipients ({selectedIds.size}/{registrations.length})
              </Typography>
              <Paper variant="outlined">
                <TableContainer sx={{ maxHeight: 260 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={
                              selectedIds.size > 0 && selectedIds.size < registrations.length
                            }
                            checked={allSelected}
                            onChange={(event) => toggleSelectAll(event.target.checked)}
                          />
                        </TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Manager</TableCell>
                        <TableCell>Where heard</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {registrations.map((registration) => (
                        <TableRow key={registration.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedIds.has(registration.id)}
                              onChange={() => toggleSelection(registration.id)}
                            />
                          </TableCell>
                          <TableCell>{registration.name}</TableCell>
                          <TableCell>{registration.email}</TableCell>
                          <TableCell>{registration.isManager ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{registration.whereHeard}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {registrations.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No registrations available.
                    </Typography>
                  </Box>
                ) : null}
              </Paper>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < registrations.length}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                  />
                }
                label="Select all registrants"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={sending}>
          Cancel
        </Button>
        <Button onClick={handleSend} variant="contained" disabled={sending || loading}>
          {sending ? 'Sending…' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
