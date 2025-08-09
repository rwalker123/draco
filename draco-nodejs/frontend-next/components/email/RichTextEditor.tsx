'use client';

import React, { useCallback, useEffect } from 'react';
import { Box, Paper, Toolbar, IconButton, Divider, Typography } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  Undo,
  Redo,
} from '@mui/icons-material';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  EditorState,
  LexicalEditor,
} from 'lexical';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';
import { UNDO_COMMAND, REDO_COMMAND } from 'lexical';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  minHeight?: number;
}

// Toolbar component for format controls
function ToolbarPlugin({ disabled = false }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1,
    );
  }, [editor, updateToolbar]);

  const formatBold = () => {
    if (!disabled) {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
    }
  };

  const formatItalic = () => {
    if (!disabled) {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
    }
  };

  const formatUnderline = () => {
    if (!disabled) {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
    }
  };

  const insertBulletList = () => {
    if (!disabled) {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  };

  const insertNumberedList = () => {
    if (!disabled) {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const insertLink = () => {
    if (!disabled) {
      const url = prompt('Enter URL:');
      if (url) {
        // Simple link insertion - would be enhanced with proper link dialog
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const linkText = selection.getTextContent() || url;
            selection.insertText(`[${linkText}](${url})`);
          }
        });
      }
    }
  };

  const undo = () => {
    if (!disabled) {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    }
  };

  const redo = () => {
    if (!disabled) {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    }
  };

  return (
    <Toolbar
      variant="dense"
      sx={{
        minHeight: 48,
        bgcolor: 'grey.50',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <IconButton
        size="small"
        onClick={formatBold}
        disabled={disabled}
        color={isBold ? 'primary' : 'default'}
        title="Bold (Ctrl+B)"
      >
        <FormatBold />
      </IconButton>

      <IconButton
        size="small"
        onClick={formatItalic}
        disabled={disabled}
        color={isItalic ? 'primary' : 'default'}
        title="Italic (Ctrl+I)"
      >
        <FormatItalic />
      </IconButton>

      <IconButton
        size="small"
        onClick={formatUnderline}
        disabled={disabled}
        color={isUnderline ? 'primary' : 'default'}
        title="Underline (Ctrl+U)"
      >
        <FormatUnderlined />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <IconButton size="small" onClick={insertBulletList} disabled={disabled} title="Bullet List">
        <FormatListBulleted />
      </IconButton>

      <IconButton
        size="small"
        onClick={insertNumberedList}
        disabled={disabled}
        title="Numbered List"
      >
        <FormatListNumbered />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <IconButton size="small" onClick={insertLink} disabled={disabled} title="Insert Link">
        <LinkIcon />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <IconButton size="small" onClick={undo} disabled={disabled} title="Undo (Ctrl+Z)">
        <Undo />
      </IconButton>

      <IconButton size="small" onClick={redo} disabled={disabled} title="Redo (Ctrl+Y)">
        <Redo />
      </IconButton>
    </Toolbar>
  );
}

// Plugin to handle HTML content initialization
function InitialContentPlugin({ initialHtml }: { initialHtml?: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialHtml) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        $insertNodes(nodes);
      });
    }
  }, [editor, initialHtml]);

  return null;
}

const theme = {
  text: {
    bold: 'font-weight: bold;',
    italic: 'font-style: italic;',
    underline: 'text-decoration: underline;',
  },
  list: {
    ul: 'list-style-type: disc; margin: 0; padding-left: 20px;',
    ol: 'list-style-type: decimal; margin: 0; padding-left: 20px;',
  },
};

const nodes = [HeadingNode, ListNode, ListItemNode, LinkNode, AutoLinkNode];

const editorConfig = {
  namespace: 'EmailEditor',
  theme,
  nodes,
  onError: (error: Error) => {
    console.error('Lexical error:', error);
  },
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your email...',
  disabled = false,
  error = false,
  minHeight = 200,
}: RichTextEditorProps) {
  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      if (onChange && !disabled) {
        editorState.read(() => {
          const htmlString = $generateHtmlFromNodes(editor);
          onChange(htmlString);
        });
      }
    },
    [onChange, disabled],
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: error ? 'error.main' : 'divider',
        borderWidth: error ? 2 : 1,
        borderRadius: 1,
        overflow: 'hidden',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <LexicalComposer initialConfig={editorConfig}>
        <ToolbarPlugin disabled={disabled} />

        <Box sx={{ position: 'relative' }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{
                  minHeight: `${minHeight}px`,
                  padding: '16px',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                }}
                readOnly={disabled}
              />
            }
            placeholder={
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  color: 'text.secondary',
                  fontSize: '14px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {placeholder}
                </Typography>
              </Box>
            }
            ErrorBoundary={({ children }: { children: React.ReactNode }) => <div>{children}</div>}
          />

          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <InitialContentPlugin initialHtml={value} />
        </Box>
      </LexicalComposer>
    </Paper>
  );
}
