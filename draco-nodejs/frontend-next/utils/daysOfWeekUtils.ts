export const DAYS: Array<{ label: string; bit: number }> = [
  { label: 'Mon', bit: 0 },
  { label: 'Tue', bit: 1 },
  { label: 'Wed', bit: 2 },
  { label: 'Thu', bit: 3 },
  { label: 'Fri', bit: 4 },
  { label: 'Sat', bit: 5 },
  { label: 'Sun', bit: 6 },
];

export const maskToSelectedBits = (mask: number): number[] => {
  return DAYS.filter((day) => (mask & (1 << day.bit)) !== 0).map((day) => day.bit);
};

export const selectedBitsToMask = (bits: number[]): number => {
  let mask = 0;
  for (const bit of bits) {
    mask |= 1 << bit;
  }
  return mask;
};

export const formatDaysOfWeekMask = (mask: number): string => {
  const selected = DAYS.filter((day) => (mask & (1 << day.bit)) !== 0).map((day) => day.label);
  return selected.length ? selected.join(', ') : 'None';
};
