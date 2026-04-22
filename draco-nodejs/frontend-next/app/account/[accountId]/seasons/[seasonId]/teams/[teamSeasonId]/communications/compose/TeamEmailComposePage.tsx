'use client';

import React from 'react';
import { Box, Breadcrumbs, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { EmailComposePage } from '@/components/emails/compose';
import { useEmailCompose } from '@/components/emails/compose/EmailComposeProvider';
import TeamRosterRecipientPanel from '@/components/emails/recipients/TeamRosterRecipientPanel';
import AccountPageHeader from '@/components/AccountPageHeader';
import AccountOptional from '@/components/account/AccountOptional';
import type { EmailComposeConfig } from '@/types/emails/compose';
import type { ContactGroup, GroupType } from '@/types/emails/recipients';

interface TeamComposeHeaderProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

const TeamComposeHeader: React.FC<TeamComposeHeaderProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
}) => {
  const { state, actions } = useEmailCompose();

  const handleRecipientsChange = (groups: Map<GroupType, ContactGroup[]>) => {
    actions.updateSelectedGroups(groups);
  };

  const subjectError = state.errors.find((e) => e.field === 'subject');

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Stack spacing={2}>
        <TeamRosterRecipientPanel
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
          onRecipientsChange={handleRecipientsChange}
        />

        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mb: 0.5 }}>
            Subject
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter email subject…"
            value={state.subject}
            onChange={(event) => actions.setSubject(event.target.value)}
            disabled={state.isSending}
            error={Boolean(subjectError)}
            helperText={subjectError?.message}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

const TeamEmailComposePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;

  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : (accountIdParam ?? '');
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : (seasonIdParam ?? '');
  const teamSeasonId = Array.isArray(teamSeasonIdParam)
    ? teamSeasonIdParam[0]
    : (teamSeasonIdParam ?? '');

  if (!accountId || !seasonId || !teamSeasonId) {
    return null;
  }

  const teamOverviewHref = `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;

  const handleSendComplete = () => {
    router.push(
      `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/communications/history`,
    );
  };

  const composeConfig: Partial<EmailComposeConfig> = {
    scope: 'team',
    seasonId,
    teamSeasonId,
    allowAttachments: false,
    allowAdvancedRecipients: false,
    allowScheduling: false,
    renderRecipientPanel: () => (
      <TeamComposeHeader accountId={accountId} seasonId={seasonId} teamSeasonId={teamSeasonId} />
    ),
  };

  return (
    <AccountOptional accountId={accountId} componentId="team.emailCompose.page">
      <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AccountPageHeader accountId={accountId}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{ position: 'relative' }}
          >
            <Box sx={{ flex: 1, textAlign: 'center', mb: 2 }}>
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
                Compose Team Email
              </Typography>
            </Box>
          </Box>
        </AccountPageHeader>

        <Box sx={{ px: 3, pt: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" underline="hover" component={NextLink} href={teamOverviewHref}>
              Team Overview
            </Link>
            <Typography color="text.primary">Compose Email</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
          <EmailComposePage
            accountId={accountId}
            seasonId={seasonId}
            config={composeConfig}
            onSendComplete={handleSendComplete}
          />
        </Box>
      </Box>
    </AccountOptional>
  );
};

export default TeamEmailComposePage;
