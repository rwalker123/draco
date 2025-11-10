import RosterCardPageClientWrapper from './RosterCardPageClientWrapper';

type TeamRosterCardPageProps = {
  params: Promise<{
    accountId: string;
    seasonId: string;
    teamSeasonId: string;
  }>;
};

const TeamRosterCardPage = async ({ params }: TeamRosterCardPageProps) => {
  const { accountId, seasonId, teamSeasonId } = await params;
  return (
    <RosterCardPageClientWrapper
      accountId={accountId}
      seasonId={seasonId}
      teamSeasonId={teamSeasonId}
    />
  );
};

export default TeamRosterCardPage;
