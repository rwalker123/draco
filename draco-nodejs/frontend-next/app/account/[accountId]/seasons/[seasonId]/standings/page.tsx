import { Metadata } from 'next';
import StandingsClientWrapper from './StandingsClientWrapper';

// Helper function to get account name for metadata
async function getAccountName(accountId: string): Promise<string> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/accounts/${accountId}/public`,
      { cache: 'force-cache' },
    );

    if (response.ok) {
      const data = await response.json();
      return data.data?.name || 'Unknown Account';
    }
  } catch (error) {
    console.error('Error fetching account name:', error);
  }
  return 'Account';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}): Promise<Metadata> {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);

  return {
    title: `${accountName} Standings`,
    description: `View league standings for ${accountName}`,
  };
}

export default function StandingsPage() {
  return <StandingsClientWrapper />;
}
