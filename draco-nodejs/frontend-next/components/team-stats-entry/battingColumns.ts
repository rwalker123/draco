export const editableBattingFields = [
  'ab',
  'h',
  'r',
  'd',
  't',
  'hr',
  'rbi',
  'so',
  'bb',
  'hbp',
  'sb',
  'cs',
  'sf',
  'sh',
  're',
  'intr',
  'lob',
] as const;

export type EditableBattingField = (typeof editableBattingFields)[number];

export const battingSummaryFields = ['tb', 'pa', 'avg', 'obp', 'slg', 'ops'] as const;
export type BattingSummaryField = (typeof battingSummaryFields)[number];

export const battingAverageFields = ['avg', 'obp', 'slg', 'ops'] as const;

export const battingViewFieldOrder = [
  'playerNumber',
  'playerName',
  ...editableBattingFields,
  ...battingSummaryFields,
] as const;

export type BattingViewField = (typeof battingViewFieldOrder)[number];

type FieldLabelMap = Record<BattingViewField, string>;

export const BATTING_FIELD_LABELS: FieldLabelMap = {
  playerNumber: '#',
  playerName: 'Player',
  ab: 'AB',
  h: 'H',
  r: 'R',
  d: '2B',
  t: '3B',
  hr: 'HR',
  rbi: 'RBI',
  so: 'SO',
  bb: 'BB',
  hbp: 'HBP',
  sb: 'SB',
  cs: 'CS',
  sf: 'SF',
  sh: 'SH',
  re: 'RE',
  intr: 'INTR',
  lob: 'LOB',
  tb: 'TB',
  pa: 'PA',
  avg: 'AVG',
  obp: 'OBP',
  slg: 'SLG',
  ops: 'OPS',
};
