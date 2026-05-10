interface AuditEntry {
  ts: string;
  requestId: string;
  userId: string;
  tool: string;
  accountId?: string;
  durationMs: number;
  status: 'ok' | 'error';
  errorCode?: string;
  count?: number;
}

export function auditLog(entry: Omit<AuditEntry, 'ts'>): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...entry }));
}
