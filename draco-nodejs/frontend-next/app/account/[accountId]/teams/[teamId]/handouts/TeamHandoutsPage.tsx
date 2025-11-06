'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import HandoutSection from '@/components/handouts/HandoutSection';
import TeamHandoutPageLayout from '@/components/handouts/TeamHandoutPageLayout';
import { useTeamHandoutHeader } from '@/hooks/useTeamHandoutHeader';

const TeamHandoutsPage: React.FC = () => {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const teamIdParam = params?.teamId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const teamId = Array.isArray(teamIdParam) ? teamIdParam[0] : teamIdParam;

  const { teamHeader, loading, error, notMember } = useTeamHandoutHeader({
    accountId,
    teamId,
  });

  if (!accountId || !teamId) {
    return null;
  }

  const breadcrumbHref =
    teamHeader?.seasonId && teamHeader.teamSeasonId
      ? `/account/${accountId}/seasons/${teamHeader.seasonId}/teams/${teamHeader.teamSeasonId}`
      : undefined;

  const title = teamHeader?.teamName ? `${teamHeader.teamName} Handouts` : 'Team Handouts';

  return (
    <TeamHandoutPageLayout
      accountId={accountId}
      teamHeader={teamHeader}
      loading={loading}
      error={error}
      title={title}
      breadcrumbHref={breadcrumbHref}
      notAuthorized={notMember}
      notAuthorizedMessage="Team handouts are only available to team members."
    >
      {teamHeader && !notMember ? (
        <HandoutSection
          scope={{ type: 'team', accountId, teamId: teamHeader.teamId }}
          title="Team Handouts"
          description="Download the documents shared with your team."
          allowManage={false}
          variant="panel"
          emptyMessage="No team handouts have been posted yet."
          hideWhenEmpty
        />
      ) : null}
    </TeamHandoutPageLayout>
  );
};

export default TeamHandoutsPage;
