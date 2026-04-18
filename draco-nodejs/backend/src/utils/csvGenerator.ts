import { format, FormatterOptionsArgs } from '@fast-csv/format';

export interface CsvHeader<T> {
  key: keyof T;
  header: string;
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
        return String(value);
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
  affiliationDuesPaid: string;
}

export const ROSTER_EXPORT_HEADERS: CsvHeader<RosterExportRow>[] = [
  { key: 'fullName', header: 'Full Name' },
  { key: 'email', header: 'Email' },
  { key: 'streetAddress', header: 'Street Address' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'zip', header: 'Zip' },
  { key: 'affiliationDuesPaid', header: 'Affiliation Dues Paid' },
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
