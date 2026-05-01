import React from 'react';
import type { ReactNode } from 'react';

interface PrintableLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const PrintableLayout: React.FC<PrintableLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <>
      <style>{`
        @media screen {
          .dr-print-root { display: none; }
        }
        @media print {
          @page {
            size: letter portrait;
            margin: 0.4in;
          }
          body *:not(:has(.dr-print-root)):not(.dr-print-root):not(.dr-print-root *) {
            display: none !important;
          }
          html, body { min-height: 0 !important; height: auto !important; margin: 0 !important; padding: 0 !important; }
          body :has(.dr-print-root):not(.dr-print-root) {
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: none !important;
          }
          .dr-print-root { display: block; width: 100%; }
          .print-hidden { display: none !important; }
          .dr-print-row { page-break-inside: avoid; }
        }
      `}</style>
      <div className="dr-print-root">
        <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>{title}</h1>
        {subtitle ? (
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#555' }}>{subtitle}</p>
        ) : null}
        {children}
      </div>
    </>
  );
};

export default PrintableLayout;
