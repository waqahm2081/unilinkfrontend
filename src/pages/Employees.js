import React, { useState, useEffect } from 'react'
import '../styles/dashboard.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faTimes,
  faUserTie,
  faPhone,
  faEnvelope,
  faIdCard,
  faBuilding,
  faBriefcase,
  faCalendarAlt,
  faMoneyBillWave,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const DEPARTMENTS = ['Administration', 'Admissions', 'Finance', 'IT', 'Marketing', 'Operations', 'HR', 'Other'];
const STATUSES = ['Active', 'Inactive', 'On Leave', 'Terminated'];

const emptyForm = {
  name: '', email: '', phone: '', emergencyPhone: '', cnicNumber: '',
  address: '', salary: '', department: '', designation: '', joiningDate: '', status: 'Active'
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalEmployees: 0, activeEmployees: 0, departments: 0 });

  // Filters
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, [filterDepartment, filterStatus, searchQuery]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterDepartment) params.append('department', filterDepartment);
      if (filterStatus) params.append('status', filterStatus);
      if (searchQuery) params.append('searchQuery', searchQuery);

      const response = await fetch(`${API_URL}/employees?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees);
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to fetch employees');
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
    setSelectedEmployee(null);
    setShowModal(true);
  };

  const openEditModal = (employee) => {
    setModalMode('edit');
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      emergencyPhone: employee.emergency_phone || '',
      cnicNumber: employee.cnic_number || '',
      address: employee.address || '',
      salary: employee.salary || '',
      department: employee.department || '',
      designation: employee.designation || '',
      joiningDate: employee.joining_date ? employee.joining_date.split('T')[0] : '',
      status: employee.status || 'Active'
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
        ? `${API_URL}/employees`
        : `${API_URL}/employees/${selectedEmployee.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        fetchEmployees();
      } else {
        setFormError(data.message || 'An error occurred');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (employee) => {
    setDeleteTarget(employee);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchEmployees();
      } else {
        alert(data.message || 'Failed to delete employee');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Inactive': return 'status-inactive';
      case 'On Leave': return 'status-on-leave';
      case 'Terminated': return 'status-terminated';
      default: return '';
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return '-';
    return 'PKR ' + parseFloat(salary).toLocaleString('en-PK');
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
                <FontAwesomeIcon icon={faUserTie} className="page-icon" />
                HR &mdash; Employees
              </h1>
            </div>
            <div className="header-right">
              <button className="btn-primary" onClick={openCreateModal}>
                <FontAwesomeIcon icon={faPlus} />
                Add Employee
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
              <div className="stat-icon-wrapper"><FontAwesomeIcon icon={faUsers} /></div>
              <div className="stat-details"><h3>{stats.totalEmployees}</h3><p>Total Employees</p></div>
            </div>
            <div className="stat-item stat-today">
              <div className="stat-icon-wrapper"><FontAwesomeIcon icon={faUserTie} /></div>
              <div className="stat-details"><h3>{stats.activeEmployees}</h3><p>Active Employees</p></div>
            </div>
          </div>

          {/* Filters */}
          <div className="logs-filters">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Search by name, email, phone, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select className="input-field" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><p>Loading employees...</p></div>
          ) : (
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Contact</th>
                    <th>Salary</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? employees.map(emp => (
                    <tr key={emp.id}>
                      <td><span className="log-id">{emp.employee_id}</span></td>
                      <td>
                        <div>
                          <strong>{emp.name}</strong>
                          {emp.email && <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{emp.email}</div>}
                        </div>
                      </td>
                      <td>{emp.department || '-'}</td>
                      <td>{emp.designation || '-'}</td>
                      <td>{emp.phone}</td>
                      <td>{formatSalary(emp.salary)}</td>
                      <td>{formatDate(emp.joining_date)}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(emp.status)}`}>{emp.status}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon btn-edit" title="Edit" onClick={() => openEditModal(emp)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="btn-icon btn-delete" title="Delete" onClick={() => openDeleteModal(emp)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>No employees found</td>
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
          <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Add New Employee' : 'Edit Employee'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {formError}
              </div>
            )}

            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <input type="text" name="name" className="input-field form-control" placeholder="Enter full name" value={formData.name} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" className="input-field form-control" placeholder="employee@company.com" value={formData.email} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Phone Number <span className="required">*</span></label>
                    <input type="tel" name="phone" className="input-field form-control" placeholder="+92-300-1234567" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Emergency Phone</label>
                    <input type="tel" name="emergencyPhone" className="input-field form-control" placeholder="+92-300-7654321" value={formData.emergencyPhone} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>CNIC Number</label>
                    <input type="text" name="cnicNumber" className="input-field form-control" placeholder="42101-1234567-1" value={formData.cnicNumber} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Salary (PKR)</label>
                    <input type="number" name="salary" className="input-field form-control" placeholder="e.g. 50000" value={formData.salary} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Department</label>
                    <select name="department" className="input-field form-control" value={formData.department} onChange={handleChange}>
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Designation</label>
                    <input type="text" name="designation" className="input-field form-control" placeholder="e.g. Senior Counselor" value={formData.designation} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Joining Date</label>
                    <input type="date" name="joiningDate" className="input-field form-control" value={formData.joiningDate} onChange={handleChange} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" className="input-field form-control" value={formData.status} onChange={handleChange}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label>Address</label>
                    <textarea name="address" className="input-field form-control" rows="2" placeholder="Enter home address" value={formData.address} onChange={handleChange}></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={formLoading}>
                {formLoading ? 'Saving...' : modalMode === 'create' ? 'Add Employee' : 'Save Changes'}
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
              <h2>Delete Employee</h2>
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
        .status-active { background: #dcfce7; color: #166534; }
        .status-inactive { background: #f3f4f6; color: #374151; }
        .status-on-leave { background: #fef9c3; color: #854d0e; }
        .status-terminated { background: #fee2e2; color: #991b1b; }
        .required { color: #F47B20; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
      `}</style>
    </>
  );
}