'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  IconButton,
  Divider,
  Typography,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Link as LinkIcon,
  ArrowDropDown,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  FormatIndentIncrease,
  FormatIndentDecrease,
  Code,
  FormatQuote,
  FormatColorText,
  FormatColorFill,
  MoreHoriz,
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
  $isElementNode,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  LexicalEditor,
  RangeSelection,
  $isTextNode,
  $setSelection,
  $getRoot,
  $insertNodes,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createTextNode,
  $createParagraphNode,
} from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  HeadingNode,
  $createHeadingNode,
  $isHeadingNode,
  QuoteNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import { ListNode, ListItemNode, $insertList } from '@lexical/list';
import { LinkNode, AutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { CodeNode, $createCodeNode } from '@lexical/code';
import { sanitizeRichContent, filterAllowedInlineStyles } from '../../utils/sanitization';
import { $patchStyleText, $setBlocksType } from '@lexical/selection';

interface RichTextEditorProps {
  initialValue?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  minHeight?: number;
}

// Toolbar component for format controls
function ToolbarPlugin({
  disabled = false,
  spellCheckEnabled,
  onToggleSpellCheck,
}: {
  disabled?: boolean;
  spellCheckEnabled: boolean;
  onToggleSpellCheck: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const toolbarBackground = isDark
    ? alpha(theme.palette.background.default, 0.92)
    : theme.palette.grey[50];
  const iconColor = isDark ? theme.palette.grey[300] : theme.palette.text.secondary;

  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [blockType, setBlockType] = React.useState<
    'paragraph' | 'h1' | 'h2' | 'h3' | 'quote' | 'code'
  >('paragraph');
  const [elementFormat, setElementFormat] = React.useState<'left' | 'center' | 'right' | 'justify'>(
    'left',
  );
  const [linkDialogOpen, setLinkDialogOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('https://');
  const [linkText, setLinkText] = React.useState('');
  const lastSelectionRef = React.useRef<RangeSelection | null>(null);
  const [formatMenuAnchor, setFormatMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [alignmentMenuAnchor, setAlignmentMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [fontMenuAnchor, setFontMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [fontSizeMenuAnchor, setFontSizeMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [fontColorMenuAnchor, setFontColorMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [bgColorMenuAnchor, setBgColorMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [overflowMenuAnchor, setOverflowMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [fontFamily, setFontFamily] = React.useState('default');
  const [fontSize, setFontSize] = React.useState('default');
  const [fontColor, setFontColor] = React.useState('default');
  const [bgColor, setBgColor] = React.useState('default');
  const [isCompactToolbar, setIsCompactToolbar] = React.useState<boolean>(false);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const normalizeColor = useCallback((value: string | undefined): string => {
    if (!value) return '';
    const trimmed = value.trim();
    const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      return trimmed.toLowerCase();
    }
    const rgbMatch = trimmed.match(
      /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*[\d.]+)?\)$/i,
    );
    if (rgbMatch) {
      const [r, g, b] = rgbMatch
        .slice(1, 4)
        .map((n) => Math.max(0, Math.min(255, Number.parseInt(n, 10))));
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    return trimmed.toLowerCase();
  }, []);
  const fontColors = React.useMemo(
    () => [
      { label: 'Black', value: '#000000' },
      { label: 'Blue', value: '#1a73e8' },
      { label: 'Red', value: '#d93025' },
      { label: 'Green', value: '#188038' },
      { label: 'Orange', value: '#f9ab00' },
      { label: 'Gray', value: '#5f6368' },
    ],
    [],
  );
  const bgColors = React.useMemo(
    () => [
      { label: 'Light Yellow', value: '#fff3cd' },
      { label: 'Light Blue', value: '#e8f0fe' },
      { label: 'Light Red', value: '#fce8e6' },
      { label: 'Light Green', value: '#e6f4ea' },
      { label: 'Light Gray', value: '#f6f6f6' },
    ],
    [],
  );

  const normalizeFontValue = React.useCallback((value: string): string => {
    if (!value) return '';
    const trimmed = value.trim();
    // Strip matching leading/trailing quotes
    return trimmed.replace(/^['"]+|['"]+$/g, '');
  }, []);

  const parseStyleMap = useCallback((styleString: string) => {
    const entries = styleString
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split(':');
        if (!key || rest.length === 0) return null;
        return [key.trim().toLowerCase(), rest.join(':').trim()] as const;
      })
      .filter(Boolean) as [string, string][];
    return Object.fromEntries(entries);
  }, []);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();

      if ($isHeadingNode(element)) {
        const tag = element.getTag();
        if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
          setBlockType(tag);
        } else {
          setBlockType('paragraph');
        }
      } else {
        const type = element.getType();
        if (type === 'quote') {
          setBlockType('quote');
        } else if (type === 'code') {
          setBlockType('code');
        } else {
          setBlockType('paragraph');
        }
      }

      const format =
        $isElementNode(element) && typeof element.getFormatType === 'function'
          ? element.getFormatType()
          : null;
      if (format === 'left' || format === 'center' || format === 'right' || format === 'justify') {
        setElementFormat(format);
      } else if (format === 'start') {
        setElementFormat('left');
      } else if (format === 'end') {
        setElementFormat('right');
      } else {
        setElementFormat('left');
      }

      let styleString = '';
      const nodes = selection.getNodes();
      const textNode = nodes.find((node) => $isTextNode(node));
      if (textNode && $isTextNode(textNode)) {
        styleString = textNode.getStyle();
      }
      const styleMap = parseStyleMap(styleString);
      setFontFamily(normalizeFontValue(styleMap['font-family']) || 'default');
      setFontSize(styleMap['font-size'] || 'default');
      setFontColor(normalizeColor(styleMap.color) || 'default');
      setBgColor(normalizeColor(styleMap['background-color']) || 'default');
    }
  }, [normalizeColor, normalizeFontValue, parseStyleMap]);

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

  useEffect(() => {
    if (!toolbarRef.current) return;

    const updateCompact = (width: number) => {
      setIsCompactToolbar(width < 760);
    };

    const measureAndUpdate = () => {
      if (toolbarRef.current) {
        updateCompact(toolbarRef.current.getBoundingClientRect().width);
      }
    };

    measureAndUpdate();
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        updateCompact(entry.contentRect.width);
      }
    });
    observer.observe(toolbarRef.current);
    return () => observer.disconnect();
  }, []);

  const formatLabel = {
    paragraph: 'Paragraph',
    h1: 'H1',
    h2: 'H2',
    h3: 'H3',
    quote: 'Quote',
    code: 'Pre',
  }[blockType];

  const openFormatMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFormatMenuAnchor(event.currentTarget);
  };

  const closeFormatMenu = () => {
    setFormatMenuAnchor(null);
  };

  const openAlignmentMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAlignmentMenuAnchor(event.currentTarget);
  };

  const closeAlignmentMenu = () => {
    setAlignmentMenuAnchor(null);
  };

  const openFontMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFontMenuAnchor(event.currentTarget);
  };

  const closeFontMenu = () => {
    setFontMenuAnchor(null);
  };

  const openFontSizeMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFontSizeMenuAnchor(event.currentTarget);
  };

  const closeFontSizeMenu = () => {
    setFontSizeMenuAnchor(null);
  };

  const openFontColorMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFontColorMenuAnchor(event.currentTarget);
  };

  const closeFontColorMenu = () => {
    setFontColorMenuAnchor(null);
  };

  const openBgColorMenu = (event: React.MouseEvent<HTMLElement>) => {
    setBgColorMenuAnchor(event.currentTarget);
  };

  const closeBgColorMenu = () => {
    setBgColorMenuAnchor(null);
  };

  const openOverflowMenu = (event: React.MouseEvent<HTMLElement>) => {
    setOverflowMenuAnchor(event.currentTarget);
  };

  const closeOverflowMenu = () => {
    setOverflowMenuAnchor(null);
  };

  const applyBlockType = (type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'quote' | 'code') => {
    closeFormatMenu();
    if (disabled) {
      return;
    }
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      switch (type) {
        case 'paragraph':
          $setBlocksType(selection, () => $createParagraphNode());
          break;
        case 'h1':
        case 'h2':
        case 'h3':
          $setBlocksType(selection, () => $createHeadingNode(type));
          break;
        case 'quote':
          $setBlocksType(selection, () => $createQuoteNode());
          break;
        case 'code':
          $setBlocksType(selection, () => $createCodeNode());
          break;
        default:
          break;
      }
    });
  };

  const applyAlignment = (format: 'left' | 'center' | 'right' | 'justify') => {
    closeAlignmentMenu();
    if (!disabled) {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format);
    }
  };

  const indentContent = () => {
    if (!disabled) {
      editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
    }
  };

  const outdentContent = () => {
    if (!disabled) {
      editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
    }
  };

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

  const applyFontFamily = (family: string) => {
    const value = family === 'default' ? '' : family;
    setFontFamily(family);
    closeFontMenu();
    if (!disabled) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { 'font-family': value });
        }
      });
    }
  };

  const applyFontSize = (size: string) => {
    const value = size === 'default' ? '' : size;
    setFontSize(size);
    closeFontSizeMenu();
    if (!disabled) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { 'font-size': value });
        }
      });
    }
  };

  const applyFontColor = (colorValue: string) => {
    const value = colorValue === 'default' ? '' : colorValue;
    setFontColor(colorValue);
    closeFontColorMenu();
    if (!disabled) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { color: value });
        }
      });
    }
  };

  const applyBgColor = (colorValue: string) => {
    const value = colorValue === 'default' ? '' : colorValue;
    setBgColor(colorValue);
    closeBgColorMenu();
    if (!disabled) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { 'background-color': value });
        }
      });
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

  const getSelectedNode = (selection: RangeSelection) => {
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    if (anchorNode === focusNode) {
      return anchorNode;
    }
    return selection.isBackward() ? anchorNode : focusNode;
  };

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    const hasProtocol = /^(https?:)?\/\//i.test(trimmed) || /^mailto:/i.test(trimmed);
    return hasProtocol ? trimmed : `https://${trimmed}`;
  };

  const handleOpenLinkDialog = () => {
    if (disabled) {
      return;
    }
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        lastSelectionRef.current = selection.clone();
        const node = getSelectedNode(selection);
        const parent = node.getParent();
        const targetLinkNode = $isLinkNode(node) ? node : $isLinkNode(parent) ? parent : null;
        const existingUrl = targetLinkNode?.getURL() ?? '';
        setLinkUrl(existingUrl || 'https://');
        setLinkText(selection.getTextContent());
      } else {
        setLinkUrl('https://');
        setLinkText('');
      }
    });
    setLinkDialogOpen(true);
  };

  const handleCloseLinkDialog = () => {
    setLinkDialogOpen(false);
    setLinkText('');
    lastSelectionRef.current = null;
  };

  const handleConfirmLink = () => {
    if (disabled) {
      return;
    }
    const normalized = normalizeUrl(linkUrl);
    editor.update(() => {
      let selection = $getSelection();
      if (!$isRangeSelection(selection) && lastSelectionRef.current) {
        $setSelection(lastSelectionRef.current);
        selection = $getSelection();
      }
      if (!$isRangeSelection(selection)) {
        return;
      }
      if (!normalized) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        return;
      }
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalized);
      if (selection.isCollapsed()) {
        selection.insertText(linkText || normalized);
      }
    });
    handleCloseLinkDialog();
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

  const copySelection = async () => {
    if (disabled) {
      return;
    }
    const selection = window.getSelection();
    const text = selection?.toString() || '';
    try {
      if (text && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        console.warn('Copy unavailable: Clipboard API not supported in this context');
      }
    } catch (error) {
      console.warn('Copy failed', error);
    }
  };

  const cutSelection = async () => {
    if (disabled) {
      return;
    }
    const selection = window.getSelection();
    const text = selection?.toString() || '';
    try {
      if (text && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        console.warn('Cut unavailable: Clipboard API not supported in this context');
      }
    } catch (error) {
      console.warn('Cut failed', error);
    }

    editor.update(() => {
      const range = $getSelection();
      if ($isRangeSelection(range)) {
        range.removeText();
      }
    });
  };

  const pasteClipboard = async () => {
    if (disabled) {
      return;
    }
    try {
      const text = (await navigator.clipboard?.readText?.()) || '';
      if (!text) {
        document.execCommand('paste');
        return;
      }
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(text);
        }
      });
    } catch (error) {
      console.warn('Paste failed', error);
    }
  };

  return (
    <Toolbar
      ref={toolbarRef}
      variant="dense"
      sx={{
        minHeight: 'auto',
        flexWrap: 'wrap',
        columnGap: 0.5,
        rowGap: 0.5,
        bgcolor: toolbarBackground,
        borderBottom: 1,
        borderColor: theme.palette.divider,
        color: theme.palette.text.primary,
        '& .MuiIconButton-root': {
          color: iconColor,
          '&.Mui-disabled': {
            color: theme.palette.action.disabled,
          },
          '&.MuiIconButton-colorPrimary': {
            color: theme.palette.primary.main,
          },
        },
        '& .MuiDivider-root': {
          borderColor: theme.palette.divider,
          alignSelf: 'stretch',
        },
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

      <Button
        size="small"
        onClick={openFontMenu}
        endIcon={<ArrowDropDown />}
        disabled={disabled}
        sx={{ textTransform: 'none', minWidth: 100 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {fontFamily === 'default' ? 'Font' : fontFamily}
        </Typography>
      </Button>
      <Menu anchorEl={fontMenuAnchor} open={Boolean(fontMenuAnchor)} onClose={closeFontMenu}>
        <MenuItem selected={fontFamily === 'default'} onClick={() => applyFontFamily('default')}>
          Default
        </MenuItem>
        <MenuItem selected={fontFamily === 'Arial'} onClick={() => applyFontFamily('Arial')}>
          Arial
        </MenuItem>
        <MenuItem selected={fontFamily === 'Georgia'} onClick={() => applyFontFamily('Georgia')}>
          Georgia
        </MenuItem>
        <MenuItem
          selected={fontFamily === 'Times New Roman'}
          onClick={() => applyFontFamily('Times New Roman')}
        >
          Times New Roman
        </MenuItem>
        <MenuItem
          selected={fontFamily === 'Courier New'}
          onClick={() => applyFontFamily('Courier New')}
        >
          Courier New
        </MenuItem>
      </Menu>

      <Button
        size="small"
        onClick={openFontSizeMenu}
        endIcon={<ArrowDropDown />}
        disabled={disabled}
        sx={{ textTransform: 'none', minWidth: 80 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {fontSize === 'default' ? 'Size' : fontSize}
        </Typography>
      </Button>
      <Menu
        anchorEl={fontSizeMenuAnchor}
        open={Boolean(fontSizeMenuAnchor)}
        onClose={closeFontSizeMenu}
      >
        <MenuItem selected={fontSize === 'default'} onClick={() => applyFontSize('default')}>
          Default
        </MenuItem>
        <MenuItem selected={fontSize === '12px'} onClick={() => applyFontSize('12px')}>
          12 px
        </MenuItem>
        <MenuItem selected={fontSize === '14px'} onClick={() => applyFontSize('14px')}>
          14 px
        </MenuItem>
        <MenuItem selected={fontSize === '16px'} onClick={() => applyFontSize('16px')}>
          16 px
        </MenuItem>
        <MenuItem selected={fontSize === '18px'} onClick={() => applyFontSize('18px')}>
          18 px
        </MenuItem>
        <MenuItem selected={fontSize === '20px'} onClick={() => applyFontSize('20px')}>
          20 px
        </MenuItem>
      </Menu>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Button
        size="small"
        onClick={openFontColorMenu}
        endIcon={<ArrowDropDown />}
        disabled={disabled}
        sx={{ textTransform: 'none', minWidth: 100 }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.75 }}
        >
          <FormatColorText fontSize="small" />
          {fontColor === 'default'
            ? 'Text color'
            : fontColors.find((c) => c.value === fontColor)?.label || fontColor}
        </Typography>
      </Button>
      <Menu
        anchorEl={fontColorMenuAnchor}
        open={Boolean(fontColorMenuAnchor)}
        onClose={closeFontColorMenu}
      >
        <MenuItem selected={fontColor === 'default'} onClick={() => applyFontColor('default')}>
          Default
        </MenuItem>
        {fontColors.map((option) => (
          <MenuItem
            key={option.value}
            selected={fontColor === option.value}
            onClick={() => applyFontColor(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      <Button
        size="small"
        onClick={openBgColorMenu}
        endIcon={<ArrowDropDown />}
        disabled={disabled}
        sx={{ textTransform: 'none', minWidth: 110 }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.75 }}
        >
          <FormatColorFill fontSize="small" />
          {bgColor === 'default'
            ? 'Highlight'
            : bgColors.find((c) => c.value === bgColor)?.label || bgColor}
        </Typography>
      </Button>
      <Menu
        anchorEl={bgColorMenuAnchor}
        open={Boolean(bgColorMenuAnchor)}
        onClose={closeBgColorMenu}
      >
        <MenuItem selected={bgColor === 'default'} onClick={() => applyBgColor('default')}>
          Default
        </MenuItem>
        {bgColors.map((option) => (
          <MenuItem
            key={option.value}
            selected={bgColor === option.value}
            onClick={() => applyBgColor(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      <Button
        size="small"
        onClick={openFormatMenu}
        endIcon={<ArrowDropDown />}
        disabled={disabled}
        sx={{ textTransform: 'none', minWidth: 90 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {formatLabel}
        </Typography>
      </Button>
      <Menu anchorEl={formatMenuAnchor} open={Boolean(formatMenuAnchor)} onClose={closeFormatMenu}>
        <MenuItem selected={blockType === 'paragraph'} onClick={() => applyBlockType('paragraph')}>
          Paragraph
        </MenuItem>
        <MenuItem selected={blockType === 'h1'} onClick={() => applyBlockType('h1')}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            H1
          </Typography>
        </MenuItem>
        <MenuItem selected={blockType === 'h2'} onClick={() => applyBlockType('h2')}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            H2
          </Typography>
        </MenuItem>
        <MenuItem selected={blockType === 'h3'} onClick={() => applyBlockType('h3')}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            H3
          </Typography>
        </MenuItem>
        <MenuItem selected={blockType === 'quote'} onClick={() => applyBlockType('quote')}>
          <FormatQuote fontSize="small" sx={{ mr: 1 }} />
          Blockquote
        </MenuItem>
        <MenuItem selected={blockType === 'code'} onClick={() => applyBlockType('code')}>
          <Code fontSize="small" sx={{ mr: 1 }} />
          Pre
        </MenuItem>
      </Menu>

      {!isCompactToolbar && (
        <>
          <IconButton
            size="small"
            onClick={insertBulletList}
            disabled={disabled}
            title="Bullet List"
          >
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
            onClick={outdentContent}
            disabled={disabled}
            title="Decrease indent"
          >
            <FormatIndentDecrease />
          </IconButton>

          <IconButton
            size="small"
            onClick={indentContent}
            disabled={disabled}
            title="Increase indent"
          >
            <FormatIndentIncrease />
          </IconButton>

          <Button
            size="small"
            onClick={openAlignmentMenu}
            endIcon={<ArrowDropDown />}
            disabled={disabled}
            sx={{ minWidth: 48, textTransform: 'none' }}
          >
            {elementFormat === 'center' && <FormatAlignCenter fontSize="small" />}
            {elementFormat === 'right' && <FormatAlignRight fontSize="small" />}
            {elementFormat === 'justify' && <FormatAlignJustify fontSize="small" />}
            {elementFormat === 'left' && <FormatAlignLeft fontSize="small" />}
          </Button>
          <Menu
            anchorEl={alignmentMenuAnchor}
            open={Boolean(alignmentMenuAnchor)}
            onClose={closeAlignmentMenu}
          >
            <MenuItem selected={elementFormat === 'left'} onClick={() => applyAlignment('left')}>
              <FormatAlignLeft fontSize="small" sx={{ mr: 1 }} />
              Align Left
            </MenuItem>
            <MenuItem
              selected={elementFormat === 'center'}
              onClick={() => applyAlignment('center')}
            >
              <FormatAlignCenter fontSize="small" sx={{ mr: 1 }} />
              Align Center
            </MenuItem>
            <MenuItem selected={elementFormat === 'right'} onClick={() => applyAlignment('right')}>
              <FormatAlignRight fontSize="small" sx={{ mr: 1 }} />
              Align Right
            </MenuItem>
            <MenuItem
              selected={elementFormat === 'justify'}
              onClick={() => applyAlignment('justify')}
            >
              <FormatAlignJustify fontSize="small" sx={{ mr: 1 }} />
              Justify
            </MenuItem>
          </Menu>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        </>
      )}

      <IconButton
        size="small"
        onClick={handleOpenLinkDialog}
        disabled={disabled}
        title="Insert Link"
      >
        <LinkIcon />
      </IconButton>

      <Dialog
        open={linkDialogOpen}
        onClose={handleCloseLinkDialog}
        fullWidth
        maxWidth="xs"
        keepMounted
      >
        <DialogTitle>Add Link</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              label="URL"
              fullWidth
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://example.com"
            />
            <TextField
              label="Text to display"
              fullWidth
              value={linkText}
              onChange={(event) => setLinkText(event.target.value)}
              helperText="Leave blank to use the URL as the link text"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLinkDialog}>Cancel</Button>
          <Button onClick={handleConfirmLink} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <IconButton size="small" onClick={openOverflowMenu} disabled={disabled} title="More">
        <MoreHoriz />
      </IconButton>
      <Menu
        anchorEl={overflowMenuAnchor}
        open={Boolean(overflowMenuAnchor)}
        onClose={closeOverflowMenu}
      >
        {isCompactToolbar && (
          <>
            {[
              {
                key: 'compact-bullet',
                label: 'Bullet list',
                ariaLabel: 'Insert bullet list',
                onClick: () => {
                  closeOverflowMenu();
                  insertBulletList();
                },
              },
              {
                key: 'compact-numbered',
                label: 'Numbered list',
                ariaLabel: 'Insert numbered list',
                onClick: () => {
                  closeOverflowMenu();
                  insertNumberedList();
                },
              },
              {
                key: 'compact-outdent',
                label: 'Decrease indent',
                ariaLabel: 'Decrease indent',
                onClick: () => {
                  closeOverflowMenu();
                  outdentContent();
                },
              },
              {
                key: 'compact-indent',
                label: 'Increase indent',
                ariaLabel: 'Increase indent',
                onClick: () => {
                  closeOverflowMenu();
                  indentContent();
                },
              },
              {
                key: 'compact-align-left',
                label: 'Align Left',
                ariaLabel: 'Align text left',
                onClick: () => {
                  closeOverflowMenu();
                  applyAlignment('left');
                },
              },
              {
                key: 'compact-align-center',
                label: 'Align Center',
                ariaLabel: 'Align text center',
                onClick: () => {
                  closeOverflowMenu();
                  applyAlignment('center');
                },
              },
              {
                key: 'compact-align-right',
                label: 'Align Right',
                ariaLabel: 'Align text right',
                onClick: () => {
                  closeOverflowMenu();
                  applyAlignment('right');
                },
              },
              {
                key: 'compact-align-justify',
                label: 'Justify',
                ariaLabel: 'Justify text',
                onClick: () => {
                  closeOverflowMenu();
                  applyAlignment('justify');
                },
              },
            ].map((item) => (
              <MenuItem
                key={item.key}
                onClick={item.onClick}
                disabled={disabled}
                aria-label={item.ariaLabel}
              >
                {item.label}
              </MenuItem>
            ))}
            <Divider />
          </>
        )}
        <MenuItem
          onClick={() => {
            closeOverflowMenu();
            undo();
          }}
          disabled={disabled}
        >
          Undo
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeOverflowMenu();
            redo();
          }}
          disabled={disabled}
        >
          Redo
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeOverflowMenu();
            cutSelection();
          }}
          disabled={disabled}
        >
          Cut
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeOverflowMenu();
            copySelection();
          }}
          disabled={disabled}
        >
          Copy
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeOverflowMenu();
            pasteClipboard();
          }}
          disabled={disabled}
        >
          Paste
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeOverflowMenu();
            onToggleSpellCheck();
          }}
          disabled={disabled}
        >
          {spellCheckEnabled ? 'Spellcheck on' : 'Spellcheck off'}
        </MenuItem>
      </Menu>
    </Toolbar>
  );
}

// Plugin to handle one-time HTML import during editor initialization
// This preserves formatting without causing cursor jumping during live editing
function HtmlImportPlugin({ initialHtml }: { initialHtml?: string }) {
  const [editor] = useLexicalComposerContext();

  const collectStyleSegments = useCallback(
    (node: Node, inherited: string[], segments: Array<{ style: string; length: number }>): void => {
      const traverse = (current: Node, carry: string[]): void => {
        if (current.nodeType === Node.TEXT_NODE) {
          const textContent = current.textContent ?? '';
          const style = carry.filter(Boolean).join('; ');
          if (textContent.length > 0) {
            segments.push({ style, length: textContent.length });
          }
          return;
        }

        if (current.nodeType === Node.ELEMENT_NODE) {
          const element = current as HTMLElement;
          const styleAttr = element.getAttribute('style') ?? '';
          const filteredStyle = filterAllowedInlineStyles(styleAttr);
          const nextInherited = filteredStyle ? [...carry, filteredStyle] : carry;
          element.childNodes.forEach((child) => traverse(child, nextInherited));
        }
      };

      traverse(node, inherited);
    },
    [], // filterAllowedInlineStyles is a module import and stable
  );

  useEffect(() => {
    if (!initialHtml || initialHtml.trim() === '') return;

    // Only run once on mount - parse HTML and set editor state
    editor.update(() => {
      try {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialHtml, 'text/html');
        const styleSegments: Array<{ style: string; length: number }> = [];
        collectStyleSegments(dom.body, [], styleSegments);
        const nodes = $generateNodesFromDOM(editor, dom);

        const root = $getRoot();
        root.clear();

        if (nodes.length > 0) {
          // Insert the parsed nodes which preserve all formatting
          $insertNodes(nodes);
          const lexicalTextNodes = root.getAllTextNodes();
          let segmentIndex = 0;
          let remaining = styleSegments[0]?.length ?? 0;
          lexicalTextNodes.forEach((textNode) => {
            const textLength = textNode.getTextContent().length;
            // Advance segments until we have a remaining length
            while (remaining === 0 && segmentIndex < styleSegments.length - 1) {
              segmentIndex += 1;
              remaining = styleSegments[segmentIndex]?.length ?? 0;
            }
            const style = styleSegments[segmentIndex]?.style ?? '';
            if (style) {
              textNode.setStyle(style);
            }
            // Decrease remaining by current text length
            remaining = Math.max(0, remaining - textLength);
          });
        } else {
          // Fallback: create empty paragraph if parsing produces no nodes
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        }
      } catch (error) {
        console.warn('Failed to parse HTML content, falling back to plain text:', error);

        // Fallback: extract plain text and create basic paragraph
        const textContent = initialHtml.replace(/<[^>]*>/g, '').trim();
        const root = $getRoot();
        root.clear();

        if (textContent) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(textContent));
          root.append(paragraph);
        } else {
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        }
      }
    });
  }, [collectStyleSegments, editor, initialHtml]);

  return null;
}

// Plugin to handle content changes using registerTextContentListener
// This avoids cursor jumping issues that occur with registerUpdateListener
function ContentChangePlugin({ onChange }: { onChange?: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onChange) return;

    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const htmlContent = $generateHtmlFromNodes(editor);
        onChange(sanitizeRichContent(htmlContent));
      });
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
  link: 'editor-link',
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

// Function to create initial editor state - now simplified since HTML parsing
// is handled by HtmlImportPlugin to avoid cursor jumping issues
function createInitialEditorState(_html?: string): (() => void) | null {
  // Always return null to use default empty state
  // HTML content will be loaded by HtmlImportPlugin after editor initialization
  return null;
}

const nodes = [HeadingNode, QuoteNode, CodeNode, ListNode, ListItemNode, LinkNode, AutoLinkNode];

const editorConfig = {
  namespace: 'EmailEditor',
  theme,
  nodes,
  onError: (error: Error) => {
    console.error('Lexical error:', error);
  },
};

export interface RichTextEditorHandle {
  getCurrentContent: () => string;
  getSanitizedContent: () => string;
  getTextContent: () => string;
  insertText: (text: string) => void;
}

const RichTextEditor = React.forwardRef<RichTextEditorHandle, RichTextEditorProps>(
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
    const theme = useTheme();
    const [spellCheckEnabled, setSpellCheckEnabled] = React.useState(true);
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

    const getSanitizedContent = useCallback(() => {
      return sanitizeRichContent(getCurrentContent());
    }, [getCurrentContent]);

    // Function to get plain text content (for content detection without HTML markup)
    const getTextContent = useCallback(() => {
      if (editorRef.current) {
        return editorRef.current.getEditorState().read(() => {
          return $getRoot().getTextContent();
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

    // Expose getCurrentContent, getTextContent, and insertText methods to parent via ref
    React.useImperativeHandle(
      ref,
      () => ({
        getCurrentContent,
        getSanitizedContent,
        getTextContent,
        insertText,
      }),
      [getCurrentContent, getSanitizedContent, getTextContent, insertText],
    );

    // Content changes are now handled by ContentChangePlugin using registerTextContentListener
    // This avoids cursor jumping while providing real-time content updates

    return (
      <Paper
        variant="outlined"
        sx={{
          borderColor: error ? theme.palette.error.main : theme.palette.widget.border,
          borderWidth: error ? 2 : 1,
          borderRadius: 1,
          overflow: 'hidden',
          opacity: 1,
          bgcolor: theme.palette.widget.surface,
          color: theme.palette.text.primary,
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
          {!disabled && (
            <ToolbarPlugin
              disabled={disabled}
              spellCheckEnabled={spellCheckEnabled}
              onToggleSpellCheck={() => setSpellCheckEnabled((prev) => !prev)}
            />
          )}

          <Box
            sx={{
              position: 'relative',
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.default, 0.45)
                  : theme.palette.background.paper,
              color: theme.palette.text.primary,
              '& .editor-text-bold': { fontWeight: 'bold' },
              '& .editor-text-italic': { fontStyle: 'italic' },
              '& .editor-text-underline': { textDecoration: 'underline' },
              '& .editor-link': {
                color: theme.palette.primary.main,
                textDecoration: 'underline',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'none',
                },
              },
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
                    backgroundColor: 'transparent',
                    color: theme.palette.text.primary,
                  }}
                  spellCheck={spellCheckEnabled}
                  lang="en"
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  inputMode="text"
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
            {/* Import HTML content on initialization only (preserves formatting) */}
            <HtmlImportPlugin initialHtml={initialValue} />
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
