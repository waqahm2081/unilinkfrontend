import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPrint, faArrowLeft, faSpinner, faReceipt
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const CURRENCY_SYMBOLS = { PKR: '₨', USD: '$', GBP: '£', EUR: '€' };

const fmt = (n, decimals = 2) =>
  parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PaymentReceipt() {
  const { invoiceId, paymentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`${API_URL}/finance/invoices/${invoiceId}`);
        const json = await res.json();
        if (json.success && json.invoice) {
          setInvoice(json.invoice);
          const list = Array.isArray(json.payments) ? json.payments : [];
          setPayments(list);

          if (paymentId) {
            const match = list.find(p => String(p.id) === String(paymentId));
            if (!match) {
              setError('Payment installment not found for this invoice');
              return;
            }
            setSelectedPayment(match);
          } else if (list.length === 1) {
            setSelectedPayment(list[0]);
          } else if (list.length === 0 && parseFloat(json.invoice.paid_amount) > 0) {
            // Legacy fallback: no history rows yet
            setSelectedPayment({
              id: null,
              amount: json.invoice.paid_amount,
              payment_date: json.invoice.payment_date,
              notes: null
            });
          } else if (list.length > 1) {
            // Show latest installment if no specific payment selected
            setSelectedPayment(list[list.length - 1]);
          }
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
  }, [invoiceId, paymentId]);

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
  const totalPaid = parseFloat(invoice.paid_amount) || 0;
  const installmentAmount = parseFloat(selectedPayment?.amount) || totalPaid;
  const installmentIndex = selectedPayment?.id
    ? payments.findIndex(p => String(p.id) === String(selectedPayment.id)) + 1
    : (payments.length || 1);
  // Remaining after this installment (based on cumulative payments up to this one)
  let paidUpToThis = installmentAmount;
  if (selectedPayment?.id && payments.length) {
    paidUpToThis = 0;
    for (const p of payments) {
      paidUpToThis += parseFloat(p.amount) || 0;
      if (String(p.id) === String(selectedPayment.id)) break;
    }
  }
  const remainingAfter = Math.max(0, finalAmount - paidUpToThis);

  const currency      = invoice.selected_currency || 'PKR';
  const isPKR         = currency === 'PKR';
  const currSymbol    = CURRENCY_SYMBOLS[currency] || currency;
  const pkrSymbol     = '₨';
  const exchangeRate  = parseFloat(invoice.exchange_rate) || 1;
  const showConverted = !isPKR && invoice.show_converted_currency !== 0 && invoice.show_converted_currency !== false && exchangeRate > 0;
  const toForeign     = (pkr) => exchangeRate > 0 ? parseFloat(pkr || 0) / exchangeRate : 0;

  const AmountCell = ({ pkr, color, size = '13px', weight = 700 }) => (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontWeight: weight, fontSize: size, color: color || '#1a1a1a' }}>
        {pkrSymbol} {fmt(pkr)}
      </div>
      {showConverted && (
        <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, marginTop: '1px' }}>
          {currSymbol} {fmt(toForeign(pkr))} {currency}
        </div>
      )}
    </div>
  );

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
          {payments.length > 1 && selectedPayment?.id && (
            <span style={{ color: '#F47B20' }}>· Installment #{installmentIndex}</span>
          )}
        </div>
        {payments.length > 1 && (
          <select
            value={selectedPayment?.id || ''}
            onChange={(e) => navigate(`/payment-receipt/${invoiceId}/${e.target.value}`)}
            style={{
              background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '8px',
              padding: '7px 10px', fontSize: '12px'
            }}
          >
            {payments.map((p, idx) => (
              <option key={p.id} value={p.id}>
                Installment #{idx + 1} — {fmtDate(p.payment_date)} — ₨ {fmt(p.amount)}
                {showConverted ? ` (≈ ${currSymbol}${fmt(toForeign(p.amount))})` : ''}
              </option>
            ))}
          </select>
        )}
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
              {!isPKR && (
                <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                  {showConverted ? `Shown in PKR and ${currency}` : 'Shown in PKR only'}
                </div>
              )}
              {payments.length > 0 && (
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  Installment #{installmentIndex} of {payments.length || 1}
                </div>
              )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', fontSize: '13px' }}>
              <span style={{ color: '#666' }}>Invoice Total</span>
              <AmountCell pkr={finalAmount} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', fontSize: '13px' }}>
              <span style={{ color: '#666' }}>This Installment</span>
              <AmountCell pkr={installmentAmount} color="#2E7D32" size="15px" weight={800} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', fontSize: '13px' }}>
              <span style={{ color: '#666' }}>Total Paid (to date)</span>
              <AmountCell pkr={paidUpToThis} />
            </div>
            <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0 12px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '13px' }}>
              <span style={{ color: '#666' }}>Amount Remaining</span>
              <AmountCell pkr={remainingAfter} color={remainingAfter > 0 ? '#E65100' : '#2E7D32'} size="15px" weight={800} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#FFF8F0', borderRadius: '8px', padding: '12px 14px', border: '1px solid #FFE0B2' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                Payment Date
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a1a' }}>
                {fmtDate(selectedPayment?.payment_date || invoice.payment_date)}
              </div>
            </div>
            <div style={{ background: '#E3F2FD', borderRadius: '8px', padding: '12px 14px', border: '1px solid #90CAF9' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
                Status
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1565C0' }}>
                {remainingAfter > 0 ? 'Partially Paid' : (invoice.payment_status || 'Paid')}
              </div>
            </div>
          </div>

          {payments.length > 1 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                Installment Summary
              </div>
              {payments.map((p, idx) => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: '12px',
                  padding: '4px 0', borderBottom: '1px dashed #eee',
                  fontWeight: selectedPayment?.id === p.id ? 700 : 400,
                  color: selectedPayment?.id === p.id ? '#1a1a1a' : '#666'
                }}>
                  <span>#{idx + 1} · {fmtDate(p.payment_date)}</span>
                  <AmountCell pkr={p.amount} color={selectedPayment?.id === p.id ? '#1a1a1a' : '#666'} size="12px" weight={selectedPayment?.id === p.id ? 700 : 400} />
                </div>
              ))}
            </div>
          )}

          <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0 12px' }} />
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#aaa' }}>
            This is a computer-generated payment receipt and does not require a signature.
          </div>
        </div>
      </div>
    </>
  );
}
