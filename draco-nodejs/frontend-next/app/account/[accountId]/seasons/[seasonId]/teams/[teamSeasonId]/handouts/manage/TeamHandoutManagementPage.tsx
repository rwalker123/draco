'use client';

import React from 'react';
import { Fab } from '@mui/material';
import { useParams } from 'next/navigation';
import HandoutSection from '@/components/handouts/HandoutSection';
import AddIcon from '@mui/icons-material/Add';
import TeamHandoutPageLayout from '@/components/handouts/TeamHandoutPageLayout';
import { useTeamHandoutHeader } from '@/hooks/useTeamHandoutHeader';

const TeamHandoutManagementPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const seasonIdParam = params?.seasonId;
  const teamSeasonIdParam = params?.teamSeasonId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const teamSeasonId = Array.isArray(teamSeasonIdParam) ? teamSeasonIdParam[0] : teamSeasonIdParam;

  const { teamHeader, loading, error } = useTeamHandoutHeader({
    accountId,
    seasonId,
    teamSeasonId,
  });

  if (!accountId || !seasonId || !teamSeasonId) {
    return null;
  }

  const breadcrumbHref = `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`;

  return (
    <TeamHandoutPageLayout
      accountId={accountId}
      teamHeader={teamHeader}
      loading={loading}
      error={error}
      title={
        teamHeader?.teamName
          ? `${teamHeader.teamName} Handout Management`
          : 'Team Handout Management'
      }
      breadcrumbHref={breadcrumbHref}
    >
      {teamHeader ? (
        <HandoutSection
          scope={{ type: 'team', accountId, teamId: teamHeader.teamId }}
          title="Manage Team Handouts"
          description="Upload new files or refresh your team resources."
          allowManage
          variant="panel"
          emptyMessage="No team handouts have been added yet."
          renderCreateTrigger={({ openCreate, disabled }) => (
            <Fab
              color="primary"
              aria-label="Add team handout"
              onClick={openCreate}
              disabled={disabled}
              sx={{
                position: 'fixed',
                bottom: { xs: 24, md: 32 },
                right: { xs: 24, md: 32 },
                zIndex: (theme) => theme.zIndex.tooltip,
              }}
            >
              <AddIcon />
            </Fab>
          )}
        />
      ) : null}
    </TeamHandoutPageLayout>
  );
};

export default TeamHandoutManagementPage;
