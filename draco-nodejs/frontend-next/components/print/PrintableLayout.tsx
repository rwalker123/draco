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
          body * { visibility: hidden !important; }
          .dr-print-root, .dr-print-root * { visibility: visible !important; }
          .dr-print-root {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
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
