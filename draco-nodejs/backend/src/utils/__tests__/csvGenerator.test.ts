import { describe, it, expect } from 'vitest';
import {
  generateCsv,
  CsvHeader,
  ROSTER_EXPORT_HEADERS,
  MANAGER_EXPORT_HEADERS,
  RosterExportRow,
  ManagerExportRow,
} from '../csvGenerator.js';

describe('csvGenerator', () => {
  describe('generateCsv', () => {
    it('should generate empty buffer when data is empty', async () => {
      interface TestRow {
        name: string;
        value: number;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'name', header: 'Name' },
        { key: 'value', header: 'Value' },
      ];

      const result = await generateCsv<TestRow>([], headers);
      const csvString = result.toString();

      // fast-csv doesn't write headers when there's no data
      expect(csvString).toBe('');
    });

    it('should generate CSV with data rows', async () => {
      interface TestRow {
        name: string;
        email: string;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'name', header: 'Full Name' },
        { key: 'email', header: 'Email Address' },
      ];
      const data: TestRow[] = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
      ];

      const result = await generateCsv(data, headers);
      const csvString = result.toString();

      expect(csvString).toContain('Full Name,Email Address');
      expect(csvString).toContain('John Doe,john@example.com');
      expect(csvString).toContain('Jane Smith,jane@example.com');
    });

    it('should handle null and undefined values as empty strings', async () => {
      interface TestRow {
        name: string | null;
        email: string | undefined;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
      ];
      const data: TestRow[] = [{ name: null, email: undefined }];

      const result = await generateCsv(data, headers);
      const csvString = result.toString();

      // Header row + data row with empty values (no trailing newline)
      expect(csvString).toBe('Name,Email\n,');
    });

    it('should properly escape commas in values', async () => {
      interface TestRow {
        name: string;
        address: string;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'name', header: 'Name' },
        { key: 'address', header: 'Address' },
      ];
      const data: TestRow[] = [{ name: 'John Doe', address: '123 Main St, Apt 4' }];

      const result = await generateCsv(data, headers);
      const csvString = result.toString();

      expect(csvString).toContain('"123 Main St, Apt 4"');
    });

    it('should properly escape quotes in values', async () => {
      interface TestRow {
        name: string;
        nickname: string;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'name', header: 'Name' },
        { key: 'nickname', header: 'Nickname' },
      ];
      const data: TestRow[] = [{ name: 'John "The Man" Doe', nickname: 'Johnny' }];

      const result = await generateCsv(data, headers);
      const csvString = result.toString();

      expect(csvString).toContain('"John ""The Man"" Doe"');
    });

    it('should handle newlines in values', async () => {
      interface TestRow {
        name: string;
        notes: string;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'name', header: 'Name' },
        { key: 'notes', header: 'Notes' },
      ];
      const data: TestRow[] = [{ name: 'John', notes: 'Line 1\nLine 2' }];

      const result = await generateCsv(data, headers);
      const csvString = result.toString();

      expect(csvString).toContain('"Line 1\nLine 2"');
    });

    it('should convert numbers to strings', async () => {
      interface TestRow {
        name: string;
        age: number;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age' },
      ];
      const data: TestRow[] = [{ name: 'John', age: 30 }];

      const result = await generateCsv(data, headers);
      const csvString = result.toString();

      expect(csvString).toContain('John,30');
    });

    it('should convert booleans to strings', async () => {
      interface TestRow {
        name: string;
        active: boolean;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'name', header: 'Name' },
        { key: 'active', header: 'Active' },
      ];
      const data: TestRow[] = [
        { name: 'John', active: true },
        { name: 'Jane', active: false },
      ];

      const result = await generateCsv(data, headers);
      const csvString = result.toString();

      expect(csvString).toContain('John,true');
      expect(csvString).toContain('Jane,false');
    });

    it('should return a Buffer', async () => {
      interface TestRow {
        name: string;
      }
      const headers: CsvHeader<TestRow>[] = [{ key: 'name', header: 'Name' }];
      const data: TestRow[] = [{ name: 'Test' }];

      const result = await generateCsv(data, headers);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should handle Unicode characters', async () => {
      interface TestRow {
        name: string;
        city: string;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'name', header: 'Name' },
        { key: 'city', header: 'City' },
      ];
      const data: TestRow[] = [
        { name: 'José García', city: 'São Paulo' },
        { name: '田中太郎', city: '東京' },
      ];

      const result = await generateCsv(data, headers);
      const csvString = result.toString();

      expect(csvString).toContain('José García');
      expect(csvString).toContain('São Paulo');
      expect(csvString).toContain('田中太郎');
      expect(csvString).toContain('東京');
    });

    it('should handle large datasets', async () => {
      interface TestRow {
        id: number;
        name: string;
      }
      const headers: CsvHeader<TestRow>[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
      ];
      const data: TestRow[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
      }));

      const result = await generateCsv(data, headers);
      const csvString = result.toString();
      const lines = csvString.trim().split('\n');

      expect(lines.length).toBe(1001); // 1 header + 1000 data rows
      expect(lines[0]).toBe('ID,Name');
      expect(lines[1]).toBe('1,User 1');
      expect(lines[1000]).toBe('1000,User 1000');
    });
  });

  describe('ROSTER_EXPORT_HEADERS', () => {
    it('should have correct header definitions', () => {
      expect(ROSTER_EXPORT_HEADERS).toHaveLength(7);
      expect(ROSTER_EXPORT_HEADERS.map((h) => h.header)).toEqual([
        'Full Name',
        'Email',
        'Street Address',
        'City',
        'State',
        'Zip',
        'Affiliation Dues Paid',
      ]);
    });

    it('should include headers in output when there is data', async () => {
      const data: RosterExportRow[] = [
        {
          fullName: 'Test User',
          email: 'test@example.com',
          streetAddress: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          affiliationDuesPaid: 'Yes',
        },
      ];
      const result = await generateCsv(data, ROSTER_EXPORT_HEADERS);
      const csvString = result.toString();
      const lines = csvString.trim().split('\n');

      expect(lines[0]).toBe('Full Name,Email,Street Address,City,State,Zip,Affiliation Dues Paid');
    });

    it('should generate correct roster export row', async () => {
      const data: RosterExportRow[] = [
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          streetAddress: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          affiliationDuesPaid: 'Yes',
        },
      ];

      const result = await generateCsv(data, ROSTER_EXPORT_HEADERS);
      const csvString = result.toString();
      const lines = csvString.trim().split('\n');

      expect(lines[1]).toBe('John Doe,john@example.com,123 Main St,Springfield,IL,62701,Yes');
    });
  });

  describe('MANAGER_EXPORT_HEADERS', () => {
    it('should have correct header definitions with phone order matching legacy system', () => {
      expect(MANAGER_EXPORT_HEADERS).toHaveLength(10);
      expect(MANAGER_EXPORT_HEADERS.map((h) => h.header)).toEqual([
        'Full Name',
        'Email',
        'Phone 2',
        'Phone 3',
        'Phone 1',
        'Street Address',
        'City',
        'State',
        'Zip',
        'League / Team',
      ]);
    });

    it('should include headers in output when there is data', async () => {
      const data: ManagerExportRow[] = [
        {
          fullName: 'Test Manager',
          email: 'manager@example.com',
          phone2: '555-0102',
          phone3: '555-0103',
          phone1: '555-0101',
          streetAddress: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          leagueTeamName: 'Test League / Test Team',
        },
      ];
      const result = await generateCsv(data, MANAGER_EXPORT_HEADERS);
      const csvString = result.toString();
      const lines = csvString.trim().split('\n');

      expect(lines[0]).toBe(
        'Full Name,Email,Phone 2,Phone 3,Phone 1,Street Address,City,State,Zip,League / Team',
      );
    });

    it('should generate correct manager export row', async () => {
      const data: ManagerExportRow[] = [
        {
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          phone2: '555-0102',
          phone3: '555-0103',
          phone1: '555-0101',
          streetAddress: '456 Oak Ave',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
          leagueTeamName: 'Spring League / Tigers',
        },
      ];

      const result = await generateCsv(data, MANAGER_EXPORT_HEADERS);
      const csvString = result.toString();
      const lines = csvString.trim().split('\n');

      expect(lines[1]).toBe(
        'Jane Smith,jane@example.com,555-0102,555-0103,555-0101,456 Oak Ave,Chicago,IL,60601,Spring League / Tigers',
      );
    });
  });
});
