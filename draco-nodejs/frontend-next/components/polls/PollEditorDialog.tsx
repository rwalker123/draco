'use client';

import React, { useCallback, useMemo, useState } from 'react';
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
import { AccountPollType, CreatePollSchema, UpdatePollSchema } from '@draco/shared-schemas';
import { UpdatePollPayload, usePollsService } from '@/hooks/usePollsService';

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

const cloneFormState = (state: PollFormState): PollFormState => ({
  question: state.question,
  active: state.active,
  options: state.options.map((option) => ({ ...option })),
});

const PollEditorDialog: React.FC<PollEditorDialogProps> = (props) => {
  if (!props.open) {
    return null;
  }

  const key = props.poll ? `poll-${props.poll.id}` : 'poll-new';
  return <PollEditorDialogInner key={key} {...props} />;
};

type PollEditorDialogInnerProps = Omit<PollEditorDialogProps, 'open'>;

const PollEditorDialogInner: React.FC<PollEditorDialogInnerProps> = ({
  accountId,
  onClose,
  poll,
  onSuccess,
  onError,
}) => {
  const { createPoll, updatePoll, loading, resetError } = usePollsService(accountId);
  const baseState = useMemo(
    () => (poll ? buildStateFromPoll(poll) : createDefaultFormState()),
    [poll],
  );
  const [formState, setFormState] = useState<PollFormState>(() => cloneFormState(baseState));
  const [removedOptionIds, setRemovedOptionIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditMode = Boolean(poll);

  const resetFormState = useCallback(() => {
    setFormState(cloneFormState(baseState));
    setRemovedOptionIds([]);
    setFormError(null);
    resetError();
  }, [baseState, resetError]);

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
      const nextOptions = prev.options.filter((item) => item.tempId !== option.tempId);

      const validationResult = CreatePollSchema.shape.options.safeParse(
        nextOptions.map((item, index) => ({
          optionText: item.optionText.trim(),
          priority: Number.isInteger(item.priority) ? item.priority : index,
        })),
      );

      if (!validationResult.success) {
        const message =
          validationResult.error.issues[0]?.message ?? 'A poll must include at least two options.';
        setFormError(message);
        return prev;
      }

      const optionId = option.id ?? '';
      if (optionId) {
        setRemovedOptionIds((ids) => [...ids, optionId]);
      }

      return {
        ...prev,
        options: nextOptions,
      };
    });
  }, []);

  const handleClose = useCallback(() => {
    resetFormState();
    onClose();
  }, [onClose, resetFormState]);

  const handleSave = useCallback(async () => {
    setFormError(null);

    const sanitizedOptions = formState.options.map((option, index) => ({
      ...(option.id ? { id: option.id } : {}),
      optionText: option.optionText.trim(),
      priority: Number.isInteger(option.priority) ? option.priority : index,
    }));

    const createPayload = {
      question: formState.question.trim(),
      active: formState.active,
      options: sanitizedOptions.map(({ id: _id, ...rest }) => rest),
    } satisfies Omit<UpdatePollPayload, 'deletedOptionIds'>;

    try {
      let result: { message: string; poll: AccountPollType };

      if (isEditMode) {
        if (!poll) {
          setFormError('Unable to locate the poll to update. Please refresh and try again.');
          return;
        }

        const validationResult = UpdatePollSchema.safeParse({
          ...createPayload,
          options: sanitizedOptions,
          deletedOptionIds: removedOptionIds.length > 0 ? removedOptionIds : undefined,
        });

        if (!validationResult.success) {
          const message =
            validationResult.error.issues[0]?.message ??
            'Please review the poll details and try again.';
          setFormError(message);
          return;
        }

        result = await updatePoll(poll.id, validationResult.data);
      } else {
        const validationResult = CreatePollSchema.safeParse(createPayload);

        if (!validationResult.success) {
          const message =
            validationResult.error.issues[0]?.message ??
            'Please review the poll details and try again.';
          setFormError(message);
          return;
        }

        result = await createPoll(validationResult.data);
      }

      onSuccess?.(result);
      handleClose();
    } catch (err) {
      console.error('Failed to save poll:', err);
      const message = err instanceof Error ? err.message : 'Failed to save poll.';
      setFormError(message);
      onError?.(message);
    }
  }, [
    formState,
    isEditMode,
    handleClose,
    onError,
    onSuccess,
    poll,
    removedOptionIds,
    createPoll,
    updatePoll,
  ]);

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
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
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PollEditorDialog;
