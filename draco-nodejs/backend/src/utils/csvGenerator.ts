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
