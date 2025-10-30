export const editablePitchingFields = [
  'ipDecimal',
  'w',
  'l',
  's',
  'h',
  'r',
  'er',
  'd',
  't',
  'hr',
  'so',
  'bb',
  'bf',
  'wp',
  'hbp',
  'bk',
  'sc',
] as const;

export type EditablePitchingField = (typeof editablePitchingFields)[number];

export const pitchingSummaryFields = ['era', 'whip', 'k9', 'bb9', 'oba', 'slg'] as const;

export const pitchingViewFieldOrder = [
  'playerNumber',
  'playerName',
  ...editablePitchingFields,
  ...pitchingSummaryFields,
] as const;

export type PitchingViewField = (typeof pitchingViewFieldOrder)[number];
export type PitchingSummaryField = (typeof pitchingSummaryFields)[number];

export type PitchingFieldMetadata = {
  label: string;
  tooltip: string;
};

const pitchingFieldMetadata: Record<PitchingViewField, PitchingFieldMetadata> = {
  playerNumber: {
    label: '#',
    tooltip: 'Player number',
  },
  playerName: {
    label: 'Player',
    tooltip: 'Player name',
  },
  ipDecimal: {
    label: 'IP',
    tooltip: 'Innings pitched',
  },
  w: {
    label: 'W',
    tooltip: 'Wins',
  },
  l: {
    label: 'L',
    tooltip: 'Losses',
  },
  s: {
    label: 'S',
    tooltip: 'Saves',
  },
  h: {
    label: 'H',
    tooltip: 'Hits allowed',
  },
  r: {
    label: 'R',
    tooltip: 'Runs allowed',
  },
  er: {
    label: 'ER',
    tooltip: 'Earned runs allowed',
  },
  d: {
    label: '2B',
    tooltip: 'Doubles allowed',
  },
  t: {
    label: '3B',
    tooltip: 'Triples allowed',
  },
  hr: {
    label: 'HR',
    tooltip: 'Home runs allowed',
  },
  so: {
    label: 'SO',
    tooltip: 'Strikeouts',
  },
  bb: {
    label: 'BB',
    tooltip: 'Walks issued',
  },
  bf: {
    label: 'BF',
    tooltip: 'Batters faced',
  },
  wp: {
    label: 'WP',
    tooltip: 'Wild pitches',
  },
  hbp: {
    label: 'HBP',
    tooltip: 'Hit batters',
  },
  bk: {
    label: 'BK',
    tooltip: 'Balks',
  },
  sc: {
    label: 'SC',
    tooltip: 'Sacrifice Hits/Flies allowed',
  },
  era: {
    label: 'ERA',
    tooltip: 'Earned run average',
  },
  whip: {
    label: 'WHIP',
    tooltip: 'Walks plus hits per inning pitched',
  },
  k9: {
    label: 'K/9',
    tooltip: 'Strikeouts per nine innings',
  },
  bb9: {
    label: 'BB/9',
    tooltip: 'Walks per nine innings',
  },
  oba: {
    label: 'OBA',
    tooltip: 'Opponent batting average',
  },
  slg: {
    label: 'SLG',
    tooltip: 'Opponent slugging percentage',
  },
};

export const PITCHING_FIELD_METADATA = pitchingFieldMetadata;

type FieldLabelMap = Record<PitchingViewField, string>;

export const PITCHING_FIELD_LABELS: FieldLabelMap = Object.fromEntries(
  Object.entries(pitchingFieldMetadata).map(([field, { label }]) => [field, label]),
) as FieldLabelMap;

export const PITCHING_FIELD_TOOLTIPS: Record<PitchingViewField, string> = Object.fromEntries(
  Object.entries(pitchingFieldMetadata).map(([field, { tooltip }]) => [field, tooltip]),
) as Record<PitchingViewField, string>;

export const PITCHING_COLUMN_DECIMAL_DIGITS: Partial<Record<PitchingViewField, number>> = {
  era: 2,
  whip: 2,
  k9: 2,
  bb9: 2,
  oba: 3,
  slg: 3,
};
