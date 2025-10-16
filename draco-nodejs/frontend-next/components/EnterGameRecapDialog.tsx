'use client';

// TODO: Replace the plain text/textarea input with a WYSIWYG editor (e.g., react-quill, TinyMCE, Slate) for game recaps once React 19 support is available.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from '@mui/material';
import { UpsertGameRecapSchema, UpsertGameRecapType } from '@draco/shared-schemas';
import { useGameRecap } from '../hooks/useGameRecap';
import RichTextEditor from './email/RichTextEditor';
import { sanitizeRichContent } from '../utils/sanitization';

interface EnterGameRecapDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  gameId: string;
  teamSeasonId: string;
  initialRecap?: string;
  teamName?: string;
  gameDate?: string;
  homeScore?: number;
  visitorScore?: number;
  homeTeamName?: string;
  visitorTeamName?: string;
  readOnly?: boolean;
  onSuccess?: (recap: UpsertGameRecapType) => void;
  onError?: (message: string) => void;
}

const extractPlainText = (html: string): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return html;
  }
  const container = document.createElement('div');
  container.innerHTML = html || '';
  return container.textContent?.replace(/\u00A0/g, ' ').trim() ?? '';
};

const EnterGameRecapDialog: React.FC<EnterGameRecapDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  gameId,
  teamSeasonId,
  initialRecap = '',
  teamName,
  gameDate,
  homeScore,
  visitorScore,
  homeTeamName,
  visitorTeamName,
  readOnly = false,
  onSuccess,
  onError,
}) => {
  const { saveRecap, loading } = useGameRecap({
    accountId,
    seasonId,
    gameId,
    teamSeasonId,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const editorResetKeyRef = useRef(0);
  const [editorContent, setEditorContent] = useState<string>(initialRecap ?? '');
  const [plainTextContent, setPlainTextContent] = useState<string>(
    extractPlainText(initialRecap ?? ''),
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      editorResetKeyRef.current += 1;
      setEditorContent(initialRecap ?? '');
      setPlainTextContent(extractPlainText(initialRecap ?? ''));
      setIsDirty(false);
      setSubmitError(null);
    }
  }, [initialRecap, open]);

  const formattedGameDate = useMemo(() => {
    if (!gameDate) {
      return null;
    }

    const date = new Date(gameDate);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    return gameDate;
  }, [gameDate]);

  const scoreboardLine = useMemo(() => {
    if (
      homeScore === undefined ||
      visitorScore === undefined ||
      !homeTeamName ||
      !visitorTeamName
    ) {
      return null;
    }

    return `${visitorTeamName} ${visitorScore} at ${homeTeamName} ${homeScore}`;
  }, [homeScore, homeTeamName, visitorScore, visitorTeamName]);

  const handleEditorChange = useCallback((html: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[RecapEditor] onChange raw HTML:', html);
    }
    setEditorContent(html);
    setPlainTextContent(extractPlainText(html));
    setIsDirty(true);
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting || loading) {
      return;
    }

    setSubmitError(null);
    onClose();
  }, [isSubmitting, loading, onClose]);

  const onSubmit = useCallback(async () => {
    if (readOnly) {
      return;
    }

    setSubmitError(null);

    const sanitizedContent = sanitizeRichContent(editorContent ?? '');
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[RecapEditor] sanitized HTML:', sanitizedContent);
    }
    const plainText = extractPlainText(sanitizedContent);

    if (!plainText.length) {
      setSubmitError('Game recap cannot be empty.');
      return;
    }

    // Validate against schema to ensure parity with backend expectations
    try {
      UpsertGameRecapSchema.parse({ recap: sanitizedContent });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Invalid recap content.');
      return;
    }

    setIsSubmitting(true);
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[RecapEditor] payload sent to upsertGameRecap:', {
        recap: sanitizedContent,
      });
    }
    const result = await saveRecap({ recap: sanitizedContent });
    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.(result.data);
      onClose();
    } else {
      setSubmitError(result.error);
      onError?.(result.error);
    }
  }, [editorContent, onClose, onError, onSuccess, readOnly, saveRecap]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {readOnly ? 'Game Recap for' : 'Enter Game Recap for'} {teamName}
      </DialogTitle>
      <DialogContent>
        {formattedGameDate && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {formattedGameDate}
          </Typography>
        )}
        {scoreboardLine && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {scoreboardLine}
          </Typography>
        )}

        {readOnly ? (
          (() => {
            const sanitizedContent = sanitizeRichContent(editorContent ?? '');
            const hasContent = extractPlainText(sanitizedContent).length > 0;
            const displayContent = hasContent
              ? sanitizedContent
              : '<span style="color:#888;">(No recap provided)</span>';
            return (
              <Box
                sx={{
                  color: 'inherit',
                  fontSize: '1rem',
                  padding: '12px 0',
                  minHeight: 200,
                  '& p': { margin: '0 0 8px' },
                  '& ul, & ol': { margin: '0 0 8px 20px' },
                  '& li': { marginBottom: '4px' },
                  '& .editor-text-bold, & strong, & b': { fontWeight: 700 },
                  '& .editor-text-italic, & em, & i': { fontStyle: 'italic' },
                  '& .editor-text-underline, & u': { textDecoration: 'underline' },
                  '& .editor-heading-h1, & h1': {
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    margin: '16px 0 8px',
                  },
                  '& .editor-heading-h2, & h2': {
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    margin: '14px 0 6px',
                  },
                  '& .editor-heading-h3, & h3': {
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    margin: '12px 0 6px',
                  },
                }}
                data-testid="game-summary-readonly"
                dangerouslySetInnerHTML={{ __html: displayContent }}
              />
            );
          })()
        ) : (
          <RichTextEditor
            key={`game-recap-editor-${editorResetKeyRef.current}`}
            initialValue={initialRecap ?? ''}
            onChange={handleEditorChange}
            placeholder="Enter the game recap..."
            disabled={loading || isSubmitting}
            minHeight={260}
          />
        )}

        {submitError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" disabled={isSubmitting || loading}>
          Close
        </Button>
        {!readOnly && (
          <Button
            onClick={onSubmit}
            color="primary"
            variant="contained"
            disabled={isSubmitting || loading || plainTextContent.length === 0 || !isDirty}
          >
            {isSubmitting || loading ? 'Saving…' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EnterGameRecapDialog;
