import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getGameSummary({
  accountId,
  seasonId,
  gameId,
  teamSeasonId,
  token,
}: {
  accountId: string;
  seasonId: string;
  gameId: string;
  teamSeasonId: string;
  token: string;
}) {
  const res = await fetch(
    `/api/accounts/${accountId}/seasons/${seasonId}/games/${gameId}/recap/${teamSeasonId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch game summary');
  const data = await res.json();
  return data.data?.recap || '';
}

export async function saveGameSummary({
  accountId,
  seasonId,
  gameId,
  teamSeasonId,
  summary,
  token,
}: {
  accountId: string;
  seasonId: string;
  gameId: string;
  teamSeasonId: string;
  summary: string;
  token: string;
}) {
  const res = await fetch(
    `/api/accounts/${accountId}/seasons/${seasonId}/games/${gameId}/recap/${teamSeasonId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recap: summary }),
    },
  );
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to save game summary');
  const data = await res.json();
  return data.data?.recap || '';
}
