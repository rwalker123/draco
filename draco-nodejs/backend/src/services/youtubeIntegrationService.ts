import { YouTubeIngestionTarget } from '../config/socialIngestion.js';
import { RepositoryFactory } from '../repositories/index.js';

/**
 * Resolves YouTube ingestion targets for both account-wide and team-specific channels.
 * It queries the repositories directly each time (no caching) so the results reflect
 * the latest channel configuration and current-season selections.
 */
export class YouTubeIntegrationService {
  private readonly accountRepository = RepositoryFactory.getAccountRepository();
  private readonly teamRepository = RepositoryFactory.getTeamRepository();
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();

  /**
   * Combines account-scoped and team-scoped YouTube ingestion targets,
   * filters out entries without valid channel IDs, and deduplicates the result
   * by account, season, team, teamSeason, and channel ID.
   */
  async listIngestionTargets(): Promise<YouTubeIngestionTarget[]> {
    const [accountTargets, teamTargets] = await Promise.all([
      this.listAccountTargets(),
      this.listTeamTargets(),
    ]);

    const deduped: YouTubeIngestionTarget[] = [];
    const seen = new Set<string>();

    for (const target of [...accountTargets, ...teamTargets]) {
      const channelId = target.channelId.trim();
      if (!channelId) {
        continue;
      }

      const key = [
        target.accountId.toString(),
        target.seasonId.toString(),
        target.teamId ? target.teamId.toString() : '',
        target.teamSeasonId ? target.teamSeasonId.toString() : '',
        channelId,
      ].join(':');

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      deduped.push({ ...target, channelId });
    }

    return deduped;
  }

  private async listAccountTargets(): Promise<YouTubeIngestionTarget[]> {
    const accounts = await this.accountRepository.findMany({
      youtubeuserid: {
        not: null,
      },
    });

    if (!accounts.length) {
      return [];
    }

    const targets: YouTubeIngestionTarget[] = [];

    for (const account of accounts) {
      const channelId = this.normalizeChannelId(account.youtubeuserid);

      if (!channelId) {
        continue;
      }

      const seasonId = await this.resolveAccountSeasonId(account.id);
      if (!seasonId) {
        console.warn(
          '[youtube] Skipping account-scoped ingestion target because no season is configured',
          { accountId: account.id.toString() },
        );
        continue;
      }

      targets.push({
        accountId: account.id,
        seasonId,
        channelId,
      });
    }

    return targets;
  }

  private async listTeamTargets(): Promise<YouTubeIngestionTarget[]> {
    const teamSeasons = await this.teamRepository.findTeamSeasonsWithYouTube();

    if (!teamSeasons.length) {
      return [];
    }

    const targets: YouTubeIngestionTarget[] = [];

    for (const record of teamSeasons) {
      const channelId = this.normalizeChannelId(record.teams?.youtubeuserid ?? null);
      const accountId = record.teams?.accountid;
      const seasonId = record.leagueseason?.seasonid ?? null;

      if (!channelId || !accountId || !seasonId) {
        continue;
      }

      const currentSeasonId = await this.getCurrentSeasonId(accountId);

      if (!currentSeasonId) {
        console.warn(
          '[youtube] Skipping team-scoped ingestion target because no current season is set',
          {
            accountId: accountId.toString(),
            teamSeasonId: record.id.toString(),
          },
        );
        continue;
      }

      if (seasonId !== currentSeasonId) {
        console.info('[youtube] Skipping team-scoped ingestion target outside current season', {
          accountId: accountId.toString(),
          teamSeasonId: record.id.toString(),
          targetSeasonId: seasonId.toString(),
          currentSeasonId: currentSeasonId.toString(),
        });
        continue;
      }

      const teamId = record.teams?.id;
      if (!teamId) {
        continue;
      }

      targets.push({
        accountId,
        seasonId,
        teamId,
        teamSeasonId: record.id,
        channelId,
      });
    }

    return targets;
  }

  private normalizeChannelId(channelId: string | null | undefined): string | null {
    if (!channelId) {
      return null;
    }

    const trimmed = channelId.trim();
    if (!trimmed) {
      return null;
    }

    const ucIdMatch = trimmed.match(/^UC[0-9A-Za-z_-]{22}$/);
    if (ucIdMatch) {
      return ucIdMatch[0];
    }

    try {
      const parsed = new URL(trimmed);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const channelIndex = segments.findIndex((segment) => segment.toLowerCase() === 'channel');
      if (channelIndex >= 0 && channelIndex + 1 < segments.length) {
        const candidate = segments[channelIndex + 1];
        if (/^UC[0-9A-Za-z_-]{22}$/.test(candidate)) {
          return candidate;
        }
      }

      const queryChannelId = parsed.searchParams.get('channelId');
      if (queryChannelId && /^UC[0-9A-Za-z_-]{22}$/.test(queryChannelId)) {
        return queryChannelId;
      }
    } catch {
      // Not a full URL, fall through to generic matching
    }

    const fallback = trimmed.match(/UC[0-9A-Za-z_-]{22}/);
    return fallback ? fallback[0] : null;
  }

  private async resolveAccountSeasonId(accountId: bigint): Promise<bigint | null> {
    const currentSeasonId = await this.getCurrentSeasonId(accountId);
    if (currentSeasonId) {
      return currentSeasonId;
    }

    const seasons = await this.seasonsRepository.findAccountSeasons(accountId, false);
    let fallbackId: bigint | null = null;

    for (const season of seasons) {
      if (fallbackId === null || season.id > fallbackId) {
        fallbackId = season.id;
      }
    }

    return fallbackId;
  }

  private async getCurrentSeasonId(accountId: bigint): Promise<bigint | null> {
    const currentSeason = await this.seasonsRepository.findCurrentSeason(accountId);
    return currentSeason?.id ?? null;
  }
}
