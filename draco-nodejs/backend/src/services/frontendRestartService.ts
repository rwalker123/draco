import { getNextBackupTime } from './backupService.js';

const RAILWAY_API_ENDPOINT = 'https://backboard.railway.com/graphql/v2';

const LATEST_DEPLOYMENT_QUERY = `
  query LatestDeployment($input: DeploymentListInput!) {
    deployments(input: $input, first: 1) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

const RESTART_MUTATION = `
  mutation RestartDeployment($id: String!) {
    deploymentRestart(id: $id)
  }
`;

interface RailwayGraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface LatestDeploymentData {
  deployments: {
    edges: Array<{ node: { id: string } }>;
  };
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

    const deploymentId = await this.fetchLatestDeploymentId(token, serviceId, environmentId);
    await this.restartDeployment(token, deploymentId);

    console.log('🔄 Frontend restart triggered successfully');
  }

  private async fetchLatestDeploymentId(
    token: string,
    serviceId: string,
    environmentId: string,
  ): Promise<string> {
    const result = await this.callRailway<LatestDeploymentData>(token, LATEST_DEPLOYMENT_QUERY, {
      input: {
        serviceId,
        environmentId,
        status: { in: ['SUCCESS'] },
      },
    });

    const deploymentId = result.data?.deployments.edges[0]?.node.id;
    if (!deploymentId) {
      throw new Error(
        `No successful deployment found for service ${serviceId} in environment ${environmentId}`,
      );
    }

    return deploymentId;
  }

  private async restartDeployment(token: string, deploymentId: string): Promise<void> {
    await this.callRailway(token, RESTART_MUTATION, { id: deploymentId });
  }

  private async callRailway<T>(
    token: string,
    query: string,
    variables: Record<string, unknown>,
  ): Promise<RailwayGraphQLResponse<T>> {
    const response = await fetch(RAILWAY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Project-Access-Token': token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Railway API request failed: ${response.status} ${response.statusText} - ${body}`,
      );
    }

    const result = (await response.json()) as RailwayGraphQLResponse<T>;

    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Railway API returned errors: ${result.errors.map((e) => e.message).join(', ')}`,
      );
    }

    return result;
  }

  private hasRequiredConfig(): boolean {
    return Boolean(
      process.env.RAILWAY_API_TOKEN &&
      process.env.FRONTEND_SERVICE_ID &&
      process.env.RAILWAY_ENVIRONMENT_ID,
    );
  }

  private getNextRestartTime(now: Date): Date {
    const shiftedNow = new Date(now.getTime() - this.restartMinuteOffsetMs);
    const base = getNextBackupTime(shiftedNow, this.restartHour, this.timezone);
    return new Date(base.getTime() + this.restartMinuteOffsetMs);
  }

  private scheduleNextRestart(): void {
    const now = new Date();
    const nextRestart = this.getNextRestartTime(now);
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
