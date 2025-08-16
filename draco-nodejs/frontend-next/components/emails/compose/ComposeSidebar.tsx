'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Description as TemplateIcon,
  People as PeopleIcon,
  Attachment as AttachmentIcon,
  Preview as PreviewIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

import { useEmailCompose } from './EmailComposeProvider';
import { useAuth } from '../../../context/AuthContext';
import { createEmailService } from '../../../services/emailService';
import { EmailTemplate } from '../../../types/emails/email';
import { extractTemplateVariables } from '../../../types/emails/compose';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { EmailRecipientError, EmailRecipientErrorCode } from '../../../types/errors';
import { createEmailRecipientError, safeAsync } from '../../../utils/errorHandling';

interface ComposeSidebarProps {
  accountId: string;
  showTemplates?: boolean;
  showRecipientSummary?: boolean;
  showAttachmentSummary?: boolean;
  compact?: boolean;
}

/**
 * ComposeSidebar - Template selection and recipient/attachment summary
 */
const ComposeSidebarComponent: React.FC<ComposeSidebarProps> = ({
  accountId,
  showTemplates = true,
  showRecipientSummary = true,
  showAttachmentSummary = true,
  compact = false,
}) => {
  const { state, actions } = useEmailCompose();
  const { token } = useAuth();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<EmailRecipientError | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(
    new Set(['templates', 'recipients']),
  );

  const loadTemplates = useCallback(async () => {
    if (!token) return;

    const result = await safeAsync(
      async () => {
        setLoadingTemplates(true);
        setTemplatesError(null);

        const emailService = createEmailService(token);
        const templateList = await emailService.listTemplates(accountId);
        setTemplates(templateList.filter((t) => t.isActive));
      },
      {
        operation: 'loadTemplates',
        accountId,
        additionalData: { component: 'ComposeSidebar' },
      },
    );

    if (!result.success) {
      const templateError =
        result.error.code === EmailRecipientErrorCode.API_UNAVAILABLE
          ? createEmailRecipientError(
              EmailRecipientErrorCode.SERVICE_UNAVAILABLE,
              'Template service is temporarily unavailable',
              {
                userMessage: 'Unable to load email templates. Please try again later.',
                retryable: true,
                context: {
                  operation: 'loadTemplates',
                  accountId,
                  additionalData: { component: 'ComposeSidebar' },
                },
              },
            )
          : result.error;

      setTemplatesError(templateError);
    }

    setLoadingTemplates(false);
  }, [token, accountId]);

  // Load templates
  useEffect(() => {
    if (showTemplates && token) {
      loadTemplates();
    }
  }, [showTemplates, token, loadTemplates]);

  // Handle accordion expansion
  const handleAccordionChange = useCallback(
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedAccordions((prev) => {
        const newSet = new Set(prev);
        if (isExpanded) {
          newSet.add(panel);
        } else {
          newSet.delete(panel);
        }
        return newSet;
      });
    },
    [],
  );

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (template: EmailTemplate) => {
      actions.selectTemplate(template);
    },
    [actions],
  );

  // Handle template variable update
  const handleTemplateVariableChange = useCallback(
    (key: string, value: string) => {
      actions.updateTemplateVariable(key, value);
    },
    [actions],
  );

  // Get template variables
  const templateVariables = state.selectedTemplate
    ? extractTemplateVariables(
        (state.selectedTemplate.subjectTemplate || '') +
          (state.selectedTemplate.bodyTemplate || ''),
      )
    : [];

  // Get recipient summary
  const recipientSummary = {
    totalRecipients: state.recipientState?.totalRecipients || 0,
    individualContacts: state.recipientState?.selectedContactIds.size || 0,
    allContacts: state.recipientState?.allContacts || false,
    teamGroups: state.recipientState?.selectedTeamGroups.length || 0,
    roleGroups: state.recipientState?.selectedRoleGroups.length || 0,
  };

  // Get attachment summary
  const attachmentSummary = {
    totalAttachments: state.attachments.length,
    uploadedCount: state.attachments.filter((a) => a.status === 'uploaded').length,
    totalSize: state.attachments.reduce((sum, att) => sum + att.size, 0),
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ width: compact ? '100%' : 320, minWidth: compact ? 'auto' : 320 }}>
      <Stack spacing={compact ? 1 : 2}>
        {/* Templates Section */}
        {showTemplates && (
          <ErrorBoundary
            componentName="TemplatesSection"
            fallback={
              <Alert severity="error" sx={{ m: 1 }}>
                <Typography variant="body2">
                  Email templates failed to load. Please refresh the page.
                </Typography>
              </Alert>
            }
            onError={(error) => {
              console.error('Templates section error:', error);
            }}
          >
            <Paper variant="outlined">
              <Accordion
                expanded={expandedAccordions.has('templates')}
                onChange={handleAccordionChange('templates')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TemplateIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Email Templates
                    </Typography>
                    {state.selectedTemplate && (
                      <Chip label="Active" size="small" color="secondary" />
                    )}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    {/* Template Loading */}
                    {loadingTemplates && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}

                    {/* Template Error */}
                    {templatesError && (
                      <Alert
                        severity="error"
                        action={
                          templatesError.retryable && (
                            <Button size="small" onClick={loadTemplates}>
                              Retry
                            </Button>
                          )
                        }
                      >
                        {templatesError.userMessage || templatesError.message}
                      </Alert>
                    )}

                    {/* Current Template */}
                    {state.selectedTemplate && (
                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {state.selectedTemplate.name}
                          </Typography>
                          <Tooltip title="Clear template">
                            <IconButton size="small" onClick={actions.clearTemplate}>
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        {state.selectedTemplate.description && (
                          <Typography variant="caption" color="text.secondary">
                            {state.selectedTemplate.description}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Template Variables */}
                    {templateVariables.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Template Variables
                        </Typography>
                        <Stack spacing={1}>
                          {templateVariables.map((variable) => (
                            <TextField
                              key={variable}
                              label={variable}
                              size="small"
                              value={state.templateVariables[variable] || ''}
                              onChange={(e) =>
                                handleTemplateVariableChange(variable, e.target.value)
                              }
                              placeholder={`Enter ${variable}...`}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Template List */}
                    {!loadingTemplates && !templatesError && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Available Templates
                        </Typography>
                        {templates.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No templates available
                          </Typography>
                        ) : (
                          <List dense>
                            {templates.map((template) => (
                              <ListItemButton
                                key={template.id}
                                onClick={() => handleTemplateSelect(template)}
                                selected={state.selectedTemplate?.id === template.id}
                              >
                                <ListItemText
                                  primary={template.name}
                                  secondary={template.description}
                                  secondaryTypographyProps={{
                                    noWrap: true,
                                    variant: 'caption',
                                  }}
                                />
                                <ListItemSecondaryAction>
                                  <Tooltip title="Preview template">
                                    <IconButton edge="end" size="small">
                                      <PreviewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </ListItemSecondaryAction>
                              </ListItemButton>
                            ))}
                          </List>
                        )}
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </ErrorBoundary>
        )}

        {/* Recipients Summary */}
        {showRecipientSummary && (
          <Paper variant="outlined">
            <Accordion
              expanded={expandedAccordions.has('recipients')}
              onChange={handleAccordionChange('recipients')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PeopleIcon fontSize="small" />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Recipients
                  </Typography>
                  <Chip
                    label={recipientSummary.totalRecipients}
                    size="small"
                    color={recipientSummary.totalRecipients === 0 ? 'error' : 'primary'}
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {recipientSummary.totalRecipients === 0 ? (
                    <Alert severity="warning">
                      <Typography variant="body2">
                        No recipients selected. Please select recipients before sending.
                      </Typography>
                    </Alert>
                  ) : (
                    <Stack spacing={1}>
                      {recipientSummary.allContacts && (
                        <Chip
                          label="All Contacts"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}

                      {recipientSummary.individualContacts > 0 && (
                        <Typography variant="body2">
                          {recipientSummary.individualContacts} individual contact
                          {recipientSummary.individualContacts !== 1 ? 's' : ''}
                        </Typography>
                      )}

                      {recipientSummary.teamGroups > 0 && (
                        <Typography variant="body2">
                          {recipientSummary.teamGroups} team group
                          {recipientSummary.teamGroups !== 1 ? 's' : ''}
                        </Typography>
                      )}

                      {recipientSummary.roleGroups > 0 && (
                        <Typography variant="body2">
                          {recipientSummary.roleGroups} role group
                          {recipientSummary.roleGroups !== 1 ? 's' : ''}
                        </Typography>
                      )}

                      <Divider />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Total Recipients:
                        </Typography>
                        <Typography variant="caption" fontWeight="medium">
                          {recipientSummary.totalRecipients}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Paper>
        )}

        {/* Attachments Summary */}
        {showAttachmentSummary && state.attachments.length > 0 && (
          <Paper variant="outlined">
            <Accordion
              expanded={expandedAccordions.has('attachments')}
              onChange={handleAccordionChange('attachments')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AttachmentIcon fontSize="small" />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Attachments
                  </Typography>
                  <Chip label={attachmentSummary.totalAttachments} size="small" color="primary" />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <List dense>
                    {state.attachments.map((attachment) => (
                      <ListItem key={attachment.id}>
                        <ListItemText
                          primary={attachment.name}
                          secondary={`${formatFileSize(attachment.size)} • ${attachment.status}`}
                          primaryTypographyProps={{
                            variant: 'body2',
                            noWrap: true,
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                            color: attachment.status === 'error' ? 'error' : 'text.secondary',
                          }}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Remove attachment">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => actions.removeAttachment(attachment.id)}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Size:
                    </Typography>
                    <Typography variant="caption" fontWeight="medium">
                      {formatFileSize(attachmentSummary.totalSize)}
                    </Typography>
                  </Box>

                  {attachmentSummary.uploadedCount < attachmentSummary.totalAttachments && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        {attachmentSummary.totalAttachments - attachmentSummary.uploadedCount}{' '}
                        attachment
                        {attachmentSummary.totalAttachments - attachmentSummary.uploadedCount !== 1
                          ? 's'
                          : ''}{' '}
                        still uploading
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};

export const ComposeSidebar = React.memo(ComposeSidebarComponent);
ComposeSidebar.displayName = 'ComposeSidebar';
