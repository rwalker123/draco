'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HubIcon from '@mui/icons-material/Hub';
import { useTheme } from '@mui/material/styles';
import { useAccount } from '@/context/AccountContext';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationSnackbar from '@/components/common/NotificationSnackbar';
import CopyableUrl from './_components/CopyableUrl';

const EXAMPLE_PROMPT_GROUPS: { heading: string; prompts: string[] }[] = [
  {
    heading: 'Your team and schedule',
    prompts: [
      'When are my next games?',
      'What teams am I on this season?',
      'Show me my team’s recent results.',
      'Who manages my team?',
      'Who else is on my team roster?',
    ],
  },
  {
    heading: 'Your stats',
    prompts: [
      'How am I batting this season?',
      'Show my career pitching stats.',
      'How does my batting average compare across seasons?',
    ],
  },
  {
    heading: 'League leaders and standings',
    prompts: [
      'Who leads the league in home runs?',
      'Show me the top 10 hitters by batting average.',
      'Who has the lowest ERA in the league this season?',
      'Show me the current standings.',
      'Who’s in first place in the 18+ League?',
    ],
  },
  {
    heading: 'Look up other players and teams',
    prompts: [
      'Find a player named Smith.',
      'What are John Doe’s career stats?',
      'How is the Tigers team doing in batting this season?',
      'Show me the Tigers pitching stats.',
    ],
  },
];

const buildFaqItems = (brandName: string) => [
  {
    question: 'What is MCP?',
    answer:
      'Model Context Protocol — an open standard for connecting AI assistants to data sources. Anthropic, OpenAI, and others have built support for it.',
  },
  {
    question: 'What can the AI see?',
    answer:
      'Read-only access to your accounts, teams, schedules, stats, and team managers. It cannot make changes or send messages.',
  },
  {
    question: 'What does it cost me?',
    answer: `Your AI provider runs the conversation (Claude, ChatGPT, etc.). ${brandName} just answers when asked. Costs are whatever you pay your AI Provider.`,
  },
  {
    question: 'How do I disconnect?',
    answer: `From your AI client, ask it to remove the MCP.`,
  },
  {
    question: 'What if it doesn’t work?',
    answer: `Make sure you’re logged into ${brandName} in this browser. Try removing and re-adding the connector. Check that your AI client supports remote MCP servers (most do as of 2026).`,
  },
];

interface IntegrationsClientProps {
  mcpUrl: string | undefined;
}

export default function IntegrationsClient({ mcpUrl }: IntegrationsClientProps) {
  const theme = useTheme();
  const { currentAccount } = useAccount();
  const { notification, showNotification, hideNotification } = useNotifications();
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  const brandName = currentAccount?.name ?? 'ezRecSports';
  const faqItems = buildFaqItems(brandName);

  const handleFaqChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFaq(isExpanded ? panel : false);
  };

  const handleCopied = (label: string) => {
    showNotification(`${label} copied to clipboard`, 'success');
  };

  const setupPrompt = mcpUrl ? `Add this remote MCP server and help me sign in: ${mcpUrl}` : '';

  if (!mcpUrl) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: 560 }}>
          The MCP server URL is not configured. Please contact support or check back later.
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Stack spacing={5}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <HubIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h4" fontWeight={700}>
              AI Assistant Integrations
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 620 }}>
            Connect your favorite AI assistant to {brandName} so you can ask it about your team
            &mdash; when&apos;s my next game, who&apos;s my manager, how am I batting? Your AI
            provider runs the conversation; {brandName} just answers the questions about your data.
          </Typography>
          <Chip
            label="Read-only — these tools cannot make changes to your account"
            color="default"
            size="small"
            variant="outlined"
            sx={{ fontStyle: 'italic' }}
          />
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            What you can ask
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Once connected, talk to your AI assistant in plain English. Here are some examples to
            try.
          </Typography>
          <Grid container spacing={2}>
            {EXAMPLE_PROMPT_GROUPS.map((group) => (
              <Grid key={group.heading} size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 2,
                    height: '100%',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    {group.heading}
                  </Typography>
                  <Stack spacing={0.75} component="ul" sx={{ pl: 2, m: 0 }}>
                    {group.prompts.map((p) => (
                      <Typography
                        key={p}
                        component="li"
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        “{p}”
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Set it up
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Copy the prompt below and paste it into your AI assistant (Claude, ChatGPT, Cursor,
            etc.). It will add {brandName} as a remote MCP server and walk you through signing in.
          </Typography>
          <CopyableUrl
            url={setupPrompt}
            label="prompt"
            multiline
            onCopy={() => handleCopied('Prompt')}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Prefer to add it manually? Use this MCP server URL in your client&apos;s connector
            settings:
          </Typography>
          <Box sx={{ mt: 1 }}>
            <CopyableUrl url={mcpUrl} onCopy={() => handleCopied('URL')} />
          </Box>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Frequently asked questions
          </Typography>
          {faqItems.map((item, i) => (
            <Accordion
              key={i}
              expanded={expandedFaq === `faq-${i}`}
              onChange={handleFaqChange(`faq-${i}`)}
              disableGutters
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                '&:not(:last-child)': { borderBottom: 0 },
                '&::before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body1" fontWeight={500}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Stack>

      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </Container>
  );
}
