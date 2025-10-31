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

export type BattingFieldMetadata = {
  label: string;
  tooltip: string;
};

const battingFieldMetadata: Record<BattingViewField, BattingFieldMetadata> = {
  playerNumber: {
    label: '#',
    tooltip: 'Player number',
  },
  playerName: {
    label: 'Player',
    tooltip: 'Player name',
  },
  ab: {
    label: 'AB',
    tooltip: 'At Bats',
  },
  h: {
    label: 'H',
    tooltip: 'Hits',
  },
  r: {
    label: 'R',
    tooltip: 'Runs',
  },
  d: {
    label: '2B',
    tooltip: 'Doubles',
  },
  t: {
    label: '3B',
    tooltip: 'Triples',
  },
  hr: {
    label: 'HR',
    tooltip: 'Home Runs',
  },
  rbi: {
    label: 'RBI',
    tooltip: 'Runs Batted In',
  },
  so: {
    label: 'SO',
    tooltip: 'Strikeouts',
  },
  bb: {
    label: 'BB',
    tooltip: 'Walks',
  },
  hbp: {
    label: 'HBP',
    tooltip: 'Hit By Pitch',
  },
  sb: {
    label: 'SB',
    tooltip: 'Stolen Bases',
  },
  cs: {
    label: 'CS',
    tooltip: 'Caught Stealing',
  },
  sf: {
    label: 'SF',
    tooltip: 'Sacrifice Flies',
  },
  sh: {
    label: 'SH',
    tooltip: 'Sacrifice Hits',
  },
  re: {
    label: 'RE',
    tooltip: 'RE',
  },
  intr: {
    label: 'INTR',
    tooltip: 'INTR',
  },
  lob: {
    label: 'LOB',
    tooltip: 'Left On Base',
  },
  tb: {
    label: 'TB',
    tooltip: 'Total Bases',
  },
  pa: {
    label: 'PA',
    tooltip: 'Plate Appearances',
  },
  avg: {
    label: 'AVG',
    tooltip: 'Batting Average',
  },
  obp: {
    label: 'OBP',
    tooltip: 'On-Base Percentage',
  },
  slg: {
    label: 'SLG',
    tooltip: 'Slugging Percentage',
  },
  ops: {
    label: 'OPS',
    tooltip: 'On-base Plus Slugging',
  },
};

export const BATTING_FIELD_METADATA = battingFieldMetadata;

type FieldLabelMap = Record<BattingViewField, string>;

export const BATTING_FIELD_LABELS: FieldLabelMap = Object.fromEntries(
  Object.entries(battingFieldMetadata).map(([field, { label }]) => [field, label]),
) as FieldLabelMap;

export const BATTING_FIELD_TOOLTIPS: Record<BattingViewField, string> = Object.fromEntries(
  Object.entries(battingFieldMetadata).map(([field, { tooltip }]) => [field, tooltip]),
) as Record<BattingViewField, string>;

export const BATTING_COLUMN_DECIMAL_DIGITS: Partial<Record<BattingViewField, number>> = {
  avg: 3,
  obp: 3,
  slg: 3,
  ops: 3,
};
