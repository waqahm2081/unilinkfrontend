import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/leads.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faPlus, faEdit, faTrash, faSearch, faFilePdf,
  faUniversity, faUser, faCheckCircle,
  faChartBar, faBuilding, faTimes, faMoneyBillWave,
  faArrowUp, faArrowDown, faExclamationCircle,
  faListCheck, faUserTie, faSave, faHandshake,
  faExchangeAlt, faMoneyBill, faToggleOn, faToggleOff,
  faEye, faEyeSlash, faReceipt
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
// Sub-modal: Manage Default Services
// ─────────────────────────────────────────────
function DefaultServicesModal({ onClose }) {
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName]   = useState('');
  const [newName, setNewName]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/finance/default-services`);
      const data = await res.json();
      if (data.success) setServices(data.services);
    } catch { setError('Failed to load services'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true); setError('');
    try {
      const res  = await fetch(`${API_URL}/finance/default-services`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: newName.trim() })
      });
      const data = await res.json();
      if (data.success) { setNewName(''); fetchServices(); }
      else setError(data.message);
    } catch { setError('Failed to add service'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    setSaving(true); setError('');
    try {
      const res  = await fetch(`${API_URL}/finance/default-services/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: editName.trim() })
      });
      const data = await res.json();
      if (data.success) { setEditingId(null); setEditName(''); fetchServices(); }
      else setError(data.message);
    } catch { setError('Failed to update service'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      const res  = await fetch(`${API_URL}/finance/default-services/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchServices();
      else setError(data.message);
    } catch { setError('Failed to delete service'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2><FontAwesomeIcon icon={faListCheck} style={{ marginRight: '10px', color: '#F47B20' }} />Default Invoice Services</h2>
          <button className="modal-close" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
            These services can be selectively included on <strong>Student</strong> invoices at no charge.
          </p>
          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#888' }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {services.map(svc => (
                <div key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f9f9f9', borderRadius: '8px', padding: '10px 14px', border: '1px solid #e5e7eb' }}>
                  {editingId === svc.id ? (
                    <>
                      <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1, margin: 0 }} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(svc.id); if (e.key === 'Escape') setEditingId(null); }} />
                      <button onClick={() => handleEdit(svc.id)} disabled={saving} style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ background: '#e5e7eb', color: '#555', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontSize: '13px', color: '#333' }}>✓ {svc.service_name}</span>
                      <button onClick={() => { setEditingId(svc.id); setEditName(svc.service_name); }} style={{ background: '#e3f2fd', color: '#1565c0', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button onClick={() => handleDelete(svc.id)} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {services.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#aaa', fontSize: '13px' }}>No services yet</div>}
            </div>
          )}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#333', display: 'block', marginBottom: '8px' }}>Add New Service</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="input-field" placeholder="e.g. SOP Review & Guidance" value={newName}
                onChange={e => setNewName(e.target.value)} style={{ flex: 1, margin: 0 }}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} />
              <button onClick={handleAdd} disabled={saving || !newName.trim()}
                style={{ background: '#F47B20', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>
                <FontAwesomeIcon icon={faPlus} /> Add
              </button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

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
    paidAmount:             invoice.paid_amount || '',
    paymentDate:            invoice.payment_date?.slice(0, 10) || '',
  });
  const [showConvertedCurrency, setShowConvertedCurrency] = useState(
    invoice.show_converted_currency !== 0 && invoice.show_converted_currency !== false
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

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
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#444', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Status</label>
                <select className="input-field" value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Amount Paid (PKR)</label>
                <input type="number" className="input-field" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} min="0" step="0.01" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Payment Date</label>
                <input type="date" className="input-field" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} />
              </div>
            </div>
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

  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());

  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [invoiceToDelete, setInvoiceToDelete]   = useState(null);
  const [deleting, setDeleting]                 = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice]     = useState(null);
  const [paymentForm, setPaymentForm]           = useState({ paymentStatus: '', paidAmount: '', paymentDate: '' });
  const [updatingPayment, setUpdatingPayment]   = useState(false);

  const [showDefaultServicesModal, setShowDefaultServicesModal] = useState(false);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [editInvoice, setEditInvoice]         = useState(null);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' },   { value: 4, label: 'April' },
    { value: 5, label: 'May' },     { value: 6, label: 'June' },
    { value: 7, label: 'July' },    { value: 8, label: 'August' },
    { value: 9, label: 'September' },{ value: 10, label: 'October' },
    { value: 11, label: 'November' },{ value: 12, label: 'December' },
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/finance/invoices?`;
      if (typeFilter)   url += `type=${encodeURIComponent(typeFilter)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      url += `month=${selectedMonth}&year=${selectedYear}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) setInvoices(data.invoices);
    } catch { setError('Failed to fetch invoices'); }
    finally { setLoading(false); }
  }, [typeFilter, statusFilter, selectedMonth, selectedYear]);

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/finance/statistics?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      if (data.success) { setStatistics(data.statistics); setBankStats(data.bankStats); }
    } catch { console.error('Stats error'); }
  }, [selectedMonth, selectedYear]);

  const fetchBankAccounts = async () => {
    try {
      const res  = await fetch(`${API_URL}/finance/bank-accounts`);
      const data = await res.json();
      if (data.success) setBankAccounts(data.accounts.filter(a => a.status === 'Active'));
    } catch { console.error('Bank accounts error'); }
  };

  useEffect(() => {
    fetchInvoices();
    fetchStats();
    fetchBankAccounts();
  }, [fetchInvoices, fetchStats]);

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      inv.invoice_id?.toLowerCase().includes(s) ||
      inv.student_name?.toLowerCase().includes(s) ||
      inv.manual_student_name?.toLowerCase().includes(s) ||
      inv.student_ref_id?.toLowerCase().includes(s) ||
      inv.university_name?.toLowerCase().includes(s) ||
      inv.account_name?.toLowerCase().includes(s) ||
      inv.agent_name?.toLowerCase().includes(s)
    );
  });

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

  const openPaymentModal = (inv) => {
    setPaymentInvoice(inv);
    setPaymentForm({
      paymentStatus: inv.payment_status,
      paidAmount:    inv.paid_amount || '',
      paymentDate:   inv.payment_date ? inv.payment_date.slice(0, 10) : ''
    });
    setShowPaymentModal(true);
  };

  const handleUpdatePayment = async () => {
    if (!paymentInvoice) return;
    setUpdatingPayment(true);
    try {
      const res  = await fetch(`${API_URL}/finance/invoices/${paymentInvoice.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentForm)
      });
      const data = await res.json();
      if (data.success) { setShowPaymentModal(false); setPaymentInvoice(null); fetchInvoices(); fetchStats(); }
      else setError(data.message);
    } catch { setError('Failed to update payment'); }
    finally { setUpdatingPayment(false); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="leads-container">

          <div className="leads-header">
            <div className="header-left">
              <h1><FontAwesomeIcon icon={faWallet} className="page-icon" />Finance & Invoices</h1>
            </div>
            <div className="header-right" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => setShowDefaultServicesModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <FontAwesomeIcon icon={faListCheck} /> Manage Services
              </button>
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

          {/* Month/Year Selector */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faChartBar} style={{ color: '#F47B20' }} />
            <span style={{ fontWeight: 600, color: '#333' }}>Stats for:</span>
            <select className="input-field" style={{ width: '150px' }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select className="input-field" style={{ width: '100px' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
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

          {/* Filters */}
          <div className="leads-filters">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input type="text" className="input-field" placeholder="Search by invoice ID, student, university, agent..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="filter-group">
              <select className="input-field" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="Student">Student Invoice</option>
                <option value="University Commission">University Commission</option>
                <option value="Agent Commission">Agent Commission</option>
              </select>
            </div>
            <div className="filter-group">
              <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading invoices...</div>
          ) : (
            <div className="leads-table-container">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Billed To / Agent</th>
                    <th>Payment Via</th>
                    <th>Amount (PKR)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length > 0 ? filteredInvoices.map(inv => {
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
                            {inv.payment_status === 'Partially Paid' && (
                              <button title="Download Receipt" style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }} onClick={() => navigate(`/payment-receipt/${inv.id}`)}>
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
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No invoices found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDefaultServicesModal && <DefaultServicesModal onClose={() => setShowDefaultServicesModal(false)} />}
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
      {showPaymentModal && paymentInvoice && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faMoneyBillWave} style={{ marginRight: '10px', color: '#4CAF50' }} />Update Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 600 }}>{paymentInvoice.invoice_id}</div>
                <div style={{ color: '#666', fontSize: '13px' }}>Final Amount: <strong>PKR {parseFloat(paymentInvoice.final_amount).toLocaleString()}</strong></div>
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
              <div className="form-group">
                <label>Payment Status</label>
                <select className="input-field" value={paymentForm.paymentStatus} onChange={e => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount Paid (PKR)</label>
                <input type="number" className="input-field" placeholder="0.00" value={paymentForm.paidAmount} onChange={e => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Payment Date</label>
                <input type="date" className="input-field" value={paymentForm.paymentDate} onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {(paymentForm.paymentStatus === 'Partially Paid' || paymentInvoice.payment_status === 'Partially Paid') && (
                <button
                  className="btn-secondary"
                  style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }}
                  onClick={() => navigate(`/payment-receipt/${paymentInvoice.id}`)}
                >
                  <FontAwesomeIcon icon={faReceipt} style={{ marginRight: '6px' }} />
                  Download Receipt
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdatePayment} disabled={updatingPayment}>
                {updatingPayment ? 'Saving...' : 'Update Payment'}
              </button>
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