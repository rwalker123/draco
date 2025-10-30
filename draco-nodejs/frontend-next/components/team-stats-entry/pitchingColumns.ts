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

type FieldLabelMap = Record<PitchingViewField, string>;

export const PITCHING_FIELD_LABELS: FieldLabelMap = {
  playerNumber: '#',
  playerName: 'Player',
  ipDecimal: 'IP',
  w: 'W',
  l: 'L',
  s: 'S',
  h: 'H',
  r: 'R',
  er: 'ER',
  d: '2B',
  t: '3B',
  hr: 'HR',
  so: 'SO',
  bb: 'BB',
  bf: 'BF',
  wp: 'WP',
  hbp: 'HBP',
  bk: 'BK',
  sc: 'SC',
  era: 'ERA',
  whip: 'WHIP',
  k9: 'K/9',
  bb9: 'BB/9',
  oba: 'OBA',
  slg: 'SLG',
};
