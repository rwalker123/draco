'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { AccountPollType } from '@draco/shared-schemas';
import { createAccountPoll, updateAccountPoll } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';

interface PollOptionForm {
  id?: string;
  tempId: string;
  optionText: string;
  priority: number;
}

interface PollFormState {
  question: string;
  active: boolean;
  options: PollOptionForm[];
}

export interface PollEditorDialogProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
  poll?: AccountPollType | null;
  onSuccess?: (result: { message: string; poll: AccountPollType }) => void;
  onError?: (message: string) => void;
}

const createEmptyOption = (index: number): PollOptionForm => ({
  tempId: `new-${index}-${Date.now()}`,
  optionText: '',
  priority: index,
});

const createDefaultFormState = (): PollFormState => ({
  question: '',
  active: true,
  options: [createEmptyOption(0), createEmptyOption(1)],
});

const buildStateFromPoll = (poll: AccountPollType): PollFormState => ({
  question: poll.question,
  active: poll.active,
  options: poll.options
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((option) => ({
      id: option.id,
      tempId: option.id,
      optionText: option.optionText,
      priority: option.priority,
    })),
});

const PollEditorDialog: React.FC<PollEditorDialogProps> = ({
  accountId,
  open,
  onClose,
  poll,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const [formState, setFormState] = useState<PollFormState>(createDefaultFormState);
  const [removedOptionIds, setRemovedOptionIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditMode = useMemo(() => Boolean(poll), [poll]);

  useEffect(() => {
    if (open) {
      if (poll) {
        setFormState(buildStateFromPoll(poll));
        setRemovedOptionIds([]);
      } else {
        setFormState(createDefaultFormState());
        setRemovedOptionIds([]);
      }
      setFormError(null);
    } else {
      setFormState(createDefaultFormState());
      setRemovedOptionIds([]);
      setFormError(null);
      setSaving(false);
    }
  }, [open, poll]);

  const handleAddOption = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      options: [...prev.options, createEmptyOption(prev.options.length)],
    }));
  }, []);

  const handleOptionTextChange = useCallback((tempId: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.tempId === tempId ? { ...option, optionText: value } : option,
      ),
    }));
  }, []);

  const handleOptionPriorityChange = useCallback((tempId: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    setFormState((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.tempId === tempId
          ? { ...option, priority: Number.isNaN(parsed) ? option.priority : parsed }
          : option,
      ),
    }));
  }, []);

  const handleRemoveOption = useCallback((option: PollOptionForm) => {
    setFormError(null);
    setFormState((prev) => {
      if (prev.options.length <= 2) {
        setFormError('A poll must include at least two options.');
        return prev;
      }

      const optionId = option.id ?? '';
      if (optionId) {
        setRemovedOptionIds((ids) => [...ids, optionId]);
      }

      return {
        ...prev,
        options: prev.options.filter((item) => item.tempId !== option.tempId),
      };
    });
  }, []);

  const validateForm = useCallback(() => {
    if (!formState.question.trim()) {
      setFormError('Poll question is required.');
      return false;
    }

    if (formState.options.length < 2) {
      setFormError('A poll must include at least two options.');
      return false;
    }

    if (formState.options.some((option) => !option.optionText.trim())) {
      setFormError('All options must include text.');
      return false;
    }

    setFormError(null);
    return true;
  }, [formState]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setFormError(null);

    const basePayload = {
      question: formState.question.trim(),
      active: formState.active,
      options: formState.options.map((option, index) => ({
        id: option.id,
        optionText: option.optionText.trim(),
        priority: option.priority ?? index,
      })),
    };

    try {
      if (isEditMode && poll) {
        const result = await updateAccountPoll({
          client: apiClient,
          path: { accountId, pollId: poll.id },
          body: {
            ...basePayload,
            deletedOptionIds: removedOptionIds.length > 0 ? removedOptionIds : undefined,
          },
          throwOnError: false,
        });

        const updated = unwrapApiResult(result, 'Failed to update poll');
        onSuccess?.({ message: 'Poll updated successfully.', poll: updated });
      } else {
        const result = await createAccountPoll({
          client: apiClient,
          path: { accountId },
          body: basePayload,
          throwOnError: false,
        });

        const created = unwrapApiResult(result, 'Failed to create poll');
        onSuccess?.({ message: 'Poll created successfully.', poll: created });
      }

      onClose();
    } catch (err) {
      console.error('Failed to save poll:', err);
      const message = 'Failed to save poll.';
      setFormError(message);
      onError?.(message);
    } finally {
      setSaving(false);
    }
  }, [
    accountId,
    apiClient,
    formState,
    isEditMode,
    onClose,
    onError,
    onSuccess,
    poll,
    removedOptionIds,
    validateForm,
  ]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit Poll' : 'Create Poll'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {formError && <Alert severity="error">{formError}</Alert>}
        <TextField
          label="Question"
          value={formState.question}
          onChange={(event) => setFormState((prev) => ({ ...prev, question: event.target.value }))}
          fullWidth
          required
        />
        <FormControlLabel
          control={
            <Switch
              checked={formState.active}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, active: event.target.checked }))
              }
            />
          }
          label="Active"
        />
        <Stack spacing={2}>
          {formState.options.map((option, index) => (
            <Box
              key={option.tempId}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}
            >
              <Stack spacing={2}>
                <TextField
                  label={`Option ${index + 1}`}
                  value={option.optionText}
                  onChange={(event) => handleOptionTextChange(option.tempId, event.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Priority"
                  type="number"
                  value={option.priority}
                  onChange={(event) =>
                    handleOptionPriorityChange(option.tempId, event.target.value)
                  }
                  fullWidth
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button color="error" onClick={() => handleRemoveOption(option)}>
                    Remove
                  </Button>
                </Box>
              </Stack>
            </Box>
          ))}
          <Button variant="outlined" onClick={handleAddOption}>
            Add Option
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PollEditorDialog;
