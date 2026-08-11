import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPrint, faArrowLeft, faSpinner, faReceipt
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const fmt = (n, decimals = 2) =>
  parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PaymentReceipt() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`${API_URL}/finance/invoices/${invoiceId}`);
        const json = await res.json();
        if (json.success && json.invoice) {
          setInvoice(json.invoice);
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
        <FontAwesomeIcon icon={faSpinner} spin /> Loading receipt...
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

  const isStudent = invoice.invoice_type === 'Student';
  const isAgent = invoice.invoice_type === 'Agent Commission';
  const isManual = invoice.is_manual_student === 1 || invoice.is_manual_student === true;

  const personName = isAgent
    ? (invoice.agent_name || 'Agent')
    : (isManual ? (invoice.manual_student_name || invoice.student_name) : (invoice.student_name || '—'));

  const personRef = isAgent
    ? (invoice.agent_company || null)
    : (isManual ? (invoice.manual_student_ref_id || invoice.student_ref_id) : (invoice.student_ref_id || null));

  const personEmail = isAgent
    ? (invoice.agent_email || null)
    : (isManual ? (invoice.manual_student_email || invoice.student_email) : (invoice.student_email || null));

  const personMobile = isAgent
    ? (invoice.agent_phone || null)
    : (isManual ? (invoice.manual_student_mobile || invoice.student_mobile) : (invoice.student_mobile || null));

  const finalAmount = parseFloat(invoice.final_amount) || 0;
  const paidAmount = parseFloat(invoice.paid_amount) || 0;
  const remaining = Math.max(0, finalAmount - paidAmount);
  const pkrSymbol = '₨';

  const printStyles = `
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .receipt-wrapper-parent { padding: 0 !important; background: #fff !important; }
      .receipt-wrapper { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
    }
    @page { margin: 12mm; size: A4; }
  `;

  return (
    <>
      <style>{printStyles}</style>

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
          <FontAwesomeIcon icon={faReceipt} style={{ color: '#F47B20' }} />
          Payment Receipt — #{invoice.invoice_id}
        </div>
        <button onClick={handlePrint} style={{
          background: '#F47B20', border: 'none', color: '#fff', padding: '8px 20px',
          borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '7px'
        }}>
          <FontAwesomeIcon icon={faPrint} /> Print / Save PDF
        </button>
      </div>

      <div className="receipt-wrapper-parent" style={{ background: '#f5f5f5', minHeight: 'calc(100vh - 54px)', padding: '32px 16px' }}>
        <div className="receipt-wrapper" style={{
          background: '#fff', maxWidth: '560px', margin: '0 auto',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)', borderRadius: '12px',
          padding: '28px 32px', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#1a1a1a'
        }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <img src="/images/logo.webp" alt="Unilink" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a' }}>Payment Receipt</div>
              <div style={{ fontSize: '12px', color: '#F47B20', fontWeight: 700 }}>#{invoice.invoice_id}</div>
            </div>
          </div>

          <div style={{ height: '2px', background: '#F47B20', marginBottom: '20px' }} />

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
              {isAgent ? 'Paid To' : 'Received From'}
            </div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a' }}>{personName}</div>
            {personRef && (
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                {isAgent ? personRef : `ID: ${personRef}`}
              </div>
            )}
            {personEmail && <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{personEmail}</div>}
            {personMobile && <div style={{ fontSize: '12px', color: '#555' }}>{personMobile}</div>}
            {isStudent && invoice.student_country && (
              <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                Countries: {invoice.student_country}
              </div>
            )}
          </div>

          <div style={{
            background: '#f9f9f9', borderRadius: '10px', padding: '16px 18px',
            border: '1px solid #eee', marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
              <span style={{ color: '#666' }}>Invoice Total</span>
              <span style={{ fontWeight: 700 }}>{pkrSymbol} {fmt(finalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
              <span style={{ color: '#666' }}>Amount Paid</span>
              <span style={{ fontWeight: 800, color: '#2E7D32', fontSize: '15px' }}>{pkrSymbol} {fmt(paidAmount)}</span>
            </div>
            <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0 12px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#666' }}>Amount Remaining</span>
              <span style={{ fontWeight: 800, color: remaining > 0 ? '#E65100' : '#2E7D32', fontSize: '15px' }}>
                {pkrSymbol} {fmt(remaining)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#FFF8F0', borderRadius: '8px', padding: '12px 14px', border: '1px solid #FFE0B2' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                Payment Date
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>{fmtDate(invoice.payment_date)}</div>
            </div>
            <div style={{ background: '#E3F2FD', borderRadius: '8px', padding: '12px 14px', border: '1px solid #90CAF9' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                Status
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1565C0' }}>{invoice.payment_status || '—'}</div>
            </div>
          </div>

          <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0 12px' }} />
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#aaa' }}>
            This is a computer-generated payment receipt and does not require a signature.
          </div>
        </div>
      </div>
    </>
  );
}
