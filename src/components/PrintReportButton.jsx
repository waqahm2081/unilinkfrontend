import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { printReport } from '../utils/printReport';
import '../styles/printReport.css';

export default function PrintReportButton({ show, title, columns, rows, subtitle }) {
  if (!show) return null;

  const handlePrint = () => {
    printReport({ title, columns, rows, subtitle });
  };

  return (
    <button type="button" className="btn-print-report" onClick={handlePrint}>
      <FontAwesomeIcon icon={faPrint} />
      Print Reports
    </button>
  );
}
