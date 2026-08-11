import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPrint, faArrowLeft, faSpinner, faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const CURRENCY_SYMBOLS = { PKR: '₨', USD: '$', GBP: '£', EUR: '€' };

const fmt = (n, decimals = 2) =>
  parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

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

  const { invoice, extraServices, countryServices, agentStudents, commissionStudents, defaultServices } = data;

  const isStudent    = invoice.invoice_type === 'Student';
  const isCommission = invoice.invoice_type === 'University Commission';
  const isAgent      = invoice.invoice_type === 'Agent Commission';

  // Currency display
  const currency      = invoice.selected_currency || 'PKR';
  const isPKR         = currency === 'PKR';
  const currSymbol    = CURRENCY_SYMBOLS[currency] || currency;
  const pkrSymbol     = '₨';
  const exchangeRate  = parseFloat(invoice.exchange_rate) || 1;
  const showConverted = !isPKR && invoice.show_converted_currency !== 0; // 0 = hidden

  // Student display name (handles manual + DB)
  const studentName = invoice.student_name || '—';
  const studentRef  = invoice.student_ref_id || null;

  // Commission students (multi-student University Commission)
  const commStudents = Array.isArray(commissionStudents) ? commissionStudents : [];

  // Services
  const extra    = Array.isArray(extraServices) ? extraServices : [];
  const country  = Array.isArray(countryServices) ? countryServices : [];
  const defaults = Array.isArray(defaultServices) ? defaultServices : [];
  const agentStu = Array.isArray(agentStudents) ? agentStudents : [];

  const countryGrouped = country.reduce((acc, svc) => {
    const key = svc.country_name || 'Country Services';
    if (!acc[key]) acc[key] = [];
    acc[key].push(svc);
    return acc;
  }, {});

  // Nest invoice country services: parents with their selected children
  const nestInvoiceCountryServices = (services) => {
    const list = Array.isArray(services) ? services : [];
    const parents = list.filter(s => s.is_parent === 1 || s.is_parent === true);
    const children = list.filter(s => !(s.is_parent === 1 || s.is_parent === true));

    if (parents.length > 0) {
      return parents.map(parent => ({
        ...parent,
        is_parent: true,
        children: children.filter(c =>
          Number(c.parent_service_id) === Number(parent.country_service_id) ||
          (c.parent_service_name && c.parent_service_name === parent.service_name)
        )
      }));
    }

    // Fallback when hierarchy columns weren't saved: group under "Processing Charges..." mains
    const nested = [];
    let current = null;
    for (const svc of list) {
      const isMainSet = /^processing charges/i.test(svc.service_name || '');
      if (isMainSet) {
        current = { ...svc, is_parent: true, children: [] };
        nested.push(current);
      } else if (current) {
        current.children.push(svc);
      } else {
        nested.push({ ...svc, is_parent: false, children: [] });
      }
    }
    return nested;
  };

  // Amounts
  const baseAmount          = parseFloat(invoice.base_amount) || 0;
  const discount            = parseFloat(invoice.discount) || 0;
  const extraTotal          = parseFloat(invoice.extra_services_total) || extra.reduce((s, x) => s + parseFloat(x.price || 0), 0);
  const gstAmount           = parseFloat(invoice.gst_amount) || 0;
  const gstPercent          = parseFloat(invoice.gst_percent) || 0;
  const finalAmount         = parseFloat(invoice.final_amount) || 0;
  const convertedFinal      = isPKR ? null : (exchangeRate > 0 ? finalAmount / exchangeRate : null);
  const agentCommissionAmt  = parseFloat(invoice.agent_commission_amount) || 0;
  const agentCommPercent    = parseFloat(invoice.agent_commission_percent) || 0;

  // Format date
  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusColor = {
    'Paid':           '#2E7D32',
    'Pending':        '#E65100',
    'Partially Paid': '#1565C0',
    'Cancelled':      '#C62828',
  }[invoice.payment_status] || '#333';

  // ─── Print styles
  const printStyles = `
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .invoice-wrapper-parent { padding: 0 !important; }
      .invoice-wrapper { box-shadow: none !important; margin: 0 !important; padding: 8px 12px !important; max-width: 100% !important; border-radius: 0 !important; }
    }
    @page { margin: 6mm; size: A4; }
  `;

  const cellPad = '2px 8px';
  const sectionGap = '8px';

  return (
    <>
      <style>{printStyles}</style>

      {/* Top toolbar (hidden on print) */}
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

      {/* Invoice body */}
      <div className="invoice-wrapper-parent" style={{ background: '#f5f5f5', minHeight: 'calc(100vh - 54px)', padding: '20px 16px' }}>
        <div className="invoice-wrapper" style={{
          background: '#fff', maxWidth: '800px', margin: '0 auto',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)', borderRadius: '12px',
          padding: '10px 20px', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#1a1a1a', fontSize: '11px'
        }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <img src="/images/logo.webp" alt="Unilink" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#F47B20', fontWeight: 700 }}>#{invoice.invoice_id}</div>
            </div>
          </div>

          {/* ── Invoice meta grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: sectionGap }}>
            {/* Left: Billed To */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                Billed To
              </div>

              {isStudent && (
                <>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>{studentName}</div>
                  {studentRef && <div style={{ fontSize: '11px', color: '#888' }}>ID: {studentRef}</div>}
                  {invoice.student_email  && <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>{invoice.student_email}</div>}
                  {invoice.student_mobile && <div style={{ fontSize: '10px', color: '#555' }}>{invoice.student_mobile}</div>}
                  {invoice.student_country && (
                    <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>
                      <span style={{ color: '#888' }}>Countries: </span>{invoice.student_country}
                    </div>
                  )}
                </>
              )}

              {isCommission && (
                <>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>University Commission</div>
                  <div style={{ fontSize: '11px', color: '#6A1B9A', fontWeight: 600 }}>{commStudents.length} Student{commStudents.length !== 1 ? 's' : ''}</div>
                  {commStudents.slice(0, 3).map((cs, i) => (
                    <div key={i} style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>
                      {i + 1}. {cs.student_name}{cs.university_name ? ` — ${cs.university_name}` : ''}
                    </div>
                  ))}
                  {commStudents.length > 3 && (
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '1px' }}>+{commStudents.length - 3} more</div>
                  )}
                </>
              )}

              {isAgent && (
                <>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>{invoice.agent_name || 'Agent'}</div>
                  {invoice.agent_company && <div style={{ fontSize: '11px', color: '#888' }}>{invoice.agent_company}</div>}
                  {agentStu.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      {agentStu.map((s, i) => (
                        <div key={i} style={{ fontSize: '11px', color: '#555' }}>
                          • {s.student_name}{s.student_ref_id ? ` (${s.student_ref_id})` : ''}{s.is_manual ? ' [manual]' : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right: Invoice details */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                Invoice Details
              </div>
              {[
                { label: 'Invoice Date', value: fmtDate(invoice.invoice_date) },
                { label: 'Due Date',     value: fmtDate(invoice.due_date) },
                { label: 'Payment',      value: invoice.payment_method === 'cash' ? 'Cash' : (invoice.bank_name || invoice.account_name || '—') },
                !isPKR && { label: 'Currency', value: `${currency} (1 ${currency} = ${fmt(exchangeRate, 4)} PKR)` },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                  <span style={{ color: '#888', minWidth: '90px' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#333', textAlign: 'right', maxWidth: '200px' }}>{value}</span>
                </div>
              ))}
              {invoice.payment_method !== 'cash' && invoice.account_name && (
                <>
                  {invoice.account_number && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                      <span style={{ color: '#888' }}>Account No.</span>
                      <span style={{ fontWeight: 600, color: '#333' }}>{invoice.account_number}</span>
                    </div>
                  )}
                  {invoice.iban && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                      <span style={{ color: '#888' }}>IBAN</span>
                      <span style={{ fontWeight: 600, color: '#333', fontSize: '10px' }}>{invoice.iban}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Student Invoice services ── */}
          {isStudent && (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ padding: cellPad, textAlign: 'left', fontWeight: 700, color: '#555', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                    <th style={{ padding: cellPad, textAlign: 'right', fontWeight: 700, color: '#555', borderBottom: '1px solid #e5e7eb', width: '110px' }}>Amount (PKR)</th>
                    {showConverted && <th style={{ padding: cellPad, textAlign: 'right', fontWeight: 700, color: '#555', borderBottom: '1px solid #e5e7eb', width: '100px' }}>{currency}</th>}
                  </tr>
                </thead>
                <tbody>
                  {baseAmount > 0 && (
                    <tr>
                      <td style={{ padding: cellPad, borderBottom: '1px solid #f5f5f5' }}>Consultancy / Processing Fee</td>
                      <td style={{ padding: cellPad, textAlign: 'right', borderBottom: '1px solid #f5f5f5', fontWeight: 600 }}>{pkrSymbol} {fmt(baseAmount)}</td>
                      {showConverted && <td style={{ padding: cellPad, textAlign: 'right', borderBottom: '1px solid #f5f5f5', color: '#666' }}>{currSymbol} {fmt(baseAmount / exchangeRate)}</td>}
                    </tr>
                  )}

                  {defaults.map((svc, i) => (
                    <tr key={`ds-${i}`} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: cellPad, borderBottom: '1px solid #f5f5f5', paddingLeft: '14px' }}>
                        <span style={{ color: '#888', marginRight: '4px' }}>✓</span>{svc.service_name}
                      </td>
                      <td style={{ padding: cellPad, textAlign: 'right', borderBottom: '1px solid #f5f5f5' }} />
                      {showConverted && <td style={{ padding: cellPad, textAlign: 'right', borderBottom: '1px solid #f5f5f5' }} />}
                    </tr>
                  ))}

                  {Object.entries(countryGrouped).map(([countryName, services]) => {
                    const nested = nestInvoiceCountryServices(services);
                    return (
                      <React.Fragment key={countryName}>
                        <tr>
                          <td colSpan={showConverted ? 3 : 2} style={{ padding: '3px 8px', background: '#FFF8F0', fontWeight: 700, color: '#F47B20', fontSize: '10px', borderBottom: '1px solid #FFE0B2' }}>
                            {countryName}
                          </td>
                        </tr>
                        {nested.map((svc, i) => (
                          <React.Fragment key={`cs-${countryName}-${svc.id || i}`}>
                            <tr>
                              <td style={{
                                padding: cellPad,
                                borderBottom: svc.children?.length ? 'none' : '1px solid #f5f5f5',
                                paddingLeft: '14px',
                                fontWeight: svc.is_parent || svc.children?.length ? 700 : 400,
                                fontSize: '11px'
                              }}>
                                <span style={{ color: '#F47B20', marginRight: '4px' }}>✓</span>{svc.service_name}
                              </td>
                              <td style={{
                                padding: cellPad,
                                textAlign: 'right',
                                borderBottom: svc.children?.length ? 'none' : '1px solid #f5f5f5'
                              }} />
                              {showConverted && (
                                <td style={{
                                  padding: cellPad,
                                  textAlign: 'right',
                                  borderBottom: svc.children?.length ? 'none' : '1px solid #f5f5f5'
                                }} />
                              )}
                            </tr>
                            {(svc.children || []).map((sub, j) => (
                              <tr key={`cs-sub-${countryName}-${sub.id || j}`}>
                                <td style={{
                                  padding: '5px 8px 4px 28px',
                                  borderBottom: '1px solid #e5e7eb',
                                  color: '#555',
                                  fontSize: '10px',
                                  lineHeight: 1.35
                                }}>
                                  <span style={{ color: '#F47B20', marginRight: '4px' }}>•</span>{sub.service_name}
                                </td>
                                <td style={{
                                  padding: '5px 8px 4px',
                                  textAlign: 'right',
                                  borderBottom: '1px solid #e5e7eb'
                                }} />
                                {showConverted && (
                                  <td style={{
                                    padding: '5px 8px 4px',
                                    textAlign: 'right',
                                    borderBottom: '1px solid #e5e7eb'
                                  }} />
                                )}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  {extra.length > 0 && (
                    <tr>
                      <td colSpan={showConverted ? 3 : 2} style={{ padding: '3px 8px', background: '#f3f4f6', fontWeight: 700, color: '#555', fontSize: '10px', borderBottom: '1px solid #e5e7eb' }}>
                        Additional Services
                      </td>
                    </tr>
                  )}
                  {extra.map((svc, i) => (
                    <tr key={`ex-${i}`}>
                      <td style={{ padding: cellPad, borderBottom: '1px solid #f5f5f5' }}>{svc.service_name}</td>
                      <td style={{ padding: cellPad, textAlign: 'right', borderBottom: '1px solid #f5f5f5', fontWeight: 600 }}>{pkrSymbol} {fmt(svc.price)}</td>
                      {showConverted && <td style={{ padding: cellPad, textAlign: 'right', borderBottom: '1px solid #f5f5f5', color: '#666' }}>{currSymbol} {fmt(parseFloat(svc.price || 0) / exchangeRate)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Subtotals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '260px' }}>
                  {[
                    extraTotal > 0 && { label: 'Additional Services', value: `${pkrSymbol} ${fmt(extraTotal)}`, converted: showConverted ? `${currSymbol} ${fmt(extraTotal / exchangeRate)}` : null },
                    gstAmount > 0 && { label: `GST (${gstPercent}%)`, value: `${pkrSymbol} ${fmt(gstAmount)}`, converted: showConverted ? `${currSymbol} ${fmt(gstAmount / exchangeRate)}` : null, color: '#FF9800' },
                    discount > 0  && { label: 'Discount', value: `− ${pkrSymbol} ${fmt(discount)}`, converted: showConverted ? `− ${currSymbol} ${fmt(discount / exchangeRate)}` : null, color: '#4CAF50' },
                    parseFloat(invoice.paid_amount) > 0 && { label: 'Paid', value: `${pkrSymbol} ${fmt(invoice.paid_amount)}`, color: '#2E7D32' },
                    invoice.payment_status === 'Partially Paid' && parseFloat(invoice.paid_amount) > 0 && {
                      label: 'Balance',
                      value: `${pkrSymbol} ${fmt(finalAmount - parseFloat(invoice.paid_amount || 0))}`,
                      color: '#E65100'
                    },
                  ].filter(Boolean).map(({ label, value, converted, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px dashed #e5e7eb', fontSize: '11px' }}>
                      <span style={{ color: '#666' }}>{label}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 600, color: color || '#333' }}>{value}</span>
                        {converted && <div style={{ fontSize: '9px', color: '#aaa' }}>{converted}</div>}
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0 0', borderTop: '2px solid #F47B20', marginTop: '2px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>Total</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#F47B20' }}>{pkrSymbol} {fmt(finalAmount)}</div>
                      {showConverted && convertedFinal !== null && (
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>
                          {currSymbol} {fmt(convertedFinal)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── University Commission — multi-student breakdown ── */}
          {isCommission && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                Commission Breakdown
              </div>

              {commStudents.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#F3E5F5' }}>
                      <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 700, color: '#4A148C', borderBottom: '1px solid #CE93D8' }}>#</th>
                      <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 700, color: '#4A148C', borderBottom: '1px solid #CE93D8' }}>Student</th>
                      <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 700, color: '#4A148C', borderBottom: '1px solid #CE93D8' }}>University</th>
                      <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 700, color: '#4A148C', borderBottom: '1px solid #CE93D8' }}>Reference</th>
                      <th style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#4A148C', borderBottom: '1px solid #CE93D8' }}>Commission (PKR)</th>
                      {showConverted && <th style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#4A148C', borderBottom: '1px solid #CE93D8' }}>{currency}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {commStudents.map((cs, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #f5f5f5', color: '#6A1B9A', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #f5f5f5' }}>
                          <div style={{ fontWeight: 600 }}>{cs.student_name || '—'}</div>
                          {cs.student_ref_id && <div style={{ fontSize: '10px', color: '#888' }}>{cs.student_ref_id}</div>}
                        </td>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #f5f5f5', color: '#555' }}>{cs.university_name || '—'}</td>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #f5f5f5', color: '#555', fontSize: '11px' }}>{cs.commission_reference || '—'}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', fontWeight: 700, color: '#6A1B9A' }}>
                          {pkrSymbol} {fmt(cs.commission_amount)}
                        </td>
                        {showConverted && (
                          <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', color: '#888' }}>
                            {currSymbol} {fmt(parseFloat(cs.commission_amount || 0) / exchangeRate)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#4A148C' }}>
                      <td colSpan={4} style={{ padding: '6px 8px', color: '#CE93D8', fontWeight: 700, fontSize: '11px' }}>
                        Total Commission ({commStudents.length} student{commStudents.length !== 1 ? 's' : ''})
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#fff', fontWeight: 800, fontSize: '13px' }}>
                        {pkrSymbol} {fmt(finalAmount)}
                      </td>
                      {showConverted && convertedFinal !== null && (
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#CE93D8', fontWeight: 700 }}>
                          {currSymbol} {fmt(convertedFinal)}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              ) : (
                /* Fallback for legacy single-student commission invoices */
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#F3E5F5' }}>
                      <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 700, color: '#4A148C', borderBottom: '1px solid #CE93D8' }}>Description</th>
                      <th style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#4A148C', borderBottom: '1px solid #CE93D8' }}>Amount (PKR)</th>
                      {showConverted && <th style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#4A148C', borderBottom: '1px solid #CE93D8' }}>{currency}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f5f5f5' }}>
                        University Commission
                        {invoice.university_name && ` — ${invoice.university_name}`}
                        {invoice.commission_reference && <span style={{ fontSize: '10px', color: '#888', marginLeft: '8px' }}>({invoice.commission_reference})</span>}
                        {studentName !== '—' && <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>Student: {studentName}</div>}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', fontWeight: 700, color: '#6A1B9A' }}>{pkrSymbol} {fmt(finalAmount)}</td>
                      {showConverted && convertedFinal !== null && (
                        <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', color: '#888' }}>{currSymbol} {fmt(convertedFinal)}</td>
                      )}
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#4A148C' }}>
                      <td style={{ padding: '6px 8px', color: '#CE93D8', fontWeight: 700 }}>Total Commission</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#fff', fontWeight: 800, fontSize: '13px' }}>{pkrSymbol} {fmt(finalAmount)}</td>
                      {showConverted && convertedFinal !== null && (
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#CE93D8', fontWeight: 700 }}>{currSymbol} {fmt(convertedFinal)}</td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              )}
            </>
          )}

          {/* ── Agent Commission ── */}
          {isAgent && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                Commission Details
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#FFF3E0' }}>
                    <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 700, color: '#E65100', borderBottom: '1px solid #FFB74D' }}>Description</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#E65100', borderBottom: '1px solid #FFB74D' }}>Amount (PKR)</th>
                    {showConverted && <th style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#E65100', borderBottom: '1px solid #FFB74D' }}>{currency}</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ fontWeight: 600 }}>Agent Commission Payout</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>Base: {pkrSymbol} {fmt(baseAmount)} × {agentCommPercent}%</div>
                      {agentStu.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                          {agentStu.map((s, i) => (
                            <div key={i} style={{ fontSize: '11px', color: '#555' }}>
                              • {s.student_name}{s.student_ref_id ? ` (${s.student_ref_id})` : ''}{s.is_manual ? ' [manual]' : ''}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', fontWeight: 700, color: '#E65100', fontSize: '14px' }}>
                      {pkrSymbol} {fmt(agentCommissionAmt || finalAmount)}
                    </td>
                    {showConverted && convertedFinal !== null && (
                      <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid #f5f5f5', color: '#888' }}>
                        {currSymbol} {fmt(convertedFinal)}
                      </td>
                    )}
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: '#E65100' }}>
                    <td style={{ padding: '6px 8px', color: '#FFE0B2', fontWeight: 700 }}>Total Commission Payable</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#fff', fontWeight: 800, fontSize: '13px' }}>
                      {pkrSymbol} {fmt(agentCommissionAmt || finalAmount)}
                    </td>
                    {showConverted && convertedFinal !== null && (
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#FFE0B2', fontWeight: 700 }}>
                        {currSymbol} {fmt(convertedFinal)}
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </>
          )}

          {/* ── Bottom panels (no Payment Status box) ── */}
          {(!isPKR && showConverted && convertedFinal !== null) || invoice.notes ? (
            <div style={{ marginTop: '10px' }}>
              {!isPKR && showConverted && convertedFinal !== null && (
                <div style={{ background: '#E3F2FD', borderRadius: '8px', padding: '10px 12px', border: '1px solid #90CAF9', marginBottom: invoice.notes ? '8px' : 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#1565C0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                    Currency Conversion
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11px' }}>
                    <span style={{ color: '#555' }}>Total (PKR)</span>
                    <span style={{ fontWeight: 700 }}>{pkrSymbol} {fmt(finalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11px' }}>
                    <span style={{ color: '#555' }}>Rate</span>
                    <span style={{ fontWeight: 600 }}>1 {currency} = {fmt(exchangeRate, 4)} PKR</span>
                  </div>
                  <div style={{ marginTop: '6px', borderTop: '1px solid #1565C0', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, color: '#1565C0', fontSize: '12px' }}>Total ({currency})</span>
                    <span style={{ fontWeight: 800, color: '#1565C0', fontSize: '16px' }}>
                      {currSymbol} {fmt(convertedFinal)}
                    </span>
                  </div>
                </div>
              )}
              {invoice.notes && (
                <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '11px', color: '#555', lineHeight: '1.4' }}>{invoice.notes}</div>
                </div>
              )}
            </div>
          ) : null}

          {/* Paid amounts for non-student invoices (kept without status box) */}
          {!isStudent && parseFloat(invoice.paid_amount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <div style={{ width: '260px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ color: '#666' }}>Paid</span>
                  <span style={{ fontWeight: 700, color: '#2E7D32' }}>{pkrSymbol} {fmt(invoice.paid_amount)}</span>
                </div>
                {invoice.payment_status === 'Partially Paid' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span style={{ color: '#666' }}>Balance</span>
                    <span style={{ fontWeight: 700, color: '#E65100' }}>
                      {pkrSymbol} {fmt(finalAmount - parseFloat(invoice.paid_amount || 0))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ height: '1px', background: '#e5e7eb', margin: '10px 0 6px' }} />
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#aaa' }}>
            This is a computer-generated invoice and does not require a signature.
          </div>

        </div>
      </div>
    </>
  );
}