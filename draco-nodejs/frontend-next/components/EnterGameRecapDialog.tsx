'use client';

// TODO: Replace the plain text/textarea input with a WYSIWYG editor (e.g., react-quill, TinyMCE, Slate) for game recaps once React 19 support is available.
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  UpsertGameRecapSchema,
  UpsertGameRecapType,
  type LineScoreType,
} from '@draco/shared-schemas';
import { getGameLineScore } from '@draco/shared-api-client';
import { useGameRecap } from '../hooks/useGameRecap';
import { useApiClient } from '../hooks/useApiClient';
import RichTextEditor from './email/RichTextEditor';
import { sanitizeRichContent } from '../utils/sanitization';
import RichTextContent from './common/RichTextContent';
import LineScoreTable from './team-stats-entry/LineScoreTable';

export interface RecapTab {
  teamSeasonId: string;
  teamName: string;
  recap: string;
}

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
  recapTabs?: RecapTab[];
  initialTeamSeasonId?: string;
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
  recapTabs,
  initialTeamSeasonId,
  onSuccess,
  onError,
  loading = false,
}) => {
  const theme = useTheme();
  const apiClient = useApiClient();
  const { saveRecap, loading: isSaving } = useGameRecap({
    accountId,
    seasonId,
    gameId,
    teamSeasonId,
  });

  const [lineScore, setLineScore] = useState<LineScoreType | null>(null);
  const [selectedTeamSeasonId, setSelectedTeamSeasonId] = useState<string>(
    initialTeamSeasonId ?? recapTabs?.[0]?.teamSeasonId ?? teamSeasonId,
  );

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
      setSelectedTeamSeasonId(initialTeamSeasonId ?? recapTabs?.[0]?.teamSeasonId ?? teamSeasonId);
    }
  }, [initialRecap, open, initialTeamSeasonId, recapTabs, teamSeasonId]);

  useEffect(() => {
    if (!open || !accountId || !seasonId || !gameId) {
      return;
    }

    const controller = new AbortController();

    const loadLineScore = async () => {
      try {
        const result = await getGameLineScore({
          client: apiClient,
          path: { accountId, seasonId, gameId },
          signal: controller.signal,
          throwOnError: false,
        });
        if (controller.signal.aborted) {
          return;
        }
        setLineScore(result.data ?? null);
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setLineScore(null);
      }
    };

    void loadLineScore();

    return () => {
      controller.abort();
    };
  }, [open, accountId, seasonId, gameId, apiClient]);

  const formattedGameDate = gameDate
    ? Number.isNaN(new Date(gameDate).getTime())
      ? gameDate
      : new Date(gameDate).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
    : null;

  const scoreboardLine =
    homeScore !== undefined && visitorScore !== undefined && homeTeamName && visitorTeamName
      ? `${visitorTeamName} ${visitorScore} at ${homeTeamName} ${homeScore}`
      : null;

  const handleEditorChange = (html: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[RecapEditor] onChange raw HTML:', html);
    }
    setEditorContent(html);
    setPlainTextContent(extractPlainText(html));
    setIsDirty(true);
  };

  const handleClose = () => {
    if (isSubmitting || isSaving) {
      return;
    }

    setSubmitError(null);
    onClose();
  };

  const onSubmit = async () => {
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
  };

  const hasTabs = Boolean(recapTabs && recapTabs.length > 1);
  const singleRecapTeamName =
    recapTabs && recapTabs.length === 1 ? recapTabs[0].teamName : undefined;
  const activeRecapHtml =
    recapTabs && recapTabs.length > 0
      ? (recapTabs.find((tab) => tab.teamSeasonId === selectedTeamSeasonId)?.recap ??
        recapTabs[0].recap)
      : editorContent;
  const sanitizedReadOnlyContent = sanitizeRichContent(activeRecapHtml ?? '');
  const readOnlyDisplayContent =
    extractPlainText(sanitizedReadOnlyContent).length > 0
      ? sanitizedReadOnlyContent
      : '<span style="color:#888;">(No recap provided)</span>';

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
        {readOnly ? 'Game Recap' : `Enter Game Recap for ${teamName}`}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {formattedGameDate && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formattedGameDate}
          </Typography>
        )}
        {lineScore ? (
          <Box sx={{ mb: 2 }}>
            <LineScoreTable lineScore={lineScore} />
          </Box>
        ) : (
          scoreboardLine && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {scoreboardLine}
            </Typography>
          )
        )}

        {loading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : readOnly ? (
          <>
            {hasTabs ? (
              <Tabs
                value={selectedTeamSeasonId}
                onChange={(_event, value: string) => setSelectedTeamSeasonId(value)}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                {recapTabs?.map((tab) => (
                  <Tab key={tab.teamSeasonId} value={tab.teamSeasonId} label={tab.teamName} />
                ))}
              </Tabs>
            ) : (
              singleRecapTeamName && (
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {singleRecapTeamName}
                </Typography>
              )
            )}
            <RichTextContent
              html={readOnlyDisplayContent}
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
          </>
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
