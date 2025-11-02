'use client';

import { useParams } from 'next/navigation';
import PlayerClassifieds from './PlayerClassifieds';

export default function PlayerClassifiedsClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId)
    ? params.accountId[0]
    : (params.accountId ?? '');

  return <PlayerClassifieds accountId={accountId} />;
}
