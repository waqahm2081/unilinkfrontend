import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/leads.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DateRangeFilter from '../components/DateRangeFilter';
import { startOfMonthYMD, todayYMD, formatDisplayDate } from '../utils/dateRange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding, faPlus, faEdit, faTrash, faTimes, faArrowLeft,
  faCheckCircle, faBan, faHistory, faArrowDown, faArrowUp
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const CURRENCIES = ['PKR', 'USD', 'GBP', 'EUR', 'AUD', 'CAD', 'AED'];
const THIS_MONTH = { from: startOfMonthYMD(new Date()), to: todayYMD() };

const fmtAmt = (n) =>
  parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const defaultForm = {
  accountName: '', bankName: '', accountNumber: '', iban: '',
  branchName: '', branchCode: '', currency: 'PKR', status: 'Active', openingBalance: '0'
};

export default function BankAccounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentAccount, setCurrentAccount] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [historyAccount, setHistoryAccount] = useState(null);
  const [historyRange, setHistoryRange] = useState(THIS_MONTH);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyData, setHistoryData] = useState(null);

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/finance/bank-accounts`);
      const data = await res.json();
      if (data.success) setAccounts(data.accounts);
    } catch (err) {
      setError('Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode('create'); setFormData(defaultForm); setFormErrors({}); setCurrentAccount(null); setShowModal(true);
  };

  const openEdit = (account) => {
    setModalMode('edit');
    setFormData({
      accountName: account.account_name, bankName: account.bank_name,
      accountNumber: account.account_number, iban: account.iban || '',
      branchName: account.branch_name || '', branchCode: account.branch_code || '',
      currency: account.currency, status: account.status,
      openingBalance: account.opening_balance ?? '0'
    });
    setFormErrors({}); setCurrentAccount(account); setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!formData.accountName.trim()) errs.accountName = 'Account name is required';
    if (!formData.bankName.trim()) errs.bankName = 'Bank name is required';
    if (!formData.accountNumber.trim()) errs.accountNumber = 'Account number is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true); setError('');
    try {
      const url = modalMode === 'create'
        ? `${API_URL}/finance/bank-accounts`
        : `${API_URL}/finance/bank-accounts/${currentAccount.id}`;
      const res = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false); fetchAccounts();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    setDeleting(true); setError('');
    try {
      const res = await fetch(`${API_URL}/finance/bank-accounts/${accountToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false); setAccountToDelete(null); fetchAccounts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const openHistory = (account) => {
    setHistoryAccount(account);
    setHistoryRange(THIS_MONTH);
    setHistoryData(null);
    setHistoryError('');
  };

  const closeHistory = () => {
    setHistoryAccount(null);
    setHistoryData(null);
    setHistoryError('');
  };

  useEffect(() => {
    if (!historyAccount) return undefined;
    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      setHistoryError('');
      try {
        const params = new URLSearchParams();
        if (historyRange.from) params.append('dateFrom', historyRange.from);
        if (historyRange.to) params.append('dateTo', historyRange.to);
        const qs = params.toString();
        const res = await fetch(`${API_URL}/finance/bank-accounts/${historyAccount.id}/transactions${qs ? `?${qs}` : ''}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success) setHistoryData(data);
        else setHistoryError(data.message || 'Failed to load transactions');
      } catch {
        if (!cancelled) setHistoryError('Network error. Please try again.');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [historyAccount, historyRange]);

  const f = (key) => ({ value: formData[key], onChange: (e) => setFormData({ ...formData, [key]: e.target.value }) });

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="leads-container">
          <div className="leads-header">
            <div className="header-left">
              <button className="btn-secondary" onClick={() => navigate('/finance')}
                style={{ marginRight: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
              <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <FontAwesomeIcon icon={faBuilding} className="page-icon" /> Bank Accounts
              </h1>
            </div>
            <div className="header-right">
              <button className="btn-primary" onClick={openCreate}>
                <FontAwesomeIcon icon={faPlus} /> Add Bank Account
              </button>
            </div>
          </div>

          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{
                  background: '#fff', borderRadius: '14px', padding: '20px',
                  border: `2px solid ${acc.status === 'Active' ? '#E8F5E9' : '#FFEBEE'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a1a' }}>{acc.account_name}</div>
                      <div style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>{acc.bank_name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: acc.status === 'Active' ? '#E8F5E9' : '#FFEBEE',
                        color: acc.status === 'Active' ? '#2E7D32' : '#C62828',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600
                      }}>
                        <FontAwesomeIcon icon={acc.status === 'Active' ? faCheckCircle : faBan} style={{ marginRight: '4px' }} />
                        {acc.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                      <div>
                        <div style={{ color: '#888', marginBottom: '2px' }}>Account No.</div>
                        <div style={{ fontWeight: 600, color: '#333', fontFamily: 'monospace' }}>{acc.account_number}</div>
                      </div>
                      <div>
                        <div style={{ color: '#888', marginBottom: '2px' }}>Currency</div>
                        <div style={{ fontWeight: 700, color: '#F47B20' }}>{acc.currency}</div>
                      </div>
                      {acc.iban && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ color: '#888', marginBottom: '2px' }}>IBAN</div>
                          <div style={{ fontWeight: 600, color: '#333', fontFamily: 'monospace', fontSize: '11px' }}>{acc.iban}</div>
                        </div>
                      )}
                      {acc.branch_name && (
                        <div>
                          <div style={{ color: '#888', marginBottom: '2px' }}>Branch</div>
                          <div style={{ fontWeight: 600, color: '#333' }}>{acc.branch_name}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ color: '#888', marginBottom: '2px' }}>Opening Balance</div>
                        <div style={{ fontWeight: 600, color: '#333' }}>
                          {parseFloat(acc.opening_balance || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })} {acc.currency}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ background: '#E8F5E9', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>This Month Credit</div>
                      <div style={{ fontWeight: 700, color: '#2E7D32', fontSize: '13px' }}>
                        {parseFloat(acc.monthly_credit || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div style={{ background: '#FFEBEE', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>This Month Pending</div>
                      <div style={{ fontWeight: 700, color: '#C62828', fontSize: '13px' }}>
                        {parseFloat(acc.monthly_pending || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon btn-edit" onClick={() => openHistory(acc)}
                      style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#E3F2FD', color: '#1565C0' }}>
                      <FontAwesomeIcon icon={faHistory} /> History
                    </button>
                    <button className="btn-icon btn-edit" onClick={() => openEdit(acc)}
                      style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px' }}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button className="btn-icon btn-delete" onClick={() => { setAccountToDelete(acc); setShowDeleteModal(true); }}
                      style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px' }}>
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#888' }}>
                  No bank accounts found. Add your first bank account.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={modalMode === 'create' ? faPlus : faEdit} style={{ marginRight: '10px' }} />
                {modalMode === 'create' ? 'Add Bank Account' : 'Edit Bank Account'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Account Name <span style={{ color: 'red' }}>*</span></label>
                    <input type="text" className={`input-field ${formErrors.accountName ? 'error' : ''}`}
                      placeholder="e.g. Main Operations Account" {...f('accountName')} />
                    {formErrors.accountName && <span className="error-message">{formErrors.accountName}</span>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Bank Name <span style={{ color: 'red' }}>*</span></label>
                    <input type="text" className={`input-field ${formErrors.bankName ? 'error' : ''}`}
                      placeholder="e.g. Habib Bank Limited" {...f('bankName')} />
                    {formErrors.bankName && <span className="error-message">{formErrors.bankName}</span>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Account Number <span style={{ color: 'red' }}>*</span></label>
                    <input type="text" className={`input-field ${formErrors.accountNumber ? 'error' : ''}`}
                      placeholder="Account number" {...f('accountNumber')} />
                    {formErrors.accountNumber && <span className="error-message">{formErrors.accountNumber}</span>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>IBAN</label>
                    <input type="text" className="input-field" placeholder="PK36HABB0000..." {...f('iban')} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Branch Name</label>
                    <input type="text" className="input-field" placeholder="Branch name" {...f('branchName')} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Branch Code</label>
                    <input type="text" className="input-field" placeholder="Branch code" {...f('branchCode')} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Currency</label>
                    <select className="input-field" {...f('currency')}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Opening Balance</label>
                    <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00" {...f('openingBalance')} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Status</label>
                    <select className="input-field" {...f('status')}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : (modalMode === 'create' ? 'Add Account' : 'Update Account')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {historyAccount && (
        <div className="modal-overlay" onClick={closeHistory}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              width: '96vw',
              maxWidth: '96vw',
              height: '92vh',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h2>
                <FontAwesomeIcon icon={faHistory} style={{ marginRight: '10px', color: '#1565C0' }} />
                History — {historyAccount.account_name}
              </h2>
              <button className="modal-close" onClick={closeHistory}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ color: '#666', fontSize: '13px' }}>
                  {historyAccount.bank_name} · {historyAccount.account_number}
                </div>
                <DateRangeFilter
                  label="Transaction date"
                  value={historyRange}
                  onChange={setHistoryRange}
                  align="right"
                />
              </div>

              {historyError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                  {historyError}
                </div>
              )}

              {historyData?.totals && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: '#E8F5E9', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                      <FontAwesomeIcon icon={faArrowDown} style={{ marginRight: '4px' }} />Credit
                    </div>
                    <div style={{ fontWeight: 700, color: '#2E7D32' }}>{fmtAmt(historyData.totals.credit)}</div>
                  </div>
                  <div style={{ background: '#FFEBEE', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                      <FontAwesomeIcon icon={faArrowUp} style={{ marginRight: '4px' }} />Debit
                    </div>
                    <div style={{ fontWeight: 700, color: '#C62828' }}>{fmtAmt(historyData.totals.debit)}</div>
                  </div>
                  <div style={{ background: '#E3F2FD', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Net</div>
                    <div style={{ fontWeight: 700, color: '#1565C0' }}>{fmtAmt(historyData.totals.net)}</div>
                  </div>
                </div>
              )}

              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Loading transactions...</div>
              ) : (
                <div className="leads-table-container" style={{ margin: 0, overflowX: 'auto' }}>
                  <table className="leads-table" style={{ width: '100%', minWidth: '720px' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Reference</th>
                        <th style={{ textAlign: 'right' }}>Credit</th>
                        <th style={{ textAlign: 'right' }}>Debit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(historyData?.transactions || []).length > 0 ? historyData.transactions.map((txn, idx) => (
                        <tr key={`${txn.reference}-${txn.date}-${idx}`}>
                          <td>{formatDisplayDate(txn.date) || txn.date}</td>
                          <td>
                            <span style={{
                              background: txn.type === 'credit' ? '#E8F5E9' : '#FFEBEE',
                              color: txn.type === 'credit' ? '#2E7D32' : '#C62828',
                              padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {txn.type}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{txn.description}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{txn.source}</div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{txn.reference || '—'}</td>
                          <td style={{ textAlign: 'right', color: '#2E7D32', fontWeight: 700 }}>
                            {txn.type === 'credit' ? fmtAmt(txn.amount) : '—'}
                          </td>
                          <td style={{ textAlign: 'right', color: '#C62828', fontWeight: 700 }}>
                            {txn.type === 'debit' ? fmtAmt(txn.amount) : '—'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
                            No transactions found for this date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ flexShrink: 0 }}>
              <button className="btn-secondary" onClick={closeHistory}>Close</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faTrash} style={{ marginRight: '10px', color: '#F44336' }} />Delete Account</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{accountToDelete?.account_name}</strong>?</p>
              <p style={{ color: '#F44336', fontSize: '14px', marginTop: '8px' }}>This cannot be undone. Accounts with linked invoices cannot be deleted.</p>
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