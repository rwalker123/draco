'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { UpsertGameRecapSchema } from '@draco/shared-schemas';

import RichTextEditor, { type RichTextEditorHandle } from '../email/RichTextEditor';
import RichTextContent from '../common/RichTextContent';
import { sanitizeRichContent } from '../../utils/sanitization';

interface GameRecapSectionProps {
  gameId: string;
  initialContent: string | null;
  loading: boolean;
  error: string | null;
  editMode: boolean;
  canEdit: boolean;
  onSave: (content: string) => Promise<void>;
}

export interface GameRecapSectionHandle {
  hasDirtyContent: () => boolean;
  saveContent: () => Promise<boolean>;
  discardContent: () => void;
}

const extractPlainText = (html: string): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return html;
  }
  const container = document.createElement('div');
  container.innerHTML = html || '';
  const text = container.textContent?.replace(/\u00A0/g, ' ').trim() ?? '';
  container.remove();
  return text;
};

const GameRecapSection = forwardRef<GameRecapSectionHandle, GameRecapSectionProps>(
  ({ gameId, initialContent, loading, error, editMode, canEdit, onSave }, ref) => {
    const theme = useTheme();
    const editorRef = useRef<RichTextEditorHandle | null>(null);
    const [editorKey, setEditorKey] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const initialPlainTextRef = useRef<string>('');

    useEffect(() => {
      setEditorKey((k) => k + 1);
      setSaveError(null);
    }, [gameId]);

    useEffect(() => {
      initialPlainTextRef.current = extractPlainText(sanitizeRichContent(initialContent ?? ''));
    }, [initialContent]);

    const hasRealChanges = useCallback(() => {
      if (!editorRef.current) {
        return false;
      }
      const currentContent = editorRef.current.getSanitizedContent();
      const currentPlainText = extractPlainText(currentContent);
      return currentPlainText !== initialPlainTextRef.current;
    }, []);

    const handleSave = useCallback(async (): Promise<boolean> => {
      setSaveError(null);

      const content = editorRef.current?.getSanitizedContent() ?? '';
      const plainText = extractPlainText(content);

      if (!plainText.length) {
        setSaveError('Game recap cannot be empty.');
        return false;
      }

      try {
        UpsertGameRecapSchema.parse({ recap: content });
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Invalid recap content.');
        return false;
      }

      setIsSaving(true);
      try {
        await onSave(content);
        initialPlainTextRef.current = plainText;
        return true;
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save recap.');
        return false;
      } finally {
        setIsSaving(false);
      }
    }, [onSave]);

    const handleDiscard = useCallback(() => {
      setEditorKey((k) => k + 1);
      setSaveError(null);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        hasDirtyContent: hasRealChanges,
        saveContent: handleSave,
        discardContent: handleDiscard,
      }),
      [hasRealChanges, handleSave, handleDiscard],
    );

    if (loading) {
      return (
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
        >
          <CircularProgress size={32} />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    return (
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Game Recap</Typography>
          <Typography variant="body2" color="text.secondary">
            {editMode
              ? 'Write a summary of the game.'
              : canEdit
                ? 'Enable edit mode to modify the recap.'
                : 'Game recap for this matchup.'}
          </Typography>
        </Stack>

        {editMode ? (
          <>
            <RichTextEditor
              key={`recap-editor-${gameId}-${editorKey}`}
              ref={editorRef}
              initialValue={initialContent ?? ''}
              placeholder="Enter the game recap..."
              disabled={isSaving}
              minHeight={260}
            />

            {saveError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {saveError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small" onClick={handleDiscard} disabled={isSaving}>
                Discard
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Recap'}
              </Button>
            </Box>
          </>
        ) : (
          <RichTextContent
            html={initialContent}
            emptyFallback={
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No recap has been entered for this game.
              </Typography>
            }
            sx={{
              padding: '12px 16px',
              minHeight: 100,
              borderRadius: 1,
              bgcolor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.default, 0.4)
                  : alpha(theme.palette.background.default, 0.35),
            }}
          />
        )}
      </Stack>
    );
  },
);

GameRecapSection.displayName = 'GameRecapSection';

export default GameRecapSection;
