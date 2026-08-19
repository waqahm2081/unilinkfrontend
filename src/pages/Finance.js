import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/leads.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PrintReportButton from '../components/PrintReportButton';
import DateRangeFilter from '../components/DateRangeFilter';
import ListPagination from '../components/ListPagination';
import useListPagination from '../hooks/useListPagination';
import { EMPTY_DATE_RANGE, hasDateRange, isDateInRange } from '../utils/dateRange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faPlus, faEdit, faTrash, faSearch, faFilePdf,
  faUniversity, faUser, faCheckCircle,
  faBuilding, faTimes, faMoneyBillWave, faUserTie, faHandshake,
  faArrowUp, faArrowDown, faExclamationCircle,
  faExchangeAlt, faMoneyBill, faToggleOn, faToggleOff,
  faEye, faEyeSlash, faReceipt, faChevronDown
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const STATUS_COLORS = {
  'Paid':           { bg: '#E8F5E9', color: '#2E7D32' },
  'Pending':        { bg: '#FFF8E1', color: '#F57F17' },
  'Partially Paid': { bg: '#E3F2FD', color: '#1565C0' },
  'Cancelled':      { bg: '#FFEBEE', color: '#C62828' },
};

const TYPE_CONFIG = {
  'Student':              { icon: faUser,       bg: '#E3F2FD', color: '#1565C0' },
  'University Commission':{ icon: faUniversity, bg: '#F3E5F5', color: '#6A1B9A' },
  'Agent Commission':     { icon: faHandshake,  bg: '#FFF3E0', color: '#E65100' },
};

const CURRENCY_FLAGS   = { PKR: '🇵🇰', USD: '🇺🇸', GBP: '🇬🇧', EUR: '🇪🇺' };
const CURRENCY_SYMBOLS = { PKR: '₨', USD: '$', GBP: '£', EUR: '€' };

// ─────────────────────────────────────────────
// Sub-modal: Manage Agents
// ─────────────────────────────────────────────
function AgentsModal({ onClose }) {
  const [agents, setAgents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [form, setForm] = useState({ agentName: '', companyName: '', email: '', phone: '', address: '', status: 'Active', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/finance/agents`);
      const data = await res.json();
      if (data.success) setAgents(data.agents);
    } catch { setError('Failed to load agents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAgents(); }, []);

  const resetForm = () => { setForm({ agentName: '', companyName: '', email: '', phone: '', address: '', status: 'Active', notes: '' }); setEditAgent(null); setShowForm(false); };

  const openEdit = (agent) => {
    setEditAgent(agent);
    setForm({ agentName: agent.agent_name, companyName: agent.company_name || '', email: agent.email || '', phone: agent.phone || '', address: agent.address || '', status: agent.status, notes: agent.notes || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.agentName.trim()) { setError('Agent name is required'); return; }
    setSaving(true); setError('');
    try {
      const url    = editAgent ? `${API_URL}/finance/agents/${editAgent.id}` : `${API_URL}/finance/agents`;
      const method = editAgent ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (data.success) { resetForm(); fetchAgents(); }
      else setError(data.message);
    } catch { setError('Failed to save agent'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this agent? This cannot be undone.')) return;
    try {
      const res  = await fetch(`${API_URL}/finance/agents/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchAgents();
      else setError(data.message);
    } catch { setError('Failed to delete agent'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <h2><FontAwesomeIcon icon={faUserTie} style={{ marginRight: '10px', color: '#F47B20' }} />Manage Agents</h2>
          <button className="modal-close" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}
          {showForm ? (
            <div style={{ background: '#f9f9f9', borderRadius: '10px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px', color: '#1a1a1a' }}>{editAgent ? 'Edit Agent' : 'Add New Agent'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Agent Name <span style={{ color: 'red' }}>*</span></label>
                  <input className="input-field" value={form.agentName} onChange={e => setForm({ ...form, agentName: e.target.value })} placeholder="Full name" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Company Name</label>
                  <input className="input-field" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Optional" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Email</label>
                  <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="agent@email.com" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Phone</label>
                  <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92..." />
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Optional" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Status</label>
                  <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Notes</label>
                  <input className="input-field" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button onClick={handleSave} disabled={saving} style={{ background: '#F47B20', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                  {saving ? 'Saving...' : (editAgent ? 'Update Agent' : 'Add Agent')}
                </button>
                <button onClick={resetForm} style={{ background: '#e5e7eb', color: '#555', border: 'none', borderRadius: '8px', padding: '9px 16px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} style={{ background: '#F47B20', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FontAwesomeIcon icon={faPlus} /> Add Agent
            </button>
          )}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#888' }}>Loading...</div>
          ) : agents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#aaa', fontSize: '13px' }}>No agents yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agents.map(agent => (
                <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesomeIcon icon={faUserTie} style={{ color: '#F47B20', fontSize: '14px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>{agent.agent_name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{[agent.company_name, agent.email, agent.phone].filter(Boolean).join(' · ')}</div>
                  </div>
                  <span style={{ background: agent.status === 'Active' ? '#E8F5E9' : '#f5f5f5', color: agent.status === 'Active' ? '#2E7D32' : '#888', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{agent.status}</span>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>{agent.total_invoices} inv.</span>
                  <button onClick={() => openEdit(agent)} style={{ background: '#e3f2fd', color: '#1565c0', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}><FontAwesomeIcon icon={faEdit} /></button>
                  <button onClick={() => handleDelete(agent.id)} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-modal: Edit Invoice
// ─────────────────────────────────────────────
function EditInvoiceModal({ invoice, bankAccounts, onClose, onSaved }) {
  const navigate = useNavigate();
  const isStudent = invoice.invoice_type === 'Student';
  const isManualStudent = invoice.is_manual_student === 1 || invoice.is_manual_student === true;
  const initialContactName = isStudent
    ? (isManualStudent ? (invoice.manual_student_name || invoice.student_name || '') : (invoice.student_name || ''))
    : (invoice.invoice_type === 'Agent Commission' ? (invoice.agent_name || '') : '');
  const initialContactEmail = isStudent
    ? (isManualStudent ? (invoice.manual_student_email || invoice.student_email || '') : (invoice.student_email || ''))
    : (invoice.agent_email || '');
  const initialContactPhone = isStudent
    ? (isManualStudent ? (invoice.manual_student_mobile || invoice.student_mobile || '') : (invoice.student_mobile || ''))
    : (invoice.agent_phone || '');

  const [form, setForm] = useState({
    invoiceDate:            invoice.invoice_date?.slice(0, 10) || '',
    dueDate:                invoice.due_date?.slice(0, 10) || '',
    bankAccountId:          invoice.bank_account_id || '',
    baseAmount:             invoice.base_amount || '',
    discount:               invoice.discount || '0',
    gstPercent:             invoice.gst_percent || '0',
    universityName:         invoice.university_name || '',
    commissionReference:    invoice.commission_reference || '',
    agentCommissionPercent: invoice.agent_commission_percent || '',
    notes:                  invoice.notes || '',
    paymentStatus:          invoice.payment_status || 'Pending',
    contactName:            initialContactName,
    contactEmail:           initialContactEmail,
    contactPhone:           initialContactPhone,
  });
  const [payments, setPayments] = useState(invoice.payments || []);
  const [showConvertedCurrency, setShowConvertedCurrency] = useState(
    invoice.show_converted_currency !== 0 && invoice.show_converted_currency !== false
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (invoice.payments?.length) {
      setPayments(invoice.payments);
      return;
    }
    fetch(`${API_URL}/finance/invoices/${invoice.id}/payments`)
      .then(r => r.json())
      .then(d => { if (d.success) setPayments(d.payments || []); })
      .catch(() => {});
  }, [invoice.id, invoice.payments]);

  const isCash     = invoice.payment_method === 'cash';
  const hasForeign = invoice.selected_currency && invoice.selected_currency !== 'PKR';
  const gstAmount  = (parseFloat(form.baseAmount) || 0) * (parseFloat(form.gstPercent) || 0) / 100;
  const extraTotal = parseFloat(invoice.extra_services_total) || 0;
  const finalAmount = Math.max(0,
    (parseFloat(form.baseAmount) || 0) + extraTotal + gstAmount - (parseFloat(form.discount) || 0)
  );
  const agentCommissionAmount = invoice.invoice_type === 'Agent Commission'
    ? (parseFloat(form.baseAmount) || 0) * (parseFloat(form.agentCommissionPercent) || 0) / 100
    : null;

  const isAgent      = invoice.invoice_type === 'Agent Commission';
  const isCommission = invoice.invoice_type === 'University Commission';

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        finalAmount: isAgent ? agentCommissionAmount : finalAmount,
        gstAmount,
        agentCommissionAmount,
        showConvertedCurrency,
      };
      delete payload.contactName;
      delete payload.contactEmail;
      delete payload.contactPhone;

      if (isStudent) {
        payload.studentName = form.contactName;
        payload.studentEmail = form.contactEmail;
        payload.studentMobile = form.contactPhone;
      } else if (isAgent) {
        payload.agentName = form.contactName;
        payload.agentEmail = form.contactEmail;
        payload.agentPhone = form.contactPhone;
      }
      const res  = await fetch(`${API_URL}/finance/invoices/${invoice.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) { onSaved(); onClose(); }
      else setError(data.message);
    } catch { setError('Failed to save changes'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <h2><FontAwesomeIcon icon={faEdit} style={{ marginRight: '10px', color: '#F47B20' }} />Edit Invoice — {invoice.invoice_id}</h2>
          <button className="modal-close" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

          {isCash && (
            <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={faMoneyBill} />
              This is a <strong>Cash</strong> invoice — not linked to any bank account.
            </div>
          )}
          {hasForeign && (
            <div style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#1565C0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={faExchangeAlt} />
              This invoice was created in <strong>{invoice.selected_currency}</strong>
              (rate: 1 {invoice.selected_currency} = PKR {parseFloat(invoice.exchange_rate || 0).toLocaleString()}).
            </div>
          )}

          {(isStudent || isAgent) && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#444', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Contact Information
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>{isAgent ? 'Agent Name' : 'Name'}</label>
                  <input
                    className="input-field"
                    value={form.contactName}
                    onChange={e => setForm({ ...form, contactName: e.target.value })}
                    placeholder={isAgent ? 'Agent name' : 'Student / client name'}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={form.contactEmail}
                      onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={form.contactPhone}
                      onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Invoice Date</label>
              <input type="date" className="input-field" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Due Date</label>
              <input type="date" className="input-field" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>

            {!isCash && (
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label>Bank Account</label>
                <select className="input-field" value={form.bankAccountId} onChange={e => setForm({ ...form, bankAccountId: e.target.value })}>
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map(ba => (
                    <option key={ba.id} value={ba.id}>{ba.account_name} — {ba.bank_name} ({ba.currency})</option>
                  ))}
                </select>
              </div>
            )}

            {isCommission && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>University Name</label>
                  <input className="input-field" value={form.universityName} onChange={e => setForm({ ...form, universityName: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Commission Reference</label>
                  <input className="input-field" value={form.commissionReference} onChange={e => setForm({ ...form, commissionReference: e.target.value })} />
                </div>
              </>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label>{isAgent ? 'Total Amount (PKR)' : 'Base Amount (PKR)'}</label>
              <input type="number" className="input-field" value={form.baseAmount} onChange={e => setForm({ ...form, baseAmount: e.target.value })} min="0" step="0.01" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Discount (PKR)</label>
              <input type="number" className="input-field" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} min="0" step="0.01" />
            </div>

            {!isAgent && (
              <div className="form-group" style={{ margin: 0 }}>
                <label>GST %</label>
                <input type="number" className="input-field" value={form.gstPercent} onChange={e => setForm({ ...form, gstPercent: e.target.value })} min="0" step="0.1" />
              </div>
            )}
            {isAgent && (
              <div className="form-group" style={{ margin: 0 }}>
                <label>Agent Commission %</label>
                <input type="number" className="input-field" value={form.agentCommissionPercent} onChange={e => setForm({ ...form, agentCommissionPercent: e.target.value })} min="0" step="0.01" />
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', background: '#FFF3E0', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#555' }}>{isAgent ? 'Final Commission (PKR)' : 'Final Amount (PKR)'}</span>
              <span style={{ fontWeight: 800, fontSize: '18px', color: '#F47B20' }}>
                PKR {(isAgent ? agentCommissionAmount : finalAmount)?.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* ── Show Converted Currency toggle (only for non-PKR invoices) ── */}
            {hasForeign && (
              <div style={{ gridColumn: '1 / -1', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FontAwesomeIcon icon={showConvertedCurrency ? faEye : faEyeSlash} style={{ color: showConvertedCurrency ? '#1565C0' : '#888' }} />
                    Show {invoice.selected_currency} amount on PDF
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    {showConvertedCurrency
                      ? `Both PKR and ${invoice.selected_currency} will appear on the invoice`
                      : `Only PKR amount will appear on the invoice`}
                  </div>
                </div>
                <button type="button" onClick={() => setShowConvertedCurrency(!showConvertedCurrency)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <FontAwesomeIcon
                    icon={showConvertedCurrency ? faToggleOn : faToggleOff}
                    style={{ fontSize: '28px', color: showConvertedCurrency ? '#1565C0' : '#ccc', transition: 'color 0.2s' }}
                  />
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#444', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment</div>
            <div className="form-group" style={{ margin: '0 0 12px' }}>
              <label>Status</label>
              <select className="input-field" value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                Total paid: PKR {parseFloat(invoice.paid_amount || 0).toLocaleString()} — use Update Payment to record installments.
              </div>
            </div>
            {payments.length > 0 && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                {payments.map((p, idx) => (
                  <div key={p.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderBottom: idx < payments.length - 1 ? '1px solid #f0f0f0' : 'none',
                    fontSize: '12px'
                  }}>
                    <span>#{idx + 1} — {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#2E7D32' }}>PKR {parseFloat(p.amount || 0).toLocaleString()}</strong>
                      <button type="button" onClick={() => navigate(`/payment-receipt/${invoice.id}/${p.id}`)}
                        style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer' }}>
                        <FontAwesomeIcon icon={faReceipt} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
            <label>Notes</label>
            <textarea className="input-field" rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Finance Page
// ─────────────────────────────────────────────
export default function Finance() {
  const navigate = useNavigate();
  const [invoices, setInvoices]         = useState([]);
  const [statistics, setStatistics]     = useState(null);
  const [bankStats, setBankStats]       = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const [searchTerm, setSearchTerm]     = useState('');
  const [dateRange, setDateRange]       = useState(EMPTY_DATE_RANGE);
  const [activeFilter, setActiveFilter] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [columnFilters, setColumnFilters] = useState({
    type: [], status: [], paymentVia: []
  });
  const [filterSearch, setFilterSearch] = useState({
    type: '', status: '', paymentVia: ''
  });

  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [invoiceToDelete, setInvoiceToDelete]   = useState(null);
  const [deleting, setDeleting]                 = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice]     = useState(null);
  const [paymentHistory, setPaymentHistory]     = useState([]);
  const [paymentForm, setPaymentForm]           = useState({
    paymentStatus: '', installmentAmount: '', paymentDate: ''
  });
  const [updatingPayment, setUpdatingPayment]   = useState(false);
  const [receiptPicker, setReceiptPicker]       = useState(null); // { invoice, payments }

  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [editInvoice, setEditInvoice]         = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/finance/invoices`);
      const data = await res.json();
      if (data.success) setInvoices(data.invoices);
    } catch { setError('Failed to fetch invoices'); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (hasDateRange(dateRange)) {
        if (dateRange.from) params.append('dateFrom', dateRange.from);
        if (dateRange.to) params.append('dateTo', dateRange.to);
      }
      const qs = params.toString();
      const res  = await fetch(`${API_URL}/finance/statistics${qs ? `?${qs}` : ''}`);
      const data = await res.json();
      if (data.success) { setStatistics(data.statistics); setBankStats(data.bankStats); }
    } catch { console.error('Stats error'); }
  }, [dateRange]);

  const fetchBankAccounts = async () => {
    try {
      const res  = await fetch(`${API_URL}/finance/bank-accounts`);
      const data = await res.json();
      if (data.success) setBankAccounts(data.accounts.filter(a => a.status === 'Active'));
    } catch { console.error('Bank accounts error'); }
  };

  useEffect(() => {
    fetchInvoices();
    fetchBankAccounts();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-dropdown-container')) {
        setActiveFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPaymentVia = (inv) => {
    if (inv.payment_method === 'cash') return 'Cash';
    return inv.account_name || '-';
  };

  const getUniqueValues = (column) => {
    const values = new Set();
    invoices.forEach(inv => {
      let value;
      if (column === 'type') value = inv.invoice_type;
      else if (column === 'status') value = inv.payment_status;
      else if (column === 'paymentVia') value = getPaymentVia(inv);
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  };

  const getFilteredOptions = (column) => {
    const unique = getUniqueValues(column);
    const term = (filterSearch[column] || '').toLowerCase();
    return term ? unique.filter(v => v.toLowerCase().includes(term)) : unique;
  };

  const toggleFilterValue = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: prev[column].includes(value)
        ? prev[column].filter(v => v !== value)
        : [...prev[column], value]
    }));
  };

  const clearColumnFilter = (column) => {
    setColumnFilters(prev => ({ ...prev, [column]: [] }));
    setFilterSearch(prev => ({ ...prev, [column]: '' }));
  };

  const clearAllFilters = () => {
    setColumnFilters({ type: [], status: [], paymentVia: [] });
    setFilterSearch({ type: '', status: '', paymentVia: '' });
    setSearchTerm('');
    setDateRange(EMPTY_DATE_RANGE);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const matchesSearch = (
        inv.invoice_id?.toLowerCase().includes(s) ||
        inv.student_name?.toLowerCase().includes(s) ||
        inv.manual_student_name?.toLowerCase().includes(s) ||
        inv.student_ref_id?.toLowerCase().includes(s) ||
        inv.university_name?.toLowerCase().includes(s) ||
        inv.account_name?.toLowerCase().includes(s) ||
        inv.agent_name?.toLowerCase().includes(s)
      );
      if (!matchesSearch) return false;
    }
    if (columnFilters.type.length > 0 && !columnFilters.type.includes(inv.invoice_type)) return false;
    if (columnFilters.status.length > 0 && !columnFilters.status.includes(inv.payment_status)) return false;
    if (columnFilters.paymentVia.length > 0 && !columnFilters.paymentVia.includes(getPaymentVia(inv))) return false;
    if (hasDateRange(dateRange) && !isDateInRange(inv.invoice_date, dateRange.from, dateRange.to)) return false;
    return true;
  });

  const { paginatedItems: paginatedInvoices, totalPages, currentPage, goToPage } = useListPagination(
    filteredInvoices,
    [searchTerm, JSON.stringify(columnFilters), dateRange.from, dateRange.to].join('|')
  );

  const hasActiveFilters = Object.values(columnFilters).some(f => f.length > 0) || searchTerm.trim() || hasDateRange(dateRange);

  const FilterDropdown = ({ column, label }) => {
    const triggerRef = useRef(null);
    const isActive = activeFilter === column;
    const hasFilters = columnFilters[column].length > 0;
    const filteredOptions = getFilteredOptions(column);
    const allOptions = getUniqueValues(column);

    const handleToggle = () => {
      if (isActive) { setActiveFilter(null); return; }
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 380;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      let top = (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove)
        ? rect.bottom + 8
        : rect.top - dropdownHeight - 8;
      let left = rect.left;
      if (left + 280 > window.innerWidth) left = window.innerWidth - 300;
      setDropdownPosition({ top, left });
      setActiveFilter(column);
    };

    return (
      <div className="filter-dropdown-container">
        <button
          ref={triggerRef}
          className={`filter-trigger ${hasFilters ? 'has-filters' : ''}`}
          onClick={handleToggle}
        >
          {label}
          <FontAwesomeIcon icon={faChevronDown} className="filter-icon" />
          {hasFilters && <span className="filter-count">{columnFilters[column].length}</span>}
        </button>
        {isActive && (
          <div className="filter-dropdown" style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}>
            <div className="filter-dropdown-header">
              <input
                type="text"
                className="filter-search-input"
                placeholder="Search..."
                value={filterSearch[column]}
                onChange={(e) => setFilterSearch(prev => ({ ...prev, [column]: e.target.value }))}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="filter-options">
              <label className="filter-option select-all">
                <input
                  type="checkbox"
                  checked={columnFilters[column].length === allOptions.length && allOptions.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setColumnFilters(prev => ({ ...prev, [column]: allOptions }));
                    else clearColumnFilter(column);
                  }}
                />
                <span className="filter-label">Select All</span>
              </label>
              {filteredOptions.length > 0 ? filteredOptions.map((value, i) => (
                <label key={i} className="filter-option">
                  <input
                    type="checkbox"
                    checked={columnFilters[column].includes(value)}
                    onChange={() => toggleFilterValue(column, value)}
                  />
                  <span className="filter-label">{value}</span>
                </label>
              )) : (
                <div className="no-results">No results found</div>
              )}
            </div>
            <div className="filter-dropdown-footer">
              <button className="btn-clear-filter" onClick={() => clearColumnFilter(column)}>Clear</button>
              <button className="btn-apply-filter" onClick={() => setActiveFilter(null)}>Apply</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${API_URL}/finance/invoices/${invoiceToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setShowDeleteModal(false); setInvoiceToDelete(null); fetchInvoices(); fetchStats(); }
      else setError(data.message);
    } catch { setError('Failed to delete invoice'); }
    finally { setDeleting(false); }
  };

  const loadPaymentHistory = async (invoiceId) => {
    try {
      const res = await fetch(`${API_URL}/finance/invoices/${invoiceId}/payments`);
      const data = await res.json();
      if (data.success) {
        setPaymentHistory(data.payments || []);
        return data.payments || [];
      }
    } catch { /* ignore */ }
    setPaymentHistory([]);
    return [];
  };

  const openPaymentModal = async (inv) => {
    setPaymentInvoice(inv);
    setPaymentForm({
      paymentStatus: inv.payment_status,
      installmentAmount: '',
      paymentDate: new Date().toISOString().slice(0, 10)
    });
    setShowPaymentModal(true);
    const payments = inv.payments?.length ? inv.payments : await loadPaymentHistory(inv.id);
    setPaymentHistory(payments || []);
  };

  const openReceiptForInvoice = async (inv) => {
    let payments = Array.isArray(inv.payments) ? inv.payments : null;
    if (!payments) {
      try {
        const res = await fetch(`${API_URL}/finance/invoices/${inv.id}/payments`);
        const data = await res.json();
        payments = data.success ? (data.payments || []) : [];
      } catch {
        payments = [];
      }
    }

    if (payments.length > 1) {
      setReceiptPicker({ invoice: inv, payments });
      return;
    }
    if (payments.length === 1) {
      navigate(`/payment-receipt/${inv.id}/${payments[0].id}`);
      return;
    }
    // Fallback for paid invoices without history rows yet
    navigate(`/payment-receipt/${inv.id}`);
  };

  const handleUpdatePayment = async () => {
    if (!paymentInvoice) return;
    const amount = parseFloat(paymentForm.installmentAmount);
    const hasInstallment = isFinite(amount) && amount > 0;

    if (hasInstallment && !paymentForm.paymentDate) {
      setError('Payment date is required for a new installment');
      return;
    }

    setUpdatingPayment(true);
    setError('');
    try {
      if (hasInstallment) {
        const res = await fetch(`${API_URL}/finance/invoices/${paymentInvoice.id}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            paymentDate: paymentForm.paymentDate,
            paymentStatus: paymentForm.paymentStatus
          })
        });
        const data = await res.json();
        if (!data.success) { setError(data.message); return; }
        setPaymentHistory(data.payments || []);
        setPaymentForm(prev => ({
          ...prev,
          installmentAmount: '',
          paymentStatus: data.paymentStatus || prev.paymentStatus,
          paymentDate: new Date().toISOString().slice(0, 10)
        }));
        setPaymentInvoice(prev => prev ? {
          ...prev,
          paid_amount: data.paidAmount,
          payment_status: data.paymentStatus,
          payments: data.payments
        } : prev);
        fetchInvoices();
        fetchStats();
      } else {
        // Status-only update (e.g. Cancelled)
        const res = await fetch(`${API_URL}/finance/invoices/${paymentInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentStatus: paymentForm.paymentStatus })
        });
        const data = await res.json();
        if (!data.success) { setError(data.message); return; }
        setShowPaymentModal(false);
        setPaymentInvoice(null);
        fetchInvoices();
        fetchStats();
      }
    } catch { setError('Failed to update payment'); }
    finally { setUpdatingPayment(false); }
  };

  const canViewReceipt = (inv) =>
    ['Paid', 'Partially Paid'].includes(inv.payment_status) && parseFloat(inv.paid_amount) > 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getBilledToDisplay = (inv) => {
    if (inv.invoice_type === 'Student') {
      const name = inv.manual_student_name || inv.student_name || '-';
      const ref = inv.manual_student_name ? '' : (inv.student_ref_id || '');
      return ref ? `${name} (${ref})` : name;
    }
    if (inv.invoice_type === 'Agent Commission') {
      return `${inv.agent_name || '-'} (${inv.agent_commission_percent || 0}% commission)`;
    }
    return inv.university_name || '-';
  };

  const getInvoiceTypeDisplay = (inv) => {
    if (inv.invoice_type === 'University Commission') return 'Uni. Commission';
    if (inv.invoice_type === 'Agent Commission') return 'Agent Comm.';
    return 'Student';
  };

  const printColumns = [
    { header: 'Invoice ID', value: (r) => r.invoice_id },
    { header: 'Type', value: (r) => getInvoiceTypeDisplay(r) },
    { header: 'Date', value: (r) => formatDate(r.invoice_date) },
    { header: 'Billed To / Agent', value: (r) => getBilledToDisplay(r) },
    {
      header: 'Payment Via',
      value: (r) => (r.payment_method === 'cash' ? 'Cash' : `${r.account_name || '-'}${r.bank_name ? ` (${r.bank_name})` : ''}`),
    },
    {
      header: 'Amount (PKR)',
      value: (r) => parseFloat(r.final_amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 }),
    },
    { header: 'Status', value: (r) => r.payment_status },
  ];

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="leads-container">

          <div className="leads-header">
            <div className="header-left">
              <h1><FontAwesomeIcon icon={faWallet} className="page-icon" />Manage Invoices</h1>
            </div>
            <div className="header-right" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <PrintReportButton
                show={hasActiveFilters}
                title="Manage Invoices"
                columns={printColumns}
                rows={filteredInvoices}
              />
              {hasActiveFilters && (
                <button className="btn-clear-all-filters" onClick={clearAllFilters}>
                  <FontAwesomeIcon icon={faTimes} /> Clear All Filters
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowAgentsModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <FontAwesomeIcon icon={faUserTie} /> Agents
              </button>
              <button className="btn-secondary" onClick={() => navigate('/finance/bank-accounts')} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <FontAwesomeIcon icon={faBuilding} /> Bank Accounts
              </button>
              <button className="btn-primary" onClick={() => navigate('/create-invoice')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FontAwesomeIcon icon={faPlus} /> New Invoice
              </button>
            </div>
          </div>

          {/* Stats */}
          {statistics && (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#E8F5E9' }}><FontAwesomeIcon icon={faArrowDown} style={{ color: '#4CAF50' }} /></div>
                <div className="stat-content">
                  <h3>Total Credit</h3>
                  <p className="stat-number" style={{ fontSize: '16px', color: '#2E7D32' }}>PKR {parseFloat(statistics.total_credit || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
                  <span style={{ fontSize: '12px', color: '#666' }}>{statistics.paid_count} paid</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#FFF3E0' }}><FontAwesomeIcon icon={faArrowUp} style={{ color: '#FF9800' }} /></div>
                <div className="stat-content">
                  <h3>Total Debit</h3>
                  <p className="stat-number" style={{ fontSize: '16px', color: '#E65100' }}>PKR {parseFloat(statistics.total_debit || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
                  <span style={{ fontSize: '12px', color: '#666' }}>{statistics.pending_count} pending</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#FFEBEE' }}><FontAwesomeIcon icon={faExclamationCircle} style={{ color: '#F44336' }} /></div>
                <div className="stat-content">
                  <h3>Pending Amount</h3>
                  <p className="stat-number" style={{ fontSize: '16px', color: '#C62828' }}>PKR {parseFloat(statistics.total_pending || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
                  <span style={{ fontSize: '12px', color: '#666' }}>{statistics.total_invoices} total</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#F3E5F5' }}><FontAwesomeIcon icon={faHandshake} style={{ color: '#6A1B9A' }} /></div>
                <div className="stat-content">
                  <h3>Agent Payouts</h3>
                  <p className="stat-number" style={{ fontSize: '16px', color: '#6A1B9A' }}>PKR {parseFloat(statistics.total_agent_payout || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
                  <span style={{ fontSize: '12px', color: '#666' }}>commissions</span>
                </div>
              </div>
            </div>
          )}

          {/* Per-Bank Stats */}
          {bankStats.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Account Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {bankStats.map(bank => (
                  <div key={bank.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '14px' }}>{bank.account_name}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>{bank.bank_name}</div>
                      </div>
                      <span style={{ background: '#F47B20', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{bank.invoice_count} inv.</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <div style={{ background: '#E8F5E9', borderRadius: '6px', padding: '7px 8px' }}>
                        <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>Credit</div>
                        <div style={{ fontWeight: 700, color: '#2E7D32', fontSize: '11px' }}>PKR {parseFloat(bank.credit || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}</div>
                      </div>
                      <div style={{ background: '#FFEBEE', borderRadius: '6px', padding: '7px 8px' }}>
                        <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>Pending</div>
                        <div style={{ fontWeight: 700, color: '#C62828', fontSize: '11px' }}>PKR {parseFloat(bank.pending || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}</div>
                      </div>
                      <div style={{ background: '#F3E5F5', borderRadius: '6px', padding: '7px 8px' }}>
                        <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>Payouts</div>
                        <div style={{ fontWeight: 700, color: '#6A1B9A', fontSize: '11px' }}>PKR {parseFloat(bank.agent_payout || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}

          <div className="page-toolbar">
            <div className="page-search">
              <FontAwesomeIcon icon={faSearch} className="page-search-icon" />
              <input
                type="text"
                className="page-search-input"
                placeholder="Search by invoice ID, student, university, agent..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" className="page-search-clear" onClick={() => setSearchTerm('')}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>
            <DateRangeFilter
              label="Invoice Date"
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading invoices...</div>
          ) : (
            <>
            <div className="leads-table-container">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th><FilterDropdown column="type" label="Type" /></th>
                    <th>Date</th>
                    <th>Billed To / Agent</th>
                    <th><FilterDropdown column="paymentVia" label="Payment Via" /></th>
                    <th>Amount (PKR)</th>
                    <th><FilterDropdown column="status" label="Status" /></th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length > 0 ? paginatedInvoices.map(inv => {
                    const typeConf = TYPE_CONFIG[inv.invoice_type] || TYPE_CONFIG['Student'];
                    const hasForeignCurrency = inv.selected_currency && inv.selected_currency !== 'PKR';
                    const isCash = inv.payment_method === 'cash';
                    const isManualStudent = inv.is_manual_student;
                    // show_converted_currency: DB returns 0/1, treat missing as 1 (default show)
                    const showConverted = hasForeignCurrency && (inv.show_converted_currency !== 0 && inv.show_converted_currency !== false);
                    const currencyHidden = hasForeignCurrency && !showConverted;

                    // Display name for billed-to column
                    const studentDisplayName = isManualStudent ? inv.manual_student_name : inv.student_name;

                    return (
                      <tr key={inv.id}>
                        <td>
                          <strong style={{ color: '#F47B20' }}>{inv.invoice_id}</strong>
                          {inv.invoice_type === 'Agent Commission' && (
                            <div style={{ fontSize: '10px', color: '#9C27B0', fontWeight: 600 }}>DEBIT</div>
                          )}
                          {isManualStudent && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#F3E5F5', color: '#6A1B9A', padding: '1px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
                              Manual
                            </div>
                          )}
                          {hasForeignCurrency && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#E3F2FD', color: '#1565C0', padding: '1px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}>
                                <FontAwesomeIcon icon={faExchangeAlt} style={{ fontSize: '8px' }} />
                                {CURRENCY_FLAGS[inv.selected_currency] || ''} {inv.selected_currency}
                              </span>
                              {currencyHidden && (
                                <span title="Foreign currency hidden on PDF" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#FFF3E0', color: '#E65100', padding: '1px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}>
                                  <FontAwesomeIcon icon={faEyeSlash} style={{ fontSize: '8px' }} /> hidden
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: typeConf.bg, color: typeConf.color, padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                            <FontAwesomeIcon icon={typeConf.icon} />
                            {inv.invoice_type === 'University Commission' ? 'Uni. Commission' :
                             inv.invoice_type === 'Agent Commission' ? 'Agent Comm.' : 'Student'}
                          </span>
                        </td>
                        <td>{formatDate(inv.invoice_date)}</td>
                        <td>
                          {inv.invoice_type === 'Student' ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px' }}>
                                {studentDisplayName || '-'}
                                {isManualStudent && <span style={{ marginLeft: '5px', background: '#F3E5F5', color: '#6A1B9A', fontSize: '10px', padding: '1px 6px', borderRadius: '8px', fontWeight: 600 }}>Manual</span>}
                              </div>
                              {!isManualStudent && <div style={{ color: '#888', fontSize: '11px' }}>{inv.student_ref_id}</div>}
                            </div>
                          ) : inv.invoice_type === 'Agent Commission' ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px' }}>{inv.agent_name || '-'}</div>
                              <div style={{ color: '#888', fontSize: '11px' }}>{inv.agent_commission_percent}% commission</div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px' }}>{inv.university_name || '-'}</div>
                              <div style={{ color: '#888', fontSize: '11px' }}>{inv.commission_reference}</div>
                              {inv.commission_students && inv.commission_students.length > 0 && (
                                <div style={{ color: '#6A1B9A', fontSize: '11px', fontWeight: 600 }}>
                                  {inv.commission_students.length} student{inv.commission_students.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {isCash ? (
                            <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FontAwesomeIcon icon={faMoneyBill} style={{ fontSize: '9px' }} /> Cash
                            </span>
                          ) : (
                            <div>
                              <div style={{ fontSize: '13px' }}>{inv.account_name || '-'}</div>
                              <div style={{ color: '#888', fontSize: '11px' }}>{inv.bank_name}</div>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>
                            PKR {parseFloat(inv.final_amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </div>
                          {inv.discount > 0 && (
                            <div style={{ color: '#4CAF50', fontSize: '11px' }}>-PKR {parseFloat(inv.discount).toLocaleString()}</div>
                          )}
                          {inv.gst_percent > 0 && (
                            <div style={{ color: '#FF9800', fontSize: '11px' }}>+{inv.gst_percent}% GST</div>
                          )}
                          {/* Only show foreign amount if show_converted_currency is on */}
                          {showConverted && inv.converted_amount && (
                            <div style={{ color: '#1565C0', fontSize: '11px', fontWeight: 600 }}>
                              ≈ {CURRENCY_SYMBOLS[inv.selected_currency] || ''}{parseFloat(inv.converted_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {inv.selected_currency}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ ...(STATUS_COLORS[inv.payment_status] || { bg: '#f5f5f5', color: '#555' }), padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                            {inv.payment_status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button title="Update Payment" style={{ background: '#e3f2fd', color: '#1565c0', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} onClick={() => openPaymentModal(inv)}>
                              <FontAwesomeIcon icon={faCheckCircle} />
                            </button>
                            <button title="Edit Invoice" style={{ background: '#FFF3E0', color: '#E65100', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} onClick={() => setEditInvoice(inv)}>
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button title="View PDF" style={{ background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} onClick={() => navigate(`/invoice-pdf/${inv.id}`)}>
                              <FontAwesomeIcon icon={faFilePdf} />
                            </button>
                            {canViewReceipt(inv) && (
                              <button title="View Receipt" style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} onClick={() => openReceiptForInvoice(inv)}>
                                <FontAwesomeIcon icon={faReceipt} />
                              </button>
                            )}
                            <button className="btn-icon btn-delete" title="Delete" onClick={() => { setInvoiceToDelete(inv); setShowDeleteModal(true); }}>
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        {hasActiveFilters ? 'No invoices match the selected filters' : 'No invoices found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <ListPagination
              total={filteredInvoices.length}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemLabel="invoice"
            />
            </>
          )}
        </div>
      </div>

      {showAgentsModal && <AgentsModal onClose={() => setShowAgentsModal(false)} />}
      {editInvoice && (
        <EditInvoiceModal
          invoice={editInvoice}
          bankAccounts={bankAccounts}
          onClose={() => setEditInvoice(null)}
          onSaved={() => { fetchInvoices(); fetchStats(); }}
        />
      )}

      {/* Update Payment Modal */}
      {showPaymentModal && paymentInvoice && (() => {
        const finalAmt = parseFloat(paymentInvoice.final_amount) || 0;
        const paidAmt = parseFloat(paymentInvoice.paid_amount) || 0;
        const remaining = Math.max(0, finalAmt - paidAmt);
        return (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '10px', color: '#4CAF50' }} />Update Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 600 }}>{paymentInvoice.invoice_id}</div>
                <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                  Final Amount: <strong>PKR {finalAmt.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px' }}>
                  <span style={{ color: '#2E7D32' }}>Paid: <strong>PKR {paidAmt.toLocaleString()}</strong></span>
                  <span style={{ color: remaining > 0 ? '#E65100' : '#2E7D32' }}>
                    Remaining: <strong>PKR {remaining.toLocaleString()}</strong>
                  </span>
                  <span style={{ color: '#555' }}>
                    Installments: <strong>{paymentHistory.length}</strong>
                  </span>
                </div>
                {paymentInvoice.payment_method === 'cash' && (
                  <div style={{ color: '#2E7D32', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FontAwesomeIcon icon={faMoneyBill} /> Cash Payment
                  </div>
                )}
                {paymentInvoice.selected_currency && paymentInvoice.selected_currency !== 'PKR' && paymentInvoice.converted_amount && paymentInvoice.show_converted_currency !== 0 && (
                  <div style={{ color: '#1565C0', fontSize: '12px', marginTop: '2px' }}>
                    ≈ {CURRENCY_SYMBOLS[paymentInvoice.selected_currency]}{parseFloat(paymentInvoice.converted_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {paymentInvoice.selected_currency}
                  </div>
                )}
              </div>

              {paymentHistory.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                    Payment History
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    {paymentHistory.map((p, idx) => (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderBottom: idx < paymentHistory.length - 1 ? '1px solid #f0f0f0' : 'none',
                        background: idx % 2 ? '#fafafa' : '#fff', gap: '10px'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>
                            Installment #{idx + 1}
                          </div>
                          <div style={{ fontSize: '12px', color: '#777' }}>
                            {formatDate(p.payment_date)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#2E7D32', fontSize: '13px' }}>
                            PKR {parseFloat(p.amount || 0).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            title="View Receipt"
                            onClick={() => navigate(`/payment-receipt/${paymentInvoice.id}/${p.id}`)}
                            style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
                          >
                            <FontAwesomeIcon icon={faReceipt} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Payment Status</label>
                <select className="input-field" value={paymentForm.paymentStatus} onChange={e => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                  Status auto-updates to Paid / Partially Paid based on installment totals (Cancelled can be set manually).
                </div>
              </div>
              <div className="form-group">
                <label>This Installment Amount (PKR)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Enter amount for this payment"
                  min="0"
                  step="0.01"
                  value={paymentForm.installmentAmount}
                  onChange={e => setPaymentForm({ ...paymentForm, installmentAmount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Payment Date</label>
                <input type="date" className="input-field" value={paymentForm.paymentDate} onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {canViewReceipt(paymentInvoice) && (
                <button
                  className="btn-secondary"
                  style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }}
                  onClick={() => openReceiptForInvoice({ ...paymentInvoice, payments: paymentHistory })}
                >
                  <FontAwesomeIcon icon={faReceipt} style={{ marginRight: '6px' }} />
                  View Receipt{paymentHistory.length > 1 ? 's' : ''}
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Close</button>
              <button className="btn-primary" onClick={handleUpdatePayment} disabled={updatingPayment}>
                {updatingPayment
                  ? 'Saving...'
                  : (parseFloat(paymentForm.installmentAmount) > 0 ? 'Record Payment' : 'Update Status')}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Receipt picker for multiple installments */}
      {receiptPicker && (
        <div className="modal-overlay" onClick={() => setReceiptPicker(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faReceipt} style={{ marginRight: '10px', color: '#2e7d32' }} />Select Receipt</h2>
              <button className="modal-close" onClick={() => setReceiptPicker(null)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px', color: '#666', fontSize: '13px' }}>
                This invoice has {receiptPicker.payments.length} installments. Choose which receipt to view.
              </p>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                {receiptPicker.payments.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const invId = receiptPicker.invoice.id;
                      setReceiptPicker(null);
                      navigate(`/payment-receipt/${invId}/${p.id}`);
                    }}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', border: 'none', borderBottom: idx < receiptPicker.payments.length - 1 ? '1px solid #f0f0f0' : 'none',
                      background: '#fff', cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>Installment #{idx + 1}</div>
                      <div style={{ fontSize: '12px', color: '#777' }}>{formatDate(p.payment_date)}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#2E7D32' }}>
                      PKR {parseFloat(p.amount || 0).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setReceiptPicker(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faTrash} style={{ marginRight: '10px', color: '#F44336' }} />Delete Invoice</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoice_id}</strong>? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#F44336' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}