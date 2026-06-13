import { format, FormatterOptionsArgs } from '@fast-csv/format';

export interface CsvHeader<T> {
  key: keyof T;
  header: string;
}

const CSV_INJECTION_PREFIXES = ['=', '+', '-', '@', '\t', '\r', '\n'];

function neutralizeCsvValue(value: string): string {
  if (value.length > 0 && CSV_INJECTION_PREFIXES.includes(value[0])) {
    return `'${value}`;
  }
  return value;
}

export async function generateCsv<T extends object>(
  data: T[],
  headers: CsvHeader<T>[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const options: FormatterOptionsArgs<T, T> = {
      headers: headers.map((h) => h.header),
      writeHeaders: true,
    };

    const csvStream = format(options);

    csvStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    csvStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    csvStream.on('error', (error) => {
      reject(error);
    });

    for (const row of data) {
      const rowData = headers.map((h) => {
        const value = row[h.key];
        if (value === null || value === undefined) {
          return '';
        }
        return neutralizeCsvValue(String(value));
      });
      csvStream.write(rowData);
    }

    csvStream.end();
  });
}

export interface RosterExportRow {
  fullName: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  submittedWaiver: string;
  registeredTeams: string;
}

export const ROSTER_EXPORT_HEADERS: CsvHeader<RosterExportRow>[] = [
  { key: 'fullName', header: 'Full Name' },
  { key: 'email', header: 'Email' },
  { key: 'streetAddress', header: 'Street Address' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'zip', header: 'Zip' },
  { key: 'submittedWaiver', header: 'Submitted Waiver' },
  { key: 'registeredTeams', header: 'Registered Teams' },
];

export interface WaiverExportRow {
  fullName: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  team: string;
}

export const WAIVER_EXPORT_HEADERS: CsvHeader<WaiverExportRow>[] = [
  { key: 'fullName', header: 'Full Name' },
  { key: 'email', header: 'Email' },
  { key: 'streetAddress', header: 'Street Address' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'zip', header: 'Zip' },
  { key: 'team', header: 'Team' },
];

export interface ManagerExportRow {
  fullName: string;
  email: string;
  phone2: string;
  phone3: string;
  phone1: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  leagueTeamName: string;
}

export const MANAGER_EXPORT_HEADERS: CsvHeader<ManagerExportRow>[] = [
  { key: 'fullName', header: 'Full Name' },
  { key: 'email', header: 'Email' },
  { key: 'phone2', header: 'Phone 2' },
  { key: 'phone3', header: 'Phone 3' },
  { key: 'phone1', header: 'Phone 1' },
  { key: 'streetAddress', header: 'Street Address' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'zip', header: 'Zip' },
  { key: 'leagueTeamName', header: 'League / Team' },
];

export interface ContactExportRow {
  lastName: string;
  firstName: string;
  middleName: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  dateOfBirth: string;
  phone1: string;
  phone2: string;
  phone3: string;
  roles: string;
}

export interface WorkoutRegistrationExportRow {
  name: string;
  email: string;
  age: string;
  phone1: string;
  phone2: string;
  phone3: string;
  phone4: string;
  positions: string;
  isManager: string;
  whereHeard: string;
  dateRegistered: string;
}

export const WORKOUT_REGISTRATION_EXPORT_HEADERS: CsvHeader<WorkoutRegistrationExportRow>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'age', header: 'Age' },
  { key: 'phone1', header: 'Phone 1' },
  { key: 'phone2', header: 'Phone 2' },
  { key: 'phone3', header: 'Phone 3' },
  { key: 'phone4', header: 'Phone 4' },
  { key: 'positions', header: 'Positions' },
  { key: 'isManager', header: 'Is Manager' },
  { key: 'whereHeard', header: 'Where Heard' },
  { key: 'dateRegistered', header: 'Date Registered' },
];

export const CONTACT_EXPORT_HEADERS: CsvHeader<ContactExportRow>[] = [
  { key: 'lastName', header: 'Last Name' },
  { key: 'firstName', header: 'First Name' },
  { key: 'middleName', header: 'Middle Name' },
  { key: 'email', header: 'Email' },
  { key: 'streetAddress', header: 'Street Address' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'zip', header: 'Zip' },
  { key: 'dateOfBirth', header: 'Date of Birth' },
  { key: 'phone1', header: 'Phone 1 (Cell)' },
  { key: 'phone2', header: 'Phone 2 (Home)' },
  { key: 'phone3', header: 'Phone 3 (Work)' },
  { key: 'roles', header: 'Roles' },
];

export interface BattingStatsExportRow {
  playerName: string;
  teamName: string;
  ab: string;
  h: string;
  r: string;
  d: string;
  t: string;
  hr: string;
  rbi: string;
  so: string;
  bb: string;
  hbp: string;
  sb: string;
  cs: string;
  sf: string;
  sh: string;
  re: string;
  intr: string;
  lob: string;
  tb: string;
  pa: string;
  avg: string;
  obp: string;
  slg: string;
  ops: string;
}

const BATTING_STAT_COLUMN_HEADERS: CsvHeader<
  Omit<BattingStatsExportRow, 'playerName' | 'teamName'>
>[] = [
  { key: 'ab', header: 'AB' },
  { key: 'h', header: 'H' },
  { key: 'r', header: 'R' },
  { key: 'd', header: '2B' },
  { key: 't', header: '3B' },
  { key: 'hr', header: 'HR' },
  { key: 'rbi', header: 'RBI' },
  { key: 'so', header: 'SO' },
  { key: 'bb', header: 'BB' },
  { key: 'hbp', header: 'HBP' },
  { key: 'sb', header: 'SB' },
  { key: 'cs', header: 'CS' },
  { key: 'sf', header: 'SF' },
  { key: 'sh', header: 'SH' },
  { key: 're', header: 'RE' },
  { key: 'intr', header: 'INTR' },
  { key: 'lob', header: 'LOB' },
  { key: 'tb', header: 'TB' },
  { key: 'pa', header: 'PA' },
  { key: 'avg', header: 'AVG' },
  { key: 'obp', header: 'OBP' },
  { key: 'slg', header: 'SLG' },
  { key: 'ops', header: 'OPS' },
];

export const BATTING_STATS_EXPORT_HEADERS: CsvHeader<BattingStatsExportRow>[] = [
  { key: 'playerName', header: 'Player' },
  { key: 'teamName', header: 'Team' },
  ...BATTING_STAT_COLUMN_HEADERS,
];

export interface PitchingStatsExportRow {
  playerName: string;
  teamName: string;
  w: string;
  l: string;
  s: string;
  ipDecimal: string;
  h: string;
  r: string;
  er: string;
  d: string;
  t: string;
  hr: string;
  so: string;
  bb: string;
  bf: string;
  wp: string;
  hbp: string;
  bk: string;
  sc: string;
  era: string;
  whip: string;
  k9: string;
  bb9: string;
  oba: string;
  slg: string;
}

const PITCHING_STAT_COLUMN_HEADERS: CsvHeader<
  Omit<PitchingStatsExportRow, 'playerName' | 'teamName'>
>[] = [
  { key: 'w', header: 'W' },
  { key: 'l', header: 'L' },
  { key: 's', header: 'S' },
  { key: 'ipDecimal', header: 'IP' },
  { key: 'h', header: 'H' },
  { key: 'r', header: 'R' },
  { key: 'er', header: 'ER' },
  { key: 'd', header: '2B' },
  { key: 't', header: '3B' },
  { key: 'hr', header: 'HR' },
  { key: 'so', header: 'SO' },
  { key: 'bb', header: 'BB' },
  { key: 'bf', header: 'BF' },
  { key: 'wp', header: 'WP' },
  { key: 'hbp', header: 'HBP' },
  { key: 'bk', header: 'BK' },
  { key: 'sc', header: 'SC' },
  { key: 'era', header: 'ERA' },
  { key: 'whip', header: 'WHIP' },
  { key: 'k9', header: 'K/9' },
  { key: 'bb9', header: 'BB/9' },
  { key: 'oba', header: 'OBA' },
  { key: 'slg', header: 'SLG' },
];

export const PITCHING_STATS_EXPORT_HEADERS: CsvHeader<PitchingStatsExportRow>[] = [
  { key: 'playerName', header: 'Player' },
  { key: 'teamName', header: 'Team' },
  ...PITCHING_STAT_COLUMN_HEADERS,
];

export interface CareerBattingStatsExportRow extends Omit<BattingStatsExportRow, 'playerName'> {
  season: string;
}

export const CAREER_BATTING_STATS_EXPORT_HEADERS: CsvHeader<CareerBattingStatsExportRow>[] = [
  { key: 'season', header: 'Season' },
  { key: 'teamName', header: 'Team' },
  ...BATTING_STAT_COLUMN_HEADERS,
];

export interface CareerPitchingStatsExportRow extends Omit<PitchingStatsExportRow, 'playerName'> {
  season: string;
}

export const CAREER_PITCHING_STATS_EXPORT_HEADERS: CsvHeader<CareerPitchingStatsExportRow>[] = [
  { key: 'season', header: 'Season' },
  { key: 'teamName', header: 'Team' },
  ...PITCHING_STAT_COLUMN_HEADERS,
];
