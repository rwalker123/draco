type NetworkPhase = 'start' | 'end' | 'error';

type NetworkLogEvent = {
  id: string;
  phase: NetworkPhase;
  method: string;
  url: string;
  attempt?: number;
  status?: number;
  durationMs?: number;
  body?: unknown;
  error?: unknown;
};

const shouldLog = (): boolean => {
  const devFlag = (globalThis as { __DEV__?: boolean }).__DEV__;
  if (typeof devFlag !== 'undefined') {
    return devFlag;
  }

  const nodeEnv = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
  return nodeEnv ? nodeEnv !== 'production' : true;
};

export function logNetworkEvent(event: NetworkLogEvent): void {
  if (!shouldLog()) {
    return;
  }

  const { phase, method, url, status, durationMs, body, error, attempt } = event;
  const attemptSuffix = attempt ? ` (attempt ${attempt})` : '';
  const prefix = `[network:${phase}] ${method} ${url}${attemptSuffix}`;

  switch (phase) {
    case 'start':
      console.info(prefix, body ? { body } : undefined);
      break;
    case 'end':
      console.info(prefix, { status, durationMs, body });
      break;
    case 'error':
      console.warn(prefix, { durationMs, error });
      break;
    default:
      console.log(prefix);
  }
}
