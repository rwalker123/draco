import { useState, useEffect, useCallback } from 'react';
import { EmailService } from '../services/emailService';
import { useAuth } from '../context/AuthContext';
import {
  EmailTemplate,
  EmailTemplateCreateRequest,
  EmailTemplateUpdateRequest,
} from '../types/emails/email';

interface UseEmailTemplatesResult {
  templates: EmailTemplate[];
  loading: boolean;
  error: string | null;
  createTemplate: (request: EmailTemplateCreateRequest) => Promise<EmailTemplate>;
  updateTemplate: (
    templateId: string,
    request: EmailTemplateUpdateRequest,
  ) => Promise<EmailTemplate>;
  deleteTemplate: (templateId: string) => Promise<void>;
  previewTemplate: (
    templateId: string,
    variables: Record<string, string>,
  ) => Promise<{ subject: string; body: string }>;
  getTemplate: (templateId: string) => Promise<EmailTemplate | null>;
  refresh: () => Promise<void>;
}

export function useEmailTemplates(accountId: string): UseEmailTemplatesResult {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emailService = new EmailService(token || '');

  // Load templates
  const loadTemplates = useCallback(async () => {
    if (!accountId || !token) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const templatesData = await emailService.listTemplates(accountId);
      setTemplates(templatesData);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Failed to load email templates. Please try again.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, token, emailService]);

  // Initial load
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Create template
  const createTemplate = useCallback(
    async (request: EmailTemplateCreateRequest): Promise<EmailTemplate> => {
      if (!accountId || !token) {
        throw new Error('Authentication required');
      }

      try {
        const newTemplate = await emailService.createTemplate(accountId, request);
        await loadTemplates(); // Refresh the list
        return newTemplate;
      } catch (err) {
        console.error('Failed to create template:', err);
        throw err;
      }
    },
    [accountId, token, loadTemplates, emailService],
  );

  // Update template
  const updateTemplate = useCallback(
    async (templateId: string, request: EmailTemplateUpdateRequest): Promise<EmailTemplate> => {
      if (!accountId || !token) {
        throw new Error('Authentication required');
      }

      try {
        const updatedTemplate = await emailService.updateTemplate(accountId, templateId, request);
        await loadTemplates(); // Refresh the list
        return updatedTemplate;
      } catch (err) {
        console.error('Failed to update template:', err);
        throw err;
      }
    },
    [accountId, token, loadTemplates, emailService],
  );

  // Delete template
  const deleteTemplate = useCallback(
    async (templateId: string): Promise<void> => {
      if (!accountId || !token) {
        throw new Error('Authentication required');
      }

      try {
        await emailService.deleteTemplate(accountId, templateId);
        await loadTemplates(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete template:', err);
        throw err;
      }
    },
    [accountId, token, loadTemplates, emailService],
  );

  // Preview template
  const previewTemplate = useCallback(
    async (
      templateId: string,
      variables: Record<string, string>,
    ): Promise<{ subject: string; body: string }> => {
      if (!accountId || !token) {
        throw new Error('Authentication required');
      }

      try {
        return await emailService.previewTemplate(accountId, templateId, variables);
      } catch (err) {
        console.error('Failed to preview template:', err);
        throw err;
      }
    },
    [accountId, token, emailService],
  );

  // Get single template
  const getTemplate = useCallback(
    async (templateId: string): Promise<EmailTemplate | null> => {
      if (!accountId || !token) {
        throw new Error('Authentication required');
      }

      try {
        return await emailService.getTemplate(accountId, templateId);
      } catch (err) {
        console.error('Failed to get template:', err);
        throw err;
      }
    },
    [accountId, token, emailService],
  );

  // Refresh templates
  const refresh = useCallback(async () => {
    await loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate,
    getTemplate,
    refresh,
  };
}
