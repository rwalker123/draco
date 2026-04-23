import fs from 'fs';
import path from 'path';

const RESULTS_DIR = path.join(import.meta.dirname, '..', '.results');

export function appendCleanupLog(label: string, errors: string[]): void {
  if (errors.length === 0) return;

  try {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });

    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      '-',
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
      String(now.getMilliseconds()).padStart(3, '0'),
    ].join('');

    const logFile = path.join(RESULTS_DIR, `cleanup-errors-${timestamp}-pid${process.pid}.log`);
    const content = `\n=== ${label} ===\n${errors.join('\n')}\n`;

    fs.appendFileSync(logFile, content, 'utf-8');
  } catch (err) {
    console.warn('cleanupLog: failed to write cleanup log:', err);
  }
}
