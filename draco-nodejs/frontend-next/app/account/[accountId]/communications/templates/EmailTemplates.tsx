import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Fab,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import { EmailService } from '../../../../../services/emailService';
import { useAuth } from '../../../../../context/AuthContext';
import { EmailTemplate } from '../../../../../types/emails/email';
import TemplateListView from '../../../../../components/emails/templates/TemplateListView';
import TemplatePreviewDialog from '../../../../../components/emails/templates/TemplatePreviewDialog';

export default function EmailTemplates() {
  const { accountId } = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedTemplateForDelete, setSelectedTemplateForDelete] = useState<EmailTemplate | null>(
    null,
  );

  const emailService = useMemo(() => new EmailService(token || ''), [token]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    if (!accountId || !token) return;

    try {
      setLoading(true);
      setError(null);
      const templatesData = await emailService.listTemplates(accountId as string);
      setTemplates(templatesData);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Failed to load email templates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [accountId, token, emailService]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleBack = () => {
    router.push(`/account/${accountId}/communications`);
  };

  const handleCreateTemplate = () => {
    router.push(`/account/${accountId}/communications/templates/new`);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    router.push(`/account/${accountId}/communications/templates/${template.id}/edit`);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const openDeleteDialog = (template: EmailTemplate) => {
    setSelectedTemplateForDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplateForDelete) return;

    try {
      await emailService.deleteTemplate(
        accountId as string,
        selectedTemplateForDelete.id.toString(),
      );
      setDeleteDialogOpen(false);
      setSelectedTemplateForDelete(null);
      await loadTemplates(); // Reload the list
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError('Failed to delete template. Please try again.');
      setDeleteDialogOpen(false);
      setSelectedTemplateForDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedTemplateForDelete(null);
  };

  const handleDialogClose = () => {
    setPreviewDialogOpen(false);
    setSelectedTemplate(null);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole={['ContactAdmin', 'AccountAdmin']} checkAccountBoundary={true}>
        <main className="min-h-screen bg-background">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '50vh',
              gap: 2,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary">
              Loading email templates...
            </Typography>
          </Box>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={['ContactAdmin', 'AccountAdmin']} checkAccountBoundary={true}>
      <main className="min-h-screen bg-background">
        <Box sx={{ p: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back to Communications
          </Button>

          <Typography variant="h4" component="h1" gutterBottom>
            Email Templates
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Create and manage reusable email templates with variable substitution for consistent
            communication.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {templates.length === 0 && !loading ? (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <TemplateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Templates Created Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Create your first email template to streamline your communications. Templates
                  support variable substitution like {'{'}firstName{'}'} and {'{'}teamName{'}'}.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateTemplate}
                  size="large"
                >
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TemplateListView
              templates={templates}
              onEdit={handleEditTemplate}
              onPreview={handlePreviewTemplate}
              onDelete={openDeleteDialog}
            />
          )}

          {/* Floating Action Button */}
          <Tooltip title="Create New Template">
            <Fab
              color="primary"
              aria-label="create template"
              onClick={handleCreateTemplate}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>

          {/* Dialogs */}
          {selectedTemplate && (
            <TemplatePreviewDialog
              open={previewDialogOpen}
              onClose={handleDialogClose}
              template={selectedTemplate}
              accountId={accountId as string}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
            <DialogTitle>Delete Email Template</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete the template &quot;{selectedTemplateForDelete?.name}
                &quot;? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDeleteCancel}>Cancel</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </main>
    </ProtectedRoute>
  );
}
