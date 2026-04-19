import { getNextBackupTime } from './backupService.js';

const RAILWAY_API_ENDPOINT = 'https://backboard.railway.com/graphql/v2';

const RESTART_MUTATION = `
  mutation serviceInstanceRestart($serviceId: String!, $environmentId: String!) {
    serviceInstanceRestart(serviceId: $serviceId, environmentId: $environmentId)
  }
`;

interface RailwayGraphQLResponse {
  data?: unknown;
  errors?: Array<{ message: string }>;
}

export class FrontendRestartService {
  private scheduledTimeout: NodeJS.Timeout | null = null;
  private readonly restartHour = 3;
  private readonly restartMinuteOffsetMs = 30 * 60 * 1000;
  private readonly timezone = process.env.FRONTEND_RESTART_TIMEZONE || 'America/New_York';

  public start(): void {
    if (!this.hasRequiredConfig()) {
      console.warn(
        '⚠️ Frontend restart service disabled: RAILWAY_API_TOKEN, FRONTEND_SERVICE_ID, or RAILWAY_ENVIRONMENT_ID not set',
      );
      return;
    }

    if (this.scheduledTimeout) {
      this.stop();
    }

    this.scheduleNextRestart();
  }

  public stop(): void {
    if (this.scheduledTimeout) {
      clearTimeout(this.scheduledTimeout);
      this.scheduledTimeout = null;
    }
    console.log('🔄 Frontend restart service stopped');
  }

  public async restartFrontend(): Promise<void> {
    const token = process.env.RAILWAY_API_TOKEN;
    const serviceId = process.env.FRONTEND_SERVICE_ID;
    const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;

    if (!token || !serviceId || !environmentId) {
      throw new Error(
        'Frontend restart requires RAILWAY_API_TOKEN, FRONTEND_SERVICE_ID, and RAILWAY_ENVIRONMENT_ID',
      );
    }

    console.log('🔄 Triggering frontend restart via Railway API...');

    const response = await fetch(RAILWAY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Project-Access-Token': token,
      },
      body: JSON.stringify({
        query: RESTART_MUTATION,
        variables: { serviceId, environmentId },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Railway API request failed: ${response.status} ${response.statusText} - ${body}`,
      );
    }

    const result = (await response.json()) as RailwayGraphQLResponse;

    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Railway API returned errors: ${result.errors.map((e) => e.message).join(', ')}`,
      );
    }

    console.log('🔄 Frontend restart triggered successfully');
  }

  private hasRequiredConfig(): boolean {
    return Boolean(
      process.env.RAILWAY_API_TOKEN &&
      process.env.FRONTEND_SERVICE_ID &&
      process.env.RAILWAY_ENVIRONMENT_ID,
    );
  }

  private scheduleNextRestart(): void {
    const now = new Date();
    const base = getNextBackupTime(now, this.restartHour, this.timezone);
    const nextRestart = new Date(base.getTime() + this.restartMinuteOffsetMs);
    const delay = nextRestart.getTime() - now.getTime();

    this.scheduledTimeout = setTimeout(() => {
      this.restartFrontend().catch((error) => {
        console.error('❌ Frontend restart failed:', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      });
      this.scheduleNextRestart();
    }, delay);

    console.log(`🔄 Frontend restart scheduled for ${nextRestart.toISOString()}`);
  }
}
