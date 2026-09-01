import { downloadBlob } from './downloadUtils';

const QUOTE_REQUIRED_PATTERN = /[",\r\n]/;
const LEADING_WHITESPACE_PATTERN = /^\s+/;
const CONTROL_PREFIX_PATTERN = /^[\t\r]/;
const FORMULA_PREFIX_PATTERN = /^[=+@-]/;
const PLAIN_NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/;
const SPREADSHEET_COERCIBLE_PATTERN = /^[+\-.\d]/;
const UTF8_BOM = '\uFEFF';

export interface CsvOptions {
  preserveText?: boolean;
}

const isFormulaRisk = (value: string): boolean => {
  if (CONTROL_PREFIX_PATTERN.test(value)) {
    return true;
  }
  const withoutLeadingWhitespace = value.replace(LEADING_WHITESPACE_PATTERN, '');
  if (PLAIN_NUMBER_PATTERN.test(withoutLeadingWhitespace)) {
    return false;
  }
  return FORMULA_PREFIX_PATTERN.test(withoutLeadingWhitespace);
};

const escapeStandardValue = (value: string): string => {
  const guarded = isFormulaRisk(value) ? `'${value}` : value;
  if (!QUOTE_REQUIRED_PATTERN.test(guarded)) {
    return guarded;
  }
  return `"${guarded.replace(/"/g, '""')}"`;
};

const escapeTextValue = (value: string): string => {
  if (isFormulaRisk(value)) {
    return escapeStandardValue(value);
  }
  if (!SPREADSHEET_COERCIBLE_PATTERN.test(value) || QUOTE_REQUIRED_PATTERN.test(value)) {
    return escapeStandardValue(value);
  }
  return `="${value}"`;
};

export const escapeCsvValue = (value: string, options: CsvOptions = {}): string =>
  options.preserveText ? escapeTextValue(value) : escapeStandardValue(value);

export const buildCsvContent = (rows: string[][], options: CsvOptions = {}): string =>
  `${rows
    .map((row) => row.map((value) => escapeCsvValue(value, options)).join(','))
    .join('\r\n')}\r\n`;

export const downloadCsvFile = (filename: string, content: string): void => {
  const blob = new Blob([`${UTF8_BOM}${content}`], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename);
};
