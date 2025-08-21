'use client';

import React, { useCallback, useEffect, useRef } from 'react';
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
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  LexicalEditor,
  $getRoot,
  $insertNodes,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createTextNode,
  $createParagraphNode,
} from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { HeadingNode, $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode, $insertList } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';

interface RichTextEditorProps {
  initialValue?: string;
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
  const [headingLevel, setHeadingLevel] = React.useState<string>('');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      // Check for heading level
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();

      if ($isHeadingNode(element)) {
        // Use proper type guard to check HeadingNode
        setHeadingLevel(element.getTag());
      } else {
        setHeadingLevel('');
      }
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
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $insertList('bullet');
        }
      });
    }
  };

  const insertNumberedList = () => {
    if (!disabled) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $insertList('number');
        }
      });
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

  const formatHeading = (headingTag: 'h1' | 'h2' | 'h3') => {
    if (!disabled) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingTag));
        }
      });
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

      <IconButton
        size="small"
        onClick={() => formatHeading('h1')}
        disabled={disabled}
        color={headingLevel === 'h1' ? 'primary' : 'default'}
        title="Heading 1"
        sx={{ minWidth: 32 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '10px', lineHeight: 1 }}>
          H1
        </Typography>
      </IconButton>

      <IconButton
        size="small"
        onClick={() => formatHeading('h2')}
        disabled={disabled}
        color={headingLevel === 'h2' ? 'primary' : 'default'}
        title="Heading 2"
        sx={{ minWidth: 32 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '10px', lineHeight: 1 }}>
          H2
        </Typography>
      </IconButton>

      <IconButton
        size="small"
        onClick={() => formatHeading('h3')}
        disabled={disabled}
        color={headingLevel === 'h3' ? 'primary' : 'default'}
        title="Heading 3"
        sx={{ minWidth: 32 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '10px', lineHeight: 1 }}>
          H3
        </Typography>
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

// Plugin to handle content changes using registerTextContentListener
// This avoids cursor jumping issues that occur with registerUpdateListener
function ContentChangePlugin({ onChange }: { onChange?: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onChange) return;

    // Use registerUpdateListener to capture HTML content changes
    // This listener fires when editor state changes and preserves formatting
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      // Get actual HTML content when editor state changes
      const htmlContent = editorState.read(() => {
        return $generateHtmlFromNodes(editor);
      });

      onChange(htmlContent);
    });

    return unregister;
  }, [editor, onChange]);

  return null;
}

const theme = {
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    listitem: 'editor-list-item',
  },
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
};

// Function to create initial editor state from HTML
function createInitialEditorState(html?: string): (() => void) | null {
  if (!html || html.trim() === '') {
    return null; // Use default empty state
  }

  // Return a function that creates the editor state using Lexical's HTML parsing
  return () => {
    const root = $getRoot();
    root.clear();

    try {
      // Use Lexical's official HTML parsing to preserve formatting
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, 'text/html');

      // For the initialization function, we need to create nodes manually
      // since we don't have editor context yet

      // Parse the HTML manually for basic elements
      const bodyElement = dom.body;

      if (bodyElement && bodyElement.children.length > 0) {
        // Process each child element
        for (const element of Array.from(bodyElement.children)) {
          if (element.tagName === 'H1') {
            const heading = $createHeadingNode('h1');
            heading.append($createTextNode(element.textContent || ''));
            root.append(heading);
          } else if (element.tagName === 'H2') {
            const heading = $createHeadingNode('h2');
            heading.append($createTextNode(element.textContent || ''));
            root.append(heading);
          } else if (element.tagName === 'H3') {
            const heading = $createHeadingNode('h3');
            heading.append($createTextNode(element.textContent || ''));
            root.append(heading);
          } else if (element.tagName === 'UL') {
            // Create bullet list
            const listItems = Array.from(element.children);
            if (listItems.length > 0) {
              const paragraph = $createParagraphNode();
              root.append(paragraph);
              // Note: For now, we'll convert list items to simple text
              // Full list support would need more complex node creation
              for (const item of listItems) {
                const listPara = $createParagraphNode();
                listPara.append($createTextNode('• ' + (item.textContent || '')));
                root.append(listPara);
              }
            }
          } else {
            // Default to paragraph for other elements
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(element.textContent || ''));
            root.append(paragraph);
          }
        }
      } else {
        // Fallback for simple text content
        const textContent = bodyElement?.textContent || html;
        if (textContent.trim()) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(textContent));
          root.append(paragraph);
        } else {
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        }
      }
    } catch (error) {
      console.error('Error parsing HTML for initial editor state:', error);
      // Fallback to empty paragraph if parsing fails
      const paragraph = $createParagraphNode();
      root.append(paragraph);
    }
  };
}

const nodes = [HeadingNode, ListNode, ListItemNode, LinkNode, AutoLinkNode];

const editorConfig = {
  namespace: 'EmailEditor',
  theme,
  nodes,
  onError: (error: Error) => {
    console.error('Lexical error:', error);
  },
};

const RichTextEditor = React.forwardRef<
  { getCurrentContent: () => string; insertText: (text: string) => void },
  RichTextEditorProps
>(
  (
    {
      initialValue,
      onChange: _onChange,
      placeholder = 'Write your email...',
      disabled = false,
      error = false,
      minHeight = 200,
    },
    ref,
  ) => {
    // Ref to access the editor instance
    const editorRef = useRef<LexicalEditor | null>(null);

    // Function to get current content (called only when needed)
    const getCurrentContent = useCallback(() => {
      if (editorRef.current) {
        return editorRef.current.getEditorState().read(() => {
          return $generateHtmlFromNodes(editorRef.current!);
        });
      }
      return '';
    }, []);

    // Function to insert text at current cursor position
    const insertText = useCallback(
      (text: string) => {
        if (editorRef.current && !disabled) {
          editorRef.current.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const textNode = $createTextNode(text);
              selection.insertNodes([textNode]);
            } else {
              // If no selection, insert at the end
              const root = $getRoot();
              const lastChild = root.getLastChild();
              if (lastChild) {
                lastChild.selectEnd();
                const textNode = $createTextNode(text);
                $insertNodes([textNode]);
              }
            }
          });
        }
      },
      [disabled],
    );

    // Expose getCurrentContent and insertText methods to parent via ref
    React.useImperativeHandle(
      ref,
      () => ({
        getCurrentContent,
        insertText,
      }),
      [getCurrentContent, insertText],
    );

    // Content changes are now handled by ContentChangePlugin using registerTextContentListener
    // This avoids cursor jumping while providing real-time content updates

    return (
      <Paper
        variant="outlined"
        sx={{
          borderColor: error ? 'error.main' : 'divider',
          borderWidth: error ? 2 : 1,
          borderRadius: 1,
          overflow: 'hidden',
          opacity: 1,
        }}
      >
        <LexicalComposer
          initialConfig={{
            ...editorConfig,
            editorState: createInitialEditorState(initialValue),
            onError: (error: Error) => {
              console.error('Lexical error:', error);
            },
          }}
        >
          {!disabled && <ToolbarPlugin disabled={disabled} />}

          <Box
            sx={{
              position: 'relative',
              '& .editor-text-bold': { fontWeight: 'bold' },
              '& .editor-text-italic': { fontStyle: 'italic' },
              '& .editor-text-underline': { textDecoration: 'underline' },
              '& .editor-list-ul': { listStyleType: 'disc', margin: 0, paddingLeft: '20px' },
              '& .editor-list-ol': { listStyleType: 'decimal', margin: 0, paddingLeft: '20px' },
              '& .editor-list-item': { margin: '4px 0' },
              '& .editor-heading-h1': {
                fontSize: '2em',
                fontWeight: 'bold',
                margin: '16px 0 8px 0',
              },
              '& .editor-heading-h2': {
                fontSize: '1.5em',
                fontWeight: 'bold',
                margin: '14px 0 6px 0',
              },
              '& .editor-heading-h3': {
                fontSize: '1.2em',
                fontWeight: 'bold',
                margin: '12px 0 4px 0',
              },
              '& .editor-heading-h4': {
                fontSize: '1.1em',
                fontWeight: 'bold',
                margin: '10px 0 4px 0',
              },
              '& .editor-heading-h5': {
                fontSize: '1em',
                fontWeight: 'bold',
                margin: '8px 0 4px 0',
              },
              '& .editor-heading-h6': {
                fontSize: '0.9em',
                fontWeight: 'bold',
                margin: '8px 0 4px 0',
              },
            }}
          >
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

            {/* Store editor reference for external access */}
            <EditorRefPlugin editorRef={editorRef} />
            {/* Handle content changes without cursor jumping */}
            <ContentChangePlugin onChange={_onChange} />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
          </Box>
        </LexicalComposer>
      </Paper>
    );
  },
);

// Add display name for React DevTools
RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
