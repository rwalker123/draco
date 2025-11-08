'use client';

import PlayerClassifieds from './PlayerClassifieds';

interface PlayerClassifiedsClientWrapperProps {
  accountId: string;
}

export default function PlayerClassifiedsClientWrapper({
  accountId,
}: PlayerClassifiedsClientWrapperProps) {
  return <PlayerClassifieds accountId={accountId} />;
}
