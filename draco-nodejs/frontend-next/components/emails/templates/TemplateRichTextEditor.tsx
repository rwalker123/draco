import React from 'react';
import { Box, FormHelperText } from '@mui/material';
import RichTextEditor, { type RichTextEditorHandle } from '../../email/RichTextEditor';
import { TEMPLATE_HELPER_TEXT } from '../../../utils/templateUtils';

interface TemplateRichTextEditorProps {
  content: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  onVariableInsert?: (variable: string) => void;
}

export interface TemplateRichTextEditorRef {
  getCurrentContent: () => string;
  getSanitizedContent: () => string;
  insertText: (text: string) => void;
  insertVariable: (variable: string) => void;
}

const TemplateRichTextEditor = React.forwardRef<
  TemplateRichTextEditorRef,
  TemplateRichTextEditorProps
>(
  (
    {
      content,
      placeholder = 'Enter your email template content here...',
      error = false,
      helperText,
      disabled = false,
      onVariableInsert,
    },
    ref,
  ) => {
    const editorRef = React.useRef<RichTextEditorHandle | null>(null);

    const insertVariable = (variable: string) => {
      const variableText = `{{${variable}}}`;
      if (editorRef.current) {
        editorRef.current.insertText(variableText);
      }
      if (onVariableInsert) {
        onVariableInsert(variable);
      }
    };

    React.useImperativeHandle(ref, () => ({
      getCurrentContent: () => editorRef.current?.getSanitizedContent() || '',
      getSanitizedContent: () => editorRef.current?.getSanitizedContent() || '',
      getTextContent: () => editorRef.current?.getTextContent() || '',
      insertText: (text: string) => editorRef.current?.insertText(text),
      insertVariable,
    }));
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            flex: 1,
            border: error ? 2 : 1,
            borderColor: error ? 'error.main' : 'divider',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <RichTextEditor
            ref={editorRef}
            initialValue={content}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            minHeight={250}
          />
        </Box>

        {helperText && (
          <FormHelperText error={error} sx={{ mt: 1 }}>
            {helperText}
          </FormHelperText>
        )}

        {!helperText && <FormHelperText sx={{ mt: 1 }}>{TEMPLATE_HELPER_TEXT.BODY}</FormHelperText>}
      </Box>
    );
  },
);

TemplateRichTextEditor.displayName = 'TemplateRichTextEditor';

export default TemplateRichTextEditor;
