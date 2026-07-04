'use client';

export default function InvoicePrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        .no-print {
          display: none !important;
        }
        body * {
          visibility: hidden;
        }
        #invoice-print-area,
        #invoice-print-area * {
          visibility: visible;
        }
        #invoice-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          border: none !important;
          box-shadow: none !important;
        }
        #view-bill-overlay {
          position: static !important;
          background: none !important;
          padding: 0 !important;
        }
        #view-bill-modal {
          max-height: none !important;
          overflow: visible !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
      }
    `}</style>
  );
}