import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { EmailService } from '../../../services/emailService';
import { useAuth } from '../../../context/AuthContext';
import { EmailTemplate } from '../../../types/emails/email';
import TemplateRichTextEditor from './TemplateRichTextEditor';
import VariableInsertionHelper from './VariableInsertionHelper';
import { TEMPLATE_HELPER_TEXT, getAllTemplateVariables } from '../../../utils/templateUtils';
import { formatDateSafely } from '../../../utils/dateUtils';
import { useDebounce } from '../../../hooks/useDebounce';

export type TemplateDialogMode = 'create' | 'edit';

export interface BaseTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
  mode: TemplateDialogMode;
  template?: EmailTemplate; // Required for edit mode
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  mode: TemplateDialogMode;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, mode, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-${mode}-tabpanel-${index}`}
      aria-labelledby={`template-${mode}-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function BaseTemplateDialog({
  open,
  onClose,
  onSuccess,
  accountId,
  mode,
  template,
}: BaseTemplateDialogProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subjectTemplate: '',
    bodyTemplate: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ref for the rich text editor
  const richTextEditorRef = React.useRef<{
    getCurrentContent: () => string;
    insertText: (text: string) => void;
    insertVariable: (variable: string) => void;
  }>(null);

  // Ref for the subject TextField to track cursor position
  const subjectTextFieldRef = React.useRef<HTMLInputElement>(null);

  // Memoize EmailService with proper token validation
  const emailService = useMemo(() => {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    return new EmailService(token);
  }, [token]);

  // Initialize form data when template changes (edit mode)
  useEffect(() => {
    if (mode === 'edit' && template && open) {
      setFormData({
        name: template.name,
        description: template.description || '',
        subjectTemplate: template.subjectTemplate || '',
        bodyTemplate: template.bodyTemplate,
      });
      setErrors({});
      setError(null);
    } else if (mode === 'create' && open) {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        subjectTemplate: '',
        bodyTemplate: '',
      });
      setErrors({});
      setError(null);
      setActiveTab(0);
    }
  }, [template, open, mode]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Sync content from rich text editor before switching tabs
    // This ensures content is preserved when switching between Subject and Content tabs
    if (richTextEditorRef.current) {
      const currentContent = richTextEditorRef.current.getCurrentContent();
      if (currentContent !== formData.bodyTemplate) {
        setFormData((prev) => ({
          ...prev,
          bodyTemplate: currentContent,
        }));
      }
    }

    setActiveTab(newValue);
  };

  // Debounced functions for better performance
  const debouncedFormDataUpdate = useDebounce((field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, 300); // 300ms delay

  const debouncedErrorClear = useDebounce((field: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  }, 100); // Shorter delay for error clearing

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Update form data with debouncing for performance
    debouncedFormDataUpdate(field, value);

    // Clear error when user starts typing (with short debounce)
    if (errors[field]) {
      debouncedErrorClear(field);
    }
  };

  const handleEditorChange = useDebounce((content: string) => {
    setFormData((prev) => ({
      ...prev,
      bodyTemplate: content,
    }));

    // Clear error when user starts typing
    if (errors.bodyTemplate) {
      setErrors((prev) => ({
        ...prev,
        bodyTemplate: '',
      }));
    }
  }, 100); // Reduced delay since real-time updates now handled by registerTextContentListener

  // Enhanced variable insertion handler that uses cursor position for subject field
  const handleVariableInsert = React.useCallback(
    (variable: string, fieldOverride?: 'subject' | 'body') => {
      const field = fieldOverride || (activeTab === 0 ? 'subject' : 'body');

      if (field === 'subject') {
        // For subject field, use cursor-aware insertion
        const currentContent = formData.subjectTemplate;
        const variableTag = `{{${variable}}}`;

        // Get cursor position from the TextField input element
        let cursorPosition = currentContent.length; // Default to end
        if (subjectTextFieldRef.current) {
          const selectionStart = subjectTextFieldRef.current.selectionStart;
          if (selectionStart !== null) {
            cursorPosition = selectionStart;
          }
        }

        // Insert the variable at the cursor position
        const beforeCursor = currentContent.substring(0, cursorPosition);
        const afterCursor = currentContent.substring(cursorPosition);
        const newContent = beforeCursor + variableTag + afterCursor;

        // Update form data
        setFormData((prev) => ({
          ...prev,
          subjectTemplate: newContent,
        }));

        // Restore cursor position after the inserted variable
        setTimeout(() => {
          if (subjectTextFieldRef.current) {
            const newCursorPosition = cursorPosition + variableTag.length;
            subjectTextFieldRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
            subjectTextFieldRef.current.focus();
          }
        }, 0);
      } else {
        // For body field, use the rich text editor's cursor-aware insertion
        if (richTextEditorRef.current) {
          richTextEditorRef.current.insertVariable(variable);

          // Update the form data with the current content from the editor
          setTimeout(() => {
            if (richTextEditorRef.current) {
              const currentContent = richTextEditorRef.current.getCurrentContent();
              setFormData((prev) => ({
                ...prev,
                bodyTemplate: currentContent,
              }));
            }
          }, 0);
        }
      }
    },
    [activeTab, formData.subjectTemplate],
  );

  const validateForm = () => {
    // Sync content from editor before validation as a safety net
    let currentBodyContent = formData.bodyTemplate;
    if (richTextEditorRef.current) {
      const editorContent = richTextEditorRef.current.getCurrentContent();
      if (editorContent !== formData.bodyTemplate) {
        currentBodyContent = editorContent;
        setFormData((prev) => ({
          ...prev,
          bodyTemplate: editorContent,
        }));
      }
    }

    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!currentBodyContent.trim()) {
      newErrors.bodyTemplate = 'Template content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        subjectTemplate: formData.subjectTemplate.trim() || undefined,
        bodyTemplate: formData.bodyTemplate,
      };

      if (mode === 'create') {
        await emailService.createTemplate(accountId, templateData);
      } else {
        if (!template) {
          throw new Error('Template is required for edit mode');
        }
        await emailService.updateTemplate(accountId, template.id, templateData);
      }

      onSuccess();
    } catch (err) {
      console.error(`Failed to ${mode} template:`, err);
      setError(`Failed to ${mode} template. Please check your input and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form for create mode
      if (mode === 'create') {
        setFormData({
          name: '',
          description: '',
          subjectTemplate: '',
          bodyTemplate: '',
        });
        setActiveTab(0);
      }
      setErrors({});
      setError(null);
      onClose();
    }
  };

  const isFormValid = formData.name.trim() && formData.bodyTemplate.trim();
  const dialogTitle = mode === 'create' ? 'Create Email Template' : 'Edit Email Template';
  const submitButtonText = mode === 'create' ? 'Create Template' : 'Save Changes';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' },
      }}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Basic Information */}
        <TextField
          label="Template Name"
          value={formData.name}
          onChange={handleInputChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          fullWidth
          required
        />

        <TextField
          label="Description (Optional)"
          value={formData.description}
          onChange={handleInputChange('description')}
          multiline
          rows={2}
          fullWidth
        />

        {/* Template Content Tabs */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Subject" />
            <Tab label="Content" />
          </Tabs>

          <TabPanel value={activeTab} index={0} mode={mode}>
            <TextField
              label="Subject Template (Optional)"
              value={formData.subjectTemplate}
              onChange={handleInputChange('subjectTemplate')}
              placeholder="Enter subject template with variables like {{firstName}} or {{teamName}}"
              multiline
              rows={2}
              fullWidth
              helperText={TEMPLATE_HELPER_TEXT.SUBJECT}
              inputRef={subjectTextFieldRef}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1} mode={mode}>
            <Box sx={{ height: 300 }}>
              <TemplateRichTextEditor
                ref={richTextEditorRef}
                content={formData.bodyTemplate}
                onChange={handleEditorChange}
                placeholder="Enter your email template content here..."
                error={!!errors.bodyTemplate}
                helperText={errors.bodyTemplate}
                onVariableInsert={(_variable) => {
                  // Sync the form data when a variable is inserted
                  setTimeout(() => {
                    if (richTextEditorRef.current) {
                      const currentContent = richTextEditorRef.current.getCurrentContent();
                      setFormData((prev) => ({
                        ...prev,
                        bodyTemplate: currentContent,
                      }));
                    }
                  }, 0);
                }}
              />
            </Box>
          </TabPanel>
        </Box>

        {/* Template Variables - Always Visible */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Template Variables
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              (Click to insert into {activeTab === 0 ? 'Subject' : 'Content'})
            </Typography>
          </Typography>
          <VariableInsertionHelper
            onInsert={(variable) =>
              handleVariableInsert(variable, activeTab === 0 ? 'subject' : 'body')
            }
          />
        </Box>

        {/* Variable Preview */}
        {(formData.subjectTemplate || formData.bodyTemplate) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Variables found:{' '}
              {getAllTemplateVariables({
                subject: formData.subjectTemplate,
                body: formData.bodyTemplate,
              }).join(', ')}
            </Typography>
          </Box>
        )}

        {/* Template Info (Edit mode only) */}
        {mode === 'edit' && template && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Template ID: {template.id.toString()} • Created:{' '}
              {formatDateSafely(template.createdAt)} • Last Updated:{' '}
              {formatDateSafely(template.updatedAt)}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading} startIcon={<CancelIcon />}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !isFormValid}
          startIcon={<SaveIcon />}
        >
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
