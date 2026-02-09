'use client';

import React from 'react';
import {
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { type WelcomeMessageType } from '@draco/shared-schemas';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import WidgetShell from '../ui/WidgetShell';
import RichTextContent from '../common/RichTextContent';
import { useAuth } from '../../context/AuthContext';
import { useApiClient } from '../../hooks/useApiClient';
import { sanitizeRichContent } from '../../utils/sanitization';
import { WelcomeMessageService } from '../../services/welcomeMessageService';

export interface InformationWidgetProps {
  accountId: string;
  /**
   * Optional team identifier the widget is being rendered for. This should be
   * the persistent teamId and not the teamSeasonId.
   */
  teamId?: string | null;
  /**
   * Optional teamSeasonId that can be used to fetch scoped welcome messages.
   * When omitted, team messages are not requested.
   */
  teamSeasonId?: string | null;
  /** Should account-level welcome messages be displayed? */
  showAccountMessages?: boolean;
  /** Should team-scoped welcome messages be displayed? */
  showTeamMessages?: boolean;
  /** Hide the entire widget if there are no messages and no errors */
  hideWhenEmpty?: boolean;
  /** Notify parent when widget visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
  title?: string;
  emptyMessage?: string;
}

interface DisplayMessage extends WelcomeMessageType {
  sanitizedBody: string;
}

const sortMessages = (messages: DisplayMessage[]): DisplayMessage[] =>
  [...messages].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return Number.parseInt(a.id, 10) - Number.parseInt(b.id, 10);
  });

const buildDisplayMessage = (message: WelcomeMessageType): DisplayMessage => ({
  ...message,
  sanitizedBody: sanitizeRichContent(message.bodyHtml ?? ''),
});

const InformationWidget: React.FC<InformationWidgetProps> = ({
  accountId,
  teamId,
  teamSeasonId,
  showAccountMessages = true,
  showTeamMessages = Boolean(teamId && teamSeasonId),
  hideWhenEmpty = false,
  onVisibilityChange,
  title = 'Information',
  emptyMessage = 'No information messages have been published yet.',
}) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [messages, setMessages] = React.useState<DisplayMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const service = new WelcomeMessageService(token, apiClient);

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);

      try {
        const accountPromise = showAccountMessages
          ? service.listAccountMessages(accountId, controller.signal)
          : Promise.resolve<WelcomeMessageType[]>([]);

        const teamPromise =
          showTeamMessages && teamSeasonId
            ? service.listTeamMessages(accountId, { teamSeasonId }, controller.signal)
            : Promise.resolve<WelcomeMessageType[]>([]);

        const [accountMessages, teamMessages] = await Promise.all([accountPromise, teamPromise]);

        if (controller.signal.aborted) return;

        const combined = sortMessages([
          ...accountMessages.map(buildDisplayMessage),
          ...teamMessages.map(buildDisplayMessage),
        ]);

        setMessages(combined);
        setExpandedId((current) => current ?? combined[0]?.id ?? null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load information messages';
        setError(message);
        setMessages([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchMessages();

    return () => {
      controller.abort();
    };
  }, [accountId, showAccountMessages, showTeamMessages, teamSeasonId, token, apiClient]);

  const hasMessages = messages.length > 0;

  // When hideWhenEmpty is true, don't show anything during loading either
  // This prevents the flash of loading spinner before hiding
  const isVisible = hideWhenEmpty
    ? hasMessages || Boolean(error)
    : hasMessages || loading || Boolean(error);

  React.useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  if (!isVisible) {
    return null;
  }

  return (
    <WidgetShell title={title} accent="info" sx={{ pb: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : messages.length === 0 ? (
        <Alert severity="info">{emptyMessage}</Alert>
      ) : (
        <Stack spacing={2}>
          {messages.map((message) => (
            <Accordion
              key={message.id}
              expanded={expandedId === message.id}
              onChange={(_event, isExpanded) => setExpandedId(isExpanded ? message.id : null)}
              disableGutters
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ color: 'text.primary', '& .MuiAccordionSummary-content': { my: 0.5 } }}
              >
                <Typography variant="h6" component="h3" color="inherit">
                  {message.caption}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <RichTextContent html={message.sanitizedBody} sanitize={false} />
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </WidgetShell>
  );
};

export default InformationWidget;
