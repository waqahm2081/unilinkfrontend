import React, { useState, useEffect, useRef } from 'react'
import '../styles/dashboard.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faUserGraduate, faFileAlt, faClock, faPassport,
  faList, faPlus, faEdit, faTrash, faChevronDown, faTimes,
  faUserTie, faPhone,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

const getStatusStyle = (status) => {
  const styles = {
    'Pending':   { background: '#fef9c3', color: '#854d0e' },
    'Approved':  { background: '#dcfce7', color: '#166534' },
    'Accepted':  { background: '#dbeafe', color: '#1e40af' },
    'Rejected':  { background: '#fee2e2', color: '#991b1b' },
    'Withdrawn': { background: '#f3e8ff', color: '#6b21a8' },
    'Closed':    { background: '#f3f4f6', color: '#374151' },
  };
  return styles[status] || { background: '#f3f4f6', color: '#374151' };
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    assignedLeads: 0,
    totalStudents: 0,
    activeApplications: 0,
    pendingVisas: 0,
    approvedVisas: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [activeFilter, setActiveFilter] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [columnFilters, setColumnFilters] = useState({
    studentName: [], country: [], program: [], counselor: [], status: [], date: []
  });
  const [filterSearch, setFilterSearch] = useState({
    studentName: '', country: '', program: '', counselor: '', status: '', date: ''
  });

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.filter-dropdown-container')) setActiveFilter(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, appsRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, { headers }),
        fetch(`${API_URL}/dashboard/recent-applications`, { headers })
      ]);
      const statsData = await statsRes.json();
      const appsData = await appsRes.json();
      if (statsData.success) setStats(statsData.stats);
      if (appsData.success) setRecentApplications(appsData.applications);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/applications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecentApplications(prev => prev.filter(app => app.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const getUniqueValues = (column) => {
    const values = new Set();
    recentApplications.forEach(app => {
      let value;
      switch (column) {
        case 'studentName': value = app.student_name; break;
        case 'country':     value = app.country_name; break;
        case 'program':     value = app.program || null; break;
        case 'counselor':   value = app.counselor_names || 'Not Assigned'; break;
        case 'status':      value = app.application_status; break;
        case 'date':        value = app.created_at ? formatDate(app.created_at) : null; break;
        default: value = '';
      }
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  };

  const getFilteredOptions = (column) => {
    const unique = getUniqueValues(column);
    const term = filterSearch[column].toLowerCase();
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
    setColumnFilters({ studentName: [], country: [], program: [], counselor: [], status: [], date: [] });
    setFilterSearch({ studentName: '', country: '', program: '', counselor: '', status: '', date: '' });
  };

  const filteredApplications = recentApplications.filter(app => {
    if (columnFilters.studentName.length > 0 && !columnFilters.studentName.includes(app.student_name)) return false;
    if (columnFilters.country.length > 0 && !columnFilters.country.includes(app.country_name)) return false;
    if (columnFilters.program.length > 0 && !columnFilters.program.includes(app.program)) return false;
    if (columnFilters.status.length > 0 && !columnFilters.status.includes(app.application_status)) return false;
    if (columnFilters.counselor.length > 0) {
      const val = app.counselor_names || 'Not Assigned';
      if (!columnFilters.counselor.includes(val)) return false;
    }
    if (columnFilters.date.length > 0) {
      const val = app.created_at ? formatDate(app.created_at) : null;
      if (!columnFilters.date.includes(val)) return false;
    }
    return true;
  });

  const hasActiveFilters = Object.values(columnFilters).some(f => f.length > 0);

  // ── FilterDropdown component ───────────────────────────────────────────────
  const FilterDropdown = ({ column, label }) => {
    const triggerRef = useRef(null);
    const isActive = activeFilter === column;
    const hasFilters = columnFilters[column].length > 0;
    const filteredOptions = getFilteredOptions(column);
    const allOptions = getUniqueValues(column);

    const handleToggle = () => {
      if (isActive) { setActiveFilter(null); return; }
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 360;
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
              {filteredOptions.length > 0
                ? filteredOptions.map((value, i) => (
                  <label key={i} className="filter-option">
                    <input
                      type="checkbox"
                      checked={columnFilters[column].includes(value)}
                      onChange={() => toggleFilterValue(column, value)}
                    />
                    <span className="filter-label">{value}</span>
                  </label>
                ))
                : <div className="no-results">No results found</div>
              }
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

  return (
    <>
      <Sidebar />
      <div className="main-content" id="mainContent">
        <Header />
        <div className="dashboard-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard Overview</h1>
              <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
            </div>
          </div>

          {/* Stats Row 1 — Leads (excluding registered students) */}
          <div className="row g-4 mb-4">
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-primary">
                <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.totalLeads ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Total Leads</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-danger">
                <div className="stat-icon"><FontAwesomeIcon icon={faPhone} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.newLeads ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">New Leads</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-warning" style={{ '--card-color': '#F47B20' }}>
                <div className="stat-icon"><FontAwesomeIcon icon={faUserTie} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.assignedLeads ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Leads Assigned</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row 2 */}
          <div className="row g-4 mb-4">
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-success">
                <div className="stat-icon"><FontAwesomeIcon icon={faUserGraduate} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.totalStudents ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Total Students Registered</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-info">
                <div className="stat-icon"><FontAwesomeIcon icon={faFileAlt} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.activeApplications ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Active Applications</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="stat-card stat-card-purple">
                <div className="stat-icon"><FontAwesomeIcon icon={faPassport} /></div>
                <div className="stat-content">
                  <h3 className="stat-number">{loading ? '...' : (stats.approvedVisas ?? 0).toLocaleString()}</h3>
                  <p className="stat-label">Total Visa Approved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="row g-4">
            <div className="col-12">
              <div className="chart-card">
                <div className="chart-header">
                  <h5 className="chart-title">
                    <FontAwesomeIcon icon={faList} className="me-2" />
                    Recent Applications
                  </h5>
                  <div className="chart-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {hasActiveFilters && (
                      <button className="btn btn-sm btn-outline-secondary" onClick={clearAllFilters}>
                        <FontAwesomeIcon icon={faTimes} className="me-1" />
                        Clear Filters
                      </button>
                    )}
                    <Link to="/create-application" className="btn btn-sm btn-primary">
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      New Application
                    </Link>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th><FilterDropdown column="studentName" label="Student Name" /></th>
                        <th>Register ID</th>
                        <th><FilterDropdown column="country" label="Country" /></th>
                        <th><FilterDropdown column="program" label="Program" /></th>
                        <th><FilterDropdown column="counselor" label="Counselor Assigned" /></th>
                        <th><FilterDropdown column="status" label="Status" /></th>
                        <th><FilterDropdown column="date" label="Registration Date" /></th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <div className="spinner-border spinner-border-sm me-2" role="status" />
                            Loading...
                          </td>
                        </tr>
                      ) : filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-muted">
                            {hasActiveFilters ? 'No applications match the selected filters' : 'No applications found'}
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map(app => {
                          const statusStyle = getStatusStyle(app.application_status);
                          return (
                            <tr key={app.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.student_name)}&background=random`}
                                    className="table-avatar me-2"
                                    alt={app.student_name}
                                  />
                                  <strong>{app.student_name}</strong>
                                </div>
                              </td>
                              <td>
                                <span className="fw-semibold" style={{ color: '#F47B20' }}>
                                  {app.student_number || '-'}
                                </span>
                              </td>
                              <td>{app.country_name}</td>
                              <td>{app.program || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>}</td>
                              <td>
                                {app.counselor_names
                                  ? <span style={{ fontSize: '13px', fontWeight: '500' }}>{app.counselor_names}</span>
                                  : <span style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>Not Assigned</span>
                                }
                              </td>
                              <td>
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', ...statusStyle }}>
                                  {app.application_status}
                                </span>
                              </td>
                              <td>{formatDate(app.created_at)}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Link to={`/edit-application/${app.id}`} className="btn btn-sm btn-outline-primary" title="Edit">
                                    <FontAwesomeIcon icon={faEdit} />
                                  </Link>
                                  {deleteConfirm === app.id ? (
                                    <>
                                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(app.id)} title="Confirm Delete">✓</button>
                                      <button className="btn btn-sm btn-secondary" onClick={() => setDeleteConfirm(null)} title="Cancel">✕</button>
                                    </>
                                  ) : (
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirm(app.id)} title="Delete">
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}