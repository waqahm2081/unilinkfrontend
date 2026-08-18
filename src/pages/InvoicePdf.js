import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPrint, faArrowLeft, faSpinner, faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';
import InvoiceDocument from '../components/InvoiceDocument';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function InvoicePdf() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [data, setData]       = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res  = await fetch(`${API_URL}/finance/invoices/${invoiceId}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.message || 'Invoice not found');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px', color: '#F47B20', fontSize: '16px' }}>
        <FontAwesomeIcon icon={faSpinner} spin /> Loading invoice...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
        <div style={{ color: '#c62828', fontSize: '16px' }}>{error}</div>
        <button onClick={() => navigate(-1)} style={{ background: '#F47B20', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          Go Back
        </button>
      </div>
    );
  }

  const { invoice } = data;
  const currency      = invoice.selected_currency || 'PKR';
  const isPKR         = currency === 'PKR';
  const showConverted = !isPKR && invoice.show_converted_currency !== 0;

  const statusColor = {
    'Paid':           '#2E7D32',
    'Pending':        '#E65100',
    'Partially Paid': '#1565C0',
    'Cancelled':      '#C62828',
  }[invoice.payment_status] || '#333';

  return (
    <>
      <div className="no-print" style={{
        background: '#1a1a1a', padding: '12px 24px', display: 'flex', alignItems: 'center',
        gap: '12px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: '1px solid #555', color: '#fff', padding: '7px 14px',
          borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div style={{ flex: 1, color: '#ccc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#F47B20' }} />
          Invoice #{invoice.invoice_id}
          <span style={{ background: '#333', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', color: statusColor, fontWeight: 700 }}>
            {invoice.payment_status}
          </span>
          {!isPKR && !showConverted && (
            <span style={{ background: '#F47B20', color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
              {currency} hidden on PDF
            </span>
          )}
        </div>
        <button onClick={handlePrint} style={{
          background: '#F47B20', border: 'none', color: '#fff', padding: '8px 20px',
          borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '7px'
        }}>
          <FontAwesomeIcon icon={faPrint} /> Print / Save PDF
        </button>
      </div>

      <InvoiceDocument data={data} />
    </>
  );
}
