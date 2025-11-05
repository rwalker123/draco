'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LeagueFaqType, UpsertLeagueFaqType } from '@draco/shared-schemas';
import {
  LEAGUE_FAQ_ANSWER_MAX_LENGTH,
  LEAGUE_FAQ_QUESTION_MAX_LENGTH,
} from '@draco/shared-schemas';
import type { LeagueFaqServiceResult } from '../../../hooks/useLeagueFaqService';
import RichTextEditor from '../../../components/email/RichTextEditor';

type RichTextEditorHandle = {
  getCurrentContent: () => string;
  getTextContent: () => string;
  insertText: (text: string) => void;
};

interface LeagueFaqFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  faq?: LeagueFaqType;
  onClose: () => void;
  onSuccess: (result: { faq: LeagueFaqType; message: string }) => void;
  onError: (message: string) => void;
  createFaq: (payload: UpsertLeagueFaqType) => Promise<LeagueFaqServiceResult<LeagueFaqType>>;
  updateFaq: (
    faqId: string,
    payload: UpsertLeagueFaqType,
  ) => Promise<LeagueFaqServiceResult<LeagueFaqType>>;
}

const FormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'Question is required')
    .max(
      LEAGUE_FAQ_QUESTION_MAX_LENGTH,
      `Question must be ${LEAGUE_FAQ_QUESTION_MAX_LENGTH} characters or fewer`,
    ),
  answer: z
    .string()
    .trim()
    .min(1, 'Answer is required')
    .max(
      LEAGUE_FAQ_ANSWER_MAX_LENGTH,
      `Answer must be ${LEAGUE_FAQ_ANSWER_MAX_LENGTH} characters or fewer`,
    ),
});

const QuestionSchema = FormSchema.pick({ question: true });
const AnswerSchema = FormSchema.pick({ answer: true });

type QuestionFormValues = z.infer<typeof QuestionSchema>;

const buildDefaultValues = (faq?: LeagueFaqType): QuestionFormValues => ({
  question: faq?.question ?? '',
});

export const LeagueFaqFormDialog: React.FC<LeagueFaqFormDialogProps> = ({
  open,
  mode,
  faq,
  onClose,
  onSuccess,
  onError,
  createFaq,
  updateFaq,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef<RichTextEditorHandle | null>(null);

  const defaultValues = useMemo(() => buildDefaultValues(faq), [faq]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(QuestionSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setSubmitError(null);
      setAnswerError(null);
      setEditorKey((value) => value + 1);
    }
  }, [defaultValues, open, reset]);

  const dialogTitle = mode === 'create' ? 'Add FAQ' : 'Edit FAQ';
  const actionLabel = mode === 'create' ? 'Create FAQ' : 'Save Changes';

  const onSubmit = async (values: QuestionFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    setAnswerError(null);

    const answerHtml = editorRef.current?.getCurrentContent() ?? '';
    const answerText = editorRef.current?.getTextContent().trim() ?? '';

    if (answerText.length === 0) {
      const message = 'Answer is required';
      setAnswerError(message);
      setSubmitting(false);
      return;
    }

    const sanitizedAnswer = answerHtml.trim();
    const answerCheck = AnswerSchema.safeParse({ answer: sanitizedAnswer });
    if (!answerCheck.success) {
      const flattened = answerCheck.error.flatten();
      const message = flattened.fieldErrors.answer?.[0] ?? 'Answer is invalid';
      setAnswerError(message);
      setSubmitting(false);
      return;
    }

    const payload: UpsertLeagueFaqType = {
      question: values.question.trim(),
      answer: sanitizedAnswer,
    };

    try {
      const result =
        mode === 'create'
          ? await createFaq(payload)
          : faq
            ? await updateFaq(faq.id, payload)
            : ({ success: false, error: 'FAQ not found.' } as const);

      if (result.success) {
        onSuccess({ faq: result.data, message: result.message });
      } else {
        setSubmitError(result.error);
        onError(result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save FAQ.';
      setSubmitError(message);
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}

          <Controller
            name="question"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Question"
                fullWidth
                autoFocus
                error={Boolean(errors.question)}
                helperText={errors.question?.message}
                multiline
              />
            )}
          />

          <Stack spacing={1} sx={{ mt: 1 }}>
            <RichTextEditor
              key={editorKey}
              ref={editorRef}
              initialValue={faq?.answer ?? ''}
              minHeight={240}
              error={Boolean(answerError)}
              placeholder="Enter the detailed answer"
            />
            {answerError && (
              <Alert severity="error" variant="outlined">
                {answerError}
              </Alert>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={submitting} variant="contained">
          {actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeagueFaqFormDialog;
