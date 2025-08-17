import React from 'react';
import { Box, FormHelperText } from '@mui/material';
import RichTextEditor from '../../email/RichTextEditor';
import { TEMPLATE_HELPER_TEXT } from '../../../utils/templateUtils';

interface TemplateRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  onVariableInsert?: (variable: string) => void;
}

interface TemplateRichTextEditorRef {
  getCurrentContent: () => string;
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
      onChange,
      placeholder = 'Enter your email template content here...',
      error = false,
      helperText,
      disabled = false,
      onVariableInsert,
    },
    ref,
  ) => {
    const editorRef = React.useRef<{
      getCurrentContent: () => string;
      insertText: (text: string) => void;
    }>(null);

    // Function to insert a template variable
    const insertVariable = React.useCallback(
      (variable: string) => {
        const variableText = `{{${variable}}}`;
        if (editorRef.current) {
          editorRef.current.insertText(variableText);
        }
        // Call the onVariableInsert callback if provided
        if (onVariableInsert) {
          onVariableInsert(variable);
        }
      },
      [onVariableInsert],
    );

    // Expose methods to parent component
    React.useImperativeHandle(
      ref,
      () => ({
        getCurrentContent: () => editorRef.current?.getCurrentContent() || '',
        insertText: (text: string) => editorRef.current?.insertText(text),
        insertVariable,
      }),
      [insertVariable],
    );
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
            value={content}
            onChange={onChange}
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
