'use client';

import HallOfFamePage from './HallOfFamePage';

interface HallOfFamePageClientProps {
  accountId: string;
}

export default function HallOfFamePageClient({ accountId }: HallOfFamePageClientProps) {
  return <HallOfFamePage accountId={accountId} />;
}
