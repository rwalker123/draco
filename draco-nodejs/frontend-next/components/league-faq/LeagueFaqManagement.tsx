'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Container, Fab, Snackbar, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { LeagueFaqType, LeagueFaqListType } from '@draco/shared-schemas';
import { listLeagueFaqs } from '@draco/shared-api-client';
import AccountPageHeader from '../AccountPageHeader';
import { AdminBreadcrumbs } from '../admin';
import { useLeagueFaqService } from '../../hooks/useLeagueFaqService';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import { LeagueFaqFormDialog } from './dialogs/LeagueFaqFormDialog';
import { DeleteLeagueFaqDialog } from './dialogs/DeleteLeagueFaqDialog';
import { LeagueFaqList } from './LeagueFaqList';

interface LeagueFaqManagementProps {
  accountId: string;
}

type FeedbackState = {
  severity: 'success' | 'error';
  message: string;
} | null;

type FormMode = 'create' | 'edit';

const sortFaqs = (items: LeagueFaqType[]): LeagueFaqType[] =>
  [...items].sort((a, b) =>
    a.question.localeCompare(b.question, undefined, { sensitivity: 'base' }),
  );

export const LeagueFaqManagement: React.FC<LeagueFaqManagementProps> = ({ accountId }) => {
  const { createFaq, updateFaq, deleteFaq } = useLeagueFaqService(accountId);
  const apiClient = useApiClient();

  const [faqs, setFaqs] = useState<LeagueFaqType[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [activeFaq, setActiveFaq] = useState<LeagueFaqType | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqPendingDeletion, setFaqPendingDeletion] = useState<LeagueFaqType | null>(null);

  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFaqs = async () => {
      setInitialLoading(true);
      setInitialError(null);

      try {
        const result = await listLeagueFaqs({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(result, 'Failed to load FAQs') as LeagueFaqListType;
        const faqsList = Array.isArray(data) ? data : [];
        setFaqs(sortFaqs(faqsList as LeagueFaqType[]));
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Failed to load FAQs';
        setInitialError(message);
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false);
        }
      }
    };

    void fetchFaqs();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient]);

  const openCreateDialog = () => {
    setFormMode('create');
    setActiveFaq(null);
    setFormOpen(true);
  };

  const openEditDialog = (faq: LeagueFaqType) => {
    setFormMode('edit');
    setActiveFaq(faq);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setActiveFaq(null);
  };

  const openDeleteDialog = (faq: LeagueFaqType) => {
    setFaqPendingDeletion(faq);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setFaqPendingDeletion(null);
  };

  const handleCreateSuccess = (result: { faq: LeagueFaqType; message: string }) => {
    setFaqs((current) => sortFaqs([...current, result.faq]));
    setFeedback({ severity: 'success', message: result.message });
    closeForm();
  };

  const handleUpdateSuccess = (result: { faq: LeagueFaqType; message: string }) => {
    setFaqs((current) =>
      sortFaqs(current.map((item) => (item.id === result.faq.id ? result.faq : item))),
    );
    setFeedback({ severity: 'success', message: result.message });
    closeForm();
  };

  const handleDeleteSuccess = (result: { faqId: string; message: string }) => {
    setFaqs((current) => current.filter((item) => item.id !== result.faqId));
    setFeedback({ severity: 'success', message: result.message });
    closeDeleteDialog();
  };

  const handleError = (message: string) => {
    setFeedback({ severity: 'error', message });
  };

  const handleFeedbackClose = () => {
    setFeedback(null);
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          League FAQ Management
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Create and maintain FAQs to help league members quickly find answers.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Content', href: `/account/${accountId}/admin/content` }}
          currentPage="FAQ Management"
        />
        {initialLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : initialError ? (
          <Alert severity="error">{initialError}</Alert>
        ) : faqs.length === 0 ? (
          <Alert severity="info">No FAQs have been created yet.</Alert>
        ) : (
          <LeagueFaqList faqs={faqs} onEdit={openEditDialog} onDelete={openDeleteDialog} />
        )}
      </Container>

      <Fab
        color="primary"
        aria-label="Create FAQ"
        onClick={openCreateDialog}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: (theme) => theme.zIndex.snackbar + 1,
        }}
      >
        <AddIcon />
      </Fab>

      <LeagueFaqFormDialog
        open={formOpen}
        mode={formMode}
        faq={formMode === 'edit' ? (activeFaq ?? undefined) : undefined}
        onClose={closeForm}
        onSuccess={formMode === 'create' ? handleCreateSuccess : handleUpdateSuccess}
        onError={handleError}
        createFaq={createFaq}
        updateFaq={updateFaq}
      />

      <DeleteLeagueFaqDialog
        open={deleteDialogOpen}
        faq={faqPendingDeletion ?? undefined}
        onClose={closeDeleteDialog}
        onSuccess={handleDeleteSuccess}
        onError={handleError}
        deleteFaq={deleteFaq}
      />

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={6000}
        onClose={handleFeedbackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert onClose={handleFeedbackClose} severity={feedback.severity} variant="filled">
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </main>
  );
};

export default LeagueFaqManagement;
