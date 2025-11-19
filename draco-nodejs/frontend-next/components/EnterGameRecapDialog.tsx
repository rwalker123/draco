'use client';

// TODO: Replace the plain text/textarea input with a WYSIWYG editor (e.g., react-quill, TinyMCE, Slate) for game recaps once React 19 support is available.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { UpsertGameRecapSchema, UpsertGameRecapType } from '@draco/shared-schemas';
import { useGameRecap } from '../hooks/useGameRecap';
import RichTextEditor from './email/RichTextEditor';
import { sanitizeRichContent } from '../utils/sanitization';
import RichTextContent from './common/RichTextContent';

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
  loading?: boolean;
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
  loading = false,
}) => {
  const theme = useTheme();
  const { saveRecap, loading: isSaving } = useGameRecap({
    accountId,
    seasonId,
    gameId,
    teamSeasonId,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const editorResetKeyRef = useRef(0);
  const [editorInstanceKey, setEditorInstanceKey] = useState('game-recap-editor-0');
  const [editorContent, setEditorContent] = useState<string>(initialRecap ?? '');
  const [plainTextContent, setPlainTextContent] = useState<string>(
    extractPlainText(initialRecap ?? ''),
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      editorResetKeyRef.current += 1;
      setEditorInstanceKey(`game-recap-editor-${editorResetKeyRef.current}`);
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
    if (isSubmitting || isSaving) {
      return;
    }

    setSubmitError(null);
    onClose();
  }, [isSubmitting, isSaving, onClose]);

  const onSubmit = useCallback(async () => {
    if (readOnly) {
      return;
    }

    if (loading) {
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
  }, [editorContent, loading, onClose, onError, onSuccess, readOnly, saveRecap]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.palette.widget.surface,
          color: theme.palette.text.primary,
          borderRadius: 2,
          boxShadow: theme.shadows[theme.palette.mode === 'dark' ? 12 : 4],
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: theme.palette.widget.headerText,
        }}
      >
        {readOnly ? 'Game Recap for' : 'Enter Game Recap for'} {teamName}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {formattedGameDate && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formattedGameDate}
          </Typography>
        )}
        {scoreboardLine && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {scoreboardLine}
          </Typography>
        )}

        {loading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : readOnly ? (
          (() => {
            const sanitizedContent = sanitizeRichContent(editorContent ?? '');
            const hasContent = extractPlainText(sanitizedContent).length > 0;
            const displayContent = hasContent
              ? sanitizedContent
              : '<span style="color:#888;">(No recap provided)</span>';
            return (
              <RichTextContent
                html={displayContent}
                sanitize={false}
                data-testid="game-summary-readonly"
                sx={{
                  padding: '12px 16px',
                  minHeight: 200,
                  borderRadius: 1,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.default, 0.4)
                      : alpha(theme.palette.background.default, 0.35),
                }}
              />
            );
          })()
        ) : (
          <RichTextEditor
            key={editorInstanceKey}
            initialValue={initialRecap ?? ''}
            onChange={handleEditorChange}
            placeholder="Enter the game recap..."
            disabled={isSaving || isSubmitting}
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
        <Button onClick={handleClose} color="secondary" disabled={isSubmitting || isSaving}>
          Close
        </Button>
        {!readOnly && (
          <Button
            onClick={onSubmit}
            color="primary"
            variant="contained"
            disabled={
              isSubmitting || isSaving || loading || plainTextContent.length === 0 || !isDirty
            }
          >
            {isSubmitting || isSaving ? 'Saving…' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EnterGameRecapDialog;
