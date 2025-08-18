'use client';

import { useParams } from 'next/navigation';
import PlayerClassifieds from './PlayerClassifieds';

export default function PlayerClassifiedsClientWrapper() {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  if (!accountIdStr) {
    return <div>Account ID not found</div>;
  }

  // Player Classifieds allows public access to TeamsWanted tab
  // Authentication is handled at the component level for specific features
  return <PlayerClassifieds accountId={accountIdStr} />;
}
