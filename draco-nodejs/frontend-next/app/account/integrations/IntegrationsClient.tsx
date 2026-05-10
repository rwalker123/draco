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
import { useNotifications } from '@/hooks/useNotifications';
import NotificationSnackbar from '@/components/common/NotificationSnackbar';
import OneClickCard from './_components/OneClickCard';
import CodeSnippetCard from './_components/CodeSnippetCard';
import CopyableUrl from './_components/CopyableUrl';

const CURSOR_SNIPPET = `{
  "mcpServers": {
    "draco": {
      "url": "DRACO_MCP_URL"
    }
  }
}`;

const VSCODE_SNIPPET = `{
  "mcp": {
    "servers": {
      "draco": {
        "type": "http",
        "url": "DRACO_MCP_URL"
      }
    }
  }
}`;

const FAQ_ITEMS = [
  {
    question: 'What is MCP?',
    answer:
      'Model Context Protocol — an open standard for connecting AI assistants to data sources. Anthropic, OpenAI, and others have built support for it.',
  },
  {
    question: 'What can the AI see?',
    answer:
      'Read-only access to your accounts, teams, schedules, stats, and team managers. It cannot make changes, send messages, or see other users’ data.',
  },
  {
    question: 'What does it cost me?',
    answer:
      'Nothing. Your AI provider runs the conversation (Claude, ChatGPT, etc.). Draco just answers when asked.',
  },
  {
    question: 'How do I disconnect?',
    answer:
      'From your AI client’s settings, remove the Draco connector. Or contact us to revoke access from our side.',
  },
  {
    question: 'What if it doesn’t work?',
    answer:
      'Make sure you’re logged into Draco in this browser. Try removing and re-adding the connector. Check that your AI client supports remote MCP servers (most do as of 2026).',
  },
];

interface IntegrationsClientProps {
  mcpUrl: string | undefined;
}

export default function IntegrationsClient({ mcpUrl }: IntegrationsClientProps) {
  const theme = useTheme();
  const { notification, showNotification, hideNotification } = useNotifications();
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  const handleFaqChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFaq(isExpanded ? panel : false);
  };

  const handleCopied = (label: string) => {
    showNotification(`${label} copied to clipboard`, 'success');
  };

  const handleClaudeAiClick = async () => {
    if (!mcpUrl) return;
    await navigator.clipboard.writeText(mcpUrl);
    showNotification(
      'MCP URL copied — paste it into Claude’s Settings → Connectors → Add Connector',
      'info',
    );
  };

  const handleClaudeDesktopClick = async () => {
    if (!mcpUrl) return;
    await navigator.clipboard.writeText(mcpUrl);
    showNotification('MCP URL copied — paste it into Claude Desktop’s MCP server settings', 'info');
  };

  const handleChatGptClick = async () => {
    if (!mcpUrl) return;
    await navigator.clipboard.writeText(mcpUrl);
    showNotification('MCP URL copied — follow the setup steps below to add it to ChatGPT', 'info');
  };

  const cursorSnippet = mcpUrl ? CURSOR_SNIPPET.replace('DRACO_MCP_URL', mcpUrl) : CURSOR_SNIPPET;
  const vscodeSnippet = mcpUrl ? VSCODE_SNIPPET.replace('DRACO_MCP_URL', mcpUrl) : VSCODE_SNIPPET;

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
            Connect your favorite AI assistant to Draco so you can ask it about your team —
            when&apos;s my next game, who&apos;s my manager, how am I batting? Your AI provider runs
            the conversation; Draco just answers the questions about your data.
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
            One-click setup
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These AI assistants support remote MCP servers. Clicking the button will open the
            provider&apos;s site and copy your Draco MCP URL to the clipboard.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <OneClickCard
                title="Claude.ai"
                description="Use Claude in your browser at claude.ai."
                note="Requires Claude Pro, Max, or Team plan."
                primaryButtonLabel="Open Claude Connectors"
                primaryButtonHref="https://claude.ai/customize/connectors"
                onPrimaryClick={handleClaudeAiClick}
                badge="Recommended"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <OneClickCard
                title="Claude Desktop"
                description="The standalone Claude app for Mac, Windows, and Linux."
                note="Requires Claude Desktop with MCP support enabled."
                primaryButtonLabel="Open Claude Desktop site"
                primaryButtonHref="https://claude.ai/download"
                onPrimaryClick={handleClaudeDesktopClick}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <OneClickCard
                title="ChatGPT"
                description="Use ChatGPT (Plus or Pro) with your Draco data."
                note="Requires ChatGPT Plus or Pro. Remote MCP connector support is rolling out."
                primaryButtonLabel="Open ChatGPT"
                primaryButtonHref="https://chatgpt.com"
                onPrimaryClick={handleChatGptClick}
                steps={[
                  { label: 'Sign in to ChatGPT (Plus or Pro required).' },
                  { label: 'Open Settings → Connectors (or Data Sources).' },
                  { label: 'Choose “Add custom connector” or “Add MCP server”.' },
                  { label: 'Paste the Draco MCP URL that was just copied to your clipboard.' },
                  { label: 'Approve the OAuth connection in the browser window that opens.' },
                ]}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Other AI clients
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            For developer tools, copy the snippet below and add it to your client&apos;s MCP
            configuration file.
          </Typography>
          <Stack spacing={2}>
            <CodeSnippetCard
              title="Cursor"
              description="AI code editor. Add the snippet to your global or project-level MCP config."
              snippet={cursorSnippet}
              copyLabel="Copy snippet"
              instruction="Settings → MCP → paste into mcp.json"
              onCopy={() => handleCopied('Cursor snippet')}
            />
            <CodeSnippetCard
              title="VS Code (GitHub Copilot)"
              description="VS Code with GitHub Copilot. Add the snippet to your user settings.json."
              snippet={vscodeSnippet}
              copyLabel="Copy snippet"
              instruction="Settings → search “mcp” → Edit in settings.json"
              onCopy={() => handleCopied('VS Code snippet')}
            />

            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Any other MCP client
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Copy the URL below and add it as a new remote MCP server in your client&apos;s
                settings.
              </Typography>
              <CopyableUrl url={mcpUrl} onCopy={() => handleCopied('URL')} />
              <Box component="ol" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Open your AI client&apos;s MCP or connector settings.
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Add a new server with the URL above.
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Approve the connection in your browser when prompted.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Frequently asked questions
          </Typography>
          {FAQ_ITEMS.map((item, i) => (
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
