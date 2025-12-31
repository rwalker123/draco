export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

export const HOLES_PER_MATCH_OPTIONS = [
  { value: 9, label: '9 Holes' },
  { value: 18, label: '18 Holes' },
] as const;

export const TEAM_SIZE_OPTIONS = [
  { value: 1, label: '1 (Individual)' },
  { value: 2, label: '2 (Pairs)' },
  { value: 3, label: '3 (Threesomes)' },
  { value: 4, label: '4 (Foursomes)' },
] as const;

export const SCHEDULE_TOOLTIPS = {
  leagueDay: 'Day of the week when league matches are played',
  firstTeeTime: 'Time when the first group tees off',
  timeBetweenTeeTimes: 'Minutes between consecutive tee times',
  holesPerMatch: 'Number of holes played per match',
  teamSize: 'Number of players per team (1 = individual play)',
} as const;

export const OFFICER_TOOLTIPS = {
  president: 'League president responsible for overall administration',
  vicePresident: 'Vice president who assists the president',
  secretary: 'Secretary handling communications and records',
  treasurer: 'Treasurer managing league finances',
} as const;

export const SCORING_TOOLTIPS = {
  useTeamScoring: 'Combined team scores compete against each other',
  useIndividualScoring: 'Players compete head-to-head (A vs A, B vs B)',
  bestBall: 'Use the best (lowest) score from each team per hole',
  netScoring: 'Strokes are adjusted based on player handicaps',
  actualScoring: 'Raw stroke counts without handicap adjustment',
  perHolePoints: 'Points awarded for winning each individual hole',
  perNinePoints: 'Points awarded for winning the front or back nine',
  perMatchPoints: 'Points awarded for winning the overall match',
  totalHolesPoints: 'Points based on total holes won across the match',
  againstFieldPoints: 'Points for performance compared to all other players',
  againstFieldDescPoints: 'Descending points for performance against the field (higher rank = fewer points)',
} as const;

export const SCORING_POINTS_FIELDS = [
  { name: 'perHolePoints', label: 'Per Hole', tooltip: SCORING_TOOLTIPS.perHolePoints },
  { name: 'perNinePoints', label: 'Per Nine', tooltip: SCORING_TOOLTIPS.perNinePoints },
  { name: 'perMatchPoints', label: 'Per Match', tooltip: SCORING_TOOLTIPS.perMatchPoints },
  { name: 'totalHolesPoints', label: 'Total Holes', tooltip: SCORING_TOOLTIPS.totalHolesPoints },
  { name: 'againstFieldPoints', label: 'Against Field', tooltip: SCORING_TOOLTIPS.againstFieldPoints },
  { name: 'againstFieldDescPoints', label: 'Against Field (Desc)', tooltip: SCORING_TOOLTIPS.againstFieldDescPoints },
] as const;
