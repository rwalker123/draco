'use client';

import { useParams } from 'next/navigation';
import PlayerClassifieds from './PlayerClassifieds';

// Test if console logging is working
console.log('🔧 PlayerClassifiedsClientWrapper.tsx loaded');
console.error('🚨 ERROR TEST 3 - This should definitely show up');

export default function PlayerClassifiedsClientWrapper() {
  console.log('🔧 PlayerClassifiedsClientWrapper component rendering');
  console.error('🚨 ERROR TEST 4 - This should definitely show up');

  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  if (!accountIdStr) {
    return <div>Account ID not found</div>;
  }

  // Player Classifieds allows public access to TeamsWanted tab
  // Authentication is handled at the component level for specific features
  return (
    <div>
      {/* TEST BANNER - IF YOU SEE THIS, THE FILE IS UPDATED */}
      <div
        style={{
          backgroundColor: 'orange',
          color: 'white',
          padding: '16px',
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '16px',
        }}
      >
        🟠 TEST BANNER - CLIENT WRAPPER FILE UPDATED! 🟠
      </div>

      <PlayerClassifieds accountId={accountIdStr} />
    </div>
  );
}
