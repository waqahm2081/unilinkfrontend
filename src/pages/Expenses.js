import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faTimes,
  faMoneyBillWave,
  faCalendarAlt,
  faLayerGroup,
  faExclamationTriangle,
  faCreditCard
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const CATEGORIES = ['Salaries', 'Bills', 'Office Maintenance', 'Recreational Activities', 'Misc'];
const PAYMENT_MODES = ['Cash', 'Cheque', 'Pay Order', 'Online Transfer'];

const emptyForm = {
  category: '',
  name: '',
  description: '',
  amount: '',
  paymentMode: '',
  expenseDate: new Date().toISOString().split('T')[0],
  referenceNo: ''
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalExpenses: 0, totalAmount: 0, monthlyAmount: 0 });

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaymentMode, setFilterPaymentMode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory, filterPaymentMode, searchQuery]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterPaymentMode) params.append('paymentMode', filterPaymentMode);
      if (searchQuery) params.append('searchQuery', searchQuery);

      const response = await fetch(`${API_URL}/expenses?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setExpenses(data.expenses);
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to fetch expenses');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData(emptyForm);
    setFormError('');
    setSelectedExpense(null);
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setModalMode('edit');
    setSelectedExpense(expense);
    setFormData({
      category: expense.category || '',
      name: expense.name || '',
      description: expense.description || '',
      amount: expense.amount || '',
      paymentMode: expense.payment_mode || '',
      expenseDate: expense.expense_date ? expense.expense_date.split('T')[0] : '',
      referenceNo: expense.reference_no || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setFormLoading(true);
    setFormError('');

    try {
      const url = modalMode === 'create'
        ? `${API_URL}/expenses`
        : `${API_URL}/expenses/${selectedExpense.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        fetchExpenses();
      } else {
        setFormError(data.message || 'An error occurred');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (expense) => {
    setDeleteTarget(expense);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/expenses/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchExpenses();
      } else {
        alert(data.message || 'Failed to delete expense');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case 'Salaries': return 'cat-salaries';
      case 'Bills': return 'cat-bills';
      case 'Office Maintenance': return 'cat-maintenance';
      case 'Recreational Activities': return 'cat-recreational';
      case 'Misc': return 'cat-misc';
      default: return '';
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '-';
    return 'PKR ' + parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />

        <div className="logs-container">
          {/* Page Header */}
          <div className="logs-header">
            <div className="header-left">
              <h1>
                <FontAwesomeIcon icon={faReceipt} className="page-icon" />
                Expense Management
              </h1>
            </div>
            <div className="header-right">
              <button className="btn-primary" onClick={openCreateModal}>
                <FontAwesomeIcon icon={faPlus} />
                Add Expense
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="logs-stats">
            <div className="stat-item stat-total">
              <div className="stat-icon-wrapper"><FontAwesomeIcon icon={faReceipt} /></div>
              <div className="stat-details"><h3>{stats.totalExpenses}</h3><p>Total Entries</p></div>
            </div>
            <div className="stat-item stat-today">
              <div className="stat-icon-wrapper"><FontAwesomeIcon icon={faMoneyBillWave} /></div>
              <div className="stat-details">
                <h3 style={{ fontSize: '16px' }}>{formatAmount(stats.totalAmount)}</h3>
                <p>Total Spent</p>
              </div>
            </div>
            <div className="stat-item stat-active">
              <div className="stat-icon-wrapper"><FontAwesomeIcon icon={faCalendarAlt} /></div>
              <div className="stat-details">
                <h3 style={{ fontSize: '16px' }}>{formatAmount(stats.monthlyAmount)}</h3>
                <p>This Month</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="logs-filters">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Search by name, ID, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select className="input-field" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <select className="input-field" value={filterPaymentMode} onChange={(e) => setFilterPaymentMode(e.target.value)}>
                <option value="">All Payment Modes</option>
                {PAYMENT_MODES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><p>Loading expenses...</p></div>
          ) : (
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Expense ID</th>
                    <th>Category</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length > 0 ? expenses.map(exp => (
                    <tr key={exp.id}>
                      <td><span className="log-id">{exp.expense_id}</span></td>
                      <td>
                        <span className={`visitor-type-badge ${getCategoryClass(exp.category)}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td><strong>{exp.name}</strong></td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.description || <span style={{ color: '#aaa' }}>—</span>}
                      </td>
                      <td><strong style={{ color: '#F47B20' }}>{formatAmount(exp.amount)}</strong></td>
                      <td>
                        <span className="time-badge">{exp.payment_mode}</span>
                      </td>
                      <td>{formatDate(exp.expense_date)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon btn-edit" title="Edit" onClick={() => openEditModal(exp)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="btn-icon btn-delete" title="Delete" onClick={() => openDeleteModal(exp)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>No expenses found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Add New Expense' : 'Edit Expense'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', margin: '0 24px', borderRadius: '8px', marginBottom: '0', fontSize: '14px' }}>
                {formError}
              </div>
            )}

            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Category <span className="required">*</span></label>
                    <select name="category" className="input-field form-control" value={formData.category} onChange={handleChange}>
                      <option value="">Select Category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Expense Name <span className="required">*</span></label>
                    <input type="text" name="name" className="input-field form-control" placeholder="e.g. March Electricity Bill" value={formData.name} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label>Description <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
                    <textarea name="description" className="input-field form-control" rows="2" placeholder="Any additional details about this expense..." value={formData.description} onChange={handleChange}></textarea>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Amount (PKR) <span className="required">*</span></label>
                    <input type="number" name="amount" className="input-field form-control" placeholder="0.00" min="0" step="0.01" value={formData.amount} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Mode of Payment <span className="required">*</span></label>
                    <select name="paymentMode" className="input-field form-control" value={formData.paymentMode} onChange={handleChange}>
                      <option value="">Select Payment Mode</option>
                      {PAYMENT_MODES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Expense Date <span className="required">*</span></label>
                    <input type="date" name="expenseDate" className="input-field form-control" value={formData.expenseDate} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Reference No. <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
                    <input type="text" name="referenceNo" className="input-field form-control" placeholder="Cheque no., transaction ID, etc." value={formData.referenceNo} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={formLoading}>
                {formLoading ? 'Saving...' : modalMode === 'create' ? 'Add Expense' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Expense</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px 0' }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '48px', color: '#F47B20', marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>Are you sure you want to delete</p>
              <p style={{ fontWeight: '700', fontSize: '18px' }}>{deleteTarget.name}?</p>
              <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#dc2626' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-box {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .modal-lg { max-width: 760px; }
        .modal-md { max-width: 600px; }
        .modal-sm { max-width: 420px; }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #eee;
        }
        .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          color: #1a1a1a;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #888;
          padding: 4px;
          transition: color 0.2s;
        }
        .modal-close:hover { color: #1a1a1a; }
        .modal-body { padding: 24px; }
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #eee;
        }
        .required { color: #F47B20; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .cat-salaries { background: #dbeafe; color: #1e40af; }
        .cat-bills { background: #fce7f3; color: #9d174d; }
        .cat-maintenance { background: #d1fae5; color: #065f46; }
        .cat-recreational { background: #fef3c7; color: #92400e; }
        .cat-misc { background: #ede9fe; color: #5b21b6; }
      `}</style>
    </>
  );
}