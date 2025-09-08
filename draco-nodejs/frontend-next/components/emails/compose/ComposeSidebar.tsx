'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Description as TemplateIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import { useAuth } from '../../../context/AuthContext';
import { createEmailService } from '../../../services/emailService';
import { EmailTemplate } from '../../../types/emails/email';
import {
  EmailComposeState,
  EmailComposeActions,
  validateComposeData,
} from '../../../types/emails/compose';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { EmailRecipientError, EmailRecipientErrorCode } from '../../../types/errors';
import { createEmailRecipientError, safeAsync } from '../../../utils/errorHandling';

// Shared styling constants to eliminate DRY violations
const SECTION_STYLES = {
  padding: 2,
  borderRadius: 1,
  border: '2px solid',
} as const;

const SPACING_CONSTANTS = {
  ICON_TEXT_ALIGNMENT: 4, // Consistent alignment for icon + text combinations
  SECTION_SPACING: 2,
  COMPACT_SPACING: 1,
} as const;

const COMMON_BORDER_STYLES = {
  outlined: {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
  },
  section: {
    ...SECTION_STYLES,
  },
} as const;

// Accessibility constants
const ARIA_LABELS = {
  CLEAR_TEMPLATE: 'Clear selected template',
  SELECT_TEMPLATE: 'Select template:',
} as const;

interface ComposeSidebarProps {
  state: EmailComposeState;
  actions: EmailComposeActions;
  accountId: string;
  showTemplates?: boolean;
  compact?: boolean;
}

export default function ComposeSidebar({
  state,
  actions,
  accountId,
  showTemplates = true,
  compact = false,
}: ComposeSidebarProps) {
  const { token } = useAuth();
  const theme = useTheme();

  // Real-time validation for contextual error display
  const validation = useMemo(() => validateComposeData(state, state.config), [state]);

  // Template state
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

  // Handle template selection with keyboard support
  const handleTemplateSelect = useCallback(
    (template: EmailTemplate) => {
      actions.selectTemplate(template);
    },
    [actions],
  );

  // Handle keyboard navigation for template selection
  const handleTemplateKeyDown = useCallback(
    (event: React.KeyboardEvent, template: EmailTemplate) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleTemplateSelect(template);
      }
    },
    [handleTemplateSelect],
  );

  // Handle keyboard navigation for clear template button
  const handleClearTemplateKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        actions.clearTemplate();
      }
    },
    [actions],
  );

  // Get template variables

  return (
    <Box sx={{ width: compact ? '100%' : 320, minWidth: compact ? 'auto' : 320 }}>
      <Stack
        spacing={compact ? SPACING_CONSTANTS.COMPACT_SPACING : SPACING_CONSTANTS.SECTION_SPACING}
      >
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
                    <TemplateIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography
                      variant="subtitle1"
                      fontWeight="medium"
                      sx={{ color: 'primary.main' }}
                    >
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
                      <Box
                        sx={{
                          ...COMMON_BORDER_STYLES.section,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          borderColor: 'primary.main',
                        }}
                        role="region"
                        aria-label="Selected template"
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <CheckCircleIcon
                            sx={{
                              color: 'primary.contrastText',
                              fontSize: '1.25rem',
                            }}
                          />
                          <Typography
                            variant="subtitle2"
                            fontWeight="medium"
                            sx={{ color: 'inherit', flex: 1 }}
                          >
                            {state.selectedTemplate.name}
                          </Typography>
                          <Tooltip title={ARIA_LABELS.CLEAR_TEMPLATE}>
                            <IconButton
                              size="small"
                              onClick={actions.clearTemplate}
                              onKeyDown={handleClearTemplateKeyDown}
                              aria-label={ARIA_LABELS.CLEAR_TEMPLATE}
                              sx={{
                                color: 'primary.contrastText',
                                '&:hover': {
                                  bgcolor:
                                    theme.palette.mode === 'dark'
                                      ? 'rgba(255, 255, 255, 0.15)'
                                      : 'rgba(255, 255, 255, 0.1)',
                                },
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        {state.selectedTemplate.description && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'primary.contrastText',
                              opacity: theme.palette.mode === 'dark' ? 0.95 : 0.9, // Better dark mode visibility
                              display: 'block',
                              ml: SPACING_CONSTANTS.ICON_TEXT_ALIGNMENT, // Align with the text above (icon + spacing)
                            }}
                          >
                            {state.selectedTemplate.description}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Template validation errors */}
                    {validation.errors
                      .filter((error) => error.field === 'template')
                      .map((error, index) => (
                        <Alert key={`template-error-${index}`} severity="error" variant="outlined">
                          {error.message}
                        </Alert>
                      ))}

                    {/* Template List */}
                    {!loadingTemplates && !templatesError && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Available Templates
                        </Typography>
                        {templates.length === 0 ? (
                          <Alert severity="info">
                            No templates found. You can create templates in the template manager.
                          </Alert>
                        ) : (
                          <Stack spacing={1}>
                            {templates
                              .filter((template) => state.selectedTemplate?.id !== template.id)
                              .map((template) => (
                                <Paper
                                  key={template.id}
                                  variant="outlined"
                                  component="button"
                                  sx={{
                                    p: 1.5,
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' },
                                    '&:focus': {
                                      bgcolor: 'action.hover',
                                      outline: `2px solid ${theme.palette.primary.main}`,
                                      outlineOffset: 1,
                                    },
                                    bgcolor: 'transparent',
                                    borderColor: 'divider',
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    borderRadius: 1,
                                    '&:focus-visible': {
                                      outline: `2px solid ${theme.palette.primary.main}`,
                                      outlineOffset: 1,
                                    },
                                  }}
                                  onClick={() => handleTemplateSelect(template)}
                                  onKeyDown={(e) => handleTemplateKeyDown(e, template)}
                                  aria-label={`${ARIA_LABELS.SELECT_TEMPLATE} ${template.name}`}
                                  tabIndex={0}
                                  role="button"
                                >
                                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                                    {template.name}
                                  </Typography>
                                  {template.description && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      {template.description}
                                    </Typography>
                                  )}
                                </Paper>
                              ))}
                          </Stack>
                        )}
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </ErrorBoundary>
        )}
      </Stack>
    </Box>
  );
}
