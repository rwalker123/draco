import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { axiosInstance } from '../utils/axiosConfig';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getGameSummary({
  accountId,
  seasonId,
  gameId,
  teamSeasonId,
}: {
  accountId: string;
  seasonId: string;
  gameId: string;
  teamSeasonId: string;
  token?: string;
}) {
  const url = `/api/accounts/${accountId}/seasons/${seasonId}/games/${gameId}/recap/${teamSeasonId}`;
  const res = await axiosInstance.get(url);
  const data = res.data;
  return data.data?.recap || '';
}

export async function saveGameSummary({
  accountId,
  seasonId,
  gameId,
  teamSeasonId,
  summary,
}: {
  accountId: string;
  seasonId: string;
  gameId: string;
  teamSeasonId: string;
  summary: string;
  token: string;
}) {
  const res = await axiosInstance.put(
    `/api/accounts/${accountId}/seasons/${seasonId}/games/${gameId}/recap/${teamSeasonId}`,
    { recap: summary },
  );
  const data = res.data;
  return data.data?.recap || '';
}
