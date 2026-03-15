export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
