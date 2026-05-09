'use client';

import { useParams } from 'next/navigation';
import PublicPlayerProfileClient from './PublicPlayerProfileClient';

export default function PublicPlayerProfileClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;

  return <PublicPlayerProfileClient accountId={accountId ?? ''} contactId={playerId ?? ''} />;
}
