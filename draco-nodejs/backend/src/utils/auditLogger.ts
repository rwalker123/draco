import { Request } from 'express';

type RegistrationEvent =
  | 'registration_newUser'
  | 'registration_existingUser'
  | 'registration_selfRegister'
  | 'registration_linkByName'
  | 'registration_revoke';

type RegistrationStatus =
  | 'attempt'
  | 'success'
  | 'already_linked'
  | 'duplicate_matches'
  | 'not_found'
  | 'validation_error'
  | 'auth_error'
  | 'server_error';

interface RegistrationLogDetails {
  accountId?: string | number | bigint;
  userId?: string;
  mode?: 'newUser' | 'existingUser';
  timingMs?: number;
  // Allow extra arbitrary structured fields but avoid sensitive data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

function getClientIp(req: Request): string | undefined {
  const forwarded = (req.headers['x-forwarded-for'] as string) || '';
  if (forwarded) return forwarded.split(',')[0].trim();
  return (req.ip as string) || req.socket?.remoteAddress || undefined;
}

export function logRegistrationEvent(
  req: Request,
  event: RegistrationEvent,
  status: RegistrationStatus,
  details: RegistrationLogDetails = {},
): void {
  if (process.env.LOG_REGISTRATION === 'false') {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    requestId: (req as Request & { requestId?: string }).requestId,
    ip: getClientIp(req),
    event,
    status,
    accountId: details.accountId !== undefined ? String(details.accountId) : undefined,
    userId: details.userId,
    mode: details.mode,
    timingMs: details.timingMs,
  };

  // Print as single-line JSON for log aggregation
  // Intentionally avoid logging sensitive fields
  console.log(JSON.stringify(payload));
}
