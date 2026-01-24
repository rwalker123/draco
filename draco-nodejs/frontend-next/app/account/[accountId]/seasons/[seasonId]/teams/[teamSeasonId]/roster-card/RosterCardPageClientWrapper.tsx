'use client';

import AccountOptional from '@/components/account/AccountOptional';
import RosterCardPageClient from './RosterCardPageClient';

interface RosterCardPageClientWrapperProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

const RosterCardPageClientWrapper: React.FC<RosterCardPageClientWrapperProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
}) => {
  return (
    <AccountOptional accountId={accountId} componentId="team.printableRosterCard">
      <RosterCardPageClient accountId={accountId} seasonId={seasonId} teamSeasonId={teamSeasonId} />
    </AccountOptional>
  );
};

export default RosterCardPageClientWrapper;
