import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getGameRecap, upsertGameRecap } from '@draco/shared-api-client';
import { createApiClient } from './apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';

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
  token?: string;
}) {
  const client = createApiClient({ token });
  const result = await getGameRecap({
    client,
    path: { accountId, seasonId, gameId, teamSeasonId },
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to fetch game summary');
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
  const client = createApiClient({ token });
  const result = await upsertGameRecap({
    client,
    path: { accountId, seasonId, gameId, teamSeasonId },
    body: { recap: summary },
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to save game summary');
}
