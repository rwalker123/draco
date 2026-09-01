import { describe, expect, it } from 'vitest';
import { buildCsvContent, escapeCsvValue } from '../csvExport';

describe('escapeCsvValue', () => {
  it('leaves plain values untouched', () => {
    expect(escapeCsvValue('Berkley')).toBe('Berkley');
  });

  it('quotes values containing a comma', () => {
    expect(escapeCsvValue('Mon, May 11, 2026')).toBe('"Mon, May 11, 2026"');
  });

  it('quotes and doubles embedded quotes', () => {
    expect(escapeCsvValue('The "Big" Field')).toBe('"The ""Big"" Field"');
  });

  it('quotes values containing newlines', () => {
    expect(escapeCsvValue('line one\nline two')).toBe('"line one\nline two"');
  });

  it('neutralizes leading formula characters', () => {
    expect(escapeCsvValue('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(escapeCsvValue('+1')).toBe("'+1");
    expect(escapeCsvValue('@field')).toBe("'@field");
    expect(escapeCsvValue('\tcmd')).toBe("'\tcmd");
  });

  it('neutralizes a formula prefix hidden behind leading whitespace', () => {
    expect(escapeCsvValue(' =SUM(A1:A2)')).toBe("' =SUM(A1:A2)");
    expect(escapeCsvValue('   @field')).toBe("'   @field");
  });

  it('neutralizes a leading minus when the value is not a plain number', () => {
    expect(escapeCsvValue('-2+3+cmd|calc')).toBe("'-2+3+cmd|calc");
    expect(escapeCsvValue('-Field A')).toBe("'-Field A");
  });

  it('quotes a neutralized value that also contains a comma', () => {
    expect(escapeCsvValue('=a,b')).toBe('"\'=a,b"');
  });

  it('does not neutralize negative numbers, padded or not', () => {
    expect(escapeCsvValue('-3')).toBe('-3');
    expect(escapeCsvValue('-3.25')).toBe('-3.25');
    expect(escapeCsvValue(' -3')).toBe(' -3');
  });
});

describe('escapeCsvValue with preserveText', () => {
  const asText = (value: string) => escapeCsvValue(value, { preserveText: true });

  it('pins values a spreadsheet would read as a signed number', () => {
    expect(asText('18+')).toBe('="18+"');
    expect(asText('70-')).toBe('="70-"');
  });

  it('pins times so they are not converted to time values', () => {
    expect(asText('9:00 PM')).toBe('="9:00 PM"');
  });

  it('leaves values that start with a letter untouched', () => {
    expect(asText('Berkley')).toBe('Berkley');
    expect(asText('White Sox vs Dodgers')).toBe('White Sox vs Dodgers');
    expect(asText('Kyte Field 1')).toBe('Kyte Field 1');
  });

  it('falls back to plain quoting when a text literal would break the row', () => {
    expect(asText('1,000 Oaks')).toBe('"1,000 Oaks"');
    expect(asText('9" Field')).toBe('"9"" Field"');
  });

  it('keeps the formula-injection guard ahead of the text literal', () => {
    expect(asText('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(asText('+1')).toBe("'+1");
    expect(asText(' =SUM(A1:A2)')).toBe("' =SUM(A1:A2)");
    expect(asText('-2+3+cmd|calc')).toBe("'-2+3+cmd|calc");
  });

  it('still pins plain negative numbers as text rather than guarding them', () => {
    expect(asText('-3')).toBe('="-3"');
  });
});

describe('buildCsvContent', () => {
  it('joins cells with commas and rows with CRLF, ending with a trailing newline', () => {
    const content = buildCsvContent([
      ['Date', 'Field'],
      ['Mon, May 11, 2026', 'Berkley'],
    ]);

    expect(content).toBe('Date,Field\r\n"Mon, May 11, 2026",Berkley\r\n');
  });

  it('produces a header-only document when there are no data rows', () => {
    expect(buildCsvContent([['Date', 'Field']])).toBe('Date,Field\r\n');
  });

  it('applies preserveText to every cell when requested', () => {
    const content = buildCsvContent(
      [
        ['Field', 'Time', 'League'],
        ['Berkley', '9:00 PM', '18+'],
      ],
      { preserveText: true },
    );

    expect(content).toBe('Field,Time,League\r\nBerkley,="9:00 PM",="18+"\r\n');
  });
});
