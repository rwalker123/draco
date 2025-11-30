import { AnnouncementType } from '@draco/shared-schemas';
import { AccountSettingsService } from './accountSettingsService.js';
import {
  composeGameResultMessage,
  type GameResultPostPayload,
} from './socialGameResultFormatter.js';
import {
  composeWorkoutAnnouncementMessage,
  type WorkoutPostPayload,
} from './socialWorkoutFormatter.js';
import { stripHtml } from '../utils/emailContent.js';

export class FacebookIntegrationService {
  private readonly accountSettingsService = new AccountSettingsService();

  async publishGameResult(accountId: bigint, payload: GameResultPostPayload): Promise<void> {
    try {
      if (!(await this.shouldPostGameResults(accountId))) {
        return;
      }

      const message = composeGameResultMessage(payload, { characterLimit: 2000 });
      if (!message) {
        return;
      }

      await this.postToFacebook(accountId, message, {
        context: 'gameResult',
        resourceId: payload.gameId.toString(),
      });
    } catch (error) {
      console.error('[facebook] Failed to publish game result', {
        accountId: accountId.toString(),
        gameId: payload.gameId.toString(),
        error,
      });
    }
  }

  async publishAnnouncement(accountId: bigint, announcement: AnnouncementType): Promise<void> {
    try {
      if (!(await this.shouldPostAnnouncements(accountId))) {
        return;
      }

      const message = this.composeAnnouncement(accountId, announcement);
      if (!message) {
        return;
      }

      await this.postToFacebook(accountId, message, {
        context: 'announcement',
        resourceId: announcement.id?.toString(),
      });
    } catch (error) {
      console.error('[facebook] Failed to publish announcement', {
        accountId: accountId.toString(),
        announcementId: announcement.id,
        error,
      });
    }
  }

  async publishWorkout(accountId: bigint, payload: WorkoutPostPayload): Promise<void> {
    try {
      if (!(await this.shouldPostWorkouts(accountId))) {
        return;
      }

      const message = composeWorkoutAnnouncementMessage(payload, { characterLimit: 2000 });
      if (!message) {
        return;
      }

      await this.postToFacebook(accountId, message, {
        context: 'workout',
        resourceId: payload.workoutId.toString(),
      });
    } catch (error) {
      console.error('[facebook] Failed to publish workout', {
        accountId: accountId.toString(),
        workoutId: payload.workoutId.toString(),
        error,
      });
    }
  }

  private async shouldPostGameResults(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const setting = settings.find((item) => item.definition.key === 'PostGameResultsToFacebook');
    return Boolean(setting?.effectiveValue);
  }

  private async shouldPostAnnouncements(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const setting = settings.find((item) => item.definition.key === 'PostAnnouncementsToFacebook');
    return Boolean(setting?.effectiveValue);
  }

  private async shouldPostWorkouts(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const setting = settings.find((item) => item.definition.key === 'PostWorkoutsToFacebook');
    return Boolean(setting?.effectiveValue);
  }

  private composeAnnouncement(accountId: bigint, announcement: AnnouncementType): string | null {
    const title = announcement.title?.trim();
    const body = stripHtml(announcement.body ?? '').trim();
    const url = this.buildAnnouncementUrl(accountId);

    const pieces = [title, body].filter(Boolean).join(': ').trim();
    const message = [pieces, url].filter(Boolean).join(' ').trim();

    return message || null;
  }

  private buildAnnouncementUrl(accountId: bigint): string {
    const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
    const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalized}/account/${accountId.toString()}/announcements`;
  }

  /**
   * Placeholder for Facebook publish integration. The message is logged to preserve parity with
   * other social integrations until a Graph API client is wired in.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async postToFacebook(
    accountId: bigint,
    message: string,
    context: { context: string; resourceId?: string },
  ): Promise<void> {
    console.info('[facebook] Post queued', {
      accountId: accountId.toString(),
      message,
      ...context,
    });
  }
}
