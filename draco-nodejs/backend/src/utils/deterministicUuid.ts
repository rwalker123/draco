import { createHash } from 'node:crypto';

export function deterministicUuid(input: string): string {
  const hash = createHash('sha1').update(input).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}
