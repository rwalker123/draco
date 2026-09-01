import type React from 'react';

export const printTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '11px',
};

export const printThStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '4px 6px',
  borderBottom: '2px solid #333',
  fontWeight: 700,
  fontSize: '10px',
  textTransform: 'uppercase',
};

export const printTdStyle: React.CSSProperties = {
  padding: '3px 6px',
  borderBottom: '1px solid #ccc',
  verticalAlign: 'top',
};

export const printNoWrapTdStyle: React.CSSProperties = {
  ...printTdStyle,
  whiteSpace: 'nowrap',
};
