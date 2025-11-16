'use client';

import React from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { type WelcomeMessageType } from '@draco/shared-schemas';

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

  const serviceRef = React.useRef(new WelcomeMessageService(token, apiClient));

  React.useEffect(() => {
    serviceRef.current = new WelcomeMessageService(token, apiClient);
  }, [token, apiClient]);

  const fetchMessages = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const accountPromise = showAccountMessages
        ? serviceRef.current.listAccountMessages(accountId)
        : Promise.resolve<WelcomeMessageType[]>([]);

      const teamPromise =
        showTeamMessages && teamSeasonId
          ? serviceRef.current.listTeamMessages(accountId, { teamSeasonId })
          : Promise.resolve<WelcomeMessageType[]>([]);

      const [accountMessages, teamMessages] = await Promise.all([accountPromise, teamPromise]);

      const combined = sortMessages([
        ...accountMessages.map(buildDisplayMessage),
        ...teamMessages.map(buildDisplayMessage),
      ]);

      setMessages(combined);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load information messages';
      setError(message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, showAccountMessages, showTeamMessages, teamSeasonId]);

  React.useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  const hasMessages = messages.length > 0;
  const shouldRender = hasMessages || loading || Boolean(error);

  const isVisible = shouldRender && !(hideWhenEmpty && !loading && !error && !hasMessages);

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
          {messages.map((message) => {
            return (
              <Card key={message.id} variant="outlined">
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="h6" component="h3">
                    {message.caption}
                  </Typography>
                  <RichTextContent html={message.sanitizedBody} sanitize={false} />
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </WidgetShell>
  );
};

export default InformationWidget;
