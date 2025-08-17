import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../../../components/auth/ProtectedRoute';
import { EmailService } from '../../../../../../services/emailService';
import { useAuth } from '../../../../../../context/AuthContext';
import TemplateRichTextEditor from '../../../../../../components/emails/templates/TemplateRichTextEditor';

// Define the ref interface for TemplateRichTextEditor
interface TemplateRichTextEditorRef {
  getCurrentContent: () => string;
  insertText: (text: string) => void;
  insertVariable: (variable: string) => void;
}
import VariableInsertionHelper from '../../../../../../components/emails/templates/VariableInsertionHelper';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-create-tabpanel-${index}`}
      aria-labelledby={`template-create-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function CreateTemplate() {
  const { accountId } = useParams();
  const router = useRouter();
  const { token } = useAuth();

  // Ref for the rich text editor
  const editorRef = useRef<TemplateRichTextEditorRef>(null);

  // Ref for the subject TextField to track cursor position
  const subjectTextFieldRef = useRef<HTMLInputElement>(null);

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

  const emailService = useMemo(() => new EmailService(token || ''), [token]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Sync content from rich text editor before switching tabs
    // This ensures content is preserved when switching between Subject and Content tabs
    if (editorRef.current) {
      const currentContent = editorRef.current.getCurrentContent();
      if (currentContent !== formData.bodyTemplate) {
        setFormData((prev) => ({
          ...prev,
          bodyTemplate: currentContent,
        }));
      }
    }

    setActiveTab(newValue);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleEditorChange = (content: string) => {
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
  };

  const handleVariableInsert = (variable: string, targetField?: 'subject' | 'body') => {
    const variableTag = `{{${variable}}}`;
    const field = targetField || 'body';

    if (field === 'subject') {
      // For subject field, use cursor-aware insertion
      const currentContent = formData.subjectTemplate;

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
      // For body, use the editor's insertion method for cursor-aware insertion
      if (editorRef.current) {
        editorRef.current.insertVariable(variable);

        // Sync form state after insertion using a slight delay to ensure editor has updated
        setTimeout(() => {
          const currentContent = editorRef.current?.getCurrentContent() || '';
          setFormData((prev) => ({
            ...prev,
            bodyTemplate: currentContent,
          }));
        }, 10);
      }
    }
  };

  const validateForm = useCallback(() => {
    // Sync content from editor before validation as a safety net
    let currentBodyContent = formData.bodyTemplate;
    if (editorRef.current) {
      const editorContent = editorRef.current.getCurrentContent();
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
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await emailService.createTemplate(accountId as string, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        subjectTemplate: formData.subjectTemplate.trim() || undefined,
        bodyTemplate: formData.bodyTemplate,
      });

      // Navigate back to templates list
      router.push(`/account/${accountId}/communications/templates`);
    } catch (err) {
      console.error('Failed to create template:', err);
      setError('Failed to create template. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, accountId, emailService, router, validateForm]);

  const handleCancel = () => {
    router.push(`/account/${accountId}/communications/templates`);
  };

  const handleBack = () => {
    router.push(`/account/${accountId}/communications/templates`);
  };

  return (
    <ProtectedRoute requiredRole={['ContactAdmin', 'AccountAdmin']} checkAccountBoundary={true}>
      <main className="min-h-screen bg-background">
        <Box sx={{ p: 3 }}>
          {/* Header with breadcrumbs and actions */}
          <Box sx={{ mb: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
              Back to Templates
            </Button>

            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
              <Link
                color="inherit"
                href={`/account/${accountId}/home`}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Home
              </Link>
              <Link
                color="inherit"
                href={`/account/${accountId}/communications`}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <EmailIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Communications
              </Link>
              <Link
                color="inherit"
                href={`/account/${accountId}/communications/templates`}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <TemplateIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Templates
              </Link>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                Create New Template
              </Typography>
            </Breadcrumbs>

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h4" component="h1">
                Create Email Template
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={handleCancel}
                  disabled={loading}
                  startIcon={<CancelIcon />}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  variant="contained"
                  disabled={loading || !formData.name.trim() || !formData.bodyTemplate.trim()}
                  startIcon={<SaveIcon />}
                >
                  Create Template
                </Button>
              </Box>
            </Box>

            <Typography variant="body1" color="text.secondary">
              Create a reusable email template with variable substitution for consistent
              communication.
            </Typography>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Main content card */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              {/* Basic Information */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Template Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Description (Optional)"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  multiline
                  rows={2}
                  fullWidth
                />
              </Box>

              {/* Template Content Tabs */}
              <Box sx={{ flexGrow: 1 }}>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                  <Tab label="Subject" />
                  <Tab label="Content" />
                </Tabs>

                <TabPanel value={activeTab} index={0}>
                  <TextField
                    label="Subject Template (Optional)"
                    value={formData.subjectTemplate}
                    onChange={handleInputChange('subjectTemplate')}
                    placeholder="Enter subject template with variables like {{firstName}} or {{teamName}}"
                    multiline
                    rows={2}
                    fullWidth
                    helperText="Use {{variableName}} for dynamic content"
                    inputRef={subjectTextFieldRef}
                  />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  <Box sx={{ height: 400, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <TemplateRichTextEditor
                      ref={editorRef}
                      content={formData.bodyTemplate}
                      onChange={handleEditorChange}
                      placeholder="Enter your email template content here..."
                      error={!!errors.bodyTemplate}
                      helperText={errors.bodyTemplate}
                    />
                  </Box>
                </TabPanel>
              </Box>

              {/* Template Variables - Always Visible */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Template Variables
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
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
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Variables found:{' '}
                    {[
                      ...(formData.subjectTemplate.match(/\{\{[^}]+\}\}/g) || []),
                      ...(formData.bodyTemplate.match(/\{\{[^}]+\}\}/g) || []),
                    ]
                      .map((v) => v.replace(/[{}]/g, '').trim())
                      .filter((v, i, arr) => arr.indexOf(v) === i)
                      .join(', ')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </main>
    </ProtectedRoute>
  );
}
