interface BaseMetricContext {
  accountId?: string | null;
  teamId?: string | null;
  submissionId?: string | null;
}

type MetricType = 'submission_failure' | 'quota_violation' | 'email_error';

interface MetricEvent extends BaseMetricContext {
  type: MetricType;
  timestamp: Date;
  detail?: string;
}

export interface PhotoSubmissionMetricsSnapshot {
  counters: {
    submissionFailures: number;
    quotaViolations: number;
    emailErrors: number;
  };
  recent: MetricEvent[];
}

const MAX_RECENT_EVENTS = 50;

const formatIdentifier = (value?: string | null): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();
  return trimmed.length > 0 ? trimmed : null;
};

const simplifyError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
};

export class PhotoSubmissionMetrics {
  private submissionFailures = 0;
  private quotaViolations = 0;
  private emailErrors = 0;
  private recent: MetricEvent[] = [];

  recordSubmissionFailure(context: BaseMetricContext & { stage: string; error: unknown }): void {
    this.submissionFailures += 1;

    const accountId = formatIdentifier(context.accountId);
    const teamId = formatIdentifier(context.teamId);
    const submissionId = formatIdentifier(context.submissionId);
    const detail = `Stage "${context.stage}" failed: ${simplifyError(context.error)}`;

    this.pushEvent({
      type: 'submission_failure',
      accountId,
      teamId,
      submissionId,
      timestamp: new Date(),
      detail,
    });

    console.error('📸 Photo submission failure', {
      stage: context.stage,
      accountId,
      teamId,
      submissionId,
      message: simplifyError(context.error),
    });
  }

  recordQuotaViolation(
    context: BaseMetricContext & { albumId?: string | null; limit: number },
  ): void {
    this.quotaViolations += 1;

    const accountId = formatIdentifier(context.accountId);
    const teamId = formatIdentifier(context.teamId);
    const submissionId = formatIdentifier(context.submissionId);
    const albumId = formatIdentifier(context.albumId);
    const detail = `Album ${albumId ?? 'unknown'} reached limit ${context.limit}`;

    this.pushEvent({
      type: 'quota_violation',
      accountId,
      teamId,
      submissionId,
      timestamp: new Date(),
      detail,
    });

    console.warn('📸 Photo submission quota violation', {
      accountId,
      teamId,
      submissionId,
      albumId,
      limit: context.limit,
    });
  }

  recordEmailError(context: BaseMetricContext & { template: string; error: unknown }): void {
    this.emailErrors += 1;

    const accountId = formatIdentifier(context.accountId);
    const teamId = formatIdentifier(context.teamId);
    const submissionId = formatIdentifier(context.submissionId);
    const detail = `Email "${context.template}" failed: ${simplifyError(context.error)}`;

    this.pushEvent({
      type: 'email_error',
      accountId,
      teamId,
      submissionId,
      timestamp: new Date(),
      detail,
    });

    console.error('📸 Photo submission email error', {
      template: context.template,
      accountId,
      teamId,
      submissionId,
      message: simplifyError(context.error),
    });
  }

  getSnapshot(): PhotoSubmissionMetricsSnapshot {
    return {
      counters: {
        submissionFailures: this.submissionFailures,
        quotaViolations: this.quotaViolations,
        emailErrors: this.emailErrors,
      },
      recent: [...this.recent],
    };
  }

  reset(): void {
    this.submissionFailures = 0;
    this.quotaViolations = 0;
    this.emailErrors = 0;
    this.recent = [];
  }

  private pushEvent(event: MetricEvent): void {
    this.recent.push(event);

    if (this.recent.length > MAX_RECENT_EVENTS) {
      this.recent = this.recent.slice(-MAX_RECENT_EVENTS);
    }
  }
}

export const photoSubmissionMetrics = new PhotoSubmissionMetrics();
