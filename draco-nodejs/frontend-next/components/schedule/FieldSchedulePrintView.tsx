import React from 'react';
import PrintableLayout from '../print/PrintableLayout';
import {
  printNoWrapTdStyle,
  printTableStyle,
  printTdStyle,
  printThStyle,
} from '../print/printTableStyles';
import {
  buildFieldGameRows,
  FIELD_GAME_COLUMN_LABELS,
  type FieldGameGroup,
} from './utils/fieldGames';

interface FieldSchedulePrintViewProps {
  groups: FieldGameGroup[];
  title: string;
  subtitle?: string;
  timeZone: string;
}

const FieldSchedulePrintView: React.FC<FieldSchedulePrintViewProps> = ({
  groups,
  title,
  subtitle,
  timeZone,
}) => {
  const rows = buildFieldGameRows(groups, timeZone);

  if (rows.length === 0) {
    return (
      <PrintableLayout title={title} subtitle={subtitle} priority>
        <p style={{ fontSize: '12px', color: '#555' }}>No games to display.</p>
      </PrintableLayout>
    );
  }

  return (
    <PrintableLayout title={title} subtitle={subtitle} priority>
      <table style={printTableStyle}>
        <thead>
          <tr>
            {FIELD_GAME_COLUMN_LABELS.map((label) => (
              <th key={label} style={printThStyle}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.gameId} className="dr-print-row">
              <td style={printTdStyle}>{row.fieldName}</td>
              <td style={printNoWrapTdStyle}>{row.date}</td>
              <td style={printNoWrapTdStyle}>{row.time}</td>
              <td style={printTdStyle}>{row.league}</td>
              <td style={printTdStyle}>{row.matchup}</td>
              <td style={printTdStyle}>{row.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PrintableLayout>
  );
};

export default FieldSchedulePrintView;
